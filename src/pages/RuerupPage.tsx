import { useState, useMemo, useCallback } from "react";
import {
    FileText,
} from "lucide-react";
import { PdfRequestModal, PdfRequestData } from "@/components/ui/PdfRequestModal";
import { generateRuerupPdf, RuerupPdfInputState } from "@/lib/ruerupPdfGenerator";

import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Accordion } from "@/components/ui/Accordion";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import {
    calculateRuerup,
    type RuerupInput,
    type FilingStatus,
    type TaxInputMode,
    type Profession,
    type PensionScheme,
    type YesNo,
    type PeriodMode,
    type CurvePoint,
} from "@/lib/ruerupCalculator";
import { buildRuerupUiModel, getRuerupYearSnapshot } from "@/lib/ruerupViewModel";

const FEDERAL_STATES = [
    "Baden-Württemberg",
    "Bayern",
    "Berlin",
    "Brandenburg",
    "Bremen",
    "Hamburg",
    "Hessen",
    "Mecklenburg-Vorpommern",
    "Niedersachsen",
    "Nordrhein-Westfalen",
    "Rheinland-Pfalz",
    "Saarland",
    "Sachsen",
    "Sachsen-Anhalt",
    "Schleswig-Holstein",
    "Thüringen",
];

const HEALTH_INSURANCE_OPTIONS = [
    { value: "gkv", label: "Gesetzlich (GKV)" },
    { value: "pkv", label: "Privat (PKV)" },
];

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
}

// Donut Chart Component
function DonutChart({
    actualPct,
    totalInvestment,
    actualInvestment,
    taxBenefit,
    periodLabel,
}: {
    actualPct: number;
    totalInvestment: number;
    actualInvestment: number;
    taxBenefit: number;
    periodLabel: string;
}) {
    const radius = 80;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;
    const blueArc = circumference * actualPct;
    const greenArc = circumference - blueArc;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-52 h-52">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
                    {/* Blue arc (actual investment) */}
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${blueArc} ${circumference}`}
                        strokeLinecap="round"
                    />
                    {/* Green arc (tax benefit) */}
                    <circle
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="none"
                        stroke="#059669"
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${greenArc} ${circumference}`}
                        strokeDashoffset={-blueArc}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500 mb-1">{periodLabel}</span>
                    <span className="font-bold text-xl text-gray-900">
                        {formatCurrency(totalInvestment)}
                    </span>
                </div>
            </div>
            <div className="mt-4 space-y-2 w-full max-w-xs">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#2563eb]" />
                        <span className="text-sm text-gray-600">Tatsächliche Investition</span>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(actualInvestment)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#059669]" />
                        <span className="text-sm text-gray-600">Steuervorteil</span>
                    </div>
                    <span className="font-semibold text-[#059669]">{formatCurrency(taxBenefit)}</span>
                </div>
            </div>
        </div>
    );
}

// Line Chart Component
function LineChart({
    points,
    maxY,
    yTicks,
    years,
    xLabelStep,
    hoveredYear,
    onHover,
}: {
    points: CurvePoint[];
    maxY: number;
    yTicks: number[];
    years: number;
    xLabelStep: number;
    hoveredYear: number | null;
    onHover: (year: number | null) => void;
}) {
    const padding = { top: 20, right: 30, bottom: 40, left: 70 };
    const width = 800;
    const height = 450;
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const getX = (year: number) => padding.left + (year / years) * chartWidth;
    const getY = (value: number) => padding.top + (1 - value / maxY) * chartHeight;

    const createPath = (key: keyof CurvePoint) => {
        return points
            .map((p, i) => `${i === 0 ? "M" : "L"} ${getX(p.year)} ${getY(p[key] as number)}`)
            .join(" ");
    };

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const relX = (x - padding.left) / chartWidth;
            const year = Math.round(relX * years);
            if (year >= 0 && year <= years) {
                onHover(year);
            }
        },
        [chartWidth, years, onHover]
    );

    const handleTouchMove = useCallback(
        (e: React.TouchEvent<SVGSVGElement>) => {
            const touch = e.touches[0];
            const rect = e.currentTarget.getBoundingClientRect();
            const x = touch.clientX - rect.left;
            const relX = (x - padding.left) / chartWidth;
            const year = Math.round(relX * years);
            if (year >= 0 && year <= years) {
                onHover(year);
            }
        },
        [chartWidth, years, onHover]
    );

    const snapshot = hoveredYear !== null ? getRuerupYearSnapshot(points, hoveredYear) : null;

    return (
        <div className="relative h-full flex items-center">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
                onMouseLeave={() => onHover(null)}
                onTouchEnd={() => onHover(null)}
            >
                {/* Grid lines and Y-axis labels */}
                {yTicks.map((tick, i) => (
                    <g key={i}>
                        <line
                            x1={padding.left}
                            y1={getY(tick)}
                            x2={width - padding.right}
                            y2={getY(tick)}
                            stroke="#e5e7eb"
                            strokeDasharray="4 4"
                        />
                        <text
                            x={padding.left - 10}
                            y={getY(tick)}
                            textAnchor="end"
                            dominantBaseline="middle"
                            className="text-xs fill-gray-500"
                        >
                            {tick >= 1000000 ? `${(tick / 1000000).toFixed(1)}M` : tick >= 1000 ? `${Math.round(tick / 1000)}k` : tick}
                        </text>
                    </g>
                ))}

                {/* X-axis labels */}
                {points
                    .filter((p) => p.year % xLabelStep === 0)
                    .map((p) => (
                        <text
                            key={p.year}
                            x={getX(p.year)}
                            y={height - 10}
                            textAnchor="middle"
                            className="text-xs fill-gray-500"
                        >
                            {p.year}
                        </text>
                    ))}

                {/* Lines */}
                <path
                    d={createPath("savingsWithoutTaxBenefit")}
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <path
                    d={createPath("ruerupWithoutReinvest")}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />
                <path
                    d={createPath("ruerupWithReinvest")}
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Hover line and points */}
                {hoveredYear !== null && snapshot && (
                    <>
                        <line
                            x1={getX(hoveredYear)}
                            y1={padding.top}
                            x2={getX(hoveredYear)}
                            y2={height - padding.bottom}
                            stroke="#374151"
                            strokeWidth="1"
                            strokeDasharray="4 4"
                        />
                        <circle
                            cx={getX(hoveredYear)}
                            cy={getY(snapshot.ruerupWithReinvest)}
                            r="5"
                            fill="#059669"
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={getX(hoveredYear)}
                            cy={getY(snapshot.ruerupWithoutReinvest)}
                            r="5"
                            fill="#2563eb"
                            stroke="white"
                            strokeWidth="2"
                        />
                        <circle
                            cx={getX(hoveredYear)}
                            cy={getY(snapshot.savingsWithoutTaxBenefit)}
                            r="5"
                            fill="#dc2626"
                            stroke="white"
                            strokeWidth="2"
                        />
                    </>
                )}
            </svg>

            {/* Tooltip */}
            {hoveredYear !== null && snapshot && (
                <div
                    className="absolute bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-3 pointer-events-none z-10"
                    style={{
                        left: `${((getX(hoveredYear) / width) * 100)}%`,
                        top: "20px",
                        transform: "translateX(-50%)",
                    }}
                >
                    <div className="text-xs font-semibold text-gray-700 mb-2">Jahr {hoveredYear}</div>
                    <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#059669]" />
                            <span className="text-gray-600">Mit Reinvestition:</span>
                            <span className="font-semibold">{formatCurrency(snapshot.ruerupWithReinvest)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#2563eb]" />
                            <span className="text-gray-600">Ohne Reinvestition:</span>
                            <span className="font-semibold">{formatCurrency(snapshot.ruerupWithoutReinvest)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#dc2626]" />
                            <span className="text-gray-600">Sparplan:</span>
                            <span className="font-semibold">{formatCurrency(snapshot.savingsWithoutTaxBenefit)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Tax Modal Component
function TaxModal({
    isOpen,
    onClose,
    taxState,
    setTaxState,
    onApply,
}: {
    isOpen: boolean;
    onClose: () => void;
    taxState: TaxModalState;
    setTaxState: React.Dispatch<React.SetStateAction<TaxModalState>>;
    onApply: (marginalRate: number, taxableIncome: number) => void;
}) {
    const result = useMemo(() => {
        const input: RuerupInput = {
            dateOfBirth: new Date(1985, 0, 1),
            federalState: taxState.federalState,
            retirementAge: 67,
            churchTaxEnabled: taxState.churchTaxEnabled,
            filingStatus: taxState.filingStatus,
            taxInputMode: taxState.inputMode,
            taxableIncomeInput: taxState.taxableIncome,
            marginalTaxRatePct: 42,
            includeSoli: taxState.includeSoli,
            grossIncomeAnnual: taxState.grossIncome,
            profession: taxState.profession,
            pensionScheme: taxState.pensionScheme,
            hasChildren: taxState.hasChildren,
            isSingleParent: taxState.isSingleParent,
            childrenCount: taxState.childrenCount,
            childAllowance: taxState.childAllowance,
            monthlyInvestmentWish: 500,
            existingCapital: 0,
            existingMonthlyInvestment: 0,
            annualReturnPct: 7,
            periodMode: "monthly",
        };
        return calculateRuerup(input);
    }, [taxState]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-[#e5e7eb]">
                    <h2 className="font-bold text-lg text-gray-900">
                        Berechnung des persönlichen Steuersatzes
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Filing Status */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Veranlagung</label>
                        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                            {([{ value: "single", label: "Ledig" }, { value: "married", label: "Verheiratet" }] as const).map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTaxState((s) => ({ ...s, filingStatus: opt.value }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${taxState.filingStatus === opt.value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Input Mode */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Eingabemodus</label>
                        <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                            {([{ value: "input", label: "Eingeben" }, { value: "estimate", label: "Ermitteln" }] as const).map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setTaxState((s) => ({ ...s, inputMode: opt.value }))}
                                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${taxState.inputMode === opt.value
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-600 hover:text-gray-900"
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {taxState.inputMode === "input" ? (
                        <Input
                            label="Zu versteuerndes Einkommen (€/Jahr)"
                            type="number"
                            value={taxState.taxableIncome}
                            onChange={(e) =>
                                setTaxState((s) => ({ ...s, taxableIncome: Number(e.target.value) }))
                            }
                        />
                    ) : (
                        <>
                            <Input
                                label="Bruttoeinkommen (€/Jahr)"
                                type="number"
                                value={taxState.grossIncome}
                                onChange={(e) =>
                                    setTaxState((s) => ({ ...s, grossIncome: Number(e.target.value) }))
                                }
                            />

                            <Select
                                label="Berufsgruppe"
                                value={taxState.profession}
                                onChange={(e) => setTaxState((s) => ({ ...s, profession: e.target.value as Profession }))}
                                options={[
                                    { value: "employee", label: "Angestellter" },
                                    { value: "self_employed", label: "Selbständig" },
                                    { value: "civil_servant", label: "Beamter" },
                                ]}
                            />

                            <Select
                                label="Altersvorsorgesystem"
                                value={taxState.pensionScheme}
                                onChange={(e) => setTaxState((s) => ({ ...s, pensionScheme: e.target.value as PensionScheme }))}
                                options={[
                                    { value: "legal", label: "Gesetzliche Rentenversicherung" },
                                    { value: "versorgungswerk", label: "Versorgungswerk" },
                                    { value: "none", label: "Keine" },
                                ]}
                            />

                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">Kinder</span>
                                <Toggle
                                    checked={taxState.hasChildren === "yes"}
                                    onChange={(v) => setTaxState((s) => ({ ...s, hasChildren: v ? "yes" : "no" }))}
                                />
                            </div>

                            {taxState.hasChildren === "yes" && (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">Alleinerziehend</span>
                                        <Toggle
                                            checked={taxState.isSingleParent === "yes"}
                                            onChange={(v) =>
                                                setTaxState((s) => ({ ...s, isSingleParent: v ? "yes" : "no" }))
                                            }
                                        />
                                    </div>

                                    <Input
                                        label="Anzahl Kinder"
                                        type="number"
                                        min={1}
                                        max={8}
                                        value={taxState.childrenCount}
                                        onChange={(e) =>
                                            setTaxState((s) => ({ ...s, childrenCount: Number(e.target.value) }))
                                        }
                                    />

                                    <Select
                                        label="Kinderfreibetrag"
                                        value={String(taxState.childAllowance)}
                                        onChange={(e) =>
                                            setTaxState((s) => ({ ...s, childAllowance: Number(e.target.value) }))
                                        }
                                        options={[
                                            { value: "0", label: "0%" },
                                            { value: "0.5", label: "50%" },
                                            { value: "1", label: "100%" },
                                        ]}
                                    />
                                </>
                            )}
                        </>
                    )}

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Solidaritätszuschlag</span>
                        <Toggle
                            checked={taxState.includeSoli}
                            onChange={(v) => setTaxState((s) => ({ ...s, includeSoli: v }))}
                        />
                    </div>

                    {/* Results */}
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Modelliertes zu verst. Einkommen</span>
                            <span className="font-semibold">{formatCurrency(result.modeledTaxableIncome)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Grenzsteuersatz (ESt)</span>
                            <span className="font-semibold">{formatPercent(result.modeledMarginalRate)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Effektiver Satz inkl. Soli/KiSt</span>
                            <span className="font-semibold text-[#059669]">
                                {formatPercent(result.modeledCombinedMarginalRate)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-[#e5e7eb]">
                    <button
                        onClick={() => {
                            onApply(result.modeledMarginalRate, result.modeledTaxableIncome);
                            onClose();
                        }}
                        className="w-full py-3 bg-[#059669] text-white font-semibold rounded-lg hover:bg-[#047857] transition-colors"
                    >
                        Ermitteln
                    </button>
                </div>
            </div>
        </div>
    );
}

type TaxModalState = {
    filingStatus: FilingStatus;
    inputMode: TaxInputMode;
    taxableIncome: number;
    grossIncome: number;
    profession: Profession;
    pensionScheme: PensionScheme;
    hasChildren: YesNo;
    isSingleParent: YesNo;
    childrenCount: number;
    childAllowance: number;
    includeSoli: boolean;
    churchTaxEnabled: YesNo;
    federalState: string;
};

export function RuerupPage() {
    // Main form state
    const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(new Date("1985-01-15"));
    const [federalState, setFederalState] = useState("Bayern");
    const [retirementAge, setRetirementAge] = useState(67);
    const [churchTaxEnabled, setChurchTaxEnabled] = useState<YesNo>("no");
    const [healthInsurance, setHealthInsurance] = useState("gkv");

    const [marginalTaxRate, setMarginalTaxRate] = useState(42);
    const [taxableIncome, setTaxableIncome] = useState(80000);
    const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
    const [includeSoli, setIncludeSoli] = useState(true);

    const [existingCapital, setExistingCapital] = useState(10000);
    const [existingMonthlyInvestment, setExistingMonthlyInvestment] = useState(200);

    const [monthlyInvestmentWish, setMonthlyInvestmentWish] = useState(500);
    const [annualReturnPct, setAnnualReturnPct] = useState(7);
    const [periodMode, setPeriodMode] = useState<PeriodMode>("monthly");

    const [hoveredYear, setHoveredYear] = useState<number | null>(null);
    const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);

    const [taxModalState, setTaxModalState] = useState<TaxModalState>({
        filingStatus: "single",
        inputMode: "input",
        taxableIncome: 80000,
        grossIncome: 100000,
        profession: "employee",
        pensionScheme: "legal",
        hasChildren: "no",
        isSingleParent: "no",
        childrenCount: 1,
        childAllowance: 1,
        includeSoli: true,
        churchTaxEnabled: "no",
        federalState: "Bayern",
    });



    // Calculate results
    const result = useMemo(() => {
        const dob = dateOfBirth || new Date();
        const input: RuerupInput = {
            dateOfBirth: dob,
            federalState,
            retirementAge,
            churchTaxEnabled,
            filingStatus,
            taxInputMode: "input",
            taxableIncomeInput: taxableIncome,
            marginalTaxRatePct: marginalTaxRate,
            includeSoli,
            grossIncomeAnnual: 100000,
            profession: "employee",
            pensionScheme: "legal",
            hasChildren: "no",
            isSingleParent: "no",
            childrenCount: 0,
            childAllowance: 0,
            monthlyInvestmentWish,
            existingCapital,
            existingMonthlyInvestment,
            annualReturnPct,
            periodMode,
        };
        return calculateRuerup(input);
    }, [
        dateOfBirth,
        federalState,
        retirementAge,
        churchTaxEnabled,
        filingStatus,
        taxableIncome,
        marginalTaxRate,
        includeSoli,
        monthlyInvestmentWish,
        existingCapital,
        existingMonthlyInvestment,
        annualReturnPct,
        periodMode,
    ]);

    const uiModel = useMemo(() => buildRuerupUiModel(result), [result]);

    const [showPdfModal, setShowPdfModal] = useState(false);
    const handlePdfGenerate = (reqData: PdfRequestData) => {
        if (!result) return;
        const inputState: RuerupPdfInputState = {
            dateOfBirth: dateOfBirth || new Date(),
            retirementAge,
            filingStatus,
            churchTaxEnabled,
            healthInsurance,
            taxableIncome,
            marginalTaxRate,
            monthlyInvestmentWish,
            existingCapital,
            existingMonthlyInvestment,
            annualReturnPct,
            periodMode,
            includeSoli,
            federalState,
        };
        generateRuerupPdf(reqData, result, inputState);
    };

    const handleTaxModalApply = (newMarginalRate: number, newTaxableIncome: number) => {
        setMarginalTaxRate(newMarginalRate);
        setTaxableIncome(newTaxableIncome);
        setFilingStatus(taxModalState.filingStatus);
        setIncludeSoli(taxModalState.includeSoli);
        setChurchTaxEnabled(taxModalState.churchTaxEnabled);
        setFederalState(taxModalState.federalState);
    };

    return (
        <Layout title="Rürup-Rechner" subtitle="Steuervorteil berechnen">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-2 lg:h-[calc(100vh-80px)] lg:overflow-hidden">
                <div className="grid lg:grid-cols-[280px_1fr_300px] xl:grid-cols-[300px_1fr_340px] gap-4 lg:gap-5 lg:h-[calc(100vh-140px)]">
                    {/* Column 1: Inputs */}
                    <div className="space-y-3 lg:h-full lg:overflow-y-auto lg:pr-2 lg:scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
                        <Accordion title="Grunddaten" defaultOpen>
                            <div className="space-y-4 pt-4">
                                <DatePicker
                                    label="Geburtsdatum"
                                    value={dateOfBirth}
                                    onChange={setDateOfBirth}
                                />
                                <Select
                                    label="Bundesland"
                                    value={federalState}
                                    onChange={(e) => setFederalState(e.target.value)}
                                    options={FEDERAL_STATES.map((s) => ({ value: s, label: s }))}
                                />
                                <Slider
                                    label="Renteneintrittsalter"
                                    valueLabel={`${retirementAge} Jahre`}
                                    min={55}
                                    max={72}
                                    value={retirementAge}
                                    onChange={(e) => setRetirementAge(Number(e.target.value))}
                                />
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-700">Kirchensteuerpflichtig</span>
                                    <Toggle
                                        checked={churchTaxEnabled === "yes"}
                                        onChange={(v) => setChurchTaxEnabled(v ? "yes" : "no")}
                                    />
                                </div>
                                <Select
                                    label="Art Krankenversicherung"
                                    value={healthInsurance}
                                    onChange={(e) => setHealthInsurance(e.target.value)}
                                    options={HEALTH_INSURANCE_OPTIONS}
                                />
                            </div>
                        </Accordion>

                        <Accordion
                            title="Annahmen zur Steuer"
                            action={
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTaxModalState((s) => ({
                                            ...s,
                                            federalState,
                                            churchTaxEnabled,
                                            includeSoli,
                                            filingStatus,
                                            taxableIncome,
                                        }));
                                        setIsTaxModalOpen(true);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs text-[#2563eb] hover:bg-[#2563eb]/10 rounded transition-colors"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Bearbeiten
                                </button>
                            }
                        >
                            <div className="space-y-3 pt-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Grenzsteuersatz</span>
                                    <span className="font-semibold text-gray-900">{formatPercent(marginalTaxRate)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Zu verst. Einkommen</span>
                                    <span className="font-semibold text-gray-900">{formatCurrency(taxableIncome)}</span>
                                </div>
                            </div>
                        </Accordion>

                        <Accordion title="Bestehende Investition">
                            <div className="space-y-4 pt-4">
                                <Input
                                    label="Bestehendes Kapital"
                                    type="number"
                                    min={0}
                                    value={existingCapital}
                                    onChange={(e) => setExistingCapital(Number(e.target.value))}
                                    suffix="€"
                                />
                                <Input
                                    label="Bestehende monatliche Einzahlung"
                                    type="number"
                                    min={0}
                                    value={existingMonthlyInvestment}
                                    onChange={(e) => setExistingMonthlyInvestment(Number(e.target.value))}
                                    suffix="€"
                                />
                            </div>
                        </Accordion>

                        <Accordion title="Investitionswunsch" defaultOpen>
                            <div className="space-y-4 pt-4">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Investitionslimit</span>
                                        <span>{formatPercent(result.limitReachedPct)} ausgeschöpft</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-[#059669] rounded-full transition-all"
                                            style={{ width: `${Math.min(100, result.limitReachedPct)}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Max. Investition/Monat</span>
                                    <span className="font-semibold">{formatCurrency(result.monthlyLimit)}</span>
                                </div>
                                <Input
                                    label="Investitionswunsch/Monat"
                                    type="number"
                                    min={0}
                                    max={result.monthlyLimit}
                                    value={monthlyInvestmentWish}
                                    onChange={(e) => setMonthlyInvestmentWish(Number(e.target.value))}
                                    suffix="€"
                                />
                            </div>
                        </Accordion>
                    </div>

                    {/* Column 2: Chart */}
                    <div className="lg:h-full lg:flex lg:flex-col">
                        <Card className="!p-4 md:!p-5 lg:flex-1 lg:flex lg:flex-col lg:overflow-hidden">
                            <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-3">
                                Wertentwicklung
                            </h3>

                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-sm text-gray-600">Erwartete Rendite</span>
                                    <span className="text-sm font-semibold text-[#059669]">
                                        {formatPercent(annualReturnPct)}
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={14}
                                    step={0.5}
                                    value={annualReturnPct}
                                    onChange={(e) => setAnnualReturnPct(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                                    <span>0%</span>
                                    <span>14%</span>
                                </div>
                            </div>

                            <div className="lg:flex-1 lg:min-h-0 flex flex-col justify-center">
                                <div className="h-[300px] sm:h-[350px] md:h-[400px] lg:h-full">
                                    <LineChart
                                        points={uiModel.chart.points}
                                        maxY={uiModel.chart.maxY}
                                        yTicks={uiModel.chart.yTicks}
                                        years={uiModel.chart.years}
                                        xLabelStep={uiModel.chart.xLabelStep}
                                        hoveredYear={hoveredYear}
                                        onHover={setHoveredYear}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 space-y-2">
                                {uiModel.legend.map((item) => (
                                    <div key={item.key} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0 flex-shrink">
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-sm text-gray-700 truncate">{item.label}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {item.deltaVsBaseline !== undefined && item.deltaVsBaseline > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-[#059669]/10 text-[#059669] whitespace-nowrap">
                                                    +{formatCurrency(item.deltaVsBaseline)}
                                                </span>
                                            )}
                                            <span className="font-semibold text-gray-900 tabular-nums text-right min-w-[100px]">
                                                {formatCurrency(item.value)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Column 3: Results & Donut */}
                    <div className="lg:overflow-y-auto lg:h-full lg:pl-2 lg:scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
                        <Card className="!p-4 md:!p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg text-gray-900">
                                    Erzielter Steuervorteil
                                </h3>
                            </div>

                            <div className="flex justify-center mb-6">
                                <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                                    {([{ value: "monthly", label: "Monatlich" }, { value: "yearly", label: "Jährlich" }] as const).map((opt) => (
                                        <button
                                            key={opt.value}
                                            onClick={() => setPeriodMode(opt.value)}
                                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${periodMode === opt.value
                                                ? "bg-white text-gray-900 shadow-sm"
                                                : "text-gray-600 hover:text-gray-900"
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <DonutChart
                                actualPct={uiModel.donut.actualPct}
                                totalInvestment={uiModel.donut.totalInvestment}
                                actualInvestment={uiModel.donut.actualInvestment}
                                taxBenefit={uiModel.donut.taxBenefit}
                                periodLabel={periodMode === "monthly" ? "pro Monat" : "pro Jahr"}
                            />

                            <div className="mt-6 p-4 bg-[#059669]/5 rounded-lg border border-[#059669]/20">
                                <div className="text-center">
                                    <span className="text-sm text-gray-600">
                                        Ihr effektiver Steuervorteil beträgt
                                    </span>
                                    <div className="font-bold text-2xl text-[#059669] mt-1">
                                        {formatPercent(result.effectiveRate * 100)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 text-center text-sm text-gray-500">
                                <span className="font-semibold text-gray-700">{result.yearsForChart}</span> Jahre bis zur Rente
                            </div>
                        </Card>

                        <Accordion title="Ergebnis & Aufteilung" defaultOpen>
                            {/* PDF Action inside Accordion Header? No, Accordion doesn't support it. Place it above or below. 
                                Actually, let's just remove the prop for now. The PDF button is already at the top of the page. 
                            */}
                            <div className="space-y-6 pt-4">
                            </div>
                        </Accordion>

                        <div className="pt-4">
                            <Button
                                variant="primary"
                                className="w-full justify-center py-3"
                                onClick={() => setShowPdfModal(true)}
                            >
                                <FileText className="w-4 h-4 mr-2" />
                                PDF erstellen
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <TaxModal
                isOpen={isTaxModalOpen}
                onClose={() => setIsTaxModalOpen(false)}
                taxState={taxModalState}
                setTaxState={setTaxModalState}
                onApply={handleTaxModalApply}
            />

            <PdfRequestModal
                isOpen={showPdfModal}
                onClose={() => setShowPdfModal(false)}
                onGenerate={handlePdfGenerate}
                title="Rürup-Report anfordern"
            />
        </Layout>
    );
}
