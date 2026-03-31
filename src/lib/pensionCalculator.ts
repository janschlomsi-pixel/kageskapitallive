// RENTENLÜCKENRECHNER RECHENKERN
export type Mode = "employee" | "versorgungswerk" | "selfEmployed";
export type YesNo = "yes" | "no";

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const pow1p = (r: number, t: number) => Math.pow(1 + r, t);

function yearsBetween(a: Date, b: Date) {
  let years = b.getFullYear() - a.getFullYear();
  const m = b.getMonth() - a.getMonth();
  if (m < 0 || (m === 0 && b.getDate() < a.getDate())) years -= 1;
  return years;
}
function addYears(d: Date, years: number) {
  const x = new Date(d);
  x.setFullYear(x.getFullYear() + years);
  return x;
}
function monthsBetween(a: Date, b: Date) {
  let m = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) m -= 1;
  return m;
}
function pvAnnuity(pmt: number, r_m: number, n: number) {
  if (n <= 0) return 0;
  if (Math.abs(r_m) < 1e-12) return pmt * n;
  return (pmt * (1 - Math.pow(1 + r_m, -n))) / r_m;
}
function pmtForFV(fv: number, r_m: number, n: number) {
  if (n <= 0) return Infinity;
  if (fv <= 0) return 0;
  if (Math.abs(r_m) < 1e-12) return fv / n;
  const denom = Math.pow(1 + r_m, n) - 1;
  if (denom <= 0) return Infinity;
  return (fv * r_m) / denom;
}
function fvAnnuity(pmt: number, r_m: number, n: number) {
  if (n <= 0) return 0;
  if (Math.abs(r_m) < 1e-12) return pmt * n;
  return (pmt * (Math.pow(1 + r_m, n) - 1)) / r_m;
}
function payoutFromCapital(capital: number, r_m: number, n: number) {
  if (capital <= 0 || n <= 0) return 0;
  const pvaf = pvAnnuity(1, r_m, n);
  if (pvaf <= 0) return 0;
  return capital / pvaf;
}
function pvGrowingAnnuity(pmt: number, r_m: number, g_m: number, n: number) {
  if (n <= 0 || pmt <= 0) return 0;
  if (Math.abs(r_m - g_m) < 1e-12) return pmt * (n / (1 + r_m));
  return (pmt * (1 - Math.pow((1 + g_m) / (1 + r_m), n))) / (r_m - g_m);
}
function pensionTaxableShare(retYear: number) {
  if (retYear >= 2058) return 1.0;
  if (retYear <= 2005) return 0.5;
  if (retYear <= 2020) return clamp(0.5 + 0.02 * (retYear - 2005), 0.5, 0.8);
  return clamp(0.8 + 0.01 * (retYear - 2020), 0.8, 1.0);
}
function approxIncomeTaxGermany(annualTaxable: number) {
  if (!isFinite(annualTaxable) || annualTaxable <= 0) return 0;
  const grundfreibetrag = 12000, z1 = 17000, z2 = 66000, z3 = 277000;
  const x = Math.max(0, annualTaxable - grundfreibetrag);
  const b1 = Math.max(0, Math.min(x, z1 - grundfreibetrag));
  const r1 = b1 * (0.14 + 0.1 * (b1 / Math.max(1, z1 - grundfreibetrag))) * 0.5 + b1 * 0.14 * 0.5;
  const b2 = Math.max(0, Math.min(x - (z1 - grundfreibetrag), z2 - z1));
  const r2 = b2 * (0.24 + 0.18 * (b2 / Math.max(1, z2 - z1))) * 0.5 + b2 * 0.24 * 0.5;
  const b3 = Math.max(0, Math.min(x - (z2 - grundfreibetrag), z3 - z2));
  const r3 = b3 * 0.42;
  const b4 = Math.max(0, x - (z3 - grundfreibetrag));
  const r4 = b4 * 0.45;
  return r1 + r2 + r3 + r4;
}

export interface PensionInput {
  today: Date;
  mode: Mode;
  dob: Date;
  jobEntry: Date;
  monthlyGross: number;
  churchTax: YesNo;
  retirementAge: number;
  lifeExpectancy: number;
  healthType: "legal" | "private";
  kvdr: YesNo;
  pkvPremium: number;
  targetNetToday: number;
  inflationPct: number;
  returnSavingPct: number;
  returnTakeoutPct: number;
  adjustForPurchasePower: boolean;
  desiredSaving: number;
  initialLumpSum: number;
  versorgungswerk: {
    hasNotice: YesNo;
    noticeTiming: "current" | "retirement";
    noticeAmount: number;
    factorToGrv: number;
    ruleAge: number;
    pensionGrowthPct: number;
    healthType: "legal" | "private";
    healthGrowthPct: number;
    kvdr: YesNo;
    pkvPremium: number;
  };
  selfEmployedGrv?: {
    enabled: boolean;
    hasNotice: YesNo;
    noticeTiming: "current" | "retirement";
    noticeAmount: number;
  };
}

export type PensionResult = 
  | { ok: false; error: string }
  | {
      ok: true;
      gap: number;
      requiredCapital: number;
      requiredSavingNow: number;
      requiredIn4: number;
      requiredIn8: number;
      coverage: number;
      pensionNet: number;
      privatePayout: number;
      totalPension: number;
      targetInflated: number;
      capitalNow: number;
      capitalIn4: number;
      capitalIn8: number;
      interestNow: number;
      interestIn4: number;
      interestIn8: number;
      retirementYear: number;
      monthsToRet: number;
    };

export function calculatePensionGap(input: PensionInput): PensionResult {
  const ageNow = yearsBetween(input.dob, input.today);
  if (ageNow < 0 || ageNow > 110) return { ok: false, error: "Geburtsdatum unplausibel." };

  const AVG_EARNINGS_NOW = 50000;
  const BBG_ANNUAL = 90600;
  const RENTENWERT_NOW = 39.32;
  const RENTENWERT_GROWTH = 0.01;
  const EP_CAP = 2.05;

  const MED_INFLATION = 0.03;
  const ADD_KV = 0.016;
  const KV_GENERAL = 0.146;
  const PV_RATE = 0.034;

  const retirementDate = addYears(input.dob, input.retirementAge);
  const monthsToRet = monthsBetween(input.today, retirementDate);
  if (monthsToRet <= 0) return { ok: false, error: "Renteneintritt liegt in der Vergangenheit." };

  const yearsToRet = monthsToRet / 12;
  const retirementYears = clamp(input.lifeExpectancy - input.retirementAge, 5, 45);
  const monthsRet = Math.round(retirementYears * 12);

  const infl = clamp(input.inflationPct / 100, 0, 0.2);
  const rAccNom = clamp(input.returnSavingPct / 100, 0, 0.3);
  const rDecNom = clamp(input.returnTakeoutPct / 100, 0, 0.3);

  const rAccChart = input.adjustForPurchasePower ? Math.max(-0.99, rAccNom - infl) : rAccNom;
  const rDecChart = input.adjustForPurchasePower ? Math.max(-0.99, rDecNom - infl) : rDecNom;

  const rAccChart_m = rAccChart / 12;
  const rDecChart_m = rDecChart / 12;
  const rAccKpi_m = rAccNom / 12;
  const rDecKpi_m = rDecNom / 12;

  const inflFactor = pow1p(infl, yearsToRet);
  const targetInflated = input.targetNetToday * inflFactor;

  const fvDesiredChart = fvAnnuity(input.desiredSaving, rAccChart_m, monthsToRet);
  const fvLumpChart = input.initialLumpSum * pow1p(rAccChart_m, monthsToRet);
  const totalAccumulatedChart = fvDesiredChart + fvLumpChart;
  const privatePayoutChart = payoutFromCapital(totalAccumulatedChart, rDecChart_m, monthsRet);

  const fvDesiredKpi = fvAnnuity(input.desiredSaving, rAccKpi_m, monthsToRet);
  const fvLumpKpi = input.initialLumpSum * pow1p(rAccKpi_m, monthsToRet);
  const totalAccumulatedKpi = fvDesiredKpi + fvLumpKpi;
  const privatePayoutKpi = payoutFromCapital(totalAccumulatedKpi, rDecKpi_m, monthsRet);

  const monthsWork = Math.max(0, monthsBetween(input.jobEntry, retirementDate));
  const workYears = Math.max(0, Math.floor(monthsWork / 12));
  const annualGrossNow = Math.max(0, input.monthlyGross * 12);
  const wageGrowth = clamp(infl + 0.01, 0, 0.06);

  const rentenwertAtRet = RENTENWERT_NOW * pow1p(RENTENWERT_GROWTH, yearsToRet);
  const statutoryGrossAtRetFromBbgGrowth = (bbgGrowth: number) => {
    let totalEP = 0;
    for (let i = 0; i < workYears; i += 1) {
      const gross_i = annualGrossNow * pow1p(wageGrowth, i);
      const bbg_i = BBG_ANNUAL * pow1p(clamp(bbgGrowth, 0, 0.03), i);
      const contributable = Math.min(gross_i, bbg_i);
      const avg_i = AVG_EARNINGS_NOW * pow1p(wageGrowth, i);
      const ep = clamp(avg_i <= 0 ? 0 : contributable / avg_i, 0, EP_CAP);
      totalEP += ep;
    }
    return totalEP * rentenwertAtRet;
  };
  const statutoryGrossAtRet = statutoryGrossAtRetFromBbgGrowth(0);

  const kvHalf = KV_GENERAL / 2 + ADD_KV / 2;
  const kvFull = KV_GENERAL + ADD_KV;

  const kvRateOnPension = (input.kvdr === "yes" ? kvHalf : kvFull) + PV_RATE;
  const gkvDeduction = statutoryGrossAtRet * kvRateOnPension;
  const pkvAtRet = input.pkvPremium * pow1p(MED_INFLATION, yearsToRet);

  const retirementYear = retirementDate.getFullYear();
  const taxableShare = pensionTaxableShare(retirementYear);
  const annualTaxableBase = Math.max(0, statutoryGrossAtRet * 12 * taxableShare);
  const annualIncomeTax = approxIncomeTaxGermany(annualTaxableBase);
  const monthlyIncomeTax = annualIncomeTax / 12;
  const hasChurchTax = input.churchTax === "yes";
  const churchRate = 0.09;
  const monthlyChurchTax = hasChurchTax ? monthlyIncomeTax * churchRate : 0;

  let pensionNetNominalKpi = 0;
  let pensionNetNominalChart = 0;

  if (input.mode === "selfEmployed") {
    const grv = input.selfEmployedGrv;
    if (grv?.enabled) {
      // Self-employed WITH GRV: calculate statutory pension
      let selfGrossAtRet = 0;
      if (grv.hasNotice === "yes" && grv.noticeAmount > 0) {
        // Use notice amount
        selfGrossAtRet = grv.noticeTiming === "current"
          ? grv.noticeAmount * pow1p(RENTENWERT_GROWTH, yearsToRet)
          : grv.noticeAmount;
      } else {
        // Use employee-style EP calculation
        selfGrossAtRet = statutoryGrossAtRet;
      }
      // Apply same tax/KV deductions as employee
      const selfKvDeduction = selfGrossAtRet * kvRateOnPension;
      const selfPkvAtRet = input.pkvPremium * pow1p(MED_INFLATION, yearsToRet);
      const selfAnnualTaxable = Math.max(0, selfGrossAtRet * 12 * taxableShare);
      const selfAnnualTax = approxIncomeTaxGermany(selfAnnualTaxable);
      const selfMonthlyTax = selfAnnualTax / 12;
      const selfChurchTax = hasChurchTax ? selfMonthlyTax * churchRate : 0;
      const selfNet = input.healthType === "legal"
        ? Math.max(0, selfGrossAtRet - selfKvDeduction - selfMonthlyTax - selfChurchTax)
        : Math.max(0, selfGrossAtRet - selfPkvAtRet - selfMonthlyTax - selfChurchTax);
      pensionNetNominalKpi = selfNet;
      pensionNetNominalChart = selfNet;
    } else {
      // No GRV: pension = 0
      pensionNetNominalKpi = 0;
      pensionNetNominalChart = 0;
    }
  } else if (input.mode === "employee") {
    const statutoryNetNominal =
      input.healthType === "legal"
        ? Math.max(0, statutoryGrossAtRet - gkvDeduction - monthlyIncomeTax - monthlyChurchTax)
        : Math.max(0, statutoryGrossAtRet - pkvAtRet - monthlyIncomeTax - monthlyChurchTax);

    pensionNetNominalKpi = statutoryNetNominal;
    pensionNetNominalChart = statutoryNetNominal;
  } else {
    const VW_SALARY_LIFT_LOG_COEFF = 2400;
    const VW_SALARY_LIFT_LOG_BASE = 9000;
    const VW_KV_GROWTH_YEARS_FACTOR = 1.12;
    const VW_GKV_RATE_EXTRA_LOAD = 0.98;
    const VW_TAX_HEALTH_DEDUCT_SHARE_LEGAL = 0.45;
    const VW_TAX_HEALTH_DEDUCT_SHARE_PRIVATE = 0.45;
    const VW_TAX_SPECIAL_ALLOWANCE_ANNUAL = 10000;

    const vwGrowth = clamp(input.versorgungswerk.pensionGrowthPct / 100, -0.02, 0.06);
    const vwNotice = Math.max(0, input.versorgungswerk.noticeAmount);
    const vwFactor = clamp(input.versorgungswerk.factorToGrv, 0, 4);

    const noticeBase =
      input.versorgungswerk.hasNotice === "yes" && vwNotice > 0
        ? input.versorgungswerk.noticeTiming === "current"
          ? vwNotice * pow1p(vwGrowth, yearsToRet)
          : vwNotice
        : null;

    const statutoryGrossAtRetVwRef = statutoryGrossAtRetFromBbgGrowth(0.005);
    const salaryLift =
      VW_SALARY_LIFT_LOG_COEFF * Math.log1p(Math.max(0, input.monthlyGross) / VW_SALARY_LIFT_LOG_BASE);
    const vwReferenceBeforeFactor = Math.max(0, statutoryGrossAtRetVwRef + salaryLift);
    const growthAdjustment = clamp(
      pow1p(vwGrowth, yearsToRet) / pow1p(RENTENWERT_GROWTH, yearsToRet),
      0.6,
      3.2
    );
    const factorBase = vwReferenceBeforeFactor * vwFactor * growthAdjustment;

    const ageDiffMonths = Math.round((input.retirementAge - input.versorgungswerk.ruleAge) * 12);
    const earlyPenalty = ageDiffMonths < 0 ? Math.min(0.36, Math.abs(ageDiffMonths) * 0.004) : 0;
    const lateBonus = ageDiffMonths > 0 ? Math.min(0.24, Math.abs(ageDiffMonths) * 0.003) : 0;
    const ageFactor = clamp(1 - earlyPenalty + lateBonus, 0.5, 1.5);

    const versorgungswerkGrossAtRet = Math.max(0, (noticeBase ?? factorBase) * ageFactor);

    const vwHealthGrowth = clamp(input.versorgungswerk.healthGrowthPct / 100, -0.02, 0.08);
    const baseKvRate = (input.versorgungswerk.kvdr === "yes" ? kvHalf : kvFull) + PV_RATE;
    const projectedKvRate = clamp(
      baseKvRate * pow1p(vwHealthGrowth, yearsToRet * VW_KV_GROWTH_YEARS_FACTOR),
      0,
      input.versorgungswerk.kvdr === "yes" ? 0.75 : 0.85
    );
    const gkvDeductionVw = versorgungswerkGrossAtRet * projectedKvRate * VW_GKV_RATE_EXTRA_LOAD;
    const pkvAtRetVw = Math.max(0, input.versorgungswerk.pkvPremium) * pow1p(vwHealthGrowth, yearsToRet);

    const annualHealthContributionVw =
      (input.versorgungswerk.healthType === "legal" ? gkvDeductionVw : pkvAtRetVw) * 12;
    const healthTaxDeductShare =
      input.versorgungswerk.healthType === "legal"
        ? VW_TAX_HEALTH_DEDUCT_SHARE_LEGAL
        : VW_TAX_HEALTH_DEDUCT_SHARE_PRIVATE;

    const annualTaxableBaseVw = Math.max(
      0,
      versorgungswerkGrossAtRet * 12 * taxableShare -
        annualHealthContributionVw * healthTaxDeductShare -
        VW_TAX_SPECIAL_ALLOWANCE_ANNUAL
    );
    const annualIncomeTaxVw = approxIncomeTaxGermany(annualTaxableBaseVw);
    const monthlyIncomeTaxVw = annualIncomeTaxVw / 12;
    const monthlyChurchTaxVw = hasChurchTax ? monthlyIncomeTaxVw * churchRate : 0;

    const versorgungswerkNetNominal =
      input.versorgungswerk.healthType === "legal"
        ? Math.max(0, versorgungswerkGrossAtRet - gkvDeductionVw - monthlyIncomeTaxVw - monthlyChurchTaxVw)
        : Math.max(0, versorgungswerkGrossAtRet - pkvAtRetVw - monthlyIncomeTaxVw - monthlyChurchTaxVw);

    pensionNetNominalChart = versorgungswerkNetNominal;
    pensionNetNominalKpi = versorgungswerkNetNominal;
  }

  const pensionNetForChart = input.adjustForPurchasePower
    ? pensionNetNominalChart / inflFactor
    : pensionNetNominalChart;
  const targetForChart = input.adjustForPurchasePower ? input.targetNetToday : targetInflated;

  const achievedPensionChart = pensionNetForChart + privatePayoutChart;
  const gapChart = Math.max(0, targetForChart - achievedPensionChart);

  const achievedPensionKpi = pensionNetNominalKpi + privatePayoutKpi;
  const gapKpi = Math.max(0, targetInflated - achievedPensionKpi);

  const useGrowingWithdrawal = input.mode === "versorgungswerk";
  const withdrawalGrowthKpi_m = useGrowingWithdrawal ? infl / 12 : 0;
  const requiredCapital = useGrowingWithdrawal
    ? pvGrowingAnnuity(gapKpi, rDecKpi_m, withdrawalGrowthKpi_m, monthsRet)
    : pvAnnuity(gapKpi, rDecKpi_m, monthsRet);

  const requiredSavingNowDynamic = pmtForFV(requiredCapital, rAccKpi_m, monthsToRet);

  const gapKpiBaseline = Math.max(0, targetInflated - pensionNetNominalKpi);
  const requiredCapitalBaseline = useGrowingWithdrawal
    ? pvGrowingAnnuity(gapKpiBaseline, rDecKpi_m, withdrawalGrowthKpi_m, monthsRet)
    : pvAnnuity(gapKpiBaseline, rDecKpi_m, monthsRet);

  const requiredSavingNowBaseline = pmtForFV(requiredCapitalBaseline, rAccKpi_m, monthsToRet);
  const delayed = (delayYears: number) => pmtForFV(requiredCapitalBaseline, rAccKpi_m, monthsToRet - delayYears * 12);

  const requiredIn4 = delayed(4);
  const requiredIn8 = delayed(8);

  const topUp = isFinite(requiredSavingNowDynamic) ? Math.max(0, requiredSavingNowDynamic) : Infinity;
  const denom = input.desiredSaving + topUp;
  const coverage =
    topUp <= 1e-9 ? 1 : !isFinite(denom) || denom <= 0 ? 0 : clamp(input.desiredSaving / denom, 0, 1);

  const capitalNow = totalAccumulatedKpi;
  const contribNow = input.desiredSaving * monthsToRet + input.initialLumpSum;
  const interestNow = capitalNow - contribNow;

  const fvIn = (delayYears: number) => {
    const m = monthsToRet - delayYears * 12;
    return fvAnnuity(input.desiredSaving, rAccKpi_m, m) + input.initialLumpSum * pow1p(rAccKpi_m, m);
  };
  const capitalIn4 = fvIn(4);
  const capitalIn8 = fvIn(8);
  const contribIn4 = input.desiredSaving * Math.max(0, monthsToRet - 4 * 12) + input.initialLumpSum;
  const contribIn8 = input.desiredSaving * Math.max(0, monthsToRet - 8 * 12) + input.initialLumpSum;
  const interestIn4 = capitalIn4 - contribIn4;
  const interestIn8 = capitalIn8 - contribIn8;

  return {
    ok: true,
    gap: gapChart,
    requiredCapital,
    requiredSavingNow: isFinite(requiredSavingNowBaseline) ? Math.max(0, requiredSavingNowBaseline) : Infinity,
    requiredIn4,
    requiredIn8,
    coverage,
    pensionNet: pensionNetNominalKpi,
    privatePayout: privatePayoutKpi,
    totalPension: pensionNetNominalKpi + privatePayoutKpi,
    targetInflated,
    capitalNow,
    capitalIn4,
    capitalIn8,
    interestNow,
    interestIn4,
    interestIn8,
    retirementYear,
    monthsToRet,
  };
}
