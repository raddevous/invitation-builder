import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { generateToken } from "@/lib/auth/jwt";

export async function POST(request: NextRequest) {
  try {
    const { accessCode } = await request.json();

    if (!accessCode || typeof accessCode !== "string") {
      return NextResponse.json(
        { error: "Access code is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("invitations")
      .select("id, slug, client_name, template_id, event_type, data, updated_at")
      .eq("access_code", accessCode.trim().toUpperCase())
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      invitationId: data.id,
      slug: data.slug,
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
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

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
