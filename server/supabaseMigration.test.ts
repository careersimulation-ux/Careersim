import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = fs.readFileSync(
  path.join(projectRoot, "supabase", "migrations", "0001_careersim_schema.sql"),
  "utf8",
);

describe("CareerSim Supabase SQL migration", () => {
  it("creates an isolated schema with the complete persistence model", () => {
    expect(migration).toContain("create schema if not exists careersim");

    for (const table of [
      "users",
      "profiles",
      "simulations",
      "simulation_sessions",
      "task_submissions",
      "task_scores",
      "simulation_results",
      "certificates",
      "portfolio_items",
      "simulation_events",
    ]) {
      expect(migration).toContain(`create table if not exists careersim.${table}`);
      expect(migration).toContain(`alter table careersim.${table} enable row level security`);
    }
  });

  it("keeps browser roles out of the data model and contains no destructive table operation", () => {
    expect(migration).toContain("revoke all privileges on all tables in schema careersim from public, anon, authenticated");
    expect(migration).toContain("grant select, insert, update, delete on all tables in schema careersim to service_role");
    expect(migration.toLowerCase()).not.toContain("drop table");
  });
});
