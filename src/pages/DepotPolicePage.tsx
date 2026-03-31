import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Accordion } from "@/components/ui/Accordion";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { DatePicker } from "@/components/ui/DatePicker";
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
import { TrendingUp, Shield, Wallet, ArrowRightLeft, ChevronDown, ChevronUp, ArrowUp, FileText } from "lucide-react";
import { PdfRequestModal, PdfRequestData } from "@/components/ui/PdfRequestModal";
import { generateDepotPolicePdf } from "@/lib/depotPolicePdfGenerator";
import { captureLead } from "@/lib/leadCapture";
const formatCurrency = (n: number | undefined) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

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
  const [dob, setDob] = useState(new Date(2001, 0, 15));
  const [retirementAge, setRetirementAge] = useState(67);

  // Investment
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [initialCapital, setInitialCapital] = useState(0);
  const [contributionGrowthPct, setContributionGrowthPct] = useState(0);

  // Returns & Tax
  const [annualReturnPct, setAnnualReturnPct] = useState(7.5);
  const [includeSoli, setIncludeSoli] = useState(true);
  const [includeKirchensteuer, setIncludeKirchensteuer] = useState(false);
  const abgeltungTaxPct = 25 + (includeSoli ? 1.375 : 0) + (includeKirchensteuer ? 2.25 : 0);
  const [basiszinsPct, setBasiszinsPct] = useState(2.55);
  const [allowanceEUR, setAllowanceEUR] = useState(1000);
  const [partialExemptionKind, setPartialExemptionKind] = useState<PartialExemptionKind>("equity");

  // Switch Simulation
  const [switchSimulation, setSwitchSimulation] = useState<YesNo>("yes");
  const [switchEveryYears, setSwitchEveryYears] = useState(7);

  // Depot Costs
  const [depotEffectiveCostPct, setDepotEffectiveCostPct] = useState(0.9);
  const [depotSwitchSellPct, setDepotSwitchSellPct] = useState(0.5);
  const [depotSwitchBuyPct, setDepotSwitchBuyPct] = useState(0.5);

  // Policy Costs
  const [policyAcqPeriodYears] = useState(5);
  const [policyAcqCostPct] = useState(0.6);
  const [policyAdminCostType] = useState<"falling" | "constant">("falling");
  const [policyAdminFirstYearPct] = useState(5.42);
  const [policyAdminLastYearPct] = useState(3.42);
  const [policyAssetBasedAdminPct] = useState(0);
  const [policyPieceCostEUR] = useState(12);
  const [policyOneTimeCostPct] = useState(0);
  const [policyContractStartOneTimeEUR] = useState(0);

  // Modals
  const [showDepotModal, setShowDepotModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [showPdfRequestModal, setShowPdfRequestModal] = useState(false);

  // UI Toggles
  const [showInvestmentDetails, setShowInvestmentDetails] = useState(false);
  const [showTaxDetails, setShowTaxDetails] = useState(false);


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
        pieceCostEUR: policyPieceCostEUR / 12,
        oneTimePaymentCostPct: policyOneTimeCostPct,
        contractStartOneTimeEUR: policyContractStartOneTimeEUR,
      },
    });
  }, [
    dob, retirementAge, monthlyContribution, initialCapital, contributionGrowthPct,
    annualReturnPct, includeSoli, includeKirchensteuer, basiszinsPct, allowanceEUR, partialExemptionKind,
    switchSimulation, switchEveryYears, depotEffectiveCostPct, depotSwitchSellPct, depotSwitchBuyPct,
    policyAcqPeriodYears, policyAcqCostPct, policyAdminCostType, policyAdminFirstYearPct,
    policyAdminLastYearPct, policyAssetBasedAdminPct, policyPieceCostEUR, policyOneTimeCostPct,
    policyContractStartOneTimeEUR,
  ]);

  const handlePdfGenerate = async (reqData: PdfRequestData) => {
    if (result) {
      const today = new Date();
      const { blob, fileName } = await generateDepotPolicePdf(reqData, {
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
          pieceCostEUR: policyPieceCostEUR / 12,
          oneTimePaymentCostPct: policyOneTimeCostPct,
          contractStartOneTimeEUR: policyContractStartOneTimeEUR,
        },
      }, result);
      await captureLead(reqData, blob, fileName, "depot-vs-privatrente");
    }
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
                  <DatePicker
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
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">Abgeltungssteuer</span>
                          <span className="text-xs font-bold text-gray-900">25,00%</span>
                        </div>
                        <p className="text-[10px] text-gray-400">Gesetzlich festgelegt</p>
                      </div>
                      <Toggle
                        checked={includeSoli}
                        onChange={setIncludeSoli}
                        label="Solidaritätszuschlag (5,5%)"
                      />
                      <Toggle
                        checked={includeKirchensteuer}
                        onChange={setIncludeKirchensteuer}
                        label="Kirchensteuer (9%)"
                      />
                      <Input
                        label="Freibetrag"
                        type="number"
                        value={allowanceEUR}
                        onChange={(e) => {
                          let val = parseFloat(e.target.value) || 0;
                          if (val > 1000) val = 1000;
                          if (val < 0) val = 0;
                          setAllowanceEUR(val);
                        }}
                        max={1000}
                        suffix="€"
                      />
                    </div>
                  )}
                </div>
              </Accordion>

              {/* Die Angaben zur Krankenversicherung wurden absichtlich entfernt */}

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

            <div className="pt-2 pb-2 flex-shrink-0 bg-white">
              {/* PDF Button shifted to right column */}
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
              <div className="w-full h-[550px] lg:flex-1 lg:h-auto lg:min-h-0 px-0 sm:px-4 py-4">
                <div className="w-full h-full -ml-3 sm:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.points} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
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
                    {includeSoli && includeKirchensteuer ? 'inkl. Soli + Kirchensteuer' : includeSoli ? 'inkl. Soli (5,5%)' : includeKirchensteuer ? 'inkl. Kirchensteuer (9%)' : 'nur Abgeltungssteuer'}
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
                      <li>• Besteuerung in der Ansparphase</li>
                      <li>• Kapitalerträge: Abgeltungssteuer</li>
                      <li>• Umschichtungen lösen Steuer aus</li>
                      <li>• Steuern fallen laufend an</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-green-50/50 rounded-lg border-l-4 border-[#059669]">
                    <h4 className="font-semibold text-[#059669] text-sm mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Police
                    </h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li>• Keine Steuer in der Ansparphase</li>
                      <li>• Fondswechsel steuerneutral möglich</li>
                      <li>• Ab 62 J. / nach 12 J.: 50% steuerfrei</li>
                      <li>• Bestandsschutz für Steuervorteile</li>
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

            {/* ============ VIDEO & CTA SECTION ============ */}
            <div className="pt-2">
              <Button
                variant="primary"
                className="w-full justify-center py-4 font-bold shadow-lg"
                onClick={() => setShowPdfRequestModal(true)}
              >
                <FileText className="w-5 h-5 mr-2" />
                Deinen Vergleich erhalten
              </Button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center mt-6">
              <h3 className="text-2xl lg:text-lg font-bold text-[#0f172a] mb-4">Erfahre mehr im Video</h3>
              <div className="w-full aspect-[9/16] rounded-xl overflow-hidden shadow-inner border-2 border-gray-100">
                <video
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                  src="/video-depot.mp4#t=0.001"
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
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Abschlusskosten Zeitraum</span>
              <span className="font-semibold text-gray-900">{policyAcqPeriodYears} Jahre</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Abschlusskosten</span>
              <span className="font-semibold text-gray-900">{policyAcqCostPct.toFixed(2)}%</span>
            </div>
            
            <div className="h-px bg-gray-200 my-2" />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Verwaltungskosten 1. Jahr</span>
              <span className="font-semibold text-gray-900">{policyAdminFirstYearPct.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Verwaltungskosten ab 10. Jahr</span>
              <span className="font-semibold text-gray-900">{policyAdminLastYearPct.toFixed(2)}%</span>
            </div>
            
            <div className="h-px bg-gray-200 my-2" />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Fondskosten (TER)</span>
              <span className="font-semibold text-gray-900">{(policyAssetBasedAdminPct + 0.2).toFixed(2)}%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Stückkosten p.a.</span>
              <span className="font-semibold text-gray-900">{formatCurrency(policyPieceCostEUR)}</span>
            </div>
          </div>
          
          <div className="p-3 bg-blue-50/50 rounded-lg border-l-4 border-blue-500 text-xs text-gray-600 mt-2">
            Die Kostenstruktur ist auf ein gängiges Marktmodell fest vorkonfiguriert, um eine realistische Vergleichbarkeit zu gewährleisten.
          </div>
          <Button className="w-full mt-4" onClick={() => setShowPolicyModal(false)}>
            Schließen
          </Button>
        </div>
      </Modal>

      <PdfRequestModal
        isOpen={showPdfRequestModal}
        onClose={() => setShowPdfRequestModal(false)}
        onGenerate={handlePdfGenerate}
        title="Depot vs. Privatrente laden"
      />

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
