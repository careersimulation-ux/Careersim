import juniorDataAnalystJson from "@shared/simulations/junior-data-analyst.json";
import type { SimulationConfig } from "@shared/simulation/types";
import { describe, expect, it } from "vitest";
import { buildSalesDataset } from "./syntheticData";

const config = juniorDataAnalystJson as unknown as SimulationConfig;

function total(rows: ReturnType<typeof buildSalesDataset>, metric: "revenue" | "customers" | "averageOrderValue") {
  return rows.reduce((sum, row) => sum + row[metric], 0);
}

describe("Junior Data Analyst synthetic dataset", () => {
  it("contains the designed Riyadh North traffic-led Q4 decline while average order value remains comparatively stable", () => {
    const rows = buildSalesDataset(config).filter(row => row.branch === "Riyadh North");
    const q3 = rows.filter(row => ["2025-07", "2025-08", "2025-09"].includes(row.month));
    const q4 = rows.filter(row => ["2025-10", "2025-11", "2025-12"].includes(row.month));
    const revenueChange = total(q4, "revenue") / total(q3, "revenue") - 1;
    const customerChange = total(q4, "customers") / total(q3, "customers") - 1;
    const q3Aov = total(q3, "averageOrderValue") / q3.length;
    const q4Aov = total(q4, "averageOrderValue") / q4.length;
    const aovChange = q4Aov / q3Aov - 1;

    expect(revenueChange).toBeLessThan(-0.25);
    expect(customerChange).toBeLessThan(-0.25);
    expect(Math.abs(aovChange)).toBeLessThan(0.05);
  });

  it("keeps the dataset light enough for in-browser exploration", () => {
    expect(buildSalesDataset(config)).toHaveLength(600);
  });
});
