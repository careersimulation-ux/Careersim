import juniorDataAnalystJson from "@shared/simulations/junior-data-analyst.json";
import type { SimulationConfig } from "@shared/simulation/types";
import { describe, expect, it } from "vitest";
import { scoreTaskResponse } from "./scoringEngine";
import { validateSimulationConfig } from "./simulationEngine";

const simulation = juniorDataAnalystJson as unknown as SimulationConfig;

const responses: Record<string, Record<string, unknown>> = {
  "explore-branch-decline": { branch: "Riyadh North", evidence: "Revenue shows the largest Q3 to Q4 decline and decrease at Riyadh North." },
  "investigate-cause": { metric: "Customers", dimension: "Month", cause: "Lower customer traffic", takeaway: "Customer traffic fell while AOV stayed stable, explaining the revenue decline." },
  "evidence-brief": { sources: ["customer-feedback", "marketing-performance"], brief: "Customer feedback identified reduced awareness of promotions, while marketing evidence showed a sharp fall in local reach. Together, the documents support the data finding that lower customer traffic drove the decline." },
  decision: { choice: "local-campaign", rationale: "Restore the local campaign to rebuild customer traffic and marketing reach through in-store activation." },
  "management-recommendation": { recommendation: "Riyadh North should restore a targeted local campaign and run weekend activation events next month. The finding is that revenue declined because customer traffic fell sharply in Q4, while average order value remained relatively stable. The sales dataset shows the branch was disproportionately affected, and the marketing report confirms that campaign reach declined after the creative assets expired. Customer feedback also records lower promotion awareness and fewer in-store events. Allocate the available budget to a targeted activation plan, rather than a national discount, because it directly addresses the demand-generation root cause. Track customer visits and campaign-attributed store visits weekly, then compare the result with the Q4 baseline before extending the approach." },
};

describe("Junior Data Analyst end-to-end simulation", () => {
  it("validates the configuration, exposes downloadable source files, and awards a complete five-task submission journey", () => {
    expect(() => validateSimulationConfig(simulation)).not.toThrow();
    expect(simulation.files).toHaveLength(5);
    expect(simulation.files.find(file => file.id === "sales-data")?.downloadUrl).toMatch(/\.xlsx$/);
    expect(simulation.files.filter(file => file.kind !== "dataset").every(file => file.downloadUrl.endsWith(".pdf"))).toBe(true);

    const scores = simulation.tasks.map(task => scoreTaskResponse({ task, response: responses[task.id]!, hintLevel: 0 }));
    expect(scores).toHaveLength(5);
    expect(scores.map(score => score.score)).toEqual([20, 20, 20, 15, 25]);
    expect(scores.reduce((total, score) => total + score.score, 0)).toBe(100);
  });
});
