import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  simulateDepotVsPolice,
  type YesNo,
  type PartialExemptionKind,
} from "@/lib/depotPoliceCalculator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Calendar, ChevronLeft, ChevronRight, TrendingUp, Shield, Wallet, ArrowRightLeft, Info, ChevronDown, ChevronUp, ArrowUp, FileText } from "lucide-react";
import { PdfRequestModal, PdfRequestData } from "@/components/ui/PdfRequestModal";
import { generateSimplePdf } from "@/lib/pdfGenerator";

const formatCurrency = (n: number | undefined) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

const formatDate = (date: Date): string => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const parseDate = (str: string): Date | null => {
  // Parse DD.MM.YYYY or YYYY-MM-DD
  if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
        return new Date(year, month, day);
      }
    }
  } else if (str.includes('-')) {
    const date = new Date(str);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
};

// Custom DatePicker Component
// Custom DatePicker Component
function CustomDatePicker({
  value,
  onChange,
  label
}: {
  value: Date;
  onChange: (date: Date) => void;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(formatDate(value));
  const [viewDate, setViewDate] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  // Portal positioning state
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    setInputValue(formatDate(value));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });
      }
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }

      const portal = document.getElementById(`datepicker-portal-${label.replace(/\s+/g, '-').toLowerCase()}`);
      if (portal && portal.contains(e.target as Node)) {
        return;
      }

      setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [label]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    const parsed = parseDate(val);
    if (parsed) {
      onChange(parsed);
      setViewDate(parsed);
    }
  };

  const handleInputBlur = () => {
    const parsed = parseDate(inputValue);
    if (parsed) {
      onChange(parsed);
    } else {
      setInputValue(formatDate(value));
    }
  };

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const selectDate = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    onChange(newDate);
    setInputValue(formatDate(newDate));
    setIsOpen(false);
  };

  const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const years = Array.from({ length: 80 }, (_, i) => 1950 + i);

  const portalId = `datepicker-portal-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          placeholder="TT.MM.JJJJ"
          className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#059669]/20 focus:border-[#059669] transition-all"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-[#059669] transition-colors"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>

      {isOpen && position && createPortal(
        <div
          id={portalId}
          className="absolute z-[9999] mt-1 bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-[280px]"
          style={{
            top: position.top,
            left: position.left,
            width: Math.max(280, position.width),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex gap-1">
              <select
                value={viewDate.getMonth()}
                onChange={(e) => setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1))}
                className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                {months.map((m, i) => (
                  <option key={m} value={i}>{m}</option>
                ))}
              </select>
              <select
                value={viewDate.getFullYear()}
                onChange={(e) => setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1))}
                className="text-sm font-medium bg-transparent border-none focus:ring-0 cursor-pointer"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = value.getDate() === day &&
                value.getMonth() === viewDate.getMonth() &&
                value.getFullYear() === viewDate.getFullYear();

              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
                    ${isSelected
                      ? 'bg-[#059669] text-white font-medium shadow-md shadow-[#059669]/20'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export function DepotPolicePage() {
  // Disable body scroll on desktop
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
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    };
  }, []);

  // Person
  const [dob, setDob] = useState(new Date(1985, 5, 15));
  const [retirementAge, setRetirementAge] = useState(67);

  // Investment
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [initialCapital, setInitialCapital] = useState(10000);
  const [contributionGrowthPct, setContributionGrowthPct] = useState(0);

  // Returns & Tax
  const [annualReturnPct, setAnnualReturnPct] = useState(7.5);
  const [abgeltungTaxPct, setAbgeltungTaxPct] = useState(26.375);
  const [basiszinsPct, setBasiszinsPct] = useState(2.55);
  const [allowanceEUR, setAllowanceEUR] = useState(1000);
  const [partialExemptionKind, setPartialExemptionKind] = useState<PartialExemptionKind>("equity");

  // Switch Simulation
  const [switchSimulation, setSwitchSimulation] = useState<YesNo>("yes");
  const [switchEveryYears, setSwitchEveryYears] = useState(7);

  // Depot Costs
  const [depotEffectiveCostPct, setDepotEffectiveCostPct] = useState(1.8);
  const [depotSwitchSellPct, setDepotSwitchSellPct] = useState(0.5);
  const [depotSwitchBuyPct, setDepotSwitchBuyPct] = useState(0.5);

  // Policy Costs
  const [policyAcqPeriodYears, setPolicyAcqPeriodYears] = useState(5);
  const [policyAcqCostPct, setPolicyAcqCostPct] = useState(2.5);
  const [policyAdminCostType, setPolicyAdminCostType] = useState<"falling" | "constant">("falling");
  const [policyAdminFirstYearPct, setPolicyAdminFirstYearPct] = useState(13.44);
  const [policyAdminLastYearPct, setPolicyAdminLastYearPct] = useState(5.33);
  const [policyAssetBasedAdminPct, setPolicyAssetBasedAdminPct] = useState(0.2);
  const [policyPieceCostEUR, setPolicyPieceCostEUR] = useState(3);
  const [policyOneTimeCostPct, setPolicyOneTimeCostPct] = useState(0);
  const [policyContractStartOneTimeEUR, setPolicyContractStartOneTimeEUR] = useState(0);

  // Modals
  const [showDepotModal, setShowDepotModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPdfRequestModal, setShowPdfRequestModal] = useState(false);

  // UI Toggles
  const [showInvestmentDetails, setShowInvestmentDetails] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);

  // Health (placeholder)
  const [healthType, setHealthType] = useState<"legal" | "private">("private");

  const result = useMemo(() => {
    const today = new Date();
    return simulateDepotVsPolice({
      dob,
      today,
      retirementAge,
      monthlyContribution,
      initialCapital,
      contributionGrowthPct,
      annualReturnPct,
      abgeltungTaxPct,
      basiszinsPct,
      allowanceEUR,
      partialExemptionKind,
      switchSimulation,
      switchEveryYears,
      depotCosts: {
        effectiveCostPct: depotEffectiveCostPct,
        switchSellPct: depotSwitchSellPct,
        switchBuyPct: depotSwitchBuyPct,
      },
      policyCosts: {
        acquisitionPeriodYears: policyAcqPeriodYears,
        acquisitionCostPct: policyAcqCostPct,
        adminCostType: policyAdminCostType,
        adminCostFirstYearPct: policyAdminFirstYearPct,
        adminCostLastYearPct: policyAdminLastYearPct,
        assetBasedAdminPct: policyAssetBasedAdminPct,
        pieceCostEUR: policyPieceCostEUR,
        oneTimePaymentCostPct: policyOneTimeCostPct,
        contractStartOneTimeEUR: policyContractStartOneTimeEUR,
      },
    });
  }, [
    dob, retirementAge, monthlyContribution, initialCapital, contributionGrowthPct,
    annualReturnPct, abgeltungTaxPct, basiszinsPct, allowanceEUR, partialExemptionKind,
    switchSimulation, switchEveryYears, depotEffectiveCostPct, depotSwitchSellPct, depotSwitchBuyPct,
    policyAcqPeriodYears, policyAcqCostPct, policyAdminCostType, policyAdminFirstYearPct,
    policyAdminLastYearPct, policyAssetBasedAdminPct, policyPieceCostEUR, policyOneTimeCostPct,
    policyContractStartOneTimeEUR,
  ]);

  const handlePdfGenerate = (reqData: PdfRequestData) => {
    const calcData = result ? {
      "Endkapital Depot (Prognose)": formatCurrency(result.finalDepot),
      "Endkapital Police (Prognose)": formatCurrency(result.finalPolicy),
      "Vorteil": formatCurrency(Math.abs(result.deltaPolicyVsDepot)),
      "Jahre bis Rente": `${result.yearsToRetirement} Jahre`,
    } : undefined;
    generateSimplePdf(reqData, "Depot vs Police", calcData);
  };

  // Calculate effective tax rate with church tax
  const effectiveTaxRate = abgeltungTaxPct;

  return (
    <Layout title="Depot vs Police" subtitle="Anlageformen vergleichen">
      {/* Main Container - Fixed Height on Desktop */}
      <div className="lg:h-[calc(100vh-80px)] lg:overflow-hidden">
        {/* Content Area */}
        <div className="h-full lg:flex lg:gap-4 p-4 lg:p-6 max-w-[1800px] mx-auto">

          {/* Left Column - Scrollable */}
          <div className="lg:w-[320px] xl:w-[360px] lg:flex-shrink-0 lg:h-full flex flex-col mb-6 lg:mb-0 bg-white">
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 depot-scroll pb-4">
              <Accordion title="Angaben zur Person" defaultOpen>
                <div className="space-y-4 pt-3">
                  <CustomDatePicker
                    label="Geburtsdatum"
                    value={dob}
                    onChange={setDob}
                  />
                  <Slider
                    label="Renteneintrittsalter"
                    valueLabel={`${retirementAge} Jahre`}
                    min={55}
                    max={75}
                    value={retirementAge}
                    onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                  />
                  <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                    <span className="text-gray-500">Aktuelles Alter</span>
                    <span className="font-semibold text-gray-900">{result.currentAge} Jahre</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-[#059669]/5 rounded-lg text-xs">
                    <span className="text-gray-500">Jahre bis Rente</span>
                    <span className="font-semibold text-[#059669]">{result.yearsToRetirement} Jahre</span>
                  </div>
                </div>
              </Accordion>

              <Accordion title="Annahmen zur Steuer" defaultOpen>
                <div className="space-y-4 pt-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700">Teilfreistellung</label>
                    <div className="flex rounded-xl border border-gray-200 p-1 bg-gray-50/50">
                      <button
                        onClick={() => setPartialExemptionKind("equity")}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${partialExemptionKind === "equity"
                          ? "bg-white text-[#059669] shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        &gt;50% Aktien
                      </button>
                      <button
                        onClick={() => setPartialExemptionKind("mixed")}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${partialExemptionKind === "mixed"
                          ? "bg-white text-[#059669] shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        &lt;50% Aktien
                      </button>
                      <button
                        onClick={() => setPartialExemptionKind("realestate")}
                        className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${partialExemptionKind === "realestate"
                          ? "bg-white text-[#059669] shadow-sm border border-gray-100"
                          : "text-gray-500 hover:text-gray-700"
                          }`}
                      >
                        Immobilien
                      </button>
                    </div>
                    <div className="flex justify-between px-1">
                      <span className="text-[10px] text-gray-400">Sich ergebende Teilfreistellung</span>
                      <span className="text-[10px] font-bold text-gray-700">
                        {partialExemptionKind === "equity" ? "30%" : partialExemptionKind === "mixed" ? "15%" : "60%"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowTaxDetails(!showTaxDetails)}
                    className="flex items-center gap-2 text-xs font-medium text-[#059669] hover:underline"
                  >
                    {showTaxDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Detailansicht {showTaxDetails ? "schließen" : "öffnen"}
                  </button>

                  {showTaxDetails && (
                    <div className="space-y-4 pl-2 border-l-2 border-[#059669]/10 animate-in slide-in-from-top-2 fade-in duration-200">
                      <Slider
                        label="Abgeltungssteuer"
                        valueLabel={`${abgeltungTaxPct.toFixed(2)}%`}
                        min={0}
                        max={30}
                        step={0.125}
                        value={abgeltungTaxPct}
                        onChange={(e) => setAbgeltungTaxPct(parseFloat(e.target.value))}
                      />
                      <Slider
                        label="Basiszins"
                        valueLabel={`${basiszinsPct}%`}
                        min={0}
                        max={5}
                        step={0.05}
                        value={basiszinsPct}
                        onChange={(e) => setBasiszinsPct(parseFloat(e.target.value))}
                      />
                      <Input
                        label="Freibetrag"
                        type="number"
                        value={allowanceEUR}
                        onChange={(e) => setAllowanceEUR(parseFloat(e.target.value) || 0)}
                        suffix="€"
                      />
                    </div>
                  )}
                </div>
              </Accordion>

              <Accordion title="Angaben zur Krankenversicherung">
                <div className="space-y-4 pt-3">
                  <Select
                    label="Krankenversicherung"
                    value={healthType}
                    onChange={(e) => setHealthType(e.target.value as "legal" | "private")}
                    options={[
                      { value: "private", label: "Privat" },
                      { value: "legal", label: "Gesetzlich" },
                    ]}
                  />
                  <p className="text-xs text-gray-500 bg-amber-50 p-2 rounded-lg">
                    <Info className="w-3 h-3 inline mr-1" />
                    KV-Beiträge werden in dieser Simulation nicht berücksichtigt.
                  </p>
                </div>
              </Accordion>

              <Accordion title="Investitionswunsch" defaultOpen>
                <div className="space-y-4 pt-3">
                  <Input
                    label="Monatliche Sparrate"
                    type="number"
                    value={monthlyContribution}
                    onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
                    suffix="€"
                  />
                  <Input
                    label="Einmalanlage"
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(parseFloat(e.target.value) || 0)}
                    suffix="€"
                  />

                  <button
                    onClick={() => setShowInvestmentDetails(!showInvestmentDetails)}
                    className="flex items-center gap-2 text-xs font-medium text-[#059669] hover:underline"
                  >
                    {showInvestmentDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    Detailansicht {showInvestmentDetails ? "schließen" : "öffnen"}
                  </button>

                  {showInvestmentDetails && (
                    <div className="pl-2 border-l-2 border-[#059669]/10 animate-in slide-in-from-top-2 fade-in duration-200">
                      <Slider
                        label="Beitragsdynamik"
                        valueLabel={`${contributionGrowthPct}%`}
                        min={0}
                        max={10}
                        step={0.5}
                        value={contributionGrowthPct}
                        onChange={(e) => setContributionGrowthPct(parseFloat(e.target.value))}
                      />
                    </div>
                  )}
                </div>
              </Accordion>
            </div>

            <div className="pt-2 pb-2 border-t border-gray-100 flex-shrink-0 bg-white">
              <Button
                variant="primary"
                className="w-full justify-center py-3"
                onClick={() => setShowPdfRequestModal(true)}
              >
                <FileText className="w-4 h-4 mr-2" />
                PDF erstellen
              </Button>
            </div>
          </div>

          {/* Middle Column - Locked/Static */}
          <div className="lg:flex-1 lg:min-w-0 lg:h-full lg:overflow-hidden lg:flex lg:flex-col mb-6 lg:mb-0">
            <Card className="lg:h-full lg:flex lg:flex-col">
              {/* Compact Controls Row */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-[#059669]" />
                    Wertentwicklung
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Rendite p.a.</span>
                    <span className="px-2 py-1 bg-[#059669]/10 text-[#059669] text-sm font-bold rounded-lg">
                      {annualReturnPct}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={0}
                    max={12}
                    step={0.5}
                    value={annualReturnPct}
                    onChange={(e) => setAnnualReturnPct(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#059669]"
                  />
                  <div className="flex gap-1 text-xs text-gray-400">
                    <span>0%</span>
                    <span>—</span>
                    <span>12%</span>
                  </div>
                </div>
              </div>

              {/* Chart - Takes remaining space */}
              <div className="flex-1 min-h-0 p-4">
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.points} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="year"
                        tick={{ fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        label={{ value: 'Jahre', position: 'insideBottomRight', offset: -5, fontSize: 11, fill: '#9ca3af' }}
                      />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k€`}
                        tickLine={{ stroke: '#e5e7eb' }}
                        axisLine={{ stroke: '#e5e7eb' }}
                        width={55}
                      />
                      <Tooltip
                        formatter={(value) => [formatCurrency(typeof value === 'number' ? value : 0), '']}
                        labelFormatter={(label) => `Jahr ${label}`}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e5e7eb",
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          padding: '8px 12px'
                        }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={36}
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => <span className="text-sm text-gray-600">{value}</span>}
                      />
                      {result.policyAheadSinceYear && (
                        <ReferenceLine
                          x={result.policyAheadSinceYear}
                          stroke="#059669"
                          strokeDasharray="5 5"
                          label={{
                            value: `Police überholt`,
                            position: 'top',
                            fontSize: 10,
                            fill: '#059669'
                          }}
                        />
                      )}
                      <Line
                        type="monotone"
                        dataKey="depot"
                        stroke="#2563eb"
                        strokeWidth={3}
                        dot={false}
                        name="Depot"
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="policy"
                        stroke="#059669"
                        strokeWidth={3}
                        dot={false}
                        name="Police"
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="payment"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        dot={false}
                        strokeDasharray="5 5"
                        name="Einzahlung"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Results Row */}
              {/* Results List View - Redesigned */}
              <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Results List */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    {/* Police Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#059669]" />
                        <span className="text-sm font-medium text-gray-700">Police</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-gray-900">{formatCurrency(result.finalPolicy)}</span>
                        {/* Diff if Police > Depot */}
                        {result.deltaPolicyVsDepot >= 0 ? (
                          <div className="flex items-center text-xs font-bold text-[#059669] bg-[#059669]/10 px-1.5 py-0.5 rounded">
                            <ArrowUp className="w-3 h-3 mr-0.5" />
                            {formatCurrency(result.deltaPolicyVsDepot)}
                          </div>
                        ) : (
                          <div className="w-[80px]" /> // Spacer
                        )}
                      </div>
                    </div>

                    {/* Depot Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[#2563eb]" />
                        <span className="text-sm font-medium text-gray-700">Depot</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-base font-bold text-gray-900">{formatCurrency(result.finalDepot)}</span>
                        {/* Diff if Depot > Police */}
                        {result.deltaPolicyVsDepot < 0 ? (
                          <div className="flex items-center text-xs font-bold text-[#059669] bg-[#059669]/10 px-1.5 py-0.5 rounded">
                            <ArrowUp className="w-3 h-3 mr-0.5" />
                            {formatCurrency(Math.abs(result.deltaPolicyVsDepot))}
                          </div>
                        ) : (
                          <div className="w-[80px]" /> // Spacer
                        )}
                      </div>
                    </div>

                    {/* Einzahlung Row */}
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                        <span className="text-sm font-medium text-gray-500">Einzahlung</span>
                      </div>
                      <span className="text-sm font-medium text-gray-500 mr-[92px]">{formatCurrency(result.finalPayment)}</span>
                    </div>
                  </div>

                  {/* Info / Highlight */}
                  <div className="flex flex-col justify-center p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                    <p className="text-xs text-gray-500 mb-2 text-center">Vorteil nach Kosten & Steuern</p>
                    <div className="text-center">
                      {result.deltaPolicyVsDepot >= 0 ? (
                        <>
                          <p className="text-2xl font-bold text-[#059669]">Police gewinnt</p>
                          <p className="text-sm text-[#059669]/80 mt-1">+{formatCurrency(result.deltaPolicyVsDepot)} mehr Kapital</p>
                        </>
                      ) : (
                        <>
                          <p className="text-2xl font-bold text-[#2563eb]">Depot gewinnt</p>
                          <p className="text-sm text-[#2563eb]/80 mt-1">+{formatCurrency(Math.abs(result.deltaPolicyVsDepot))} mehr Kapital</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Scrollable */}
          <div className="lg:w-[320px] xl:w-[360px] lg:flex-shrink-0 lg:h-full lg:overflow-y-auto lg:pl-2 space-y-4 depot-scroll">
            {/* Besteuerungsart Card - Enhanced */}
            <Card className="overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#059669]" />
                  Besteuerungsart
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Effective Tax Rate Display */}
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Abgeltungssteuer</span>
                    <span className="text-lg font-bold text-[#2563eb]">{effectiveTaxRate.toFixed(2)}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    inkl. Soli (5,5%) {abgeltungTaxPct > 26 ? '+ Kirchensteuer' : ''}
                  </p>
                </div>

                {/* Comparison */}
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50/50 rounded-lg border-l-4 border-[#2563eb]">
                    <h4 className="font-semibold text-[#2563eb] text-sm mb-2 flex items-center gap-2">
                      <Wallet className="w-4 h-4" />
                      Depot
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Vorabpauschale jährlich versteuern</li>
                      <li>• Abgeltungssteuer auf alle Gewinne</li>
                      <li>• Teilfreistellung: {partialExemptionKind === 'equity' ? '30%' : partialExemptionKind === 'mixed' ? '15%' : '60%'}</li>
                      <li>• Fondswechsel = steuerpflichtig</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-green-50/50 rounded-lg border-l-4 border-[#059669]">
                    <h4 className="font-semibold text-[#059669] text-sm mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Police
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Steuerstundung während Laufzeit</li>
                      <li>• Halbeinkünfteverfahren ab 62 J.</li>
                      <li>• Nach 12 Jahren nur 50% versteuern</li>
                      <li>• Fondswechsel = steuerneutral</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>

            {/* Fondswechsel Card */}
            <Card>
              <div className="p-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4 text-[#059669]" />
                  Fondswechsel simulieren
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <Toggle
                  checked={switchSimulation === "yes"}
                  onChange={(v) => setSwitchSimulation(v ? "yes" : "no")}
                  label="Fondswechsel aktivieren"
                />
                {switchSimulation === "yes" && (
                  <Slider
                    label="Wechsel alle X Jahre"
                    valueLabel={`${switchEveryYears} Jahre`}
                    min={1}
                    max={20}
                    value={switchEveryYears}
                    onChange={(e) => setSwitchEveryYears(parseInt(e.target.value))}
                  />
                )}
                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Hinweis:</strong> Bei Fondswechsel im Depot fallen Steuern auf realisierte Gewinne an. In der Police ist ein Wechsel steuerneutral.
                  </p>
                </div>
              </div>
            </Card>

            {/* Cost Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowDepotModal(true)}
                className="flex items-center justify-center gap-2 py-3"
              >
                <Wallet className="w-4 h-4" />
                Depot Kosten
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowPolicyModal(true)}
                className="flex items-center justify-center gap-2 py-3"
              >
                <Shield className="w-4 h-4" />
                Police Kosten
              </Button>
            </div>

            {/* Quick Info */}
            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Zusammenfassung</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Anlagezeitraum</span>
                  <span className="font-medium">{result.yearsToRetirement} Jahre</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Monatliche Rate</span>
                  <span className="font-medium">{formatCurrency(monthlyContribution)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Startkapital</span>
                  <span className="font-medium">{formatCurrency(initialCapital)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Erwartete Rendite</span>
                  <span className="font-medium">{annualReturnPct}% p.a.</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Gewinn Depot</span>
                  <span className="font-medium text-[#2563eb]">{formatCurrency(result.finalDepot - result.finalPayment)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Gewinn Police</span>
                  <span className="font-medium text-[#059669]">{formatCurrency(result.finalPolicy - result.finalPayment)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

      <PdfRequestModal
        isOpen={showPdfRequestModal}
        onClose={() => setShowPdfRequestModal(false)}
        onGenerate={(data) => generateSimplePdf(data, "Depot vs Police")}
        title="Vergleich laden"
      />

      {/* Depot Costs Modal */}
      <Modal
        isOpen={showDepotModal}
        onClose={() => setShowDepotModal(false)}
        title="Depot Effektivkosten"
      >
        <div className="space-y-4">
          <Slider
            label="Effektivkosten p.a."
            valueLabel={`${depotEffectiveCostPct}%`}
            min={0}
            max={2}
            step={0.05}
            value={depotEffectiveCostPct}
            onChange={(e) => setDepotEffectiveCostPct(parseFloat(e.target.value))}
          />
          <Slider
            label="Verkaufskosten bei Fondswechsel"
            valueLabel={`${depotSwitchSellPct}%`}
            min={0}
            max={5}
            step={0.1}
            value={depotSwitchSellPct}
            onChange={(e) => setDepotSwitchSellPct(parseFloat(e.target.value))}
          />
          <Slider
            label="Kaufkosten bei Fondswechsel"
            valueLabel={`${depotSwitchBuyPct}%`}
            min={0}
            max={5}
            step={0.1}
            value={depotSwitchBuyPct}
            onChange={(e) => setDepotSwitchBuyPct(parseFloat(e.target.value))}
          />
          <Button className="w-full mt-4" onClick={() => setShowDepotModal(false)}>
            Schließen
          </Button>
        </div>
      </Modal>

      {/* Policy Costs Modal */}
      <Modal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        title="Police Kostenstruktur"
      >
        <div className="space-y-4">
          <Input
            label="Abschlusskosten-Zeitraum (Jahre)"
            type="number"
            value={policyAcqPeriodYears}
            onChange={(e) => setPolicyAcqPeriodYears(parseInt(e.target.value) || 1)}
          />
          <Slider
            label="Abschlusskosten"
            valueLabel={`${policyAcqCostPct}%`}
            min={0}
            max={10}
            step={0.5}
            value={policyAcqCostPct}
            onChange={(e) => setPolicyAcqCostPct(parseFloat(e.target.value))}
          />
          <Select
            label="Verwaltungskosten-Typ"
            value={policyAdminCostType}
            onChange={(e) => setPolicyAdminCostType(e.target.value as "falling" | "constant")}
            options={[
              { value: "falling", label: "Fallend" },
              { value: "constant", label: "Konstant" },
            ]}
          />
          {policyAdminCostType === "falling" && (
            <>
              <Slider
                label="Verwaltungskosten 1. Jahr"
                valueLabel={`${policyAdminFirstYearPct}%`}
                min={0}
                max={10}
                step={0.5}
                value={policyAdminFirstYearPct}
                onChange={(e) => setPolicyAdminFirstYearPct(parseFloat(e.target.value))}
              />
              <Slider
                label="Verwaltungskosten letztes Jahr"
                valueLabel={`${policyAdminLastYearPct}%`}
                min={0}
                max={5}
                step={0.25}
                value={policyAdminLastYearPct}
                onChange={(e) => setPolicyAdminLastYearPct(parseFloat(e.target.value))}
              />
            </>
          )}
          {policyAdminCostType === "constant" && (
            <Slider
              label="Verwaltungskosten p.a."
              valueLabel={`${policyAdminLastYearPct}%`}
              min={0}
              max={5}
              step={0.25}
              value={policyAdminLastYearPct}
              onChange={(e) => setPolicyAdminLastYearPct(parseFloat(e.target.value))}
            />
          )}
          <Slider
            label="Fondskosten"
            valueLabel={`${policyAssetBasedAdminPct}%`}
            min={0}
            max={2}
            step={0.1}
            value={policyAssetBasedAdminPct}
            onChange={(e) => setPolicyAssetBasedAdminPct(parseFloat(e.target.value))}
          />
          <Input
            label="Stückkosten pro Monat"
            type="number"
            value={policyPieceCostEUR}
            onChange={(e) => setPolicyPieceCostEUR(parseFloat(e.target.value) || 0)}
            suffix="€"
          />
          <Slider
            label="Einmalzahlung-Kosten"
            valueLabel={`${policyOneTimeCostPct}%`}
            min={0}
            max={10}
            step={0.5}
            value={policyOneTimeCostPct}
            onChange={(e) => setPolicyOneTimeCostPct(parseFloat(e.target.value))}
          />
          <Input
            label="Einmalige Vertragskosten"
            type="number"
            value={policyContractStartOneTimeEUR}
            onChange={(e) => setPolicyContractStartOneTimeEUR(parseFloat(e.target.value) || 0)}
            suffix="€"
          />
          <Button className="w-full mt-4" onClick={() => setShowPolicyModal(false)}>
            Schließen
          </Button>
        </div>
      </Modal>

      <style>{`
        .depot-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .depot-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .depot-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .depot-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </Layout >
  );
}
