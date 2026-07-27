import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
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

    // Remove this token from any other invitation first (device switching invitations)
    await supabaseAdmin
      .from("push_tokens")
      .delete()
      .eq("token", token);

    const { error } = await supabaseAdmin
      .from("push_tokens")
      .insert(
        { invitation_id: invitationId, token, updated_at: new Date().toISOString() }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    await supabaseAdmin
      .from("push_tokens")
      .delete()
      .eq("token", token)
      .eq("invitation_id", auth.invitationId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
