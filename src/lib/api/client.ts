import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "@/lib/types/common";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

// Attach authenticated session context headers automatically to every request
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("rms_auth_token");
      const userRaw = localStorage.getItem("rms_auth_user");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      if (userRaw) {
        try {
          const user = JSON.parse(userRaw);
          if (user.id != null) config.headers["x-user-id"] = String(user.id);
          if (user.role) config.headers["x-user-role"] = String(user.role);
          if (user.restaurant_id != null) config.headers["x-restaurant-id"] = String(user.restaurant_id);
        } catch {
          // ignore parse errors
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export function parseApiError(err: unknown): string {
  const ax = err as AxiosError<ApiErrorBody>;
  const msg = ax.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string") return msg;
  if (ax.message) return ax.message;
  return "Request failed";
}
