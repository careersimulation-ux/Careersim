import juniorDataAnalystJson from "@shared/simulations/junior-data-analyst.json";
import type { SimulationConfig } from "@shared/simulation/types";
import { describe, expect, it } from "vitest";
import { scoreTaskResponse } from "./scoringEngine";
import { toCatalogSimulation, toPublicSimulationConfig, validateSimulationConfig } from "./simulationEngine";

const config = juniorDataAnalystJson as unknown as SimulationConfig;

describe("CareerSim scoring engine", () => {
  it("awards full deterministic credit for a supported branch-decline finding", () => {
    const task = config.tasks.find(item => item.id === "explore-branch-decline");
    expect(task).toBeDefined();
    const score = scoreTaskResponse({
      task: task!,
      response: { branch: "Riyadh North", evidence: "Revenue declined from Q3 to Q4, showing the largest decrease." },
      hintLevel: 0,
    });
    expect(score.score).toBe(20);
    expect(score.maxScore).toBe(20);
  });

  it("caps attainable score after strong hints without changing objective answers", () => {
    const task = config.tasks.find(item => item.id === "decision");
    const score = scoreTaskResponse({
      task: task!,
      response: { choice: "local-campaign", rationale: "The campaign can restore customer traffic and marketing reach." },
      hintLevel: 3,
    });
    expect(score.score).toBeLessThan(15);
    expect(score.score).toBeGreaterThan(0);
  });

  it("does not expose answer evaluation rules in client-safe simulation configuration", () => {
    const publicConfig = toPublicSimulationConfig(config);
    expect(JSON.stringify(publicConfig)).not.toContain("\"evaluation\"");
    expect(JSON.stringify(publicConfig)).not.toContain("customerMultiplier");
  });

  it("keeps workplace documents and instruction payloads out of public catalog detail", () => {
    const publicDetail = toCatalogSimulation(config);
    expect(JSON.stringify(publicDetail)).not.toContain("Customer_Feedback.pdf");
    expect(JSON.stringify(publicDetail)).not.toContain("customerMultiplier");
  });

  it("validates simulation JSON structure, unique task identifiers, and a 100-point rubric", () => {
    expect(() => validateSimulationConfig(config)).not.toThrow();
    const invalid = { ...config, tasks: config.tasks.map(task => ({ ...task, id: "duplicate" })) };
    expect(() => validateSimulationConfig(invalid)).toThrow("task ids must be unique");
  });
});
