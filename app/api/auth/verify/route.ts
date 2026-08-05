import { NextRequest, NextResponse } from "next/server";
import { wpGetInvitationBySlug } from "@/lib/wp/client";
import { verifyAuth } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  const payload = verifyAuth(request);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { ok, body } = await wpGetInvitationBySlug(payload.slug);

    if (!ok || !body?.invitation || body.invitation.id !== payload.invitationId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const { invitation } = body;

    return NextResponse.json({
      authenticated: true,
      invitation: {
        id: invitation.id,
        slug: invitation.slug,
        clientName: invitation.clientName,
        templateId: invitation.templateId,
        eventType: invitation.eventType,
        email: invitation.email,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        data: invitation.data,
        updatedAt: invitation.updatedAt,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
