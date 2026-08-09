"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import type { InvitationData } from "@/lib/types/invitation";
import { precacheInvitationMedia, resolveInvitationMedia } from "@/lib/utils/media-cache";

interface UseMediaCacheOptions {
  isGuestMode?: boolean;
}

interface UseMediaCacheResult {
  resolvedData: InvitationData | null;
  isCaching: boolean;
  precache: (data: InvitationData) => Promise<void>;
}

export function useMediaCache(
  data: InvitationData | null,
  options: UseMediaCacheOptions = {}
): UseMediaCacheResult {
  const { isGuestMode = false } = options;
  const [resolvedData, setResolvedData] = useState<InvitationData | null>(data);
  const [isCaching, setIsCaching] = useState(false);
  const lastPrecachedRef = useRef<string>("");

  const shouldCache = Capacitor.isNativePlatform() && !isGuestMode;
  console.log("[useMediaCache] shouldCache:", shouldCache, "isNative:", Capacitor.isNativePlatform(), "isGuestMode:", isGuestMode);

  const precache = useCallback(
    async (invData: InvitationData) => {
      if (!shouldCache) {
        console.log("[useMediaCache] precache skipped (shouldCache=false)");
        return;
      }

      const dataKey = JSON.stringify(invData);
      if (dataKey === lastPrecachedRef.current) {
        console.log("[useMediaCache] precache skipped (already cached this data)");
        return;
      }
      lastPrecachedRef.current = dataKey;

      console.log("[useMediaCache] starting precache...");
      setIsCaching(true);
      try {
        const result = await precacheInvitationMedia(invData);
        console.log("[useMediaCache] precache result:", result);
      } catch (err) {
        console.error("[useMediaCache] Precache failed:", err);
      } finally {
        setIsCaching(false);
      }
    },
    [shouldCache]
  );

  useEffect(() => {
    if (!data) {
      setResolvedData(null);
      return;
    }

    if (!shouldCache) {
      setResolvedData(data);
      return;
    }

    let cancelled = false;

    const resolve = async () => {
      const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
      console.log("[useMediaCache] resolve effect: isOnline:", isOnline, "shouldCache:", shouldCache);

      // Some hosts (e.g. Google Drive) don't reliably load as a direct
      // <img src> in the WebView — that's exactly why they're downloaded
      // via the proxy in the first place. So always prefer the cached
      // local file when one exists, online or offline, not just offline.
      const alreadyResolved = await resolveInvitationMedia(data);
      if (!cancelled) {
        console.log("[useMediaCache] resolved with existing cache entries, setting resolvedData");
        setResolvedData(alreadyResolved);
      }

      if (isOnline) {
        console.log("[useMediaCache] online — triggering precache");
        await precache(data);
        if (!cancelled) {
          const freshlyResolved = await resolveInvitationMedia(data);
          console.log("[useMediaCache] post-precache resolve complete, setting resolvedData");
          setResolvedData(freshlyResolved);
        }
      }
    };

    resolve();

    return () => {
      cancelled = true;
    };
  }, [data, shouldCache, precache]);

  useEffect(() => {
    if (!shouldCache || !data) return;

    const handleOnline = async () => {
      await precache(data);
      const resolved = await resolveInvitationMedia(data);
      setResolvedData(resolved);
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [shouldCache, data, precache]);

  // On web (non-native), return data directly to avoid a one-render-cycle delay
  // caused by useEffect. This ensures ToolsTab receives updated data immediately
  // when editors apply changes, so the save bubble appears correctly.
  if (!shouldCache) {
    return { resolvedData: data, isCaching: false, precache };
  }

  return { resolvedData, isCaching, precache };
}
