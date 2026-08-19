import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const migration = fs.readFileSync(
  path.join(projectRoot, "supabase", "migrations", "0001_careersim_schema.sql"),
  "utf8",
);
const personalizedMigration = fs.readFileSync(
  path.join(projectRoot, "supabase", "migrations", "0002_personalized_student_routing.sql"),
  "utf8",
);
const compatibilityMigration = fs.readFileSync(
  path.join(projectRoot, "supabase", "migrations", "0003_personalized_routing_compatibility.sql"),
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

describe("personalized student routing migration", () => {
  it("extends the existing profile and creates editable routing rules without another user system", () => {
    expect(personalizedMigration).toContain("alter table careersim.profiles");
    for (const column of ["full_name", "age", "education_level", "academic_year", "assessment_score", "career_path_key", "recommended_level", "routing_decision"]) {
      expect(personalizedMigration).toContain(`add column if not exists ${column}`);
    }
    expect(personalizedMigration).toContain("create table if not exists careersim.career_routing_rules");
    expect(personalizedMigration).not.toMatch(/create table[^\n]*careersim\.student/i);
  });

  it("preserves private service-role-only access and avoids destructive data operations", () => {
    expect(personalizedMigration).toContain("alter table careersim.career_routing_rules enable row level security");
    expect(personalizedMigration).toContain("revoke all privileges on careersim.career_routing_rules from public, anon, authenticated");
    expect(personalizedMigration).toContain("grant select, insert, update, delete on careersim.career_routing_rules to service_role");
    expect(personalizedMigration.toLowerCase()).not.toContain("drop table");
    expect(personalizedMigration.toLowerCase()).not.toContain("delete from careersim.profiles");
  });
});

describe("personalized routing compatibility migration", () => {
  it("adds only the missing runtime fields needed by a prior routing draft", () => {
    for (const column of ["full_name", "assessment_score", "career_path_key", "routing_decision", "career_key", "minimum_assessment_score", "required_completed_simulations", "simulation_slug", "priority", "is_active"]) {
      expect(compatibilityMigration).toContain(`add column if not exists ${column}`);
    }
    expect(compatibilityMigration).toContain("coalesce(minimum_assessment_score, min_assessment_score)");
    expect(compatibilityMigration.toLowerCase()).not.toContain("drop column");
    expect(compatibilityMigration.toLowerCase()).not.toContain("delete from");
  });
});
