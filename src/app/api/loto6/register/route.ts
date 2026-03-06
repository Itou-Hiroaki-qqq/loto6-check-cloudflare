import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuthUser } from "@/lib/auth";
import { numbersToJson } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthUser(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { numbers: number[] };
    const { numbers } = body;

    if (!Array.isArray(numbers) || numbers.length !== 6) {
      return NextResponse.json(
        { error: "6個の数字を入力してください" },
        { status: 400 }
      );
    }

    for (const num of numbers) {
      if (typeof num !== "number" || num < 1 || num > 43) {
        return NextResponse.json(
          { error: "数字は1～43の範囲で入力してください" },
          { status: 400 }
        );
      }
    }

    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== 6) {
      return NextResponse.json(
        { error: "同じ数字は入力できません" },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext({ async: true });
    const db = env.DB;

    const id = crypto.randomUUID();
    const sortedNumbers = [...numbers].sort((a, b) => a - b);
    const now = new Date().toISOString();

    await db
      .prepare(
        "INSERT INTO loto6_numbers (id, user_id, numbers, created_at) VALUES (?, ?, ?, ?)"
      )
      .bind(id, payload.uid, numbersToJson(sortedNumbers), now)
      .run();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error registering loto6 numbers:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
