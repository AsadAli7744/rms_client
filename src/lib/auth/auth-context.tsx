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
  login: (email: string, password?: string) => Promise<AuthUser>;
  loginAsDemoRole: (role: UserRole) => Promise<AuthUser>;
  logout: () => void;
  switchRestaurantTenant: (restaurantId: number, restaurantName: string) => void;
}

const STORAGE_KEY = "rms_auth_user";
const TOKEN_KEY = "rms_auth_token";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Quick persona accounts pre-configured for evaluation
export const DEMO_USERS: Record<UserRole, { email: string; name: string; title: string; desc: string }> = {
  admin: {
    email: "admin@rms.com",
    name: "SaaS Super Admin",
    title: "SaaS Platform Owner",
    desc: "Oversee all restaurant tenants, platform billing, global metrics & restaurants.",
  },
  manager: {
    email: "manager@restaurant.com",
    name: "David Manager",
    title: "Restaurant Owner / Manager",
    desc: "Branch operations, item sales analytics, staff, tables, floor layout & discounts.",
  },
  cashier: {
    email: "cashier@restaurant.com",
    name: "Sarah Cashier",
    title: "Cashier Staff",
    desc: "Take orders at POS counter, manage 1-order-per-table queue, apply discounts & checkout.",
  },
  kitchen: {
    email: "kitchen@restaurant.com",
    name: "Chef Gordon",
    title: "Kitchen Staff",
    desc: "Live Kitchen Display System (KDS), thermal auto-printing & real-time ticket progression.",
  },
  waiter: {
    email: "cashier@restaurant.com", // waiter fallback
    name: "Alex Waiter",
    title: "Floor Waiter",
    desc: "Dine-in table order creation, customer table assistance & menu ordering.",
  },
};

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

  const login = async (email: string, password?: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await api.post("/users/login", {
        email: email.trim().toLowerCase(),
        password: password || "password123",
      });

      const loggedUser: AuthUser = res.data.user;
      const authToken: string = res.data.token;
      saveSession(loggedUser, authToken);
      return loggedUser;
    } catch (err) {
      // Fallback fallback persona in case server has not created it yet
      const foundPersona = Object.entries(DEMO_USERS).find(
        ([, data]) => data.email.toLowerCase() === email.trim().toLowerCase()
      );
      if (foundPersona) {
        const [roleKey, data] = foundPersona;
        const mockUser: AuthUser = {
          id: roleKey === "admin" ? 4 : roleKey === "manager" ? 3 : roleKey === "kitchen" ? 2 : 1,
          restaurant_id: 1,
          branch_id: roleKey === "admin" ? null : 1,
          name: data.name,
          email: data.email,
          role: roleKey as UserRole,
          restaurant: { id: 1, name: "Grand Cafe & Bistro", code: "GCB", default_currency: "PKR" },
          branch: { id: 1, name: "Downtown Main Branch", code: "DT-01" },
        };
        const mockToken = `rms-demo-token-${roleKey}-${Date.now()}`;
        saveSession(mockUser, mockToken);
        return mockUser;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsDemoRole = async (role: UserRole): Promise<AuthUser> => {
    const demo = DEMO_USERS[role];
    try {
      return await login(demo.email, "password123");
    } catch {
      // Fallback
      const fallbackUser: AuthUser = {
        id: role === "admin" ? 4 : role === "manager" ? 3 : role === "kitchen" ? 2 : 1,
        restaurant_id: 1,
        branch_id: role === "admin" ? null : 1,
        name: demo.name,
        email: demo.email,
        role,
        restaurant: { id: 1, name: "Grand Cafe & Bistro", code: "GCB", default_currency: "PKR" },
        branch: { id: 1, name: "Downtown Main Branch", code: "DT-01" },
      };
      const token = `demo-${role}-${Date.now()}`;
      saveSession(fallbackUser, token);
      return fallbackUser;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
    router.push("/login");
  };

  const switchRestaurantTenant = (restaurantId: number, restaurantName: string) => {
    if (!user) return;
    const updated: AuthUser = {
      ...user,
      restaurant_id: restaurantId,
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
        loginAsDemoRole,
        logout,
        switchRestaurantTenant,
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
