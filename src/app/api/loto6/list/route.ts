import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuthUser } from "@/lib/auth";
import { jsonToNumbers } from "@/lib/db";

interface Loto6Row {
  id: string;
  numbers: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const payload = await getAuthUser(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = await getCloudflareContext({ async: true });
    const db = env.DB;

    const { results } = await db
      .prepare(
        "SELECT id, numbers, created_at FROM loto6_numbers WHERE user_id = ? ORDER BY created_at DESC"
      )
      .bind(payload.uid)
      .all<Loto6Row>();

    const numbers = results.map((row) => ({
      id: row.id,
      numbers: jsonToNumbers(row.numbers),
      created_at: row.created_at,
    }));

    return NextResponse.json({ numbers });
  } catch (error) {
    console.error("Error fetching loto6 numbers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
