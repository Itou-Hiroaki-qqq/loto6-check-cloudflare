import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuthUser } from "@/lib/auth";

export async function DELETE(request: NextRequest) {
  try {
    const payload = await getAuthUser(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const db = env.DB;

    await db
      .prepare("DELETE FROM loto6_numbers WHERE id = ? AND user_id = ?")
      .bind(id, payload.uid)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting loto6 numbers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
