import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { StockAsset, AssetCategory } from "./types/invitation";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export async function fetchAssets(
  category: AssetCategory
): Promise<StockAsset[]> {
  try {
    const res = await fetch(`/stock/${category}/assets.json`);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export function resolveAssetUrl(
  assetId: string,
  category: AssetCategory
): string {
  if (!assetId) return "";
  if (assetId.startsWith("http") || assetId.startsWith("/")) return assetId;
  return `/stock/${category}/${assetId}`;
}

export function buildInviteUrl(slug: string): string {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    
    // If on localhost, keep it as localhost
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const port = window.location.port ? `:${window.location.port}` : "";
      return `${protocol}//${slug}.localhost${port}`;
    }
    
    // For other domains, use the current apex domain
    const parts = hostname.split(".");
    const apex = parts.length > 2 ? parts.slice(1).join(".") : hostname;
    return `${protocol}//${slug}.${apex}`;
  }
  return `/invite/${slug}`;
}

const FAVICON_URL_PATTERN = /^(\/|https?:\/\/|data:image)/i;

export function updateFavicon(url?: string | null) {
  if (typeof document === "undefined") return;

  let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;

  if (!url || !FAVICON_URL_PATTERN.test(url)) {
    if (link) {
      document.head.removeChild(link);
    }
    return;
  }

  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }

  link.href = url;
}
