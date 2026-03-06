/**
 * エクスポートした当選番号データをD1にインポートするスクリプト
 *
 * 使い方:
 *   1. export-from-neon.js で winning_numbers.json を生成
 *   2. wrangler.toml の database_id を本番のD1データベースIDに設定
 *   3. 以下を実行:
 *      node scripts/import-to-d1.js
 *   4. 生成された import-winning-numbers.sql を確認
 *   5. 以下を実行してD1にインポート:
 *      npx wrangler d1 execute loto6-check-db --file=scripts/import-winning-numbers.sql
 *      (ローカルDBの場合は --local を追加)
 */

const fs = require("fs");

function main() {
  const inputFile = "winning_numbers.json";
  const outputFile = "scripts/import-winning-numbers.sql";

  if (!fs.existsSync(inputFile)) {
    console.error(`${inputFile} が見つかりません。先に export-from-neon.js を実行してください。`);
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(inputFile, "utf-8"));
  console.log(`${data.length} 件のデータを変換中...`);

  const lines = data.map((row) => {
    const mainNumbers = row.main_numbers;
    const drawNumber = row.draw_number !== null ? row.draw_number : "NULL";
    const now = new Date().toISOString();
    return `INSERT OR REPLACE INTO winning_numbers (draw_date, main_numbers, bonus_number, draw_number, created_at, updated_at) VALUES ('${row.draw_date}', '${mainNumbers}', ${row.bonus_number}, ${drawNumber}, '${now}', '${now}');`;
  });

  const sql = lines.join("\n");
  fs.writeFileSync(outputFile, sql);
  console.log(`${outputFile} に ${data.length} 件のINSERT文を生成しました`);
  console.log(`\n次のコマンドでD1にインポートしてください:`);
  console.log(`  npx wrangler d1 execute loto6-check-db --file=${outputFile}`);
  console.log(`  (ローカルDBの場合は --local を追加)`);
}

main();
