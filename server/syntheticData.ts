import type { SalesRecord, SimulationConfig } from "@shared/simulation/types";

const monthlySeasonality = [0.93, 0.95, 1.02, 1.04, 1.01, 0.98, 0.96, 0.97, 1.0, 1.04, 1.08, 1.14];

export function buildSalesDataset(config: SimulationConfig): SalesRecord[] {
  const { months, branches, categories, anomaly } = config.datasetBlueprint;

  return months.flatMap((month, monthIndex) =>
    branches.flatMap((branch, branchIndex) =>
      categories.map((category, categoryIndex) => {
        const seasonal = monthlySeasonality[monthIndex] ?? 1;
        const pattern = 1 + (((branchIndex * 3 + categoryIndex * 2 + monthIndex) % 7) - 3) / 100;
        const affected = branch.name === anomaly.branch && anomaly.months.includes(month);
        const customers = Math.round(
          (branch.baselineCustomers * category.multiplier * seasonal * pattern * (affected ? anomaly.customerMultiplier : 1)) / categories.length,
        );
        const aovShift = affected ? 1.012 : 1 + (((monthIndex + categoryIndex) % 3) - 1) / 100;
        const averageOrderValue = Math.round(branch.baselineAov * aovShift);
        const discount = Math.round(0.06 * 100 + ((categoryIndex + monthIndex) % 3) * 1.2) / 100;
        const revenue = Math.round(customers * averageOrderValue * (1 - discount));
        const unitsSold = Math.round(customers * (0.85 + categoryIndex * 0.13));
        const returns = Math.round(unitsSold * (0.035 + categoryIndex * 0.004) * (affected ? anomaly.returnMultiplier : 1));
        const cost = Math.round(revenue * (1 - category.margin));
        const marketingSpend = Math.round(
          branch.baselineCustomers * category.multiplier * 0.19 * seasonal * (affected ? anomaly.marketingMultiplier : 1),
        );

        return {
          id: `${month}-${branchIndex}-${categoryIndex}`,
          date: `${month}-01`,
          month,
          branch: branch.name,
          city: branch.city,
          productCategory: category.category,
          product: category.product,
          unitsSold,
          revenue,
          cost,
          profit: revenue - cost,
          customers,
          averageOrderValue,
          marketingSpend,
          discount,
          returns,
        };
      }),
    ),
  );
}

export function aggregateSales(records: SalesRecord[]) {
  return records.reduce(
    (totals, record) => ({
      revenue: totals.revenue + record.revenue,
      profit: totals.profit + record.profit,
      customers: totals.customers + record.customers,
      unitsSold: totals.unitsSold + record.unitsSold,
      marketingSpend: totals.marketingSpend + record.marketingSpend,
      returns: totals.returns + record.returns,
    }),
    { revenue: 0, profit: 0, customers: 0, unitsSold: 0, marketingSpend: 0, returns: 0 },
  );
}
