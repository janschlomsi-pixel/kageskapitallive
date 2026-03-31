import { simulateDepotVsPolice } from "./lib/depotPoliceCalculator";

const commonInput = {
  dob: new Date("2005-01-01"),
  today: new Date("2026-06-01"),
  retirementAge: 67,
  monthlyContribution: 250,
  initialCapital: 5000,
  contributionGrowthPct: 0,
  annualReturnPct: 7.5,
  abgeltungTaxPct: 26.375,
  basiszinsPct: 2.55,
  allowanceEUR: 1000,
  partialExemptionKind: "equity" as const,
  switchEveryYears: 7,
  depotCosts: { effectiveCostPct: 0.9, switchSellPct: 0.5, switchBuyPct: 0.5 },
  policyCosts: {
    acquisitionPeriodYears: 5,
    acquisitionCostPct: 0.6,
    adminCostType: "falling" as const,
    adminCostFirstYearPct: 5.42,
    adminCostLastYearPct: 3.42,
    assetBasedAdminPct: 0,
    pieceCostEUR: 12,
    oneTimePaymentCostPct: 0,
    contractStartOneTimeEUR: 0,
  }
};

const resOff = simulateDepotVsPolice({ ...commonInput, switchSimulation: "no" });
const resOn = simulateDepotVsPolice({ ...commonInput, switchSimulation: "yes" });

console.log("=== FONDSWECHSEL OFF ===");
console.log(`Depot:  ${resOff.finalDepot.toFixed(0)} €`);
console.log(`Police: ${resOff.finalPolicy.toFixed(0)} €\n`);

console.log("=== FONDSWECHSEL ON ===");
console.log(`Depot:  ${resOn.finalDepot.toFixed(0)} €`);
console.log(`Police: ${resOn.finalPolicy.toFixed(0)} €\n`);
