import axios, { type AxiosError } from "axios";
import type { ApiErrorBody } from "@/lib/types/common";

const baseURL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

export function parseApiError(err: unknown): string {
  const ax = err as AxiosError<ApiErrorBody>;
  const msg = ax.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(", ");
  if (typeof msg === "string") return msg;
  if (ax.message) return ax.message;
  return "Request failed";
}
