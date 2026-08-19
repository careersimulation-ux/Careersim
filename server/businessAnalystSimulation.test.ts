import businessAnalystJson from "@shared/simulations/business-analyst.json";
import type { SimulationConfig } from "@shared/simulation/types";
import { describe, expect, it } from "vitest";
import { scoreTaskResponse } from "./scoringEngine";
import { getSimulationConfig, listSimulationConfigs, validateSimulationConfig } from "./simulationEngine";

const simulation = businessAnalystJson as unknown as SimulationConfig;

const responses: Record<string, Record<string, unknown>> = {
  "locate-pipeline-gap": { branch: "Jeddah Growth", evidence: "Jeddah pipeline value shows the largest Q3 to Q4 decline among the offices." },
  "test-handoff": { metric: "Customers", dimension: "Month", branch: "Jeddah Growth", cause: "Manual discovery handoff", takeaway: "Qualified lead flow falls while the discovery handoff creates a clear delay for the next owner." },
  "evidence-synthesis": { sources: ["stakeholder-interviews", "process-audit"], brief: "Stakeholder interviews show that Jeddah opportunities wait for an accountable discovery owner and notes are fragmented. The process audit confirms seven manual handoffs, duplicated discovery work, and a long wait before proposals. Together, the sources show that the workflow handoff, rather than demand, is slowing the opportunity pipeline." },
  "workflow-decision": { choice: "workflow-pilot", rationale: "Run a focused pilot with a named owner and shared workflow to reduce the discovery handoff delay." },
  "executive-recommendation": { recommendation: "Jeddah Growth should pilot a shared intake template, named opportunity owner, and 24-hour discovery review for one segment over eight weeks. The finding is that qualified opportunities decline after a manual discovery handoff, not because market demand is absent. Stakeholder interviews and the process audit show fragmented notes, duplicate calls, and unclear ownership. Faisal should own adoption with Client Success support. Track handoff wait time and discovery-to-proposal cycle time weekly, review both metrics with the operations director every Friday, then compare the pilot with the Q4 baseline before scaling the workflow across the wider advisory practice." },
};

describe("Business Analyst simulation", () => {
  it("validates and registers as a second live JSON-driven simulation", () => {
    expect(() => validateSimulationConfig(simulation)).not.toThrow();
    expect(getSimulationConfig(simulation.slug)?.id).toBe(simulation.id);
    expect(listSimulationConfigs()).toHaveLength(2);
    expect(simulation.files.every(file => file.downloadUrl.startsWith("/manus-storage/"))).toBe(true);
  });

  it("awards a complete 100-point journey with reusable task types", () => {
    const scores = simulation.tasks.map(task => scoreTaskResponse({ task, response: responses[task.id]!, hintLevel: 0 }));
    expect(scores.map(score => score.score)).toEqual([20, 20, 20, 15, 25]);
    expect(scores.reduce((total, score) => total + score.score, 0)).toBe(100);
  });
});
