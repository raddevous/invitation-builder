import { NextRequest, NextResponse } from "next/server";
import { wpGetInvitationBySlug, wpUpdateInvitation } from "@/lib/wp/client";
import { unstable_cache, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

const getInvitationBySlug = unstable_cache(
  async (slug: string) => {
    const { ok, body } = await wpGetInvitationBySlug(slug);

    if (!ok || !body?.invitation) {
      throw new Error("Invitation not found");
    }

    const { invitation } = body;

    return {
      id: invitation.id,
      slug: invitation.slug,
      templateId: invitation.templateId,
      eventType: invitation.eventType,
      clientName: invitation.clientName,
      email: invitation.email,
      createdAt: invitation.createdAt,
      expiresAt: invitation.expiresAt,
      data: invitation.data,
      updatedAt: invitation.updatedAt,
    };
  },
  ["invitation"],
  { revalidate: process.env.NODE_ENV === "development" ? false : 60, tags: ["invitations"] }
);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const invitation = await getInvitationBySlug(slug);

    return NextResponse.json(
      { invitation },
      {
        headers: {
          "Cache-Control": "max-age=0, must-revalidate",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Invitation not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Verify JWT token
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const { slug } = await params;
    const body = await request.json();
    const { invitationId, data } = body;

    if (!invitationId || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify the token matches the invitation being updated
    if (auth.invitationId !== invitationId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    const { ok, body: result } = await wpUpdateInvitation(slug, invitationId, data);

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to update invitation", details: result?.error },
        { status: 500 }
      );
    }

    // Clear server cache so share link gets fresh data
    revalidateTag("invitations");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH] Internal error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
