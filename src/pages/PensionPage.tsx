import { useState, useMemo, useEffect } from "react";
import {
  ShieldCheck,
  TrendingUp,
  Wallet,
  FileText,
} from "lucide-react";
import { PdfRequestModal, PdfRequestData } from "@/components/ui/PdfRequestModal";
import { generatePensionPdf, type PensionPdfInput, type PensionPdfResult } from "@/lib/pensionPdfGenerator";
import { captureLead } from "@/lib/leadCapture";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Accordion } from "@/components/ui/Accordion";
import { DatePicker } from "@/components/ui/DatePicker";
import { calculatePensionGap, type Mode, type YesNo } from "@/lib/pensionCalculator";
import { Button } from "@/components/ui/Button"; // Assuming Button component is available

const formatCurrency = (n: number | undefined) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

// Format percent helper (used in display)
const _formatPercent = (n: number) => `${(n * 100).toFixed(0)}% `;
void _formatPercent; // Prevent unused warning

// Helper function to calculate future value
function calculateFV(monthlyPayment: number, annualRate: number, years: number, initialLump: number): number {
  const monthlyRate = annualRate / 100 / 12;
  const months = years * 12;
  if (Math.abs(monthlyRate) < 1e-10) {
    return initialLump + monthlyPayment * months;
  }
  const fv = monthlyPayment * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  const fvLump = initialLump * Math.pow(1 + monthlyRate, months);
  return fv + fvLump;
}

export function PensionPage() {
  const [mode, setMode] = useState<Mode>("employee");

  // Person
  const [dob, setDob] = useState<Date | undefined>(new Date("2001-01-15"));
  const [jobEntry, setJobEntry] = useState<Date | undefined>(new Date("2024-01-01"));
  const [monthlyGross, setMonthlyGross] = useState(0);
  const [churchTax, setChurchTax] = useState<YesNo>("no");
  const [retirementAge, setRetirementAge] = useState(67);
  const [lifeExpectancy, setLifeExpectancy] = useState(90);

  // Health
  const [healthType, setHealthType] = useState<"legal" | "private">("legal");
  const [kvdr, setKvdr] = useState<YesNo>("yes");
  const [pkvPremium, setPkvPremium] = useState(0);

  // Versorgungswerk
  const [hasNotice, setHasNotice] = useState<YesNo>("no");
  const [noticeTiming, setNoticeTiming] = useState<"current" | "retirement">("retirement");
  const [noticeAmount, setNoticeAmount] = useState(0);
  const [factorToGrv, setFactorToGrv] = useState(1.3);
  const [ruleAge, setRuleAge] = useState(67);
  const [pensionGrowthPct, setPensionGrowthPct] = useState(1.5);
  const [vwHealthType, setVwHealthType] = useState<"legal" | "private">("private");
  const [healthGrowthPct, setHealthGrowthPct] = useState(3);
  const [vwKvdr] = useState<YesNo>("yes");
  const [vwPkvPremium, setVwPkvPremium] = useState(0);

  // Self-employed GRV
  const [selfGrvEnabled, setSelfGrvEnabled] = useState(false);
  const [selfGrvHasNotice, setSelfGrvHasNotice] = useState<YesNo>("no");
  const [selfGrvNoticeTiming, setSelfGrvNoticeTiming] = useState<"current" | "retirement">("retirement");
  const [selfGrvNoticeAmount, setSelfGrvNoticeAmount] = useState(0);

  // Target
  const [targetNetToday, setTargetNetToday] = useState(0);

  // Assumptions-DEFAULTS: Anspar 7%, Entnahme 2%
  const [inflationPct, setInflationPct] = useState(2.5);
  const [returnSavingPct, setReturnSavingPct] = useState(7); // Default 7%
  const [returnTakeoutPct, setReturnTakeoutPct] = useState(2); // Default 2%
  const [adjustForPurchasePower, setAdjustForPurchasePower] = useState(false);

  // Investment
  const [desiredSaving, setDesiredSaving] = useState(0);
  const [initialLumpSum, setInitialLumpSum] = useState(0);

  // Disable global scrolling on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
      } else {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const [showPdfModal, setShowPdfModal] = useState(false);
  const handlePdfGenerate = async (reqData: PdfRequestData) => {
    if (!data) return;

    const fullGapNominal = Math.max(0, data.targetInflated - data.pensionNet);
    const rDec_m = returnTakeoutPct / 100 / 12;
    const retMonths = (lifeExpectancy - retirementAge) * 12;
    const requiredCapitalFull = fullGapNominal <= 0 || retMonths <= 0 ? 0
      : Math.abs(rDec_m) < 1e-12 ? fullGapNominal * retMonths
      : fullGapNominal * (1 - Math.pow(1 + rDec_m, -retMonths)) / rDec_m;

    const pdfInput: PensionPdfInput = {
      mode, dob: dob || new Date(), jobEntry: jobEntry || new Date(),
      monthlyGross, churchTax: churchTax === "yes",
      retirementAge, lifeExpectancy, healthType,
      targetNetToday, inflationPct, returnSavingPct, returnTakeoutPct,
      desiredSaving, initialLumpSum,
    };

    const pdfResult: PensionPdfResult = {
      gap, pensionNet: data.pensionNet, privatePayout: data.privatePayout,
      totalPension: data.totalPension, targetInflated: data.targetInflated,
      requiredCapital: data.requiredCapital, requiredCapitalFull,
      requiredSavingNow: data.requiredSavingNow,
      requiredIn4: data.requiredIn4, requiredIn8: data.requiredIn8,
      coverage: data.coverage,
      capitalNow, capitalIn4, capitalIn8,
      interestNow, interestIn4, interestIn8,
      retirementYear: data.retirementYear, monthsToRet: data.monthsToRet,
    };

    const { blob, fileName } = await generatePensionPdf(reqData, pdfResult, pdfInput);
    captureLead(reqData, blob, fileName, "altersvorsorge");
  };

  const result = useMemo(() => {
    const today = new Date();
    return calculatePensionGap({
      today,
      mode,
      dob: dob || new Date(),
      jobEntry: jobEntry || new Date(),
      monthlyGross,
      churchTax,
      retirementAge,
      lifeExpectancy,
      healthType,
      kvdr,
      pkvPremium,
      targetNetToday,
      inflationPct,
      returnSavingPct,
      returnTakeoutPct,
      adjustForPurchasePower,
      desiredSaving,
      initialLumpSum,
      versorgungswerk: {
        hasNotice,
        noticeTiming,
        noticeAmount,
        factorToGrv,
        ruleAge,
        pensionGrowthPct,
        healthType: vwHealthType,
        healthGrowthPct,
        kvdr: vwKvdr,
        pkvPremium: vwPkvPremium,
      },
      selfEmployedGrv: {
        enabled: selfGrvEnabled,
        hasNotice: selfGrvHasNotice,
        noticeTiming: selfGrvNoticeTiming,
        noticeAmount: selfGrvNoticeAmount,
      },
    });
  }, [
    mode, dob, jobEntry, monthlyGross, churchTax, retirementAge, lifeExpectancy,
    healthType, kvdr, pkvPremium, targetNetToday, inflationPct, returnSavingPct,
    returnTakeoutPct, adjustForPurchasePower, desiredSaving, initialLumpSum,
    hasNotice, noticeTiming, noticeAmount, factorToGrv, ruleAge, pensionGrowthPct,
    vwHealthType, healthGrowthPct, vwKvdr, vwPkvPremium,
    selfGrvEnabled, selfGrvHasNotice, selfGrvNoticeTiming, selfGrvNoticeAmount,
  ]);

  const isOk = result.ok;
  const data = isOk ? result : null;

  // Calculate years to retirement
  const yearsToRetirement = data?.monthsToRet ? data.monthsToRet / 12 : 30;

  // Inflation factor for nominal vs real calculations
  const inflationFactor = Math.pow(1 + inflationPct / 100, yearsToRetirement);

  // KAUFKRAFT-TOGGLE LOGIC:
  //-AUS (adjustForPurchasePower = false): Show nominal values (inflated)
  //-AN (adjustForPurchasePower = true): Show real values (today's purchasing power)

  // Target values based on Kaufkraft toggle
  const targetToday = targetNetToday; // Always the same: what user wants today
  const targetAtRetirement = adjustForPurchasePower
    ? targetNetToday // Kaufkraft AN: show in today's terms
    : targetNetToday * inflationFactor; // Kaufkraft AUS: nominal (inflated)

  // Pension values-adjust based on Kaufkraft toggle
  const pensionNetNominal = data?.pensionNet ?? 0;
  const pensionNet = adjustForPurchasePower
    ? pensionNetNominal / inflationFactor // Kaufkraft AN: deflate to today's purchasing power
    : pensionNetNominal; // Kaufkraft AUS: nominal

  const privatePayoutNominal = data?.privatePayout ?? 0;
  const privatePayout = adjustForPurchasePower
    ? privatePayoutNominal / inflationFactor
    : privatePayoutNominal;

  // Gap calculation based on current mode
  const gap = Math.max(0, targetAtRetirement - pensionNet - privatePayout);
  const totalCoverage = pensionNet + privatePayout;

  // For vertical bar chart: calculate heights relative to max value
  const maxBarValue = Math.max(targetToday, targetAtRetirement, totalCoverage + gap);

  // Height percentages for vertical bars (0-100%)
  const targetTodayHeight = maxBarValue > 0 ? (targetToday / maxBarValue) * 100 : 0;
  const targetRetirementHeight = maxBarValue > 0 ? (targetAtRetirement / maxBarValue) * 100 : 0;

  // Stacked bar segments (as percentages of the total stacked bar height)
  const stackedTotal = pensionNet + privatePayout + gap;
  const pensionPct = stackedTotal > 0 ? (pensionNet / stackedTotal) * 100 : 0;
  const privatePct = stackedTotal > 0 ? (privatePayout / stackedTotal) * 100 : 0;
  const gapPct = stackedTotal > 0 ? (gap / stackedTotal) * 100 : 0;

  // Note: stackedTotal is used for calculating segment percentages

  // Coverage percentage (for gauge)
  const coveragePct = targetAtRetirement > 0 ? (totalCoverage / targetAtRetirement) * 100 : 0;
  const capitalNow = data?.capitalNow ?? calculateFV(desiredSaving, returnSavingPct, yearsToRetirement, initialLumpSum);
  const capitalIn4 = data?.capitalIn4 ?? calculateFV(desiredSaving, returnSavingPct, Math.max(0, yearsToRetirement - 4), initialLumpSum);
  const capitalIn8 = data?.capitalIn8 ?? calculateFV(desiredSaving, returnSavingPct, Math.max(0, yearsToRetirement - 8), initialLumpSum);

  // Interest calculations
  const totalContribNow = desiredSaving * yearsToRetirement * 12 + initialLumpSum;
  const totalContribIn4 = desiredSaving * Math.max(0, yearsToRetirement - 4) * 12 + initialLumpSum;
  const totalContribIn8 = desiredSaving * Math.max(0, yearsToRetirement - 8) * 12 + initialLumpSum;

  const interestNow = data?.interestNow ?? Math.max(0, capitalNow - totalContribNow);
  const interestIn4 = data?.interestIn4 ?? Math.max(0, capitalIn4 - totalContribIn4);
  const interestIn8 = data?.interestIn8 ?? Math.max(0, capitalIn8 - totalContribIn8);

  return (
    <>
      <Layout title="Rentenlückenrechner" subtitle="Versorgungslücke berechnen">
        {/* Desktop: Fixed viewport height, no scrolling on main page */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-2 lg:h-[calc(100vh-80px)] lg:overflow-hidden">
          {/* Mode Toggle-kompakter auf Desktop */}
          <div className="flex justify-center mb-4 lg:mb-3">
            <div className="inline-flex bg-gray-100 p-1 rounded-xl w-full max-w-sm sm:w-auto">
              {(["employee", "selfEmployed", "versorgungswerk"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); if (m === "selfEmployed") setHealthType("private"); else if (m === "employee") setHealthType("legal"); }}
                  className={`flex-1 sm:flex-none px-2 sm:px-4 py-2 rounded-lg text-[11px] sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${mode === m
                      ? "bg-white shadow-md text-[#059669]"
                      : "text-gray-600 hover:text-gray-900"
                    } `}
                >
                  {m === "versorgungswerk" ? "Versorgungswerk" : m === "employee" ? "Angestellt" : "Selbstständig"}
                </button>
              ))}
            </div>
          </div>

          {/* 3-Column Layout: Links/Rechts scrollbar, Mitte locked */}
          <div className="grid lg:grid-cols-[280px_1fr_300px] xl:grid-cols-[300px_1fr_340px] gap-4 lg:gap-5 lg:h-[calc(100vh-140px)]">
            {/* Column 1: Inputs (schmal, eigenes Scrolling) */}
            <div className="space-y-3 lg:h-full lg:overflow-y-auto lg:pr-2 lg:scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
              {mode === "selfEmployed" ? (
                <>
                <Accordion title="Angaben zur Person" defaultOpen>
                  <div className="space-y-4 pt-4">
                    <DatePicker
                      label="Geburtsdatum"
                      value={dob}
                      onChange={(date) => setDob(date)}
                    />
                    <Slider
                      label="Renteneintrittsalter"
                      valueLabel={`${retirementAge} Jahre`}
                      min={55}
                      max={75}
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                    />
                    <Slider
                      label="Lebenserwartung"
                      valueLabel={`${lifeExpectancy} Jahre`}
                      min={70}
                      max={100}
                      value={lifeExpectancy}
                      onChange={(e) => setLifeExpectancy(parseInt(e.target.value))}
                    />
                  </div>
                </Accordion>

                <Accordion title="Annahme zur Rente" defaultOpen>
                  <div className="space-y-4 pt-4">
                    <Select
                      label="Gesetzliche Rentenversicherung"
                      value={selfGrvEnabled ? "yes" : "no"}
                      onChange={(e) => setSelfGrvEnabled(e.target.value === "yes")}
                      options={[
                        { value: "no", label: "Nein" },
                        { value: "yes", label: "Ja" },
                      ]}
                    />
                    {selfGrvEnabled && (
                      <>
                        <Select
                          label="Liegt aktueller Rentenbescheid vor?"
                          value={selfGrvHasNotice}
                          onChange={(e) => setSelfGrvHasNotice(e.target.value as YesNo)}
                          options={[
                            { value: "no", label: "Nein" },
                            { value: "yes", label: "Ja" },
                          ]}
                        />
                        {selfGrvHasNotice === "yes" ? (
                          <>
                            <Select
                              label="Zeitpunkt der Mitteilung"
                              value={selfGrvNoticeTiming}
                              onChange={(e) => setSelfGrvNoticeTiming(e.target.value as "current" | "retirement")}
                              options={[
                                { value: "current", label: "Aktuell" },
                                { value: "retirement", label: "Zur Rente" },
                              ]}
                            />
                            <Input
                              label="Rentenbetrag laut Bescheid"
                              type="number"
                              value={selfGrvNoticeAmount}
                              onChange={(e) => setSelfGrvNoticeAmount(parseFloat(e.target.value) || 0)}
                              suffix="€"
                            />
                          </>
                        ) : (
                          <>
                            <DatePicker
                              label="Berufseintritt"
                              value={jobEntry}
                              onChange={(date) => setJobEntry(date)}
                            />
                            <Input
                              label="Monatliches Bruttoeinkommen"
                              type="number"
                              value={monthlyGross}
                              onChange={(e) => setMonthlyGross(parseFloat(e.target.value) || 0)}
                              suffix="€"
                            />
                            <Select
                              label="Kirchensteuerpflichtig"
                              value={churchTax}
                              onChange={(e) => setChurchTax(e.target.value as YesNo)}
                              options={[
                                { value: "no", label: "Nein" },
                                { value: "yes", label: "Ja" },
                              ]}
                            />
                          </>
                        )}
                      </>
                    )}
                  </div>
                </Accordion>

                <Accordion title="Krankenversicherung im Alter" defaultOpen>
                  <div className="space-y-4 pt-4">
                    <Select
                      label="Art der Krankenversicherung"
                      value={healthType}
                      onChange={(e) => setHealthType(e.target.value as "legal" | "private")}
                      options={[
                        { value: "private", label: "Privat" },
                        { value: "legal", label: "Gesetzlich" },
                      ]}
                    />
                    {healthType === "legal" && (
                      <Select
                        label="KVdR (Krankenversicherung der Rentner)"
                        value={kvdr}
                        onChange={(e) => setKvdr(e.target.value as YesNo)}
                        options={[
                          { value: "yes", label: "Ja" },
                          { value: "no", label: "Nein" },
                        ]}
                      />
                    )}
                    {healthType === "private" && (
                      <Input
                        label="PKV-Beitrag heute"
                        type="number"
                        value={pkvPremium}
                        onChange={(e) => setPkvPremium(parseFloat(e.target.value) || 0)}
                        suffix="€"
                      />
                    )}
                  </div>
                </Accordion>
                </>
              ) : (
                <Accordion title="Angaben zur Person" defaultOpen>
                  <div className="space-y-4 pt-4">
                    <DatePicker
                      label="Geburtsdatum"
                      value={dob}
                      onChange={(date) => setDob(date)}
                    />
                    <DatePicker
                      label="Berufseintritt"
                      value={jobEntry}
                      onChange={(date) => setJobEntry(date)}
                    />
                    <Input
                      label="Monatliches Brutto"
                      type="number"
                      value={monthlyGross}
                      onChange={(e) => setMonthlyGross(parseFloat(e.target.value) || 0)}
                      suffix="€"
                    />
                    <Select
                      label="Kirchensteuer"
                      value={churchTax}
                      onChange={(e) => setChurchTax(e.target.value as YesNo)}
                      options={[
                        { value: "no", label: "Nein" },
                        { value: "yes", label: "Ja" },
                      ]}
                    />
                    <Slider
                      label="Renteneintrittsalter"
                      valueLabel={`${retirementAge} Jahre`}
                      min={55}
                      max={75}
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                    />
                    <Slider
                      label="Lebenserwartung"
                      valueLabel={`${lifeExpectancy} Jahre`}
                      min={70}
                      max={100}
                      value={lifeExpectancy}
                      onChange={(e) => setLifeExpectancy(parseInt(e.target.value))}
                    />
                  </div>
                </Accordion>
              )}

              {mode === "versorgungswerk" ? (
                <Accordion title="Versorgungswerk-Annahmen" defaultOpen>
                  <div className="space-y-4 pt-4">
                    <Select
                      label="Rentenmitteilung vorhanden"
                      value={hasNotice}
                      onChange={(e) => setHasNotice(e.target.value as YesNo)}
                      options={[
                        { value: "no", label: "Nein" },
                        { value: "yes", label: "Ja" },
                      ]}
                    />
                    {hasNotice === "yes" && (
                      <>
                        <Select
                          label="Zeitpunkt der Mitteilung"
                          value={noticeTiming}
                          onChange={(e) => setNoticeTiming(e.target.value as "current" | "retirement")}
                          options={[
                            { value: "current", label: "Aktuell" },
                            { value: "retirement", label: "Bei Renteneintritt" },
                          ]}
                        />
                        <Input
                          label="Rentenbetrag laut Mitteilung"
                          type="number"
                          value={noticeAmount}
                          onChange={(e) => setNoticeAmount(parseFloat(e.target.value) || 0)}
                          suffix="€"
                        />
                      </>
                    )}
                    {hasNotice === "no" && (
                      <div className="hidden">
                        {/* Versteckt im UI, aber im Code vorhanden */}
                        <Slider
                          label="Faktor zur GRV"
                          valueLabel={`${factorToGrv.toFixed(2)} x`}
                          min={0.5}
                          max={2.5}
                          step={0.1}
                          value={factorToGrv}
                          onChange={(e) => setFactorToGrv(parseFloat(e.target.value))}
                        />
                      </div>
                    )}
                    <div className="hidden">
                      <Slider
                        label="Regelaltersgrenze"
                        valueLabel={`${ruleAge} Jahre`}
                        min={60}
                        max={70}
                        value={ruleAge}
                        onChange={(e) => setRuleAge(parseInt(e.target.value))}
                      />
                      <Slider
                        label="Rentensteigerung p.a."
                        valueLabel={`${pensionGrowthPct}% `}
                        min={0}
                        max={4}
                        step={0.5}
                        value={pensionGrowthPct}
                        onChange={(e) => setPensionGrowthPct(parseFloat(e.target.value))}
                      />
                    </div>
                    <Select
                      label="Krankenversicherung im Alter"
                      value={vwHealthType}
                      onChange={(e) => setVwHealthType(e.target.value as "legal" | "private")}
                      options={[
                        { value: "private", label: "Privat" },
                        { value: "legal", label: "Gesetzlich" },
                      ]}
                    />
                    {vwHealthType === "legal" && (
                      <Select
                        label="KVdR (Krankenversicherung der Rentner)"
                        value={kvdr}
                        onChange={(e) => setKvdr(e.target.value as YesNo)}
                        options={[
                          { value: "yes", label: "Ja" },
                          { value: "no", label: "Nein" },
                        ]}
                      />
                    )}
                    {vwHealthType === "private" && (
                      <Input
                        label="PKV-Beitrag heute"
                        type="number"
                        value={vwPkvPremium}
                        onChange={(e) => setVwPkvPremium(parseFloat(e.target.value) || 0)}
                        suffix="€"
                      />
                    )}
                    <div className="hidden">
                      <Slider
                        label="KV-Kostensteigerung p.a."
                        valueLabel={`${healthGrowthPct}% `}
                        min={0}
                        max={8}
                        step={0.5}
                        value={healthGrowthPct}
                        onChange={(e) => setHealthGrowthPct(parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </Accordion>
              ) : mode === "employee" ? (
                <Accordion title="Gesundheits-Annahmen" defaultOpen>
                  <div className="space-y-4 pt-4">
                    <Select
                      label="Krankenversicherung"
                      value={healthType}
                      onChange={(e) => setHealthType(e.target.value as "legal" | "private")}
                      options={[
                        { value: "private", label: "Privat" },
                        { value: "legal", label: "Gesetzlich" },
                      ]}
                    />
                    {healthType === "legal" && (
                      <Select
                        label="KVdR (Krankenversicherung der Rentner)"
                        value={kvdr}
                        onChange={(e) => setKvdr(e.target.value as YesNo)}
                        options={[
                          { value: "yes", label: "Ja" },
                          { value: "no", label: "Nein" },
                        ]}
                      />
                    )}
                    {healthType === "private" && (
                      <Input
                        label="PKV-Beitrag heute"
                        type="number"
                        value={pkvPremium}
                        onChange={(e) => setPkvPremium(parseFloat(e.target.value) || 0)}
                        suffix="€"
                      />
                    )}
                  </div>
                </Accordion>
              ) : null /* selfEmployed: health already in main accordion */}

              <Accordion title="Versorgungsziel" defaultOpen>
                <div className="space-y-4 pt-4">
                  <Input
                    label="Gewünschtes Netto (heute)"
                    type="number"
                    value={targetNetToday}
                    onChange={(e) => setTargetNetToday(parseFloat(e.target.value) || 0)}
                    suffix="€"
                  />
                </div>
              </Accordion>
            </div>

            {/* Column 2: Annahmen + Chart als EINE Karte (breit, locked-kein Scroll) */}
            <div className="lg:h-full lg:overflow-hidden lg:flex lg:flex-col">
              <Card className="!p-4 lg:!p-5 lg:h-full lg:flex lg:flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base lg:text-lg font-bold text-gray-900">Annahmen & Versorgungsziel</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${adjustForPurchasePower
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-blue-700"
                    } `}>
                    {adjustForPurchasePower ? "Kaufkraftbereinigt" : "Nominal"}
                  </span>
                </div>

                {/* Controls/Regler-kompakt, aligned */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-4 pb-4 border-b border-gray-100">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600">Inflation</label>
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{inflationPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={6}
                      step={0.5}
                      value={inflationPct}
                      onChange={(e) => setInflationPct(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600">Rendite Anspar</label>
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{returnSavingPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={12}
                      step={0.5}
                      value={returnSavingPct}
                      onChange={(e) => setReturnSavingPct(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-gray-600">Rendite Entnahme</label>
                      <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{returnTakeoutPct}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={8}
                      step={0.5}
                      value={returnTakeoutPct}
                      onChange={(e) => setReturnTakeoutPct(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                    />
                  </div>
                  <div className="flex items-center justify-start md:justify-center xl:justify-start mt-2 md:mt-0 pt-2 md:pt-0">
                    <Toggle
                      checked={adjustForPurchasePower}
                      onChange={setAdjustForPurchasePower}
                      label="Kaufkraft (inflationsbereinigt)"
                    />
                  </div>
                </div>

                {!isOk ? (
                  <div className="text-center py-8 text-red-500">{result.error}</div>
                ) : (
                  <div className="space-y-3 lg:flex-1 lg:flex lg:flex-col lg:min-h-0">
                    {/* VERTICAL Bar Chart-Balken gehen nach oben, füllen Container maximal */}
                    {/* Kaufkraft AUS (Nominal): 3 Balken | Kaufkraft AN (Real): 2 Balken */}
                    <div className={`flex items-end justify-center h-[300px] lg: h-[280px] xl: h-[320px] lg: flex-1 lg: min-h-0 px-4 lg: px-6 ${adjustForPurchasePower ? 'gap-6 lg:gap-12 xl:gap-16' : 'gap-4 lg:gap-6 xl:gap-10'
                      } `}>

                      {/* Balken 1: Versorgungsziel (heute)-IMMER sichtbar */}
                      <div className="flex flex-col items-center h-full justify-end flex-1 max-w-32 lg:max-w-40 xl:max-w-48">
                        <div
                          className="w-full bg-gradient-to-t from-sky-500 to-sky-400 rounded-t-lg lg:rounded-t-xl shadow-lg flex flex-col items-center justify-center transition-all duration-500 min-h-[50px]"
                          style={{ height: `${Math.max(targetTodayHeight, 20)}% ` }}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-sm lg:text-lg xl:text-xl drop-shadow-md">{formatCurrency(targetToday)}</span>
                            <span className="text-white text-[10px] lg:text-xs xl:text-sm font-medium opacity-90 leading-tight text-center mt-1">Versorgungsziel</span>
                          </div>
                        </div>
                      </div>

                      {/* Balken 2: Ziel mit Inflation-NUR bei Kaufkraft AUS (Nominal) */}
                      {!adjustForPurchasePower && (
                        <div className="flex flex-col items-center h-full justify-end flex-1 max-w-32 lg:max-w-40 xl:max-w-48">
                          <div
                            className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-t-lg lg:rounded-t-xl shadow-lg flex flex-col items-center justify-center transition-all duration-500 min-h-[50px]"
                            style={{ height: `${Math.max(targetRetirementHeight, 20)}% ` }}
                          >
                            <div className="flex flex-col items-center px-1 text-center">
                              <span className="text-white font-bold text-sm lg:text-lg xl:text-xl drop-shadow-md">{formatCurrency(targetAtRetirement)}</span>
                              <span className="text-white text-[10px] lg:text-xs xl:text-sm font-medium opacity-90 leading-tight mt-1">Versorgungsziel mit Inflation</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Balken 3 (oder 2 bei Kaufkraft AN): Deckung (Stacked) */}
                      <div className="flex flex-col items-center h-full justify-end flex-1 max-w-32 lg:max-w-40 xl:max-w-48">
                        <div
                          className="w-full rounded-t-lg lg:rounded-t-xl shadow-lg overflow-hidden flex flex-col-reverse transition-all duration-500 min-h-[50px]"
                          style={{ height: `${Math.max(adjustForPurchasePower ? targetTodayHeight : targetRetirementHeight, 20)}% ` }}
                        >
                          {/* Bottom: Versorgungswerk (blue) */}
                          {pensionPct > 0 && (
                            <div
                              className="w-full bg-gradient-to-t from-blue-600 to-blue-500 flex items-center justify-center transition-all duration-500 relative overflow-hidden"
                              style={{ height: `${pensionPct}% `, minHeight: pensionPct > 3 ? '28px' : '0' }}
                            >
                              {pensionPct > 8 && (
                                <div className="text-white text-[9px] lg:text-xs xl:text-sm font-bold text-center px-1 leading-tight">
                                  <div className="whitespace-nowrap">{formatCurrency(pensionNet)}</div>
                                  <div className="opacity-90 font-medium text-[8px] lg:text-[10px] whitespace-normal leading-tight mt-0.5">{mode === 'versorgungswerk' ? 'Versorgungswerk Netto' : mode === 'employee' ? 'Gesetzliche Rente Netto' : selfGrvEnabled ? 'Gesetzliche Rente Netto' : 'Rente Netto'}</div>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Middle: Private Vorsorge (green) */}
                          {privatePct > 0 && (
                            <div
                              className="w-full bg-gradient-to-t from-emerald-600 to-emerald-500 flex items-center justify-center transition-all duration-500 relative overflow-hidden"
                              style={{ height: `${privatePct}% `, minHeight: privatePct > 3 ? '28px' : '0' }}
                            >
                              {privatePct > 8 && (
                                <div className="text-white text-[9px] lg:text-xs xl:text-sm font-bold text-center px-1 leading-tight">
                                  <div className="whitespace-nowrap">{formatCurrency(privatePayout)}</div>
                                  <div className="opacity-90 font-medium text-[8px] lg:text-[10px] mt-0.5">Rente</div>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Top: Lücke (red) */}
                          {gapPct > 0 && (
                            <div
                              className="w-full bg-gradient-to-t from-red-500 to-red-400 flex items-center justify-center transition-all duration-500 relative overflow-hidden"
                              style={{ height: `${gapPct}% `, minHeight: gapPct > 3 ? '28px' : '0' }}
                            >
                              {gapPct > 8 && (
                                <div className="text-white text-[9px] lg:text-xs xl:text-sm font-bold text-center px-1 leading-tight">
                                  <div className="whitespace-nowrap">{formatCurrency(gap)}</div>
                                  <div className="opacity-90 font-medium text-[8px] lg:text-[10px] mt-0.5">Versorgungslücke</div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Neuer zentrierter Gesamtrente-Indikator, angelehnt an Capital Flow */}
                    <div className="flex justify-center mt-4">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-gray-700 text-sm lg:text-base">Gesamtrente</span>
                        <div className="border border-green-200 bg-green-50 text-emerald-600 font-bold px-3 py-1 lg:px-4 lg:py-1.5 rounded text-sm lg:text-base">
                          {formatCurrency(pensionNet + privatePayout)}
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </Card>
            </div>

            {/* Column 3: Results & Investment (eigenes Scrolling) */}
            <div className="space-y-3 lg:h-full lg:overflow-y-auto lg:pl-2 lg:scrollbar-thin" style={{ scrollbarGutter: 'stable' }}>
              {/* Benötigtes Kapital */}
              <Card>
                <div className="text-center py-2">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#059669] to-[#10b981] flex items-center justify-center text-white mx-auto mb-3 shadow-lg">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 mb-1">Benötigtes Kapital</p>
                  <p className="text-3xl font-bold text-[#059669]">
                    {data ? formatCurrency(data.requiredCapital) : "—"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">um die Lücke zu schließen</p>
                </div>
              </Card>

              {/* Notwendige Sparrate */}
              <Card title="Notwendige Sparrate">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                    <p className="text-sm text-gray-500 mb-1">Ab heute</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {data && isFinite(data.requiredSavingNow) ? formatCurrency(data.requiredSavingNow) : "∞"}
                    </p>
                    <p className="text-xs text-gray-400">pro Monat</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">In 4 Jahren</p>
                      <p className="text-lg font-bold text-orange-600">
                        {data && isFinite(data.requiredIn4) ? formatCurrency(data.requiredIn4) : "∞"}
                      </p>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-xl">
                      <p className="text-xs text-gray-500 mb-1">In 8 Jahren</p>
                      <p className="text-lg font-bold text-red-600">
                        {data && isFinite(data.requiredIn8) ? formatCurrency(data.requiredIn8) : "∞"}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Investitionswunsch mit Gauge */}
              <Card title="Investitionswunsch">
                <div className="space-y-4">
                  <Input
                    label="Monatliche Sparrate"
                    type="number"
                    value={desiredSaving}
                    onChange={(e) => setDesiredSaving(parseFloat(e.target.value) || 0)}
                    suffix="€"
                  />
                  <Input
                    label="Einmalanlage"
                    type="number"
                    value={initialLumpSum}
                    onChange={(e) => setInitialLumpSum(parseFloat(e.target.value) || 0)}
                    suffix="€"
                  />

                  {/* Half-Circle Gauge */}
                  <div className="pt-4">
                    <p className="text-sm font-medium text-gray-600 text-center mb-3">Abdeckung des Gesamtziels</p>
                    <div className="relative w-48 h-28 mx-auto">
                      <svg viewBox="0 0 120 70" className="w-full h-full">
                        {/* Background arc */}
                        <path
                          d="M 10 60 A 50 50 0 0 1 110 60"
                          fill="none"
                          stroke="#e5e7eb"
                          strokeWidth="12"
                          strokeLinecap="round"
                        />
                        {/* Gradient definition */}
                        <defs>
                          <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ef4444" />
                            <stop offset="50%" stopColor="#f59e0b" />
                            <stop offset="100%" stopColor="#10b981" />
                          </linearGradient>
                        </defs>
                        {/* Progress arc */}
                        <path
                          d="M 10 60 A 50 50 0 0 1 110 60"
                          fill="none"
                          stroke="url(#gaugeGradient)"
                          strokeWidth="12"
                          strokeLinecap="round"
                          strokeDasharray={`${Math.min(coveragePct, 100) * 1.57} 157`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-end pb-0">
                        <span className={`text-3xl font-bold ${coveragePct >= 100 ? "text-[#059669]" : coveragePct >= 50 ? "text-amber-500" : "text-red-500"
                          } `}>
                          {Math.round(coveragePct)}%
                        </span>
                        <span className="text-xs text-gray-400">erreicht</span>
                      </div>
                    </div>
                  </div>

                  {/* Capital & Interest Tables */}
                  <div className="pt-4 border-t border-gray-100 space-y-4">
                    {/* Kapitalentwicklung */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">Kapitalentwicklung</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">Heute</p>
                          <p className="text-sm font-bold text-emerald-600">{formatCurrency(capitalNow)}</p>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">In 4 J.</p>
                          <p className="text-sm font-bold text-orange-600">{formatCurrency(capitalIn4)}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">In 8 J.</p>
                          <p className="text-sm font-bold text-red-600">{formatCurrency(capitalIn8)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Zinsgewinn */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700">Zinsgewinn</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="text-center p-2 bg-emerald-50 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">Heute</p>
                          <p className="text-sm font-bold text-emerald-600">{formatCurrency(interestNow)}</p>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">In 4 J.</p>
                          <p className="text-sm font-bold text-orange-600">{formatCurrency(interestIn4)}</p>
                        </div>
                        <div className="text-center p-2 bg-red-50 rounded-lg">
                          <p className="text-[10px] text-gray-500 uppercase">In 8 J.</p>
                          <p className="text-sm font-bold text-red-600">{formatCurrency(interestIn8)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="pt-4">
                <Button
                  variant="primary"
                  className="w-full justify-center py-3"
                  onClick={() => setShowPdfModal(true)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Deine Rentenanalyse erhalten
                </Button>
              </div>

              {/* ============ VIDEO & CTA SECTION ============ */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center mt-6">
                <h3 className="text-2xl lg:text-lg font-bold text-[#0f172a] mb-4">Erfahre mehr im Video</h3>
                <div className="w-full aspect-[9/16] rounded-xl overflow-hidden shadow-inner border-2 border-gray-100">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                    src="/video-rente.mp4#t=0.001"
                  />
                </div>
                <div className="mt-6">
                  <a href="https://outlook.office.com/bookwithme/user/359c7d5667e74b6b97800e6f681c3a29%40horbach.de/meetingtype/GUOy31G5NEWyOmoXzR4T8g2?anonymous&ismsaljsauthenabled=true" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white text-sm font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-700">
                    Jetzt Beratung anfragen
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>

      <PdfRequestModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onGenerate={handlePdfGenerate}
        title="Rentenanalyse laden"
      />
    </>
  );
}
