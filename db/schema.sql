-- ユーザーテーブル
CREATE TABLE IF NOT EXISTS users (
    uid TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ロト6番号テーブル（ユーザー登録番号）
CREATE TABLE IF NOT EXISTS loto6_numbers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    numbers TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_loto6_numbers_user_id ON loto6_numbers(user_id);

-- 当選番号テーブル
CREATE TABLE IF NOT EXISTS winning_numbers (
    draw_date TEXT PRIMARY KEY,
    main_numbers TEXT NOT NULL,
    bonus_number INTEGER NOT NULL,
    draw_number INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
