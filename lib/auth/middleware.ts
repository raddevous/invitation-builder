import { NextRequest, NextResponse } from "next/server";
import { verifyToken, type JWTPayload } from "./jwt";

export function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get("auth_token")?.value;
  return token || null;
}

export function verifyAuth(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(request: NextRequest): NextResponse | JWTPayload {
  const payload = verifyAuth(request);
  if (!payload) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return payload;
}
