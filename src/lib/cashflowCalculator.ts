// CASHFLOW RECHENKERN
export type IncomeRow = { name: string; net: number };
export type ExpenseRow = { name: string; amount: number };
export type AssetRow = { name: string; monthly: number; value: number };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const sum = <T>(rows: T[], fn: (r: T) => number) => rows.reduce((a, r) => a + fn(r), 0);

export function simulateGrowth(args: {
  years: number;
  startCapital: number;
  monthlyContribution: number;
  annualRate: number;
}) {
  const points: Array<{ year: number; value: number }> = [{ year: 0, value: Math.max(0, args.startCapital) }];
  const mRate = clamp(args.annualRate / 12, -0.99, 5);
  let value = Math.max(0, args.startCapital);

  for (let year = 1; year <= args.years; year += 1) {
    for (let month = 0; month < 12; month += 1) {
      value += Math.max(0, args.monthlyContribution);
      value *= 1 + mRate;
    }
    points.push({ year, value });
  }
  return points;
}

export function calculateCashflow(input: {
  monthlyIncomeRows: IncomeRow[];
  annualIncomeRows: IncomeRow[];
  expensesNecessary: ExpenseRow[];
  expensesOptional: ExpenseRow[];
  insuranceRows: ExpenseRow[];
  assetsShort: AssetRow[];
  assetsMid: AssetRow[];
  assetsLong: AssetRow[];
  targetAllocation: { liabilities: number; insurance: number; liquidity: number; wealth: number; retirement: number };
  liquidityGoal: number;
  liquidityGoalAuto: boolean;
  surplusStartCapital: number;
  surplusMonthly: number;
  surplusYears: number;
  surplusReturnRate: number;
  surplusInflationRate: number;
  surplusInterestRate: number;
}) {
  const incomeMonthlyNetOnly = sum(input.monthlyIncomeRows, (r) => r.net);
  const incomeAnnualNetOnly = sum(input.annualIncomeRows, (r) => r.net);
  const incomeMonthlyNet = incomeMonthlyNetOnly + incomeAnnualNetOnly / 12;

  const monthlySalaryNet = Math.max(
    0,
    input.monthlyIncomeRows.find((r) => r.name.toLowerCase().includes("gehalt"))?.net ?? incomeMonthlyNetOnly
  );
  const recommendedLiquidityGoal = monthlySalaryNet * 3;

  const expenseNecessaryMonthly = sum(input.expensesNecessary, (r) => r.amount);
  const expenseOptionalMonthly = sum(input.expensesOptional, (r) => r.amount);
  const insuranceMonthly = sum(input.insuranceRows, (r) => r.amount);
  const liabilitiesMonthly = expenseNecessaryMonthly + expenseOptionalMonthly;

  const shortMonthly = sum(input.assetsShort, (r) => r.monthly);
  const midMonthly = sum(input.assetsMid, (r) => r.monthly);
  const longMonthly = sum(input.assetsLong, (r) => r.monthly);

  const shortValue = sum(input.assetsShort, (r) => r.value);
  const midValue = sum(input.assetsMid, (r) => r.value);
  const longValue = sum(input.assetsLong, (r) => r.value);

  const assetsMonthlyTotal = shortMonthly + midMonthly + longMonthly;
  const freeMonthlyRaw = incomeMonthlyNet - liabilitiesMonthly - insuranceMonthly - assetsMonthlyTotal;
  const freeMonthly = Math.max(0, freeMonthlyRaw);
  const freeYearly = freeMonthly * 12;

  const activeLiquidityGoal = input.liquidityGoalAuto ? recommendedLiquidityGoal : input.liquidityGoal;
  const liquidityCoverage = activeLiquidityGoal <= 0 ? 100 : (shortValue / activeLiquidityGoal) * 100;
  const liquiditySurplus = shortValue - activeLiquidityGoal;

  const years = clamp(Math.round(input.surplusYears), 1, 40);

  // Rates
  const interestRate = clamp(input.surplusInterestRate / 100, -0.95, 2);
  const returnRate = clamp(input.surplusReturnRate / 100, -0.95, 2);
  const inflationRate = clamp(input.surplusInflationRate / 100, 0, 1);

  // 1. Nominal Savings (Guthabenzins)
  const growthNominalSavings = simulateGrowth({
    years,
    startCapital: input.surplusStartCapital,
    monthlyContribution: input.surplusMonthly,
    annualRate: interestRate,
  });

  // 2. Real Savings (Guthabenzins - Inflation)
  const growthRealSavings = simulateGrowth({
    years,
    startCapital: input.surplusStartCapital,
    monthlyContribution: input.surplusMonthly,
    annualRate: interestRate - inflationRate,
  });

  // 3. Real Investment (Rendite - Inflation)
  const growthRealInvestment = simulateGrowth({
    years,
    startCapital: input.surplusStartCapital,
    monthlyContribution: input.surplusMonthly,
    annualRate: returnRate - inflationRate,
  });

  // 4. Nominal Investment (Only for Loss calculation context if needed, or we just rely on Real Investment)
  const growthNominalInvestment = simulateGrowth({
    years,
    startCapital: input.surplusStartCapital,
    monthlyContribution: input.surplusMonthly,
    annualRate: returnRate,
  });

  // Loss Calculation: Difference between Nominal Investment and Real Investment (Purchasing Power Loss of the Investment)
  // OR Difference between Nominal Savings and Real Savings (Purchasing Power Loss of Cash)
  // The user said "Unten der Inflationsverlust... das passt auch". 
  // Previous implementation was: Nominal Invesment - Effective Investment. 
  // We keep this logic but using new variable names.
  const lossTotal = Math.max(
    0,
    (growthNominalInvestment[growthNominalInvestment.length - 1]?.value ?? 0) - (growthRealInvestment[growthRealInvestment.length - 1]?.value ?? 0)
  );

  const lossYearly = lossTotal / years;
  const lossMonthly = lossYearly / 12;
  const lossDaily = lossYearly / 365;

  return {
    incomeMonthlyNet,
    freeMonthly,
    freeYearly,
    liabilitiesMonthly,
    insuranceMonthly,
    shortValue,
    midValue,
    longValue,
    shortMonthly,
    midMonthly,
    longMonthly,
    activeLiquidityGoal,
    liquidityCoverage,
    liquiditySurplus,

    // New Return Values
    growthNominalSavings,
    growthRealSavings,
    growthRealInvestment,
    growthNominalInvestment,

    lossTotal,
    lossYearly,
    lossMonthly,
    lossDaily,
    recommendedLiquidityGoal,
    assetsMonthlyTotal,
    expenseNecessaryMonthly,
    expenseOptionalMonthly,
  };
}
