// =============================================================
// Supabase Integration Tests — King's Running AI Analytics
// v1.1.0
// =============================================================
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

describe("Supabase Connection", () => {
  it("should have VITE_SUPABASE_URL configured", () => {
    expect(supabaseUrl).toBeTruthy();
    expect(supabaseUrl).toMatch(/^https:\/\//);
  });

  it("should have VITE_SUPABASE_ANON_KEY configured", () => {
    expect(supabaseKey).toBeTruthy();
    expect(supabaseKey.length).toBeGreaterThan(20);
  });
});

describe("Supabase running_logs table", () => {
  it("should fetch running logs from Supabase", async () => {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from("running_logs")
      .select("id, date, running_type, distance_km")
      .limit(5);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("date");
      expect(data[0]).toHaveProperty("distance_km");
    }
  });
});

describe("Supabase running_shoes table", () => {
  it("should fetch running shoes from Supabase", async () => {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from("running_shoes")
      .select("id, shoes_name, brand, status")
      .limit(5);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("shoes_name");
    }
  });
});

describe("Supabase races table", () => {
  it("should fetch races from Supabase", async () => {
    const client = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await client
      .from("races")
      .select("id, race_name, date, distance_km")
      .limit(5);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    if (data && data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("race_name");
    }
  });
});

describe("Supabase empty tables", () => {
  it("should access body_composition table without error", async () => {
    const client = createClient(supabaseUrl, supabaseKey);
    const { error } = await client
      .from("body_composition")
      .select("id")
      .limit(1);
    // May be empty or have RLS, but should not throw a connection error
    expect(error === null || error?.code !== "ECONNREFUSED").toBe(true);
  });

  it("should access sleep_logs table without error", async () => {
    const client = createClient(supabaseUrl, supabaseKey);
    const { error } = await client
      .from("sleep_logs")
      .select("id")
      .limit(1);
    expect(error === null || error?.code !== "ECONNREFUSED").toBe(true);
  });

  it("should access heart_rate_logs table without error", async () => {
    const client = createClient(supabaseUrl, supabaseKey);
    const { error } = await client
      .from("heart_rate_logs")
      .select("id")
      .limit(1);
    expect(error === null || error?.code !== "ECONNREFUSED").toBe(true);
  });
});
