import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_ANON_KEY;
const sb = createClient(url, key);

// Insert a minimal row to get back the full column list
async function discoverColumns(table, testRow) {
  const { data, error } = await sb.from(table).insert(testRow).select("*");
  if (error) {
    console.log(`${table} insert error: ${error.message}`);
    console.log(`  hint: ${error.hint || "none"}`);
    console.log(`  details: ${error.details || "none"}`);
  } else {
    console.log(`${table} columns: ${Object.keys(data[0] || {}).join(", ")}`);
    // Clean up
    if (data[0]?.id) {
      await sb.from(table).delete().eq("id", data[0].id);
    }
  }
}

// Try minimal inserts
await discoverColumns("body_composition", { date: "2026-01-01" });
await discoverColumns("sleep_logs", { date: "2026-01-01" });
await discoverColumns("heart_rate_logs", { date: "2026-01-01" });
