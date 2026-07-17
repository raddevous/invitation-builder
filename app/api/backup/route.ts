import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");
    const download = searchParams.get("download") === "true";

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    // Check if backup exists
    const { data: backup, error } = await supabase
      .from("local_data_backups")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      throw error;
    }

    if (!backup) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }

    if (download) {
      // Return the backup data
      return NextResponse.json({
        exists: true,
        data: backup.backup_data,
        created_at: backup.created_at,
        updated_at: backup.updated_at,
      });
    }

    // Just check existence
    return NextResponse.json({
      exists: true,
      created_at: backup.created_at,
      updated_at: backup.updated_at,
    });
  } catch (error) {
    console.error("Error checking backup:", error);
    return NextResponse.json({ error: "Failed to check backup" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, backup_data } = body;

    if (!user_id || !backup_data) {
      return NextResponse.json({ error: "user_id and backup_data are required" }, { status: 400 });
    }

    // Check if backup already exists
    const { data: existingBackup } = await supabase
      .from("local_data_backups")
      .select("id")
      .eq("user_id", user_id)
      .single();

    let result;

    if (existingBackup) {
      // Update existing backup
      result = await supabase
        .from("local_data_backups")
        .update({ backup_data })
        .eq("user_id", user_id)
        .select();
    } else {
      // Create new backup
      result = await supabase
        .from("local_data_backups")
        .insert({ user_id, backup_data })
        .select();
    }

    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({ success: true, data: result.data[0] });
  } catch (error) {
    console.error("Error creating/updating backup:", error);
    return NextResponse.json({ error: "Failed to create/update backup" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("local_data_backups")
      .delete()
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting backup:", error);
    return NextResponse.json({ error: "Failed to delete backup" }, { status: 500 });
  }
}
