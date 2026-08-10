import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";

const WP_API_URL = (process.env.WP_API_URL || "").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  // Verify JWT token
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    console.error("Upload: auth failed");
    return auth;
  }

  if (!WP_API_URL) {
    console.error("Upload: WP_API_URL not configured");
    return NextResponse.json(
      { error: "Upload service not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const field = formData.get("field") as string | null;
    const invitationId = formData.get("invitationId") as string | null;

    console.log("Upload: received", { field, invitationId, hasFile: !!file, fileName: file?.name, fileSize: file?.size });

    if (!file || !field || !invitationId) {
      console.error("Upload: missing params", { file: !!file, field, invitationId });
      return NextResponse.json(
        { error: "Missing file, field, or invitationId" },
        { status: 400 }
      );
    }

    // Verify the token matches the invitation being updated
    if (auth.invitationId !== invitationId) {
      console.error("Upload: auth mismatch", { authInvitationId: auth.invitationId, invitationId });
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Forward the file to WordPress
    const wpFormData = new FormData();
    wpFormData.append("file", file);
    wpFormData.append("field", field);
    wpFormData.append("invitationId", invitationId);

    console.log("Upload: forwarding to WordPress", `${WP_API_URL}/upload`);

    const wpResponse = await fetch(`${WP_API_URL}/upload`, {
      method: "POST",
      body: wpFormData,
      headers: {
        "X-Invitation-Id": invitationId,
      },
    });

    console.log("Upload: WordPress response", wpResponse.status, wpResponse.statusText);

    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      console.error("WordPress upload failed:", wpResponse.status, errorText);
      let errorMsg = "Upload failed";
      try { const error = JSON.parse(errorText); errorMsg = error.error || error.message || errorMsg; } catch {}
      return NextResponse.json(
        { error: errorMsg },
        { status: wpResponse.status }
      );
    }

    const result = await wpResponse.json();
    console.log("Upload: success, url:", result.url);
    return NextResponse.json({ url: result.url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed: " + (err instanceof Error ? err.message : String(err)) }, { status: 500 });
  }
}
