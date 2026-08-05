import { getStoredItem, setStoredItem } from "@/lib/utils/storage";
import { apiUrl } from "@/lib/utils/api";
import type { Invitation } from "@/lib/types/invitation";

const CACHE_PREFIX = "offline_cache_invitation_";
const SAVE_QUEUE_KEY = "offline_save_queue";

interface QueuedSave {
  slug: string;
  invitationId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export async function cacheInvitation(slug: string, invitation: Invitation): Promise<void> {
  await setStoredItem(`${CACHE_PREFIX}${slug}`, JSON.stringify(invitation));
}

export async function getCachedInvitation(slug: string): Promise<Invitation | null> {
  const raw = await getStoredItem(`${CACHE_PREFIX}${slug}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Invitation;
  } catch {
    return null;
  }
}

export async function queueOfflineSave(slug: string, invitationId: string, data: Record<string, unknown>): Promise<void> {
  const queue = await getSaveQueue();
  const filtered = queue.filter((item) => item.slug !== slug);
  filtered.push({ slug, invitationId, data, timestamp: Date.now() });
  await setStoredItem(SAVE_QUEUE_KEY, JSON.stringify(filtered));
}

export async function getSaveQueue(): Promise<QueuedSave[]> {
  const raw = await getStoredItem(SAVE_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedSave[];
  } catch {
    return [];
  }
}

export async function clearSaveQueue(): Promise<void> {
  await setStoredItem(SAVE_QUEUE_KEY, "[]");
}

export async function flushSaveQueue(): Promise<{ success: number; failed: number }> {
  const queue = await getSaveQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  let success = 0;
  let failed = 0;
  const remaining: QueuedSave[] = [];

  for (const item of queue) {
    try {
      const res = await fetch(apiUrl(`/api/invitation/${item.slug}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId: item.invitationId, data: item.data }),
      });
      if (res.ok) {
        success++;
        const cached = await getCachedInvitation(item.slug);
        if (cached) {
          await cacheInvitation(item.slug, { ...cached, data: item.data as never });
        }
      } else {
        failed++;
        remaining.push(item);
      }
    } catch {
      failed++;
      remaining.push(item);
    }
  }

  await setStoredItem(SAVE_QUEUE_KEY, JSON.stringify(remaining));
  return { success, failed };
}

const LAST_SLUG_KEY = "last_used_slug";

export async function setLastUsedSlug(slug: string): Promise<void> {
  await setStoredItem(LAST_SLUG_KEY, slug);
}

export async function getLastUsedSlug(): Promise<string | null> {
  return await getStoredItem(LAST_SLUG_KEY);
}

export function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}
