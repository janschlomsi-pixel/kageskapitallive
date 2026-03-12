import type { RuerupResult, CurvePoint } from "./ruerupCalculator";

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

export type RuerupYearSnapshot = {
    year: number;
    ruerupWithReinvest: number;
    ruerupWithoutReinvest: number;
    savingsWithoutTaxBenefit: number;
};

export type RuerupUiModel = {
    chart: {
        years: number;
        points: CurvePoint[];
        maxY: number;
        yTicks: number[];
        xLabelStep: number;
    };
    donut: {
        totalInvestment: number;
        actualInvestment: number;
        taxBenefit: number;
        actualPct: number; // 0..1
        benefitPct: number; // 0..1
        radius: number;
        circumference: number;
        blueArcLength: number;
        greenArcLength: number;
    };
    legend: Array<{
        key: "withReinvest" | "withoutReinvest" | "withoutBenefit";
        label: string;
        value: number;
        deltaVsBaseline?: number;
        color: string;
    }>;
    badges: {
        limitReachedPct: number;
        curveGainWithReinvest: number;
        curveGainWithoutReinvest: number;
    };
};

export function buildRuerupUiModel(
    calc: RuerupResult,
    opts?: { donutRadius?: number; yTickCount?: number }
): RuerupUiModel {
    const donutRadius = opts?.donutRadius ?? 92;
    const yTickCount = opts?.yTickCount ?? 4;

    const points = calc.points ?? [];
    const years = Math.max(1, calc.yearsForChart ?? 1);

    const maxYValue = Math.max(
        1,
        ...points.map((p) =>
            Math.max(
                p.ruerupWithReinvest,
                p.ruerupWithoutReinvest,
                p.savingsWithoutTaxBenefit
            )
        )
    );

    const maxY = Math.ceil((maxYValue * 1.05) / 25000) * 25000;
    const yTicks = [...Array(yTickCount + 1)].map((_, idx) => {
        const share = idx / yTickCount;
        return maxY * (1 - share);
    });

    const xLabelStep = years <= 16 ? 1 : years <= 30 ? 2 : 3;

    const circumference = 2 * Math.PI * donutRadius;
    const blueArcLength = circumference * clamp(calc.actualPct, 0, 1);
    const greenArcLength = Math.max(0, circumference - blueArcLength);

    return {
        chart: {
            years,
            points,
            maxY,
            yTicks,
            xLabelStep,
        },
        donut: {
            totalInvestment: calc.periodTotalInvestment,
            actualInvestment: calc.periodActualInvestment,
            taxBenefit: calc.periodTaxBenefit,
            actualPct: clamp(calc.actualPct, 0, 1),
            benefitPct: clamp(calc.benefitPct, 0, 1),
            radius: donutRadius,
            circumference,
            blueArcLength,
            greenArcLength,
        },
        legend: [
            {
                key: "withReinvest",
                label: "Rürup mit Reinvestition",
                value: calc.finalPoint.ruerupWithReinvest,
                deltaVsBaseline: calc.curveGainWithReinvest,
                color: "#059669",
            },
            {
                key: "withoutReinvest",
                label: "Rürup ohne Reinvestition",
                value: calc.finalPoint.ruerupWithoutReinvest,
                deltaVsBaseline: calc.curveGainWithoutReinvest,
                color: "#2563eb",
            },
            {
                key: "withoutBenefit",
                label: "Sparplan ohne Steuervorteil",
                value: calc.finalPoint.savingsWithoutTaxBenefit,
                color: "#dc2626",
            },
        ],
        badges: {
            limitReachedPct: calc.limitReachedPct,
            curveGainWithReinvest: calc.curveGainWithReinvest,
            curveGainWithoutReinvest: calc.curveGainWithoutReinvest,
        },
    };
}

export function getRuerupYearSnapshot(
    points: CurvePoint[],
    year: number
): RuerupYearSnapshot {
    const safeYear = clamp(Math.round(year), 0, Math.max(0, points.length - 1));
    const p = points[safeYear] ?? {
        year: safeYear,
        ruerupWithReinvest: 0,
        ruerupWithoutReinvest: 0,
        savingsWithoutTaxBenefit: 0,
    };
    return p;
}
