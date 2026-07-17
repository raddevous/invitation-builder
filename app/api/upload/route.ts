import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/middleware";

export async function POST(request: NextRequest) {
  // Verify JWT token
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) {
    return auth;
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const field = formData.get("field") as string | null;
    const invitationId = formData.get("invitationId") as string | null;

    if (!file || !field || !invitationId) {
      return NextResponse.json(
        { error: "Missing file, field, or invitationId" },
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

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${invitationId}/${field}/custom.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Determine proper content type, especially for font files
    // Supabase storage may not support the `font/*` MIME types, so use `application/octet-stream` for fonts
    let contentType = file.type;
    const fontExtensions = ['woff2', 'woff', 'ttf', 'otf'];
    if (fontExtensions.includes(ext)) {
      contentType = "application/octet-stream";
    }

    // Ensure the user-uploads bucket allows the required MIME types
    await supabaseAdmin.storage.updateBucket("user-uploads", {
      allowedMimeTypes: [
        'image/*',
        'audio/*',
        'video/*',
        'font/woff2',
        'font/woff',
        'font/ttf',
        'font/otf',
        'application/x-font-woff',
        'application/x-font-woff2',
        'application/x-font-ttf',
        'application/x-font-opentype',
        'application/font-woff',
        'application/font-woff2',
        'application/font-ttf',
        'application/font-sfnt',
        'application/octet-stream'
      ],
      public: true,
    });

    const { error: uploadError } = await supabaseAdmin.storage
      .from("user-uploads")
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("user-uploads").getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
