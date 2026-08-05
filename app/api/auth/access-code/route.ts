import { NextRequest, NextResponse } from "next/server";
import { wpAuthAccessCode } from "@/lib/wp/client";
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

    const { ok, body } = await wpAuthAccessCode(accessCode.trim().toUpperCase());

    if (!ok || !body?.invitation) {
      return NextResponse.json(
        { error: "Invalid access code" },
        { status: 401 }
      );
    }

    const { invitation } = body;

    // Generate JWT token
    const token = generateToken({
      invitationId: invitation.id,
      slug: invitation.slug,
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
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

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
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
