// =============================================================
// Vitest: Validate SUPABASE_SERVICE_ROLE_KEY is set and works
// =============================================================
import { describe, it, expect } from "vitest";
import { getSupabaseAdmin } from "./_core/supabaseAdmin";

describe("Supabase Admin Client", () => {
  it("should have VITE_SUPABASE_URL set", () => {
    expect(process.env.VITE_SUPABASE_URL).toBeTruthy();
  });

  it("should have SUPABASE_SERVICE_ROLE_KEY set", () => {
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeTruthy();
  });

  it("should create admin client without throwing", () => {
    expect(() => getSupabaseAdmin()).not.toThrow();
  });

  it("should be able to call admin.auth.getUser with invalid token and return null gracefully", async () => {
    const { verifySupabaseToken } = await import("./_core/supabaseAdmin");
    const result = await verifySupabaseToken("invalid-token-for-testing");
    // Should return null (not throw) for invalid tokens
    expect(result).toBeNull();
  });
});
