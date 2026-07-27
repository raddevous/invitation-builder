import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/firebase/admin";

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

    // Send push notification to the host (best-effort, non-blocking)
    const pushDebug: string[] = [];
    try {
      const { data: tokens, error: tokenError } = await supabaseAdmin
        .from("push_tokens")
        .select("token")
        .eq("invitation_id", invitationId);

      pushDebug.push(`tokens: ${tokens?.length ?? 0}, error: ${tokenError?.message ?? "none"}`);

      if (tokens && tokens.length > 0) {
        const attendanceLabel = attendance === "attending" ? "attending" : "not attending";
        const messageBody = `${guestName} is ${attendanceLabel}${guestCount > 1 ? ` (+${guestCount - 1})` : ""}`;

        const results = await Promise.all(
          tokens.map(({ token }) =>
            sendPushNotification(
              token,
              "New RSVP",
              messageBody,
              { invitationId, guestName, attendance }
            ).then(() => "ok")
            .catch((err) => {
              pushDebug.push(`push error: ${err instanceof Error ? err.message : String(err)}`);
              return err;
            })
          )
        );
        pushDebug.push(`results: ${JSON.stringify(results)}`);
      } else {
        pushDebug.push(`no tokens for invitation: ${invitationId}`);
      }
    } catch (pushErr) {
      pushDebug.push(`block error: ${pushErr instanceof Error ? pushErr.message : String(pushErr)}`);
    }

    return NextResponse.json({ success: true, id: data.id, pushDebug });
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
