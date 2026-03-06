import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getAuthUser } from "@/lib/auth";
import { jsonToNumbers } from "@/lib/db";
import { checkLoto6 } from "@/lib/loto6/check";
import { CheckResult } from "@/lib/loto6/types";

interface WinningRow {
  draw_date: string;
  main_numbers: string;
  bonus_number: number;
  draw_number: number | null;
}

interface UserNumberRow {
  id: string;
  numbers: string;
}

type CheckResultWithId = CheckResult & { userNumberId: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: NextRequest) {
  try {
    const payload = await getAuthUser(request);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { startDate?: string; endDate?: string };
    const { startDate, endDate } = body;

    if (startDate && !DATE_PATTERN.test(startDate)) {
      return NextResponse.json(
        { error: "開始日の形式が不正です（YYYY-MM-DD）" },
        { status: 400 }
      );
    }
    if (endDate && !DATE_PATTERN.test(endDate)) {
      return NextResponse.json(
        { error: "終了日の形式が不正です（YYYY-MM-DD）" },
        { status: 400 }
      );
    }

    const { env } = await getCloudflareContext({ async: true });
    const db = env.DB;

    // ユーザーの登録番号を取得
    const { results: userNumbersResult } = await db
      .prepare(
        "SELECT id, numbers FROM loto6_numbers WHERE user_id = ? ORDER BY created_at DESC"
      )
      .bind(payload.uid)
      .all<UserNumberRow>();

    if (userNumbersResult.length === 0) {
      return NextResponse.json(
        { error: "登録された番号がありません" },
        { status: 400 }
      );
    }

    // 当選番号を取得
    let winningNumbersList: WinningRow[];

    if (startDate && endDate) {
      const { results } = await db
        .prepare(
          "SELECT draw_date, main_numbers, bonus_number, draw_number FROM winning_numbers WHERE draw_date >= ? AND draw_date <= ? ORDER BY draw_date DESC"
        )
        .bind(startDate, endDate)
        .all<WinningRow>();
      winningNumbersList = results;
    } else if (startDate) {
      const { results } = await db
        .prepare(
          "SELECT draw_date, main_numbers, bonus_number, draw_number FROM winning_numbers WHERE draw_date >= ? ORDER BY draw_date DESC"
        )
        .bind(startDate)
        .all<WinningRow>();
      winningNumbersList = results;
    } else if (endDate) {
      const { results } = await db
        .prepare(
          "SELECT draw_date, main_numbers, bonus_number, draw_number FROM winning_numbers WHERE draw_date <= ? ORDER BY draw_date DESC"
        )
        .bind(endDate)
        .all<WinningRow>();
      winningNumbersList = results;
    } else {
      // デフォルト: 最新10件
      const { results } = await db
        .prepare(
          "SELECT draw_date, main_numbers, bonus_number, draw_number FROM winning_numbers ORDER BY draw_date DESC LIMIT 10"
        )
        .all<WinningRow>();
      winningNumbersList = results;
    }

    // 各ユーザー番号に対して判定を実行
    const results: CheckResultWithId[] = [];

    for (const userNumberRecord of userNumbersResult) {
      const userNumbers = jsonToNumbers(userNumberRecord.numbers);

      for (const winning of winningNumbersList) {
        const checkResult = checkLoto6(userNumbers, {
          drawDate: winning.draw_date,
          mainNumbers: jsonToNumbers(winning.main_numbers),
          bonusNumber: winning.bonus_number,
          drawNumber: winning.draw_number ?? undefined,
        });

        results.push({
          userNumberId: userNumberRecord.id,
          ...checkResult,
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[API] Error fetching from database:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `エラーが発生しました: ${errorMessage}`,
        results: [],
      },
      { status: 500 }
    );
  }
}
