import { Capacitor } from "@capacitor/core";

/**
 * Production API domain. Used to resolve absolute URLs for API calls
 * when running inside the native Capacitor app (Android/iOS), since the
 * native WebView may load the app bundle locally (e.g. capacitor://localhost)
 * instead of from https://instavow.com, which breaks relative fetch("/api/...") calls.
 */
export const API_BASE_URL = "https://instavow.com";

/**
 * Resolves an API path to an absolute URL when running in the native app,
 * or leaves it relative when running on the web (same-origin).
 *
 * Usage: fetch(apiUrl("/api/auth/verify"), { credentials: "include" })
 */
export function apiUrl(path: string): string {
  if (Capacitor.isNativePlatform()) {
    return `${API_BASE_URL}${path}`;
  }
  return path;
}
