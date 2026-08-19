import { describe, expect, it } from "vitest";
import { calculateRoutingDecision } from "@shared/studentRouting";

describe("personalized student routing", () => {
  it("routes a high-school engineering student to a beginner explorer", () => {
    const decision = calculateRoutingDecision({ educationLevel: "high_school", careerInterests: ["Engineering"] });
    expect(decision.career.key).toBe("engineering");
    expect(decision.level).toBe("explorer");
    expect(decision.isExploration).toBe(true);
  });

  it("routes high-school medicine interest to Medicine Explorer when no professional simulation is available", () => {
    const decision = calculateRoutingDecision({ educationLevel: "high_school", careerInterests: ["Medicine"] });
    expect(decision.experience.en).toBe("Medicine Explorer");
    expect(decision.recommendedSimulationAvailable).toBe(false);
  });

  it("routes first-year civil engineering to exploration and second-year to an intern level", () => {
    const firstYear = calculateRoutingDecision({ educationLevel: "university", major: "Civil Engineering", academicYear: "year_1" });
    const secondYear = calculateRoutingDecision({ educationLevel: "university", major: "Civil Engineering", academicYear: "year_2" });
    expect(firstYear.level).toBe("explorer");
    expect(secondYear.level).toBe("intern");
  });

  it("uses assessment or completion evidence for later-year progression rather than academic year alone", () => {
    const withoutEvidence = calculateRoutingDecision({ educationLevel: "university", major: "Civil Engineering", academicYear: "year_4" });
    const withAssessment = calculateRoutingDecision({ educationLevel: "university", major: "Civil Engineering", academicYear: "year_4", assessmentScore: 90 });
    expect(withoutEvidence.level).toBe("intern");
    expect(withoutEvidence.needsSkillCheck).toBe(true);
    expect(withAssessment.level).toBe("advanced_intern");
  });

  it("routes graduates to the junior professional level and maps available technology and business simulations", () => {
    const technology = calculateRoutingDecision({ educationLevel: "graduate", major: "Computer Science" });
    const business = calculateRoutingDecision({ educationLevel: "graduate", major: "Business Administration" });
    expect(technology.level).toBe("junior_professional");
    expect(technology.recommendedSimulationSlug).toBe("junior-data-analyst-gulf-retail-group");
    expect(business.recommendedSimulationSlug).toBe("business-analyst-gulf-growth-partners");
  });

  it("keeps manual alternative-career exploration available through the catalog rather than locking an interest", () => {
    const decision = calculateRoutingDecision({ educationLevel: "university", major: "Other", careerInterests: ["Graphic Design"], academicYear: "year_1" });
    expect(decision.career.key).toBe("design");
    expect(decision.level).toBe("explorer");
  });
});
