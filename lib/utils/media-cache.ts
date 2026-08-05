import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { getStoredItem, setStoredItem } from "@/lib/utils/storage";
import { apiUrl } from "@/lib/utils/api";
import type { Invitation, InvitationData } from "@/lib/types/invitation";

const MEDIA_CACHE_MAP_KEY = "media_cache_map";
const MEDIA_CACHE_DIR = "media_cache";

interface CacheMap {
  [originalUrl: string]: string;
}

async function getCacheMap(): Promise<CacheMap> {
  const raw = await getStoredItem(MEDIA_CACHE_MAP_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

async function setCacheMap(map: CacheMap): Promise<void> {
  await setStoredItem(MEDIA_CACHE_MAP_KEY, JSON.stringify(map));
}

function isCacheableUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  return true;
}

const CORS_BLOCKED_HOSTS = [
  "drive.google.com",
  "docs.google.com",
];

function needsProxy(url: string): boolean {
  try {
    const parsed = new URL(url);
    return CORS_BLOCKED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(".google.com"));
  } catch {
    return false;
  }
}

function proxiedUrl(url: string): string {
  return apiUrl(`/api/proxy?url=${encodeURIComponent(url)}`);
}

function toWebUri(uri: string): string {
  if (!uri || !uri.startsWith("file://")) return uri;
  try {
    return Capacitor.convertFileSrc(uri);
  } catch {
    return uri;
  }
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/x-icon": "ico",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
  "font/ttf": "ttf",
  "font/otf": "otf",
  "font/woff": "woff",
  "font/woff2": "woff2",
  "application/octet-stream": "bin",
};

function urlToFilename(url: string, contentType?: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  let ext: string | undefined;

  if (contentType) {
    ext = MIME_TO_EXT[contentType.toLowerCase().split(";")[0].trim()];
  }

  if (!ext) {
    const urlExt = url.split("?")[0].split(".").pop()?.toLowerCase();
    if (urlExt && urlExt.length <= 5 && /^[a-z0-9]+$/.test(urlExt)) {
      ext = urlExt;
    }
  }

  return `${Math.abs(hash).toString(36)}.${ext || "bin"}`;
}

export async function cacheMediaFile(url: string): Promise<string | null> {
  if (!isCacheableUrl(url)) {
    console.log("[media-cache] skip non-cacheable URL:", url);
    return null;
  }
  if (!Capacitor.isNativePlatform()) {
    console.log("[media-cache] not native platform, skipping");
    return null;
  }

  const map = await getCacheMap();
  if (map[url]) {
    const cachedPath = map[url];
    const isStale = cachedPath.includes("/cache/media_cache/") || cachedPath.endsWith(".bin");
    if (isStale) {
      console.log("[media-cache] stale cache entry, re-caching:", url, "->", cachedPath);
      delete map[url];
      await setCacheMap(map);
    } else {
      console.log("[media-cache] already cached:", url, "->", cachedPath);
      return cachedPath;
    }
  }

  const fetchUrl = needsProxy(url) ? proxiedUrl(url) : url;
  console.log("[media-cache] downloading:", url, needsProxy(url) ? "(via proxy)" : "(direct)");
  try {
    const response = await fetch(fetchUrl);
    if (!response.ok) {
      console.log("[media-cache] fetch failed status:", response.status, url);
      return null;
    }

    const blob = await response.blob();
    const contentType = blob.type || response.headers.get("content-type") || "";
    console.log("[media-cache] fetched blob:", blob.size, "bytes, type:", contentType, "for", url);
    const base64 = await blobToBase64(blob);
    const filename = urlToFilename(url, contentType);

    const result = await Filesystem.writeFile({
      path: `${MEDIA_CACHE_DIR}/${filename}`,
      data: base64,
      // Directory.Data (not Cache) — the OS can purge Cache under storage
      // pressure at any time, which would silently break offline images.
      directory: Directory.Data,
      recursive: true,
    });

    const localUri = toWebUri(result.uri);
    map[url] = localUri;
    await setCacheMap(map);
    console.log("[media-cache] cached OK:", url, "->", localUri);

    return localUri;
  } catch (err) {
    console.error("[media-cache] Failed to cache:", url, err);
    return null;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] || result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function resolveMediaUrl(url: string): Promise<string> {
  if (!isCacheableUrl(url)) return url;
  if (!Capacitor.isNativePlatform()) return url;

  const map = await getCacheMap();
  if (map[url]) {
    const isStale = map[url].includes("/cache/media_cache/") || map[url].endsWith(".bin");
    if (isStale) {
      console.log("[media-cache] resolveMediaUrl: stale cache entry, returning original URL:", url, "->", map[url]);
      return url;
    }
    return toWebUri(map[url]);
  }

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return url;
  }

  const cached = await cacheMediaFile(url);
  return cached || url;
}

export async function resolveMediaUrls(urls: string[]): Promise<string[]> {
  const results: string[] = [];
  for (const url of urls) {
    if (!url) {
      results.push(url);
      continue;
    }
    const resolved = await resolveMediaUrl(url);
    results.push(resolved);
  }
  return results;
}

function extractMediaUrls(data: InvitationData): string[] {
  const urls: string[] = [];

  const add = (val: unknown) => {
    if (typeof val === "string" && isCacheableUrl(val)) {
      urls.push(val);
    } else if (Array.isArray(val)) {
      val.forEach((v) => {
        if (typeof v === "string" && isCacheableUrl(v)) {
          urls.push(v);
        }
      });
    }
  };

  add(data.heroIcon);
  add(data.heroBackgroundImages);
  add(data.heroBackgroundImagesMobile);
  add(data.backgroundImage);
  add(data.galleryImages);
  add(data.photosAndImages);
  add(data.venueImages);
  add(data.backgroundMusic);
  add(data.customHeadingFont);
  add(data.customBodyFont);
  add(data.welcomeEnvelope);
  add(data.flowerDecoration);

  add(data.eventDetailsImage?.urls);
  add(data.galleryImage?.urls);
  add(data.mapImage?.urls);
  add(data.rsvpImage?.urls);
  add(data.timelineImage?.urls);
  add(data.countdownImage?.urls);
  add(data.dresscodeImage?.urls);
  add(data.giftguideImage?.urls);

  add(data.eventDetailsDividerCustomImageUrl1);
  add(data.eventDetailsDividerCustomImageUrl2);
  add(data.eventDetailsDividerCustomImageUrl3);
  add(data.galleryDividerCustomImageUrl1);
  add(data.galleryDividerCustomImageUrl2);
  add(data.galleryDividerCustomImageUrl3);
  add(data.mapDividerCustomImageUrl1);
  add(data.mapDividerCustomImageUrl2);
  add(data.mapDividerCustomImageUrl3);
  add(data.rsvpDividerCustomImageUrl1);
  add(data.rsvpDividerCustomImageUrl2);
  add(data.rsvpDividerCustomImageUrl3);
  add(data.timelineDividerCustomImageUrl1);
  add(data.timelineDividerCustomImageUrl2);
  add(data.timelineDividerCustomImageUrl3);
  add(data.countdownDividerCustomImageUrl1);
  add(data.countdownDividerCustomImageUrl2);
  add(data.countdownDividerCustomImageUrl3);
  add(data.dresscodeDividerCustomImageUrl1);
  add(data.dresscodeDividerCustomImageUrl2);
  add(data.dresscodeDividerCustomImageUrl3);
  add(data.giftguideDividerCustomImageUrl1);
  add(data.giftguideDividerCustomImageUrl2);
  add(data.giftguideDividerCustomImageUrl3);
  add(data.footerDividerCustomImageUrl1);
  add(data.footerDividerCustomImageUrl2);
  add(data.footerDividerCustomImageUrl3);

  if (data.storyTimeline && Array.isArray(data.storyTimeline)) {
    data.storyTimeline.forEach((container: any) => {
      if (container.items && Array.isArray(container.items)) {
        container.items.forEach((item: any) => {
          add(item.imageUrl);
        });
      }
    });
  }

  return [...new Set(urls)];
}

export async function precacheInvitationMedia(data: InvitationData): Promise<{ cached: number; failed: number }> {
  if (!Capacitor.isNativePlatform()) {
    console.log("[media-cache] precache: not native platform, skipping");
    return { cached: 0, failed: 0 };
  }

  const urls = extractMediaUrls(data);
  console.log("[media-cache] precache: found", urls.length, "media URLs to cache");
  if (urls.length > 0) {
    console.log("[media-cache] precache URLs:", JSON.stringify(urls, null, 2));
  }
  let cached = 0;
  let failed = 0;

  for (const url of urls) {
    const result = await cacheMediaFile(url);
    if (result) {
      cached++;
    } else {
      failed++;
    }
  }

  console.log("[media-cache] precache complete:", cached, "cached,", failed, "failed");
  return { cached, failed };
}

export async function getCachedMediaMap(): Promise<CacheMap> {
  return getCacheMap();
}

export async function resolveInvitationMedia(data: InvitationData): Promise<InvitationData> {
  if (!Capacitor.isNativePlatform()) {
    console.log("[media-cache] resolve: not native platform, returning original data");
    return data;
  }
  const map = await getCacheMap();
  console.log("[media-cache] resolve: cache map has", Object.keys(map).length, "entries");
  if (Object.keys(map).length === 0) {
    console.log("[media-cache] resolve: cache map empty, returning original data");
    return data;
  }

  const resolveStr = (val: string): string => {
    if (val && map[val]) {
      if (map[val].includes("/cache/media_cache/") || map[val].endsWith(".bin")) {
        console.log("[media-cache] resolve SKIP (stale entry):", val, "->", map[val]);
        return val;
      }
      const webUri = toWebUri(map[val]);
      console.log("[media-cache] resolve:", val, "->", webUri);
      return webUri;
    }
    if (val) {
      console.log("[media-cache] resolve MISS (no cached entry for):", val);
    }
    return val;
  };
  const resolveArr = (val: string[] | undefined): string[] | undefined => {
    if (!val) return val;
    return val.map((v) => resolveStr(v));
  };
  const resolveImageBg = (val: { urls: string[] } | undefined): { urls: string[] } | undefined => {
    if (!val) return val;
    return { ...val, urls: val.urls.map((u) => resolveStr(u)) };
  };

  const resolved: InvitationData = {
    ...data,
    heroIcon: data.heroIcon ? resolveStr(data.heroIcon) : data.heroIcon,
    heroBackgroundImages: resolveArr(data.heroBackgroundImages),
    heroBackgroundImagesMobile: resolveArr(data.heroBackgroundImagesMobile),
    backgroundImage: data.backgroundImage ? resolveStr(data.backgroundImage) : data.backgroundImage,
    galleryImages: resolveArr(data.galleryImages) || [],
    photosAndImages: resolveArr(data.photosAndImages) || [],
    venueImages: resolveArr(data.venueImages),
    backgroundMusic: resolveArr(data.backgroundMusic) as string[] | undefined,
    customHeadingFont: data.customHeadingFont ? resolveStr(data.customHeadingFont) : data.customHeadingFont,
    customBodyFont: data.customBodyFont ? resolveStr(data.customBodyFont) : data.customBodyFont,
    welcomeEnvelope: data.welcomeEnvelope ? resolveStr(data.welcomeEnvelope) : data.welcomeEnvelope,
    flowerDecoration: data.flowerDecoration ? resolveStr(data.flowerDecoration) : data.flowerDecoration,
    eventDetailsImage: resolveImageBg(data.eventDetailsImage),
    galleryImage: resolveImageBg(data.galleryImage),
    mapImage: resolveImageBg(data.mapImage),
    rsvpImage: resolveImageBg(data.rsvpImage),
    timelineImage: resolveImageBg(data.timelineImage),
    countdownImage: resolveImageBg(data.countdownImage),
    dresscodeImage: resolveImageBg(data.dresscodeImage),
    giftguideImage: resolveImageBg(data.giftguideImage),
    eventDetailsDividerCustomImageUrl1: data.eventDetailsDividerCustomImageUrl1 ? resolveStr(data.eventDetailsDividerCustomImageUrl1) : data.eventDetailsDividerCustomImageUrl1,
    eventDetailsDividerCustomImageUrl2: data.eventDetailsDividerCustomImageUrl2 ? resolveStr(data.eventDetailsDividerCustomImageUrl2) : data.eventDetailsDividerCustomImageUrl2,
    eventDetailsDividerCustomImageUrl3: data.eventDetailsDividerCustomImageUrl3 ? resolveStr(data.eventDetailsDividerCustomImageUrl3) : data.eventDetailsDividerCustomImageUrl3,
    galleryDividerCustomImageUrl1: data.galleryDividerCustomImageUrl1 ? resolveStr(data.galleryDividerCustomImageUrl1) : data.galleryDividerCustomImageUrl1,
    galleryDividerCustomImageUrl2: data.galleryDividerCustomImageUrl2 ? resolveStr(data.galleryDividerCustomImageUrl2) : data.galleryDividerCustomImageUrl2,
    galleryDividerCustomImageUrl3: data.galleryDividerCustomImageUrl3 ? resolveStr(data.galleryDividerCustomImageUrl3) : data.galleryDividerCustomImageUrl3,
    mapDividerCustomImageUrl1: data.mapDividerCustomImageUrl1 ? resolveStr(data.mapDividerCustomImageUrl1) : data.mapDividerCustomImageUrl1,
    mapDividerCustomImageUrl2: data.mapDividerCustomImageUrl2 ? resolveStr(data.mapDividerCustomImageUrl2) : data.mapDividerCustomImageUrl2,
    mapDividerCustomImageUrl3: data.mapDividerCustomImageUrl3 ? resolveStr(data.mapDividerCustomImageUrl3) : data.mapDividerCustomImageUrl3,
    rsvpDividerCustomImageUrl1: data.rsvpDividerCustomImageUrl1 ? resolveStr(data.rsvpDividerCustomImageUrl1) : data.rsvpDividerCustomImageUrl1,
    rsvpDividerCustomImageUrl2: data.rsvpDividerCustomImageUrl2 ? resolveStr(data.rsvpDividerCustomImageUrl2) : data.rsvpDividerCustomImageUrl2,
    rsvpDividerCustomImageUrl3: data.rsvpDividerCustomImageUrl3 ? resolveStr(data.rsvpDividerCustomImageUrl3) : data.rsvpDividerCustomImageUrl3,
    timelineDividerCustomImageUrl1: data.timelineDividerCustomImageUrl1 ? resolveStr(data.timelineDividerCustomImageUrl1) : data.timelineDividerCustomImageUrl1,
    timelineDividerCustomImageUrl2: data.timelineDividerCustomImageUrl2 ? resolveStr(data.timelineDividerCustomImageUrl2) : data.timelineDividerCustomImageUrl2,
    timelineDividerCustomImageUrl3: data.timelineDividerCustomImageUrl3 ? resolveStr(data.timelineDividerCustomImageUrl3) : data.timelineDividerCustomImageUrl3,
    countdownDividerCustomImageUrl1: data.countdownDividerCustomImageUrl1 ? resolveStr(data.countdownDividerCustomImageUrl1) : data.countdownDividerCustomImageUrl1,
    countdownDividerCustomImageUrl2: data.countdownDividerCustomImageUrl2 ? resolveStr(data.countdownDividerCustomImageUrl2) : data.countdownDividerCustomImageUrl2,
    countdownDividerCustomImageUrl3: data.countdownDividerCustomImageUrl3 ? resolveStr(data.countdownDividerCustomImageUrl3) : data.countdownDividerCustomImageUrl3,
    dresscodeDividerCustomImageUrl1: data.dresscodeDividerCustomImageUrl1 ? resolveStr(data.dresscodeDividerCustomImageUrl1) : data.dresscodeDividerCustomImageUrl1,
    dresscodeDividerCustomImageUrl2: data.dresscodeDividerCustomImageUrl2 ? resolveStr(data.dresscodeDividerCustomImageUrl2) : data.dresscodeDividerCustomImageUrl2,
    dresscodeDividerCustomImageUrl3: data.dresscodeDividerCustomImageUrl3 ? resolveStr(data.dresscodeDividerCustomImageUrl3) : data.dresscodeDividerCustomImageUrl3,
    giftguideDividerCustomImageUrl1: data.giftguideDividerCustomImageUrl1 ? resolveStr(data.giftguideDividerCustomImageUrl1) : data.giftguideDividerCustomImageUrl1,
    giftguideDividerCustomImageUrl2: data.giftguideDividerCustomImageUrl2 ? resolveStr(data.giftguideDividerCustomImageUrl2) : data.giftguideDividerCustomImageUrl2,
    giftguideDividerCustomImageUrl3: data.giftguideDividerCustomImageUrl3 ? resolveStr(data.giftguideDividerCustomImageUrl3) : data.giftguideDividerCustomImageUrl3,
    footerDividerCustomImageUrl1: data.footerDividerCustomImageUrl1 ? resolveStr(data.footerDividerCustomImageUrl1) : data.footerDividerCustomImageUrl1,
    footerDividerCustomImageUrl2: data.footerDividerCustomImageUrl2 ? resolveStr(data.footerDividerCustomImageUrl2) : data.footerDividerCustomImageUrl2,
    footerDividerCustomImageUrl3: data.footerDividerCustomImageUrl3 ? resolveStr(data.footerDividerCustomImageUrl3) : data.footerDividerCustomImageUrl3,
  };

  if (data.storyTimeline && Array.isArray(data.storyTimeline)) {
    resolved.storyTimeline = data.storyTimeline.map((container: any) => ({
      ...container,
      items: container.items?.map((item: any) => ({
        ...item,
        imageUrl: item.imageUrl ? resolveStr(item.imageUrl) : item.imageUrl,
      })),
    }));
  }

  return resolved;
}

/**
 * Reverses locally-cached device file URIs (e.g. `_capacitor_file_/...`,
 * `file://...`) back to their original remote URL before data is persisted
 * to the server. This is the safety net for the (many) editor components
 * that read their editable state from `resolveInvitationMedia()`'s output —
 * if that resolved data is echoed back on save, we must not let device-local
 * paths leak into the saved record, since they're meaningless off-device.
 *
 * Any local-looking path that can't be mapped back to a remote URL is
 * dropped entirely (better a missing image than a permanently-broken one).
 */
export async function sanitizeMediaForSave<T>(data: T): Promise<T> {
  const map = await getCacheMap();
  const reverseMap: Record<string, string> = {};
  for (const [originalUrl, localUri] of Object.entries(map)) {
    reverseMap[localUri] = originalUrl;
    reverseMap[toWebUri(localUri)] = originalUrl;
  }

  const looksLocal = (s: string): boolean =>
    s.startsWith("file://") ||
    s.startsWith("capacitor://") ||
    s.includes("_capacitor_file_") ||
    s.includes("/media_cache/");

  const fix = (val: unknown): unknown => {
    if (typeof val === "string") {
      if (reverseMap[val]) return reverseMap[val];
      if (looksLocal(val)) {
        console.warn("[media-cache] sanitize: dropping unmapped local URI before save:", val);
        return "";
      }
      return val;
    }
    if (Array.isArray(val)) return val.map(fix);
    if (val && typeof val === "object") {
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(val as Record<string, unknown>)) {
        out[k] = fix((val as Record<string, unknown>)[k]);
      }
      return out;
    }
    return val;
  };

  return fix(data) as T;
}

export async function clearMediaCache(): Promise<void> {
  try {
    await Filesystem.rmdir({
      path: MEDIA_CACHE_DIR,
      directory: Directory.Data,
      recursive: true,
    });
  } catch {
    // Directory may not exist
  }
  await setCacheMap({});
}
