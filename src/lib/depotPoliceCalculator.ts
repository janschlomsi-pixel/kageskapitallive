// DEPOT VS POLICE RECHENKERN
export type YesNo = "yes" | "no";
export type PartialExemptionKind = "equity" | "mixed" | "realestate";

export type DepotCosts = {
  effectiveCostPct: number;
  switchSellPct: number;
  switchBuyPct: number;
};

export type PolicyCosts = {
  acquisitionPeriodYears: number;
  acquisitionCostPct: number;
  adminCostType: "falling" | "constant";
  adminCostFirstYearPct: number;
  adminCostLastYearPct: number;
  assetBasedAdminPct: number;
  pieceCostEUR: number;
  oneTimePaymentCostPct: number;
  contractStartOneTimeEUR: number;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function yearsBetween(a: Date, b: Date) {
  let years = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) years -= 1;
  return years;
}

function partialExemptionRate(kind: PartialExemptionKind) {
  if (kind === "equity") return 0.3;
  if (kind === "mixed") return 0.15;
  return 0.6;
}

export interface DepotPoliceInput {
  dob: Date;
  today: Date;
  retirementAge: number;
  monthlyContribution: number;
  initialCapital: number;
  contributionGrowthPct: number;
  annualReturnPct: number;
  abgeltungTaxPct: number;
  basiszinsPct: number;
  allowanceEUR: number;
  partialExemptionKind: PartialExemptionKind;
  switchSimulation: YesNo;
  switchEveryYears: number;
  depotCosts: DepotCosts;
  policyCosts: PolicyCosts;
}

export interface DepotPoliceResult {
  currentAge: number;
  yearsToRetirement: number;
  points: Array<{ year: number; payment: number; depot: number; policy: number }>;
  finalPayment: number;
  finalDepot: number;
  finalPolicy: number;
  deltaPolicyVsDepot: number;
  policyAheadSinceYear: number | null;
}

export function simulateDepotVsPolice(input: DepotPoliceInput): DepotPoliceResult {
  const currentAge = clamp(yearsBetween(input.dob, input.today), 0, 95);
  const yearsToRetirement = clamp(input.retirementAge - currentAge, 1, 50);

  const annualReturn = clamp(input.annualReturnPct / 100, 0, 0.2);
  const monthlyReturn = annualReturn / 12;
  const taxRate = clamp(input.abgeltungTaxPct / 100, 0, 0.5);
  const basiszinsRate = clamp(input.basiszinsPct / 100, 0, 0.12);
  const partialExemption = partialExemptionRate(input.partialExemptionKind);
  const dynamicRate = clamp(input.contributionGrowthPct / 100, 0, 0.2);

  const depotCostMonth = clamp(input.depotCosts.effectiveCostPct / 100 / 12, 0, 0.2);
  const switchSellRate = clamp(input.depotCosts.switchSellPct / 100, 0, 0.4);
  const switchBuyRate = clamp(input.depotCosts.switchBuyPct / 100, 0, 0.4);

  const policyAcqRate = clamp(input.policyCosts.acquisitionCostPct / 100, 0, 0.5);
  const policyAcqYears = clamp(Math.round(input.policyCosts.acquisitionPeriodYears), 1, 40);

  // GAMMA: Asset Based Fee (Kapitalkosten)
  const policyGammaRateMonthly = clamp(input.policyCosts.assetBasedAdminPct / 100 / 12, 0, 0.05);

  // BETA: Premium Based Fee (Verwaltungskosten auf Beitrag)
  // We re-interpret "adminCostFirstYearPct" and "adminCostLastYearPct" as Beta rates on the premium
  const policyBetaFirstRate = clamp(input.policyCosts.adminCostFirstYearPct / 100, 0, 0.5);
  const policyBetaLastRate = clamp(input.policyCosts.adminCostLastYearPct / 100, 0, 0.5);

  const policyPieceCost = Math.max(0, input.policyCosts.pieceCostEUR);
  const policyOneTimeCostRate = clamp(input.policyCosts.oneTimePaymentCostPct / 100, 0, 0.4);

  let totalPayment = Math.max(0, input.initialCapital);
  let depot = totalPayment;
  let depotCostBasis = totalPayment;
  let policy = totalPayment;

  // One-Time Costs
  if (policyOneTimeCostRate > 0) policy *= 1 - policyOneTimeCostRate;
  if (input.policyCosts.contractStartOneTimeEUR > 0) {
    policy += input.policyCosts.contractStartOneTimeEUR;
    totalPayment += input.policyCosts.contractStartOneTimeEUR;
  }

  // ALPHA: Acquisition Costs
  // Calculate on Total "Valuation Sum" (Bewertungssumme). Standard is Monthly * 12 * Years (static base).
  const totalPlannedPremium = Math.max(0, input.monthlyContribution) * 12 * yearsToRetirement;
  const totalAlphaCost = totalPlannedPremium * policyAcqRate;
  const alphaMonthlyDeduction = totalAlphaCost / (policyAcqYears * 12);

  const points: Array<{ year: number; payment: number; depot: number; policy: number }> = [
    { year: 0, payment: totalPayment, depot, policy },
  ];
  let policyAheadSinceYear: number | null = null;
  let accumulatedPayment = totalPayment;

  for (let year = 1; year <= yearsToRetirement; year += 1) {
    // Dynamic Contribution
    const annualContribution =
      Math.max(0, input.monthlyContribution) * 12 * Math.pow(1 + dynamicRate, year - 1);

    // Beta Rate Interpolation (Falling/Constant)
    const currentBetaRate =
      input.policyCosts.adminCostType === "constant"
        ? policyBetaLastRate
        : lerp(policyBetaFirstRate, policyBetaLastRate, (year - 1) / Math.max(1, yearsToRetirement - 1));

    const monthlyContributionCurrent = annualContribution / 12;
    const depotAtYearStart = depot;
    let annualContributionApplied = 0;

    for (let month = 0; month < 12; month += 1) {
      accumulatedPayment += monthlyContributionCurrent;
      annualContributionApplied += monthlyContributionCurrent;

      // --- DEPOT ---
      depot += monthlyContributionCurrent;
      depotCostBasis += monthlyContributionCurrent;
      depot *= 1 + monthlyReturn;
      depot *= Math.max(0, 1 - depotCostMonth);

      // --- POLICY ---
      // 1. Deduct Costs from Contribution (Beta)
      let netContribution = monthlyContributionCurrent * (1 - currentBetaRate);

      // 2. Deduct Alpha (if applicable) - usually taken from contribution, can go negative (debt) technically but usually just eats the premium.
      if (year <= policyAcqYears) {
        netContribution -= alphaMonthlyDeduction;
      }

      // 3. Add to Capital
      policy += netContribution;

      // 4. Piece Cost
      policy = Math.max(0, policy - policyPieceCost);

      // 5. Return
      policy *= 1 + monthlyReturn;

      // 6. Gamma Cost (on Capital)
      policy *= Math.max(0, 1 - policyGammaRateMonthly);
    }

    // --- FUND SWITCH / REBALANCING ---
    // User requested "Standardisiert an, 7 Jahre". 
    // Logic: If switchSimulation is YES, do it. Logic assumes Page defaults to YES.
    const switchYear = input.switchEveryYears > 0 ? input.switchEveryYears : 7;
    if (input.switchSimulation === "yes" && year % switchYear === 0) {
      // Depot Tax
      const unrealizedGain = Math.max(0, depot - depotCostBasis);
      const taxableGain = unrealizedGain * (1 - partialExemption);
      const switchTax = taxableGain * taxRate;
      depot = Math.max(0, depot - switchTax);

      // Depot Costs (Spread/Fee)
      depot *= 1 - switchSellRate;
      depot *= 1 - switchBuyRate; // "Gebühren bei Verkauf" + "Gebühren bei Neuanlage"

      // Reset Cost Basis
      depotCostBasis = depot;
    }

    // --- ANNUAL TAX (Vorabpauschale) ---
    const annualGain = Math.max(0, depot - depotAtYearStart - annualContributionApplied);
    // Basisertrag = StartOfYr * Basiszins * 0.7
    const basisErtrag = Math.max(0, depotAtYearStart * basiszinsRate * 0.7);
    const vorabPauschale = Math.min(annualGain, basisErtrag);
    const taxableVorab = Math.max(0, (vorabPauschale * (1 - partialExemption)) - input.allowanceEUR);
    const annualTax = taxableVorab * taxRate;
    depot = Math.max(0, depot - annualTax);

    points.push({ year, payment: accumulatedPayment, depot, policy });

    if (policyAheadSinceYear === null && policy >= depot) policyAheadSinceYear = year;
  }

  return {
    currentAge,
    yearsToRetirement,
    points,
    finalPayment: accumulatedPayment,
    finalDepot: depot,
    finalPolicy: policy,
    deltaPolicyVsDepot: policy - depot,
    policyAheadSinceYear,
  };
}
