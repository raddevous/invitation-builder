import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { requireAuth } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

const getInvitationBySlug = unstable_cache(
  async (slug: string) => {
    const { data, error } = await supabaseAdmin
      .from("invitations")
      .select("id, slug, template_id, event_type, client_name, data, updated_at")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      throw new Error("Invitation not found");
    }

    return {
      id: data.id,
      slug: data.slug,
      templateId: data.template_id,
      eventType: data.event_type,
      clientName: data.client_name,
      data: data.data,
      updatedAt: data.updated_at,
    };
  },
  ["invitation"],
  { revalidate: 60, tags: ["invitations"] }
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

    console.log('[PATCH] Request:', { slug, invitationId, dataKeys: Object.keys(data) });
    console.log('[PATCH] Full data being saved:', JSON.stringify(data).substring(0, 500) + '...');
    console.log('[PATCH] Entourage data:', JSON.stringify(data.entourage)?.substring(0, 300) + '...');

    if (!invitationId || !data) {
      console.error('[PATCH] Missing required fields:', { invitationId, data });
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

    // Get current data before update
    const { data: currentRecord } = await supabaseAdmin
      .from("invitations")
      .select("data")
      .eq("id", invitationId)
      .single();

    console.log('[PATCH] Current data sample:', {
      hisName: currentRecord?.data?.hisName,
      herName: currentRecord?.data?.herName,
      date: currentRecord?.data?.date
    });

    const { data: updatedData, error } = await supabaseAdmin
      .from("invitations")
      .update({
        data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", invitationId)
      .select();

    if (error) {
      console.error('[PATCH] Supabase error:', error);
      return NextResponse.json(
        { error: "Failed to update invitation", details: error.message },
        { status: 500 }
      );
    }

    console.log('[PATCH] Updated record:', updatedData?.[0]?.id);
    console.log('[PATCH] Updated data sample:', {
      hisName: updatedData?.[0]?.data?.hisName,
      herName: updatedData?.[0]?.data?.herName,
      date: updatedData?.[0]?.data?.date
    });

    // Clear server cache so share link gets fresh data
    revalidateTag("invitations");
    console.log('[PATCH] Cache revalidated');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[PATCH] Internal error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
