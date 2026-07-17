import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invitationId, guestName, attendance, guestCount, message } = body;

    if (!invitationId || !guestName || !attendance) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const validAttendance = ["attending", "not-attending", "maybe"];
    if (!validAttendance.includes(attendance)) {
      return NextResponse.json(
        { error: "Invalid attendance value" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("rsvp_responses")
      .insert({
        invitation_id: invitationId,
        guest_name: guestName,
        attendance,
        guest_count: guestCount || 1,
        message: message || null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save RSVP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get("invitationId");

    if (!invitationId) {
      return NextResponse.json(
        { error: "invitationId is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("rsvp_responses")
      .select("*")
      .eq("invitation_id", invitationId)
      .order("submitted_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch RSVPs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses: data });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
