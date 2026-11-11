"use client";

const CACHE_PREFIX = "rms_cache:";

interface CacheEnvelope<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

/**
 * Read cached data from browser's localStorage.
 */
export function getStoredCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const envelope: CacheEnvelope<T> = JSON.parse(raw);
    const now = Date.now();

    // Check if expired
    if (envelope.ttlMs > 0 && now - envelope.timestamp > envelope.ttlMs) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return envelope.data;
  } catch (err) {
    console.warn(`[BrowserCache] Failed to read key "${key}":`, err);
    return null;
  }
}

/**
 * Write data to browser's localStorage cache with a configurable TTL (defaults to 30 minutes).
 */
export function setStoredCache<T>(key: string, data: T, ttlMinutes = 30): void {
  if (typeof window === "undefined") return;
  try {
    const envelope: CacheEnvelope<T> = {
      data,
      timestamp: Date.now(),
      ttlMs: ttlMinutes * 60 * 1000,
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(envelope));
  } catch (err) {
    // Quota exceeded or private browsing restriction
    console.warn(`[BrowserCache] Failed to set key "${key}":`, err);
  }
}

/**
 * Invalidate / remove cached items matching a key or prefix.
 */
export function invalidateStoredCache(keyOrPrefix: string): void {
  if (typeof window === "undefined") return;
  try {
    const fullPrefix = `${CACHE_PREFIX}${keyOrPrefix}`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k === fullPrefix || k.startsWith(fullPrefix))) {
        keysToRemove.push(k);
      }
    }

    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn(`[BrowserCache] Invalidation error for "${keyOrPrefix}":`, err);
  }
}

/**
 * Clear all RMS cached data from localStorage.
 */
export function clearAllStoredCache(): void {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.warn("[BrowserCache] Clear error:", err);
  }
}
