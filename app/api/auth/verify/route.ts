import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { verifyAuth } from "@/lib/auth/middleware";

export async function GET(request: NextRequest) {
  const payload = verifyAuth(request);
  if (!payload) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("invitations")
      .select("id, slug, client_name, template_id, event_type, data, updated_at")
      .eq("id", payload.invitationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      invitation: {
        id: data.id,
        slug: data.slug,
        clientName: data.client_name,
        templateId: data.template_id,
        eventType: data.event_type,
        data: data.data,
        updatedAt: data.updated_at,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
