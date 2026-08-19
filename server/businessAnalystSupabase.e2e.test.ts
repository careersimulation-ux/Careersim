import businessAnalystJson from "@shared/simulations/business-analyst.json";
import type { SimulationConfig } from "@shared/simulation/types";
import { afterEach, describe, expect, it } from "vitest";
import { ensureSimulationSeed } from "./db/career";
import { appRouter } from "./routers";
import { getSupabase } from "./supabase";

const simulation = businessAnalystJson as unknown as SimulationConfig;
let testUserId: number | undefined;

const responses: Record<string, Record<string, unknown>> = {
  "locate-pipeline-gap": { branch: "Jeddah Growth", evidence: "Jeddah pipeline value has the largest Q3 to Q4 decline across the offices." },
  "test-handoff": { metric: "Customers", dimension: "Month", branch: "Jeddah Growth", cause: "Manual discovery handoff", takeaway: "Qualified lead flow declines while the manual discovery handoff delays ownership." },
  "evidence-synthesis": { sources: ["stakeholder-interviews", "process-audit"], brief: "Stakeholder interviews show that Jeddah opportunities wait for an accountable discovery owner and notes are fragmented. The process audit confirms seven manual handoffs, duplicated discovery work, and a long wait before proposals. Together, the sources show that the workflow handoff, rather than demand, is slowing the opportunity pipeline." },
  "workflow-decision": { choice: "workflow-pilot", rationale: "Run a focused pilot with a named owner and shared workflow to reduce the discovery handoff delay." },
  "executive-recommendation": { recommendation: "Jeddah Growth should pilot a shared intake template, named opportunity owner, and 24-hour discovery review for one segment over eight weeks. The finding is that qualified opportunities decline after a manual discovery handoff, not because market demand is absent. Stakeholder interviews and the process audit show fragmented notes, duplicate calls, and unclear ownership. Faisal should own adoption with Client Success support. Track handoff wait time and discovery-to-proposal cycle time weekly, review both metrics with the operations director every Friday, then compare the pilot with the Q4 baseline before scaling the workflow across the wider advisory practice." },
};

afterEach(async () => {
  if (!testUserId) return;
  await getSupabase().from("users").delete().eq("id", testUserId);
  testUserId = undefined;
});

describe("Business Analyst Supabase workflow", () => {
  it("persists a complete role-specific result, certificate, and portfolio item", async () => {
    await ensureSimulationSeed(simulation);
    const openId = `business-analyst-test-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const { data: user, error } = await getSupabase().from("users")
      .insert({ open_id: openId, name: "Business Analyst Test", email: `${openId}@example.test`, login_method: "test" })
      .select("*")
      .single();
    if (error || !user) throw new Error(`Unable to create Business Analyst test user: ${error?.message ?? "unknown error"}`);
    testUserId = Number(user.id);

    const caller = appRouter.createCaller({
      user: { id: testUserId, openId, name: user.name, email: user.email, loginMethod: user.login_method, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: {},
      res: {},
    } as never);

    await caller.profile.completeOnboarding({ country: "Saudi Arabia", university: "Test University", major: "Business Administration", graduationYear: 2026, careerInterests: ["Business Analysis"], preferredLanguage: "en" });
    const session = await caller.simulation.start({ slug: simulation.slug });
    for (const task of simulation.tasks) {
      await caller.simulation.submitTask({ sessionId: session.id, taskId: task.id, response: responses[task.id]!, hintLevel: 0 });
    }

    const completion = await caller.simulation.complete({ sessionId: session.id });
    const resultBundle = await caller.simulation.result({ sessionId: session.id });
    const certificate = await caller.sharing.certificate({ code: completion.verificationCode });
    const portfolio = await caller.sharing.myPortfolio();

    expect(resultBundle?.result.totalScore).toBe(100);
    expect(resultBundle?.taskScores).toHaveLength(5);
    expect(certificate?.simulation.id).toBe(simulation.id);
    expect(portfolio.items.some(item => item.simulation.id === simulation.id && item.item.summary.includes("Mapped a stalled opportunity pipeline"))).toBe(true);
  }, 60_000);
});
