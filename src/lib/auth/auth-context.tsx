"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api/client";

export type UserRole = "admin" | "manager" | "cashier" | "kitchen" | "waiter";

export interface AuthUser {
  id: number;
  restaurant_id: number;
  branch_id: number | null;
  name: string;
  email: string;
  role: UserRole;
  restaurant?: {
    id: number;
    name: string;
    code: string;
    default_currency?: string;
  };
  branch?: {
    id: number;
    name: string;
    code: string;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  switchRestaurantTenant: (restaurantId: number, restaurantName: string) => void;
  assignBranch: (branch: { id: number; name: string; code: string }) => void;
}

const STORAGE_KEY = "rms_auth_user";
const TOKEN_KEY = "rms_auth_token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      const savedToken = localStorage.getItem(TOKEN_KEY);
      if (savedUser && savedToken) {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch {
      // ignore parsing error
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveSession = (newUser: AuthUser, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_KEY, newToken);
  };

  const login = async (email: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await api.post("/users/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const loggedUser: AuthUser = res.data.user;
      const authToken: string = res.data.token;
      saveSession(loggedUser, authToken);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    router.push("/login");
  };

  const assignBranch = (branch: { id: number; name: string; code: string }) => {
    if (!user) return;
    if (user.branch_id === branch.id) return;
    const updated: AuthUser = {
      ...user,
      branch_id: branch.id,
      branch: { id: branch.id, name: branch.name, code: branch.code },
    };
    saveSession(updated, token ?? "token");
  };

  const switchRestaurantTenant = (restaurantId: number, restaurantName: string) => {
    if (!user) return;
    const updated: AuthUser = {
      ...user,
      restaurant_id: restaurantId,
      branch_id: null,
      branch: undefined,
      restaurant: {
        id: restaurantId,
        name: restaurantName,
        code: `R-${restaurantId}`,
      },
    };
    saveSession(updated, token ?? "token");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        switchRestaurantTenant,
        assignBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
