import { describe, expect, it } from "vitest";

describe("Supabase project connection", () => {
  it("accepts the configured publishable key at the public auth settings endpoint", async () => {
    const projectUrl = process.env.SUPABASE_URL;
    const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(publishableKey).toMatch(/^sb_publishable_/);

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: { apikey: publishableKey! },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toBeTypeOf("object");
  });

  it("accepts the configured server-only service-role key", async () => {
    const projectUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(projectUrl).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/i);
    expect(serviceRoleKey).toBeTruthy();

    const response = await fetch(`${projectUrl}/auth/v1/settings`, {
      headers: { apikey: serviceRoleKey! },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toBeTypeOf("object");
  });
});
