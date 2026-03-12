// ruerup-calculation.ts
export type YesNo = "yes" | "no";
export type FilingStatus = "single" | "married";
export type TaxInputMode = "input" | "estimate";
export type Profession = "employee" | "self_employed" | "civil_servant";
export type PensionScheme = "legal" | "versorgungswerk" | "none";
export type PeriodMode = "monthly" | "yearly";

export type CurvePoint = {
    year: number;
    ruerupWithReinvest: number;
    ruerupWithoutReinvest: number;
    savingsWithoutTaxBenefit: number;
};

export type RuerupInput = {
    today?: Date;
    dateOfBirth: Date;
    federalState: string;
    retirementAge: number;
    churchTaxEnabled: YesNo;

    filingStatus: FilingStatus;
    taxInputMode: TaxInputMode;
    taxableIncomeInput: number;
    marginalTaxRatePct: number;
    includeSoli: boolean;

    grossIncomeAnnual: number;
    profession: Profession;
    pensionScheme: PensionScheme;
    hasChildren: YesNo;
    isSingleParent: YesNo;
    childrenCount: number;
    childAllowance: number; // 0 | 0.5 | 1

    monthlyInvestmentWish: number;
    existingCapital: number;
    existingMonthlyInvestment: number;
    annualReturnPct: number; // 0..14 in UI, hier frei
    periodMode: PeriodMode;
};

export type RuerupResult = {
    yearsUntilRetirement: number;
    yearsForChart: number;
    modeledTaxableIncome: number;
    modeledMarginalRate: number; // in %
    modeledCombinedMarginalRate: number; // in %
    monthlyLimit: number;
    yearlyLimit: number;
    effectiveRate: number; // 0..1
    monthlyTaxBenefit: number;
    annualTaxBenefit: number;
    monthlyActualInvestment: number;
    points: CurvePoint[];
    finalPoint: CurvePoint;
    periodTotalInvestment: number;
    periodTaxBenefit: number;
    periodActualInvestment: number;
    actualPct: number; // 0..1
    benefitPct: number; // 0..1
    limitReachedPct: number; // 0..100
    curveGainWithReinvest: number;
    curveGainWithoutReinvest: number;
};

const RUERUP_LIMIT_SINGLE_2025 = 29344;
const RUERUP_LIMIT_MARRIED_2025 = 58688;

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

function yearsToRetirementExact(dateOfBirth: Date, retirementAge: number, today: Date) {
    const retirementDate = new Date(
        dateOfBirth.getFullYear() + retirementAge,
        dateOfBirth.getMonth(),
        dateOfBirth.getDate()
    );
    const ms = retirementDate.getTime() - today.getTime();
    return Math.max(0, ms / (1000 * 60 * 60 * 24 * 365.2425));
}

function taxSingle2025(zve: number) {
    const x = Math.floor(Math.max(0, zve));
    if (x <= 12096) return 0;
    if (x <= 17443) {
        const y = (x - 12096) / 10000;
        return (932.3 * y + 1400) * y;
    }
    if (x <= 68480) {
        const z = (x - 17443) / 10000;
        return (176.64 * z + 2397) * z + 1015.13;
    }
    if (x <= 277825) return 0.42 * x - 10911.92;
    return 0.45 * x - 19246.67;
}

function incomeTax2025(zve: number, filingStatus: FilingStatus) {
    if (filingStatus === "married") {
        const half = Math.max(0, zve) / 2;
        return taxSingle2025(half) * 2;
    }
    return taxSingle2025(zve);
}

function solidarityTax(incomeTax: number, filingStatus: FilingStatus) {
    const freeLimit = filingStatus === "married" ? 36260 : 18130;
    if (incomeTax <= freeLimit) return 0;
    const full = incomeTax * 0.055;
    const mitigation = (incomeTax - freeLimit) * 0.119;
    return Math.max(0, Math.min(full, mitigation));
}

function churchTaxRate(state: string) {
    return state === "Baden-Württemberg" || state === "Bayern" ? 0.08 : 0.09;
}

function totalTax(
    zve: number,
    filingStatus: FilingStatus,
    includeSoli: boolean,
    churchTaxEnabled: YesNo,
    state: string
) {
    const income = incomeTax2025(zve, filingStatus);
    const soli = includeSoli ? solidarityTax(income, filingStatus) : 0;
    const church = churchTaxEnabled === "yes" ? income * churchTaxRate(state) : 0;
    return { income, soli, church, total: income + soli + church };
}

function marginalRate(
    zve: number,
    filingStatus: FilingStatus,
    includeSoli: boolean,
    churchTaxEnabled: YesNo,
    state: string
) {
    const delta = 100;
    const t1 = totalTax(zve, filingStatus, includeSoli, churchTaxEnabled, state).total;
    const t2 = totalTax(zve + delta, filingStatus, includeSoli, churchTaxEnabled, state).total;
    return clamp((t2 - t1) / delta, 0, 0.55);
}

function incomeMarginalRate(zve: number, filingStatus: FilingStatus) {
    const delta = 100;
    const t1 = incomeTax2025(zve, filingStatus);
    const t2 = incomeTax2025(zve + delta, filingStatus);
    return clamp((t2 - t1) / delta, 0, 0.55);
}

function estimateTaxableIncome(params: {
    grossIncomeAnnual: number;
    profession: Profession;
    pensionScheme: PensionScheme;
    hasChildren: YesNo;
    isSingleParent: YesNo;
    childrenCount: number;
    childAllowance: number;
}) {
    const gross = Math.max(0, params.grossIncomeAnnual);
    const employeeAllowance = params.profession === "employee" ? 1230 : 0;
    const specialExpenses = 36;

    const socialRate =
        params.profession === "employee"
            ? 0.18
            : params.profession === "self_employed"
                ? 0.12
                : 0.04;

    const socialCap = params.profession === "employee" ? 96600 : gross;
    let socialDeduction = Math.min(gross, socialCap) * socialRate;

    if (params.pensionScheme === "versorgungswerk") {
        socialDeduction += Math.min(gross, 96600) * 0.04;
    }
    if (params.pensionScheme === "none") {
        socialDeduction *= 0.6;
    }

    const hasChildren = params.hasChildren === "yes";
    const kids = hasChildren ? clamp(Math.round(params.childrenCount), 1, 8) : 0;
    const childAllowancePerChild = 6672;
    const childAllowance = kids * childAllowancePerChild * clamp(params.childAllowance, 0, 1);

    const singleParentAllowance =
        params.isSingleParent === "yes" && kids > 0
            ? 4260 + Math.max(0, kids - 1) * 240
            : 0;

    return Math.max(
        0,
        gross -
        employeeAllowance -
        specialExpenses -
        socialDeduction -
        childAllowance -
        singleParentAllowance
    );
}

function simulateCurve(
    annualContribution: number,
    annualReturnPct: number,
    years: number,
    initialCapital: number
) {
    const points: number[] = [];
    const annualReturn = clamp(annualReturnPct / 100, 0, 0.2);
    let value = Math.max(0, initialCapital);

    // Jahr 0 startet bereits mit einer vollen Jahresinvestition.
    for (let year = 0; year <= years; year += 1) {
        value = value * (1 + annualReturn) + Math.max(0, annualContribution);
        points.push(value);
    }

    return points;
}

export function calculateRuerup(input: RuerupInput): RuerupResult {
    const today = input.today ?? new Date();

    const yearsUntilRetirement = yearsToRetirementExact(input.dateOfBirth, input.retirementAge, today);
    const yearsForChart = clamp(Math.floor(yearsUntilRetirement), 1, 45);

    const yearlyLimit =
        input.filingStatus === "married" ? RUERUP_LIMIT_MARRIED_2025 : RUERUP_LIMIT_SINGLE_2025;
    const monthlyLimit = yearlyLimit / 12;

    const monthlyWish = Math.max(0, input.monthlyInvestmentWish);
    const annualWish = monthlyWish * 12;
    const deductibleAnnual = Math.min(annualWish, yearlyLimit);

    const modeledTaxableIncome =
        input.taxInputMode === "estimate"
            ? estimateTaxableIncome({
                grossIncomeAnnual: input.grossIncomeAnnual,
                profession: input.profession,
                pensionScheme: input.pensionScheme,
                hasChildren: input.hasChildren,
                isSingleParent: input.isSingleParent,
                childrenCount: input.childrenCount,
                childAllowance: input.childAllowance,
            })
            : Math.max(0, input.taxableIncomeInput);

    const before = totalTax(
        modeledTaxableIncome,
        input.filingStatus,
        input.includeSoli,
        input.churchTaxEnabled,
        input.federalState
    );

    const after = totalTax(
        Math.max(0, modeledTaxableIncome - deductibleAnnual),
        input.filingStatus,
        input.includeSoli,
        input.churchTaxEnabled,
        input.federalState
    );

    const taxSavingByIncome = Math.max(0, before.total - after.total);
    const effectiveIncomeRate = deductibleAnnual > 0 ? taxSavingByIncome / deductibleAnnual : 0;

    const assumedIncomeRate = clamp(input.marginalTaxRatePct / 100, 0, 0.55);
    const levyFactor =
        1 +
        (input.includeSoli ? 0.055 : 0) +
        (input.churchTaxEnabled === "yes" ? churchTaxRate(input.federalState) : 0);
    const assumedTotalRate = assumedIncomeRate * levyFactor;

    const effectiveRate =
        effectiveIncomeRate > 0
            ? clamp(Math.min(assumedTotalRate, effectiveIncomeRate), 0, 0.65)
            : clamp(assumedTotalRate, 0, 0.65);

    const annualTaxBenefit = deductibleAnnual * effectiveRate;
    const monthlyTaxBenefit = annualTaxBenefit / 12;
    const monthlyActualInvestment = Math.max(0, monthlyWish - monthlyTaxBenefit);

    const annualWithReinvest =
        annualWish + annualTaxBenefit + Math.max(0, input.existingMonthlyInvestment) * 12;
    const annualWithoutReinvest =
        annualWish + Math.max(0, input.existingMonthlyInvestment) * 12;
    const annualWithoutBenefit =
        monthlyActualInvestment * 12 + Math.max(0, input.existingMonthlyInvestment) * 12;

    const withReinvestValues = simulateCurve(
        annualWithReinvest,
        input.annualReturnPct,
        yearsForChart,
        input.existingCapital
    );
    const withoutReinvestValues = simulateCurve(
        annualWithoutReinvest,
        input.annualReturnPct,
        yearsForChart,
        input.existingCapital
    );
    const withoutBenefitValues = simulateCurve(
        annualWithoutBenefit,
        input.annualReturnPct,
        yearsForChart,
        input.existingCapital
    );

    const points: CurvePoint[] = withReinvestValues.map((value, year) => ({
        year,
        ruerupWithReinvest: value,
        ruerupWithoutReinvest: withoutReinvestValues[year] ?? 0,
        savingsWithoutTaxBenefit: withoutBenefitValues[year] ?? 0,
    }));

    const finalPoint =
        points[points.length - 1] ?? {
            year: 0,
            ruerupWithReinvest: 0,
            ruerupWithoutReinvest: 0,
            savingsWithoutTaxBenefit: 0,
        };

    const periodTotalInvestment = input.periodMode === "monthly" ? monthlyWish : annualWish;
    const periodTaxBenefit = input.periodMode === "monthly" ? monthlyTaxBenefit : annualTaxBenefit;
    const periodActualInvestment = Math.max(0, periodTotalInvestment - periodTaxBenefit);

    const actualPct =
        periodTotalInvestment > 0 ? clamp(periodActualInvestment / periodTotalInvestment, 0, 1) : 0;
    const benefitPct = periodTotalInvestment > 0 ? clamp(1 - actualPct, 0, 1) : 0;

    const limitReachedPct = clamp(
        monthlyLimit > 0 ? (Math.max(0, input.monthlyInvestmentWish) / monthlyLimit) * 100 : 0,
        0,
        100
    );

    const curveGainWithReinvest =
        finalPoint.ruerupWithReinvest - finalPoint.savingsWithoutTaxBenefit;
    const curveGainWithoutReinvest =
        finalPoint.ruerupWithoutReinvest - finalPoint.savingsWithoutTaxBenefit;

    return {
        yearsUntilRetirement,
        yearsForChart,
        modeledTaxableIncome,
        modeledMarginalRate: incomeMarginalRate(modeledTaxableIncome, input.filingStatus) * 100,
        modeledCombinedMarginalRate:
            marginalRate(
                modeledTaxableIncome,
                input.filingStatus,
                input.includeSoli,
                input.churchTaxEnabled,
                input.federalState
            ) * 100,
        monthlyLimit,
        yearlyLimit,
        effectiveRate,
        monthlyTaxBenefit,
        annualTaxBenefit,
        monthlyActualInvestment,
        points,
        finalPoint,
        periodTotalInvestment,
        periodTaxBenefit,
        periodActualInvestment,
        actualPct,
        benefitPct,
        limitReachedPct,
        curveGainWithReinvest,
        curveGainWithoutReinvest,
    };
}
