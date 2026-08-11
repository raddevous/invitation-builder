/**
 * WordPress REST API client.
 * Talks to the "Invitation Database" WordPress plugin, which mirrors the
 * previous Supabase schema (invitations, rsvp_responses, push_tokens).
 *
 * Only the public "app" endpoints are used here (no WP auth/nonce needed):
 *   GET    /invitation/{slug}
 *   PATCH  /invitation/{slug}
 *   POST   /auth/access-code
 *   POST   /auth/signup
 *   POST   /rsvp
 *   GET    /rsvp
 *   POST   /push-token
 *   DELETE /push-token
 */

const WP_API_URL = (process.env.WP_API_URL || "").replace(/\/$/, "");

function wpUrl(path: string): string {
  return `${WP_API_URL}${path}`;
}

export interface WpInvitation {
  id: string;
  slug: string;
  clientName: string;
  templateId: string;
  eventType: string;
  data: unknown;
  updatedAt: string;
  email?: string;
  createdAt?: string;
  expiresAt?: string;
}

async function wpFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; body: T | null }> {
  try {
    const res = await fetch(wpUrl(path), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      cache: "no-store",
    });
    const body = (await res.json().catch(() => null)) as T | null;
    return { ok: res.ok, status: res.status, body };
  } catch {
    return { ok: false, status: 0, body: null };
  }
}

/**
 * GET /invitation/{slug} — public, does not expose access_code.
 */
export async function wpGetInvitationBySlug(slug: string) {
  return wpFetch<{ invitation: WpInvitation }>(
    `/invitation/${encodeURIComponent(slug)}?_t=${Date.now()}`
  );
}

/**
 * PATCH /invitation/{slug} — update invitation data.
 */
export async function wpUpdateInvitation(
  slug: string,
  invitationId: string,
  data: unknown
) {
  return wpFetch<{ success: boolean; error?: string }>(
    `/invitation/${encodeURIComponent(slug)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ invitationId, data }),
    }
  );
}

/**
 * POST /auth/access-code — login via access code.
 */
export async function wpAuthAccessCode(accessCode: string) {
  return wpFetch<{ invitation: WpInvitation; error?: string }>(
    `/auth/access-code`,
    {
      method: "POST",
      body: JSON.stringify({ accessCode }),
    }
  );
}

/**
 * POST /auth/signup — create a new invitation.
 */
export async function wpSignup(payload: {
  email: string;
  phoneNumber?: string;
  address?: string;
  clientName?: string;
}) {
  return wpFetch<{
    success: boolean;
    accessCode: string;
    invitation: WpInvitation;
    error?: string;
  }>(`/auth/signup`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * POST /rsvp — submit an RSVP response.
 */
export async function wpSubmitRsvp(payload: {
  invitationId: string;
  guestName: string;
  attendance: string;
  guestCount?: number;
  message?: string | null;
}) {
  return wpFetch<{ success: boolean; id: string; error?: string }>(`/rsvp`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface WpRsvpResponse {
  id: string;
  invitation_id: string;
  guest_name: string;
  attendance: string;
  guest_count: number;
  message: string | null;
  submitted_at: string;
}

/**
 * GET /rsvp?invitationId=X — list RSVPs for an invitation.
 * A cache-busting `_t` param is appended because the hosting environment's
 * edge/page cache caches GET requests by exact URL, which would otherwise
 * serve stale RSVP lists.
 */
export async function wpGetRsvps(invitationId: string) {
  return wpFetch<{ responses: WpRsvpResponse[]; error?: string }>(
    `/rsvp?invitationId=${encodeURIComponent(invitationId)}&_t=${Date.now()}`
  );
}

/**
 * DELETE /rsvp — cancel/delete an RSVP response by id.
 */
export async function wpCancelRsvp(id: string) {
  return wpFetch<{ success: boolean; error?: string }>(`/rsvp`, {
    method: "DELETE",
    body: JSON.stringify({ id }),
  });
}

/**
 * POST /push-token — register a push token for an invitation.
 */
export async function wpRegisterPushToken(
  invitationId: string,
  token: string
) {
  return wpFetch<{ success: boolean; error?: string }>(`/push-token`, {
    method: "POST",
    body: JSON.stringify({ invitationId, token }),
  });
}

/**
 * DELETE /push-token — remove a push token.
 */
export async function wpRemovePushToken(
  token: string,
  invitationId?: string
) {
  return wpFetch<{ success: boolean; error?: string }>(`/push-token`, {
    method: "DELETE",
    body: JSON.stringify({ token, invitationId }),
  });
}

/**
 * GET /push-token?invitationId=X — list push tokens for an invitation.
 * Used server-side to send push notifications via Firebase.
 */
export async function wpGetPushTokens(invitationId: string) {
  return wpFetch<{ tokens: string[]; error?: string }>(
    `/push-token?invitationId=${encodeURIComponent(invitationId)}&_t=${Date.now()}`
  );
}
