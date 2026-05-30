import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { readFileSync } from "fs";

// Load env
try {
  const envContent = readFileSync(".env", "utf-8");
  const lines = envContent.split("\n");
  for (const line of lines) {
    const [key, ...vals] = line.split("=");
    if (key && vals.length) process.env[key.trim()] = vals.join("=").trim();
  }
} catch {}

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

// Tables to inspect
const tables = [
  "running_logs",
  "running_shoes",
  "races",
  "body_composition",
  "sleep_logs",
  "heart_rate_logs",
  // Try alternate names
  "shoes",
  "body",
  "sleep",
  "heart_rate",
  "activities",
];

console.log("=== Supabase Table Inspection ===\n");

for (const table of tables) {
  const { data, error } = await supabase.from(table).select("*").limit(2);
  if (error) {
    if (error.code === "42P01") {
      console.log(`❌ ${table}: Table does not exist`);
    } else {
      console.log(`⚠️  ${table}: ${error.message} (code: ${error.code})`);
    }
  } else {
    const cols = data && data.length > 0 ? Object.keys(data[0]) : [];
    console.log(`✅ ${table}: ${data?.length ?? 0} rows (sample cols: ${cols.slice(0, 8).join(", ")})`);
    if (data && data.length > 0) {
      console.log(`   Sample row keys: ${JSON.stringify(Object.keys(data[0]))}`);
    }
  }
}
