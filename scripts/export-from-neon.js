/**
 * 旧Neon DBから当選番号データをエクスポートするスクリプト
 *
 * 使い方:
 *   1. 旧プロジェクト (loto6-check) の .env.local から DATABASE_URL を取得
 *   2. 以下を実行:
 *      DATABASE_URL="postgresql://..." node scripts/export-from-neon.js
 *   3. winning_numbers.json が生成される
 *
 * 注意: このスクリプトは旧プロジェクト側で実行する想定です。
 *       @neondatabase/serverless パッケージが必要です。
 */

const { neon } = require("@neondatabase/serverless");

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL が設定されていません");
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log("当選番号データをエクスポート中...");

  const rows = await sql`
    SELECT
      TO_CHAR(draw_date, 'YYYY-MM-DD') as draw_date,
      main_numbers,
      bonus_number,
      draw_number
    FROM winning_numbers
    ORDER BY draw_date ASC
  `;

  console.log(`${rows.length} 件のデータを取得しました`);

  // D1用のJSON形式に変換
  const data = rows.map((row) => ({
    draw_date: row.draw_date,
    main_numbers: JSON.stringify(row.main_numbers),
    bonus_number: row.bonus_number,
    draw_number: row.draw_number,
  }));

  const fs = require("fs");
  fs.writeFileSync("winning_numbers.json", JSON.stringify(data, null, 2));
  console.log("winning_numbers.json に保存しました");
}

main().catch(console.error);
