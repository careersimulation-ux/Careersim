import { describe, expect, it } from "vitest";
import { getSupabase } from "./supabase";

describe("CareerSim Supabase adapter", () => {
  it("reads the exposed careersim schema through the server-only client", async () => {
    const { error } = await getSupabase().from("simulations").select("id").limit(1);
    expect(error).toBeNull();
  });
});
