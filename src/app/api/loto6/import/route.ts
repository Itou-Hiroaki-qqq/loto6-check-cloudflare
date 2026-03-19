import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { numbersToJson } from "@/lib/db";

interface ImportData {
  drawDate: string;
  mainNumbers: number[];
  bonusNumber: number;
  drawNumber?: number;
}

/**
 * loto6-auto-update からのデータ受信用エンドポイント
 * POST /api/loto6/import
 * Body: { results: ImportData[] }
 */
export async function POST(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    // APIキー認証
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = env.AUTO_UPDATE_API_KEY;

    if (!expectedApiKey) {
      console.error("[Import] AUTO_UPDATE_API_KEY is not set");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    if (apiKey !== expectedApiKey) {
      console.warn("[Import] Invalid API key attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { results: ImportData[] };
    const results = body.results;

    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json(
        { error: "No data provided" },
        { status: 400 }
      );
    }

    console.log(`[Import] Receiving ${results.length} record(s)...`);

    const db = env.DB;
    let savedCount = 0;
    let updatedCount = 0;

    for (const result of results) {
      try {
        const existing = await db
          .prepare("SELECT draw_date FROM winning_numbers WHERE draw_date = ?")
          .bind(result.drawDate)
          .first();

        const now = new Date().toISOString();

        if (existing) {
          await db
            .prepare(
              "UPDATE winning_numbers SET main_numbers = ?, bonus_number = ?, draw_number = ?, updated_at = ? WHERE draw_date = ?"
            )
            .bind(
              numbersToJson(result.mainNumbers),
              result.bonusNumber,
              result.drawNumber || null,
              now,
              result.drawDate
            )
            .run();
          updatedCount++;
        } else {
          await db
            .prepare(
              "INSERT INTO winning_numbers (draw_date, main_numbers, bonus_number, draw_number, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
            )
            .bind(
              result.drawDate,
              numbersToJson(result.mainNumbers),
              result.bonusNumber,
              result.drawNumber || null,
              now,
              now
            )
            .run();
          savedCount++;
        }
      } catch (error) {
        console.error(`[Import] Error saving ${result.drawDate}:`, error);
      }
    }

    const message = `インポート完了: 新規${savedCount}件、更新${updatedCount}件`;
    console.log(`[Import] ${message}`);

    return NextResponse.json({
      success: true,
      message,
      count: savedCount,
      updated: updatedCount,
      total: results.length,
    });
  } catch (error) {
    console.error("[Import] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: `エラーが発生しました: ${errorMessage}` },
      { status: 500 }
    );
  }
}
