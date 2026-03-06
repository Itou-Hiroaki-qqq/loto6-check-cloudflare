import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { scrapeWinningNumbers } from "@/lib/loto6/scraper";
import { numbersToJson } from "@/lib/db";

async function handleAutoUpdate(request: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true });

    // APIキー認証
    const apiKey = request.headers.get("x-api-key");
    const expectedApiKey = env.AUTO_UPDATE_API_KEY;

    if (!expectedApiKey) {
      console.error("[Auto Update] AUTO_UPDATE_API_KEY is not set");
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    if (apiKey !== expectedApiKey) {
      console.warn("[Auto Update] Invalid API key attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Auto Update] Starting automatic update...");

    const results = await scrapeWinningNumbers();

    if (results.length === 0) {
      console.warn("[Auto Update] No winning numbers found");
      return NextResponse.json({
        success: true,
        message: "当選番号が見つかりませんでした",
        count: 0,
      });
    }

    const db = env.DB;

    let savedCount = 0;
    let updatedCount = 0;

    for (const result of results) {
      try {
        // 既存データチェック
        const existing = await db
          .prepare("SELECT draw_date FROM winning_numbers WHERE draw_date = ?")
          .bind(result.drawDate)
          .first();

        const now = new Date().toISOString();

        if (existing) {
          // 更新
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
          // 新規挿入
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
        console.error(
          `[Auto Update] Error saving ${result.drawDate}:`,
          error
        );
      }
    }

    const message =
      savedCount > 0
        ? `自動更新完了: 新規${savedCount}件、更新${updatedCount}件`
        : `自動更新完了: 更新${updatedCount}件（新規データなし）`;

    console.log(`[Auto Update] ${message}`);

    return NextResponse.json({
      success: true,
      message,
      count: savedCount,
      updated: updatedCount,
      total: results.length,
    });
  } catch (error) {
    console.error("[Auto Update] Error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: `エラーが発生しました: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleAutoUpdate(request);
}

export async function POST(request: NextRequest) {
  return handleAutoUpdate(request);
}
