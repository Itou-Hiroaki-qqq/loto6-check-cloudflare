/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  AUTO_UPDATE_API_KEY: string;
}
