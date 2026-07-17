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
    return `${window.location.origin}/invite/${slug}`;
  }
  return `/invite/${slug}`;
}
