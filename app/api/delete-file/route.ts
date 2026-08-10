import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";

const WP_API_URL = (process.env.WP_API_URL || "").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  // Verify JWT token
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const body = await request.json();
    const url = body.url as string | undefined;
    const path = body.path as string | undefined;

    // Need either a URL (WordPress) or a path (legacy Supabase)
    if (!url && !path) {
      return NextResponse.json(
        { error: "Missing url or path" },
        { status: 400 }
      );
    }

    // If we have a URL, forward to WordPress for deletion
    if (url && WP_API_URL) {
      // Only forward URLs that belong to the WordPress site (not Supabase or other hosts)
      try {
        const parsed = new URL(url);
        const wpHost = new URL(WP_API_URL).hostname;
        // Compare base domains (strip leading www.)
        const stripWww = (h: string) => h.replace(/^www\./, '');
        if (stripWww(parsed.hostname) === stripWww(wpHost)) {
          const wpResponse = await fetch(`${WP_API_URL}/upload`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
          });

          if (!wpResponse.ok) {
            const errorText = await wpResponse.text();
            console.error("WordPress delete failed:", wpResponse.status, errorText);
            let errorMsg = "Delete failed";
            try { const error = JSON.parse(errorText); errorMsg = error.error || errorMsg; } catch {}
            return NextResponse.json(
              { error: errorMsg },
              { status: wpResponse.status }
            );
          }

          return NextResponse.json({ success: true });
        }
      } catch {
        // Invalid URL — fall through
      }
    }

    // Legacy: path-based deletion was for Supabase Storage.
    // Supabase is no longer used for uploads, so we just return success
    // for old paths that can't be deleted anymore.
    if (path) {
      // Verify the path belongs to the authenticated invitation
      if (!path.startsWith(`${auth.invitationId}/`)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }
      // Supabase storage is deprecated — return success (idempotent)
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: "Could not delete file — no valid URL or WordPress API configured" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
