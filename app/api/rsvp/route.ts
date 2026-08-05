import { NextRequest, NextResponse } from "next/server";
import { wpSubmitRsvp, wpGetRsvps, wpGetPushTokens } from "@/lib/wp/client";
import { sendPushNotification } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

    const { ok, body: result } = await wpSubmitRsvp({
      invitationId,
      guestName,
      attendance,
      guestCount: guestCount || 1,
      message: message || null,
    });

    if (!ok || !result?.id) {
      return NextResponse.json(
        { error: "Failed to save RSVP" },
        { status: 500 }
      );
    }

    // Send push notification to the host (best-effort, non-blocking)
    try {
      const { ok: tokensOk, body: tokensBody } = await wpGetPushTokens(invitationId);

      if (tokensOk && tokensBody?.tokens && tokensBody.tokens.length > 0) {
        const attendanceLabel = attendance === "attending" ? "attending" : "not attending";
        const messageBody = `${guestName} is ${attendanceLabel}${guestCount > 1 ? ` (+${guestCount - 1})` : ""}`;

        await Promise.all(
          tokensBody.tokens.map((token) =>
            sendPushNotification(
              token,
              "New RSVP",
              messageBody,
              { invitationId, guestName, attendance }
            ).catch(() => {})
          )
        );
      }
    } catch {
      // push notification failure should not affect RSVP save
    }

    return NextResponse.json({ success: true, id: result.id });
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

    const { ok, body } = await wpGetRsvps(invitationId);

    if (!ok) {
      return NextResponse.json(
        { error: "Failed to fetch RSVPs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ responses: body?.responses ?? [] });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
