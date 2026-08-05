import { NextRequest, NextResponse } from "next/server";
import { wpRegisterPushToken, wpRemovePushToken } from "@/lib/wp/client";
import { requireAuth } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { invitationId, token } = await request.json();
    if (!invitationId || !token) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (auth.invitationId !== invitationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { ok, body } = await wpRegisterPushToken(invitationId, token);

    if (!ok) {
      return NextResponse.json({ error: body?.error || "Failed to register token" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    await wpRemovePushToken(token, auth.invitationId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
