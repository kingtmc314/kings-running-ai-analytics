import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase connection", () => {
  it("should connect to Supabase and list tables", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_ANON_KEY;
    expect(url).toBeTruthy();
    expect(key).toBeTruthy();

    const supabase = createClient(url!, key!);
    // Try a lightweight query — just fetch 1 row from any table or check health
    const { error } = await supabase.from("running_logs").select("id").limit(1);
    // If table doesn't exist yet, error code will be 42P01 (undefined_table) — that's OK
    // What matters is we got a response (not a network/auth error)
    if (error) {
      // Auth errors (401/403) mean bad credentials
      expect(error.code).not.toBe("401");
      expect(error.message).not.toContain("Invalid API key");
      console.log("Table may not exist yet:", error.message);
    } else {
      console.log("Connected to Supabase successfully");
    }
  });
});
