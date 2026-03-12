import { useState, useMemo, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { Slider } from "@/components/ui/Slider";
import { Toggle } from "@/components/ui/Toggle";
import { Button } from "@/components/ui/Button";
import {
  calculateCashflow,
  type IncomeRow,
  type ExpenseRow,
  type AssetRow,
} from "@/lib/cashflowCalculator";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import { ArrowUpRight, TrendingUp, CreditCard, FileText } from "lucide-react";
import { PdfRequestModal, PdfRequestData } from "@/components/ui/PdfRequestModal";
import { generateCashflowPdf, type CashflowPdfInput, type CashflowPdfResult } from "@/lib/cashflowPdfGenerator";

const formatCurrency = (n: number | undefined) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n ?? 0);

const formatPercent = (n: number) => `${n.toFixed(1)}%`;

// Extended row types with isSystem flag
interface SystemIncomeRow extends IncomeRow {
  isSystem: boolean;
}
interface SystemExpenseRow extends ExpenseRow {
  isSystem: boolean;
}
interface SystemAssetRow extends AssetRow {
  isSystem: boolean;
}

// Mobile label shortening for very long labels
const shortenLabel = (label: string, isMobile: boolean): string => {
  if (!isMobile) return label;

  const mappings: Record<string, string> = {
    "Fitnessstudio, Vereinsmitgliedschaften": "Mitgliedschaften",
    "Spotify, Netflix, Amazon Prime": "Streaming & Abos",
    "Auto (Kraftstoff, Parken, Reparatur)": "Auto laufend",
    "Weggehen, Restaurant, Party": "Ausgehen",
    "Essen, Trinken, Haushaltsbedarf": "Haushalt",
    "Autoleasing / Finanzierung": "Autoleasing",
    "Sonderzahlung (13. Gehalt)": "13. Gehalt",
    "Berufsunfähigkeitsversicherung": "BU-Versicherung",
    "Private Krankenversicherung": "PKV",
    "Wohngebäudeversicherung": "Wohngebäude",
    "Zahnzusatzversicherung": "Zahnzusatz",
    "Risikolebensversicherung": "Risikoleben",
  };

  return mappings[label] || label;
};

// Section Header Component
function SectionHeader({
  icon,
  title,
  subtitle,
  sum
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  sum?: { label: string; value: number }[];
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#059669] to-[#10b981] flex items-center justify-center text-white shadow-lg">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {sum && sum.length > 0 && (
        <div className="flex gap-6">
          {sum.map((s, i) => (
            <div key={i} className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-xl font-bold text-[#059669]">{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Group Header Component (title only, no add button)
function GroupHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-4 mt-6 first:mt-0">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
    </div>
  );
}

// Add Button Component (shown at bottom of each group)
function AddButton({ onClick, label = "Hinzufügen" }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full mt-4 py-3 px-4 border-2 border-dashed border-gray-200 rounded-xl text-[#059669] hover:text-[#047857] hover:border-[#059669] hover:bg-[#059669]/5 font-medium transition-all duration-200 min-h-[48px]"
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      {label}
    </button>
  );
}

// Income Row Component
function IncomeRowItem({
  row,
  onChange,
  onAction,
  isMobile,
}: {
  row: SystemIncomeRow;
  onChange: (key: keyof SystemIncomeRow, value: string | number) => void;
  onAction: () => void;
  isMobile: boolean;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const displayName = shortenLabel(row.name, isMobile);

  const handleAction = () => {
    if (row.isSystem) {
      setIsResetting(true);
      setTimeout(() => setIsResetting(false), 300);
    }
    onAction();
  };

  return (
    <div className={`group py-3 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl hover:bg-gray-50/80 transition-all duration-200 border-b border-gray-50 last:border-0 ${isResetting ? 'bg-amber-50/50' : ''}`}>
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="flex-[2]">
          <Input
            type="text"
            value={displayName}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Bezeichnung"
            disabled={row.isSystem}
            className={row.isSystem ? 'bg-gray-50 text-gray-700' : ''}
          />
        </div>
        <div className="w-40">
          <Input
            type="number"
            value={row.net === 0 ? "" : row.net}
            onChange={(e) => onChange("net", e.target.value === "" ? 0 : parseFloat(e.target.value))}
            placeholder="Betrag"
            suffix="€"
          />
        </div>
        <button
          onClick={handleAction}
          className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-150 ${row.isSystem ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
          title={row.isSystem ? "Wert zurücksetzen" : "Zeile entfernen"}
        >
          {row.isSystem ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
        {!row.isSystem && <span className="text-xs text-gray-400 italic hidden lg:inline">(hinzugefügt)</span>}
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 break-words">
            {row.isSystem ? displayName : "Bezeichnung"}
            {!row.isSystem && <span className="ml-2 text-gray-400 italic">(hinzugefügt)</span>}
          </label>
          <div className="flex items-center gap-2">
            {row.isSystem ? (
              <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium min-h-[48px] flex items-center break-words">
                {displayName}
              </div>
            ) : (
              <div className="flex-1">
                <Input
                  type="text"
                  value={row.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Bezeichnung"
                  className="!min-h-[48px]"
                />
              </div>
            )}
            <button
              onClick={handleAction}
              className={`p-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-150 ${row.isSystem ? 'text-gray-400 bg-gray-50 hover:bg-amber-50 active:bg-amber-100' : 'text-gray-400 bg-gray-50 hover:bg-red-50 active:bg-red-100'}`}
            >
              {row.isSystem ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Betrag</label>
          <Input
            type="number"
            value={row.net === 0 ? "" : row.net}
            onChange={(e) => onChange("net", e.target.value === "" ? 0 : parseFloat(e.target.value))}
            placeholder="Betrag"
            suffix="€"
            className="!min-h-[48px]"
          />
        </div>
      </div>
    </div>
  );
}

// Expense Row Component
function ExpenseRowItem({
  row,
  onChange,
  onAction,
  isMobile,
}: {
  row: SystemExpenseRow;
  onChange: (key: keyof SystemExpenseRow, value: string | number) => void;
  onAction: () => void;
  isMobile: boolean;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const displayName = shortenLabel(row.name, isMobile);

  const handleAction = () => {
    if (row.isSystem) {
      setIsResetting(true);
      setTimeout(() => setIsResetting(false), 300);
    }
    onAction();
  };

  return (
    <div className={`group py-3 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl hover:bg-gray-50/80 transition-all duration-200 border-b border-gray-50 last:border-0 ${isResetting ? 'bg-amber-50/50' : ''}`}>
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="flex-[2]">
          <Input
            type="text"
            value={displayName}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Bezeichnung"
            disabled={row.isSystem}
            className={row.isSystem ? 'bg-gray-50 text-gray-700' : ''}
          />
        </div>
        <div className="w-40">
          <Input
            type="number"
            value={row.amount === 0 ? "" : row.amount}
            onChange={(e) => onChange("amount", e.target.value === "" ? 0 : parseFloat(e.target.value))}
            placeholder="Betrag"
            suffix="€"
          />
        </div>
        <button
          onClick={handleAction}
          className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-150 ${row.isSystem ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
          title={row.isSystem ? "Wert zurücksetzen" : "Zeile entfernen"}
        >
          {row.isSystem ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
        {!row.isSystem && <span className="text-xs text-gray-400 italic hidden lg:inline">(hinzugefügt)</span>}
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 break-words">
            {row.isSystem ? displayName : "Bezeichnung"}
            {!row.isSystem && <span className="ml-2 text-gray-400 italic">(hinzugefügt)</span>}
          </label>
          <div className="flex items-center gap-2">
            {row.isSystem ? (
              <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium min-h-[48px] flex items-center break-words">
                {displayName}
              </div>
            ) : (
              <div className="flex-1">
                <Input
                  type="text"
                  value={row.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Bezeichnung"
                  className="!min-h-[48px]"
                />
              </div>
            )}
            <button
              onClick={handleAction}
              className={`p-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-150 ${row.isSystem ? 'text-gray-400 bg-gray-50 hover:bg-amber-50 active:bg-amber-100' : 'text-gray-400 bg-gray-50 hover:bg-red-50 active:bg-red-100'}`}
            >
              {row.isSystem ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1.5">Betrag</label>
          <Input
            type="number"
            value={row.amount === 0 ? "" : row.amount}
            onChange={(e) => onChange("amount", e.target.value === "" ? 0 : parseFloat(e.target.value))}
            placeholder="Betrag"
            suffix="€"
            className="!min-h-[48px]"
          />
        </div>
      </div>
    </div>
  );
}

// Asset Row Component
function AssetRowItem({
  row,
  onChange,
  onAction,
  isMobile,
}: {
  row: SystemAssetRow;
  onChange: (key: keyof SystemAssetRow, value: string | number) => void;
  onAction: () => void;
  isMobile: boolean;
}) {
  const [isResetting, setIsResetting] = useState(false);
  const displayName = shortenLabel(row.name, isMobile);

  const handleAction = () => {
    if (row.isSystem) {
      setIsResetting(true);
      setTimeout(() => setIsResetting(false), 300);
    }
    onAction();
  };

  return (
    <div className={`group py-3 px-3 sm:px-4 -mx-3 sm:-mx-4 rounded-xl hover:bg-gray-50/80 transition-all duration-200 border-b border-gray-50 last:border-0 ${isResetting ? 'bg-amber-50/50' : ''}`}>
      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center gap-3">
        <div className="flex-[2]">
          <Input
            type="text"
            value={displayName}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Bezeichnung"
            disabled={row.isSystem}
            className={row.isSystem ? 'bg-gray-50 text-gray-700' : ''}
          />
        </div>
        <div className="w-32">
          <Input
            type="number"
            value={row.monthly === 0 ? "" : row.monthly}
            onChange={(e) => onChange("monthly", e.target.value === "" ? 0 : parseFloat(e.target.value))}
            placeholder="Monatlich"
            suffix="€"
          />
        </div>
        <div className="w-36">
          <Input
            type="number"
            value={row.value === 0 ? "" : row.value}
            onChange={(e) => onChange("value", e.target.value === "" ? 0 : parseFloat(e.target.value))}
            placeholder="Bestand"
            suffix="€"
          />
        </div>
        <button
          onClick={handleAction}
          className={`p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg transition-all duration-150 ${row.isSystem ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
          title={row.isSystem ? "Wert zurücksetzen" : "Zeile entfernen"}
        >
          {row.isSystem ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
        {!row.isSystem && <span className="text-xs text-gray-400 italic hidden lg:inline">(hinzugefügt)</span>}
      </div>

      {/* Mobile Layout */}
      <div className="sm:hidden space-y-3">
        <div className="w-full">
          <label className="block text-xs font-medium text-gray-500 mb-1.5 break-words">
            {row.isSystem ? displayName : "Bezeichnung"}
            {!row.isSystem && <span className="ml-2 text-gray-400 italic">(hinzugefügt)</span>}
          </label>
          <div className="flex items-center gap-2">
            {row.isSystem ? (
              <div className="flex-1 px-4 py-3 bg-gray-50 rounded-xl text-gray-700 font-medium min-h-[48px] flex items-center break-words">
                {displayName}
              </div>
            ) : (
              <div className="flex-1">
                <Input
                  type="text"
                  value={row.name}
                  onChange={(e) => onChange("name", e.target.value)}
                  placeholder="Bezeichnung"
                  className="!min-h-[48px]"
                />
              </div>
            )}
            <button
              onClick={handleAction}
              className={`p-3 min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-all duration-150 ${row.isSystem ? 'text-gray-400 bg-gray-50 hover:bg-amber-50 active:bg-amber-100' : 'text-gray-400 bg-gray-50 hover:bg-red-50 active:bg-red-100'}`}
            >
              {row.isSystem ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Monatlich</label>
            <Input
              type="number"
              value={row.monthly === 0 ? "" : row.monthly}
              onChange={(e) => onChange("monthly", e.target.value === "" ? 0 : parseFloat(e.target.value))}
              placeholder="Monatlich"
              suffix="€"
              className="!min-h-[48px]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Bestand</label>
            <Input
              type="number"
              value={row.value === 0 ? "" : row.value}
              onChange={(e) => onChange("value", e.target.value === "" ? 0 : parseFloat(e.target.value))}
              placeholder="Bestand"
              suffix="€"
              className="!min-h-[48px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Cashflow Page
export function CashflowPage() {
  const [activeTab, setActiveTab] = useState("eingaben");
  const [activeIncomeIndex, setActiveIncomeIndex] = useState(-1);
  const [activeAssetIndex, setActiveAssetIndex] = useState(-1);
  const [isMobile, setIsMobile] = useState(false);


  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Income - Monatlich (with isSystem flag)
  const [monthlyIncomeRows, setMonthlyIncomeRows] = useState<SystemIncomeRow[]>([
    { name: "Gehalt", net: 5500, isSystem: true },
    { name: "Nebenjob", net: 0, isSystem: true },
    { name: "Vermietung (kalt)", net: 0, isSystem: true },
  ]);

  // Income - Jährlich
  const [annualIncomeRows, setAnnualIncomeRows] = useState<SystemIncomeRow[]>([
    { name: "Sonderzahlung (13. Gehalt)", net: 5500, isSystem: true },
    { name: "Urlaubsgeld", net: 0, isSystem: true },
    { name: "Weihnachtsgeld", net: 0, isSystem: true },
  ]);

  // Expenses - Notwendig
  const [expensesNecessary, setExpensesNecessary] = useState<SystemExpenseRow[]>([
    { name: "Miete kalt", amount: 1200, isSystem: true },
    { name: "Miete Nebenkosten", amount: 200, isSystem: true },
    { name: "Essen, Trinken, Haushaltsbedarf", amount: 400, isSystem: true },
    { name: "Internet", amount: 45, isSystem: true },
    { name: "Strom", amount: 80, isSystem: true },
    { name: "Handy", amount: 40, isSystem: true },
    { name: "Sonstiges", amount: 100, isSystem: true },
  ]);

  // Expenses - Nicht notwendig
  const [expensesOptional, setExpensesOptional] = useState<SystemExpenseRow[]>([
    { name: "Fitnessstudio, Vereinsmitgliedschaften", amount: 50, isSystem: true },
    { name: "Weggehen, Restaurant, Party", amount: 200, isSystem: true },
    { name: "Spotify, Netflix, Amazon Prime", amount: 35, isSystem: true },
    { name: "Darlehen", amount: 0, isSystem: true },
    { name: "GEZ", amount: 18, isSystem: true },
    { name: "Autoleasing / Finanzierung", amount: 350, isSystem: true },
    { name: "Auto (Kraftstoff, Parken, Reparatur)", amount: 250, isSystem: true },
    { name: "Gewerkschaft", amount: 0, isSystem: true },
    { name: "Shopping", amount: 150, isSystem: true },
  ]);

  // Insurance / Absicherungen
  const [insuranceRows, setInsuranceRows] = useState<SystemExpenseRow[]>([
    { name: "Haftpflichtversicherung", amount: 8, isSystem: true },
    { name: "Kfz-Versicherung", amount: 65, isSystem: true },
    { name: "Hausrat", amount: 15, isSystem: true },
    { name: "Unfallversicherung", amount: 25, isSystem: true },
    { name: "Risikolebensversicherung", amount: 35, isSystem: true },
    { name: "Berufsunfähigkeitsversicherung", amount: 150, isSystem: true },
    { name: "Pflegeversicherung", amount: 0, isSystem: true },
    { name: "Krankenhausleistungen", amount: 20, isSystem: true },
    { name: "Anwartschaft", amount: 0, isSystem: true },
    { name: "Rechtsschutz", amount: 25, isSystem: true },
    { name: "Zahnzusatzversicherung", amount: 30, isSystem: true },
    { name: "Wohngebäudeversicherung", amount: 0, isSystem: true },
    { name: "Auslandsreise", amount: 10, isSystem: true },
    { name: "Private Krankenversicherung", amount: 450, isSystem: true },
  ]);

  // Assets - Kurzfristig
  const [assetsShort, setAssetsShort] = useState<SystemAssetRow[]>([
    { name: "Sparbuch", monthly: 0, value: 2000, isSystem: true },
    { name: "Girokonto", monthly: 0, value: 3500, isSystem: true },
    { name: "Tagesgeldkonto", monthly: 200, value: 15000, isSystem: true },
  ]);

  // Assets - Mittelfristig
  const [assetsMid, setAssetsMid] = useState<SystemAssetRow[]>([
    { name: "Geldanlage", monthly: 0, value: 5000, isSystem: true },
    { name: "Bausparvertrag", monthly: 100, value: 8000, isSystem: true },
    { name: "Immobilie", monthly: 0, value: 0, isSystem: true },
  ]);

  // Assets - Langfristig
  const [assetsLong, setAssetsLong] = useState<SystemAssetRow[]>([
    { name: "Rürup", monthly: 0, value: 0, isSystem: true },
    { name: "Riester", monthly: 0, value: 0, isSystem: true },
    { name: "bAV", monthly: 200, value: 12000, isSystem: true },
    { name: "Private Altersvorsorge", monthly: 300, value: 25000, isSystem: true },
  ]);

  // Surplus simulation
  const [liquidityGoalAuto, setLiquidityGoalAuto] = useState(true);
  const [liquidityGoal, setLiquidityGoal] = useState(15000);
  const [surplusStartCapital, setSurplusStartCapital] = useState(0);
  const [surplusMonthly, setSurplusMonthly] = useState(0);
  const [surplusYears, setSurplusYears] = useState(20);
  const [surplusReturnRate, setSurplusReturnRate] = useState(7);
  const [surplusInflationRate, setSurplusInflationRate] = useState(2.5);
  const [surplusInterestRate, setSurplusInterestRate] = useState(1.0);

  // Calculations
  const monthlyIncomeSum = monthlyIncomeRows.reduce((sum, r) => sum + r.net, 0);
  const annualIncomeSum = annualIncomeRows.reduce((sum, r) => sum + r.net, 0);
  const necessaryExpenseSum = expensesNecessary.reduce((sum, r) => sum + r.amount, 0);
  const optionalExpenseSum = expensesOptional.reduce((sum, r) => sum + r.amount, 0);
  const insuranceSum = insuranceRows.reduce((sum, r) => sum + r.amount, 0);
  const assetsShortSum = assetsShort.reduce((sum, r) => sum + r.value, 0);
  const assetsShortMonthly = assetsShort.reduce((sum, r) => sum + r.monthly, 0);
  const assetsMidSum = assetsMid.reduce((sum, r) => sum + r.value, 0);
  const assetsMidMonthly = assetsMid.reduce((sum, r) => sum + r.monthly, 0);
  const assetsLongSum = assetsLong.reduce((sum, r) => sum + r.value, 0);
  const assetsLongMonthly = assetsLong.reduce((sum, r) => sum + r.monthly, 0);

  const result = useMemo(
    () =>
      calculateCashflow({
        monthlyIncomeRows,
        annualIncomeRows,
        expensesNecessary,
        expensesOptional,
        insuranceRows,
        assetsShort,
        assetsMid,
        assetsLong,
        targetAllocation: { liabilities: 50, insurance: 10, liquidity: 10, wealth: 15, retirement: 15 },
        liquidityGoal,
        liquidityGoalAuto,
        surplusStartCapital,
        surplusMonthly,
        surplusYears,
        surplusReturnRate,
        surplusInflationRate,
        surplusInterestRate,
      }),
    [
      monthlyIncomeRows,
      annualIncomeRows,
      expensesNecessary,
      expensesOptional,
      insuranceRows,
      assetsShort,
      assetsMid,
      assetsLong,
      liquidityGoal,
      liquidityGoalAuto,
      surplusStartCapital,
      surplusMonthly,
      surplusYears,
      surplusReturnRate,
      surplusInflationRate,
      surplusInterestRate,
    ]
  );

  const [showPdfModal, setShowPdfModal] = useState(false);
  const handlePdfGenerate = (reqData: PdfRequestData) => {
    if (!result) return;
    const pdfInput: CashflowPdfInput = {
      monthlyIncomeRows, annualIncomeRows,
      expensesNecessary, expensesOptional, insuranceRows,
      assetsShort, assetsMid, assetsLong,
      targetAllocation: { liabilities: 50, insurance: 10, liquidity: 10, wealth: 15, retirement: 15 },
      liquidityGoal: liquidityGoalAuto ? result.recommendedLiquidityGoal : liquidityGoal,
      surplusStartCapital, surplusMonthly, surplusYears,
      surplusReturnRate, surplusInflationRate, surplusInterestRate,
    };
    generateCashflowPdf(reqData, result as CashflowPdfResult, pdfInput);
  };

  // Auto-Vorbelegung: Startkapital = kurzfristiges Vermögen minus Liquiditätsziel
  useEffect(() => {
    const activeLiqGoal = liquidityGoalAuto ? (monthlyIncomeSum * 3) : liquidityGoal;
    const surplus = Math.max(0, assetsShortSum - activeLiqGoal);
    setSurplusStartCapital(surplus);
  }, [assetsShortSum, monthlyIncomeSum, liquidityGoalAuto, liquidityGoal]);

  // Auto-Vorbelegung: Monatliche Sparrate = freier Cashflow (gerundet)
  useEffect(() => {
    setSurplusMonthly(Math.round(Math.max(0, result.freeMonthly)));
  }, [result.freeMonthly]);

  // Wachstums-Chart-Daten
  const growthChartData = result.growthNominalSavings.map((p, i) => ({
    year: p.year,
    nominalSavings: p.value,
    realSavings: result.growthRealSavings[i]?.value ?? 0,
    realInvestment: result.growthRealInvestment[i]?.value ?? 0,
  }));

  // Helper functions for row actions with proper delete/reset behavior
  const handleIncomeAction = (
    rows: SystemIncomeRow[],
    setRows: (r: SystemIncomeRow[]) => void,
    index: number
  ) => {
    const row = rows[index];
    if (row.isSystem) {
      const updated = [...rows];
      updated[index] = { ...updated[index], net: 0 };
      setRows(updated);
    } else {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleExpenseAction = (
    rows: SystemExpenseRow[],
    setRows: (r: SystemExpenseRow[]) => void,
    index: number
  ) => {
    const row = rows[index];
    if (row.isSystem) {
      const updated = [...rows];
      updated[index] = { ...updated[index], amount: 0 };
      setRows(updated);
    } else {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleAssetAction = (
    rows: SystemAssetRow[],
    setRows: (r: SystemAssetRow[]) => void,
    index: number
  ) => {
    const row = rows[index];
    if (row.isSystem) {
      const updated = [...rows];
      updated[index] = { ...updated[index], monthly: 0, value: 0 };
      setRows(updated);
    } else {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const updateIncomeRow = (rows: SystemIncomeRow[], setRows: (r: SystemIncomeRow[]) => void, index: number, key: keyof SystemIncomeRow, value: string | number) => {
    const updated = [...rows];
    if (key === 'name') updated[index].name = value as string;
    else if (key === 'net') updated[index].net = value as number;
    setRows(updated);
  };

  const updateExpenseRow = (rows: SystemExpenseRow[], setRows: (r: SystemExpenseRow[]) => void, index: number, key: keyof SystemExpenseRow, value: string | number) => {
    const updated = [...rows];
    if (key === 'name') updated[index].name = value as string;
    else if (key === 'amount') updated[index].amount = value as number;
    setRows(updated);
  };

  const updateAssetRow = (rows: SystemAssetRow[], setRows: (r: SystemAssetRow[]) => void, index: number, key: keyof SystemAssetRow, value: string | number) => {
    const updated = [...rows];
    if (key === 'name') updated[index].name = value as string;
    else if (key === 'monthly') updated[index].monthly = value as number;
    else if (key === 'value') updated[index].value = value as number;
    setRows(updated);
  };

  return (
    <Layout title="Cashflow-Analyse" subtitle="Einnahmen, Ausgaben & Vermögen">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          tabs={[
            { id: "eingaben", label: "Eingaben" },
            { id: "auswertung", label: "Auswertung" },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        >
          {activeTab === "eingaben" && (
            <div className="space-y-8">
              {/* ==================== EINNAHMEN ==================== */}
              <Card className="!p-6 sm:!p-8 lg:!p-10">
                <SectionHeader
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  title="Einnahmen"
                  subtitle="Regelmäßige und jährliche Einkünfte"
                  sum={[
                    { label: "Monatlich Netto", value: monthlyIncomeSum },
                    { label: "Jährlich Netto", value: annualIncomeSum },
                  ]}
                />

                <GroupHeader title="Monatlich" />
                <div className="space-y-1">
                  {monthlyIncomeRows.map((row, idx) => (
                    <IncomeRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateIncomeRow(monthlyIncomeRows, setMonthlyIncomeRows, idx, key, value)}
                      onAction={() => handleIncomeAction(monthlyIncomeRows, setMonthlyIncomeRows, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setMonthlyIncomeRows([...monthlyIncomeRows, { name: "", net: 0, isSystem: false }])}
                  label="Einnahme hinzufügen"
                />

                <GroupHeader title="Jährlich" />
                <div className="space-y-1">
                  {annualIncomeRows.map((row, idx) => (
                    <IncomeRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateIncomeRow(annualIncomeRows, setAnnualIncomeRows, idx, key, value)}
                      onAction={() => handleIncomeAction(annualIncomeRows, setAnnualIncomeRows, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setAnnualIncomeRows([...annualIncomeRows, { name: "", net: 0, isSystem: false }])}
                  label="Einnahme hinzufügen"
                />
              </Card>

              {/* ==================== AUSGABEN ==================== */}
              <Card className="!p-6 sm:!p-8 lg:!p-10">
                <SectionHeader
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  }
                  title="Ausgaben"
                  subtitle="Fixkosten und variable Ausgaben"
                  sum={[
                    { label: "Notwendig", value: necessaryExpenseSum },
                    { label: "Optional", value: optionalExpenseSum },
                  ]}
                />

                <GroupHeader title="Notwendige Ausgaben" />
                <div className="space-y-1">
                  {expensesNecessary.map((row, idx) => (
                    <ExpenseRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateExpenseRow(expensesNecessary, setExpensesNecessary, idx, key, value)}
                      onAction={() => handleExpenseAction(expensesNecessary, setExpensesNecessary, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setExpensesNecessary([...expensesNecessary, { name: "", amount: 0, isSystem: false }])}
                  label="Ausgabe hinzufügen"
                />

                <GroupHeader title="Nicht notwendige Ausgaben" />
                <div className="space-y-1">
                  {expensesOptional.map((row, idx) => (
                    <ExpenseRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateExpenseRow(expensesOptional, setExpensesOptional, idx, key, value)}
                      onAction={() => handleExpenseAction(expensesOptional, setExpensesOptional, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setExpensesOptional([...expensesOptional, { name: "", amount: 0, isSystem: false }])}
                  label="Ausgabe hinzufügen"
                />
              </Card>

              {/* ==================== VERMÖGENSWERTE ==================== */}
              <Card className="!p-6 sm:!p-8 lg:!p-10">
                <SectionHeader
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  title="Vermögenswerte"
                  subtitle="Kurzfristig, mittelfristig und langfristig"
                  sum={[
                    { label: "Monatl. Sparrate", value: assetsShortMonthly + assetsMidMonthly + assetsLongMonthly },
                    { label: "Gesamtbestand", value: assetsShortSum + assetsMidSum + assetsLongSum },
                  ]}
                />

                <GroupHeader title="Kurzfristig (< 1 Jahr)" />
                <div className="space-y-1">
                  {assetsShort.map((row, idx) => (
                    <AssetRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateAssetRow(assetsShort, setAssetsShort, idx, key, value)}
                      onAction={() => handleAssetAction(assetsShort, setAssetsShort, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setAssetsShort([...assetsShort, { name: "", monthly: 0, value: 0, isSystem: false }])}
                  label="Vermögenswert hinzufügen"
                />

                <GroupHeader title="Mittelfristig (1-5 Jahre)" />
                <div className="space-y-1">
                  {assetsMid.map((row, idx) => (
                    <AssetRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateAssetRow(assetsMid, setAssetsMid, idx, key, value)}
                      onAction={() => handleAssetAction(assetsMid, setAssetsMid, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setAssetsMid([...assetsMid, { name: "", monthly: 0, value: 0, isSystem: false }])}
                  label="Vermögenswert hinzufügen"
                />

                <GroupHeader title="Langfristig (> 5 Jahre)" />
                <div className="space-y-1">
                  {assetsLong.map((row, idx) => (
                    <AssetRowItem
                      key={idx}
                      row={row}
                      onChange={(key, value) => updateAssetRow(assetsLong, setAssetsLong, idx, key, value)}
                      onAction={() => handleAssetAction(assetsLong, setAssetsLong, idx)}
                      isMobile={isMobile}
                    />
                  ))}
                </div>
                <AddButton
                  onClick={() => setAssetsLong([...assetsLong, { name: "", monthly: 0, value: 0, isSystem: false }])}
                  label="Vermögenswert hinzufügen"
                />
              </Card>

              {/* ==================== ABSICHERUNGEN ==================== */}
              <Card className="!p-6 sm:!p-8 lg:!p-10">
                <SectionHeader
                  icon={
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                  title="Absicherungen"
                  subtitle="Versicherungen und Vorsorge"
                  sum={[
                    { label: "Monatl. Gesamt", value: insuranceSum },
                  ]}
                />

                <GroupHeader title="Versicherungen" />

                {/* Mobile: Single column, Desktop: Two columns */}
                <div className="grid sm:grid-cols-2 gap-x-8">
                  <div className="space-y-1">
                    {insuranceRows.slice(0, Math.ceil(insuranceRows.length / 2)).map((row, idx) => (
                      <ExpenseRowItem
                        key={idx}
                        row={row}
                        onChange={(key, value) => updateExpenseRow(insuranceRows, setInsuranceRows, idx, key, value)}
                        onAction={() => handleExpenseAction(insuranceRows, setInsuranceRows, idx)}
                        isMobile={isMobile}
                      />
                    ))}
                  </div>
                  <div className="space-y-1">
                    {insuranceRows.slice(Math.ceil(insuranceRows.length / 2)).map((row, idx) => {
                      const actualIdx = idx + Math.ceil(insuranceRows.length / 2);
                      return (
                        <ExpenseRowItem
                          key={actualIdx}
                          row={row}
                          onChange={(key, value) => updateExpenseRow(insuranceRows, setInsuranceRows, actualIdx, key, value)}
                          onAction={() => handleExpenseAction(insuranceRows, setInsuranceRows, actualIdx)}
                          isMobile={isMobile}
                        />
                      );
                    })}
                  </div>
                </div>
                <AddButton
                  onClick={() => setInsuranceRows([...insuranceRows, { name: "", amount: 0, isSystem: false }])}
                  label="Versicherung hinzufügen"
                />
              </Card>

              {/* ==================== ZUR AUSWERTUNG BUTTON ==================== */}
              <div className="pt-4 pb-8">
                <button
                  onClick={() => {
                    setActiveTab("auswertung");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full py-4 px-6 bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#047857] hover:to-[#059669] text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Auswertung anzeigen</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {activeTab === "auswertung" && (() => {
            // Berechnungen für die Auswertung
            const totalAssetsMonthlyCalc = assetsShortMonthly + assetsMidMonthly + assetsLongMonthly;
            const totalExpensesMonthly = necessaryExpenseSum + optionalExpenseSum;

            // Einkommensverteilung: Frei, Verbindlichkeiten, Vermögenswerte, Absicherung
            const incomeDistribution = [
              { name: "Frei", value: Math.max(0, result.freeMonthly), color: "#059669" },
              { name: "Verbindlichkeiten", value: totalExpensesMonthly, color: "#ef4444" },
              { name: "Vermögenswerte", value: totalAssetsMonthlyCalc, color: "#3b82f6" },
              { name: "Absicherung", value: insuranceSum, color: "#f59e0b" },
            ].filter(d => d.value > 0);

            const totalIncomeForPct = result.incomeMonthlyNet > 0 ? result.incomeMonthlyNet : 1;

            // Vermögensverteilung
            const assetDistribution = [
              { name: "Kurzfristig", value: assetsShortSum, color: "#10b981" },
              { name: "Mittelfristig", value: assetsMidSum, color: "#3b82f6" },
              { name: "Langfristig", value: assetsLongSum, color: "#8b5cf6" },
            ].filter(d => d.value > 0);

            const totalAssetsValue = assetsShortSum + assetsMidSum + assetsLongSum;

            // Liquiditätsziel Berechnungen
            const activeLiqGoal = liquidityGoalAuto ? (monthlyIncomeSum * 3) : liquidityGoal;
            const availableLiquidity = assetsShortSum;
            const liquidityCoveragePct = activeLiqGoal > 0 ? (availableLiquidity / activeLiqGoal) * 100 : 0;
            const capitalSurplus = availableLiquidity - activeLiqGoal;
            const inflationLoss = result.lossYearly; // Assuming result.lossYearly is the annual inflation loss

            // Empfohlene Verteilung (fixe Ziele) – ohne Liquidität (separat als 3×Netto-Ziel)
            const recommendedAllocation = [
              { label: "Verbindlichkeiten", targetPct: 50, ist: totalExpensesMonthly, color: "#ef4444" },
              { label: "Absicherung", targetPct: 10, ist: insuranceSum, color: "#f59e0b" },
              { label: "Vermögensaufbau", targetPct: 10, ist: assetsMidMonthly, color: "#3b82f6" },
              { label: "Altersvorsorge", targetPct: 20, ist: assetsLongMonthly, color: "#8b5cf6" },
            ];

            // Liquidität: 3×Netto-Ziel Bewertung (0/1/2 Punkte)
            const liqTarget = monthlyIncomeSum * 3;
            const liqIst = assetsShortSum;
            const liqPct = liqTarget > 0 ? (liqIst / liqTarget) * 100 : 0;
            let liqPoints = 0;
            let liqStatus: 'green' | 'yellow' | 'red';
            let liqStatusLabel: string;
            // Optimal: 90% bis 115% vom Ziel
            if (liqPct >= 90 && liqPct <= 115) {
              liqPoints = 2;
              liqStatus = 'green';
              liqStatusLabel = 'Optimal';
            } 
            // Akzeptabel: 50% bis 89%, oder über 115% (zu viel nicht investierte Liquidität)
            else if (liqPct >= 50) {
              liqPoints = 1;
              liqStatus = 'yellow';
              liqStatusLabel = 'Akzeptabel';
            } else {
              liqPoints = 0;
              liqStatus = 'red';
              liqStatusLabel = 'Anpassen';
            }
            
            // Für die Darstellung des Liquiditäts-Balkens (damit der Balken über den Ziel-Strich hinausgehen kann)
            const liqVisualMaxPct = Math.max(125, liqPct);
            const liqVisualTargetPos = (100 / liqVisualMaxPct) * 100;
            const liqVisualIstPos = (liqPct / liqVisualMaxPct) * 100;

            // Auto-Vorbelegung erfolgt via useEffect (Startkapital + Sparrate)

            // Wachstumsprognose berechnen
            const growthChartData = [];
            let currentRealSavings = surplusStartCapital;
            let currentNominalSavings = surplusStartCapital;
            let currentRealInvestment = surplusStartCapital;

            for (let i = 0; i <= surplusYears; i++) {
              growthChartData.push({
                year: `J${i}`,
                realSavings: currentRealSavings,
                nominalSavings: currentNominalSavings,
                realInvestment: currentRealInvestment,
              });

              if (i < surplusYears) {
                // Add yearly contributions
                const yearlyContribution = surplusMonthly * 12;

                // Effektiver Guthabenzins (Guthabenzins - Inflation)
                const effectiveSavingsRate = (surplusInterestRate - surplusInflationRate) / 100;
                currentNominalSavings = (currentNominalSavings + yearlyContribution) * (1 + effectiveSavingsRate);

                // Kaufkraftverlust (reine Inflation)
                const realSavingsRate = (-surplusInflationRate) / 100;
                currentRealSavings = (currentRealSavings + yearlyContribution) * (1 + realSavingsRate);

                // Real Investment (Rendite - Inflation)
                const realInvestmentRate = (surplusReturnRate - surplusInflationRate) / 100;
                currentRealInvestment = (currentRealInvestment + yearlyContribution) * (1 + realInvestmentRate);
              }
            }

            return (
              <div className="space-y-8">
                {/* KPI Row */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Cashflow KPI */}
                  <Card className="!p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#059669] to-[#10b981] flex items-center justify-center text-white shadow-lg mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">Freier Cashflow</p>
                    <p className="text-4xl font-bold text-[#059669]">{formatCurrency(result.freeMonthly)}</p>
                    <p className="text-sm text-gray-500 mt-1">pro Monat</p>
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.freeYearly)}</p>
                      <p className="text-sm text-gray-500">pro Jahr</p>
                    </div>
                  </Card>

                  {/* Einkommensverteilung: Frei, Verbindlichkeiten, Vermögenswerte, Absicherung */}
                  <Card className="!p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Einkommensverteilung</h3>
                    <div className="h-48" style={{ animation: 'pieChartFadeIn 0.7s ease-out' }}>
                      {incomeDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            {/* @ts-ignore - activeIndex works at runtime in recharts v3 */}
                            <Pie
                              data={incomeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              dataKey="value"
                              paddingAngle={2}
                              isAnimationActive={false}
                              activeIndex={activeIncomeIndex}
                              activeShape={(props: PieSectorDataItem) => {
                                const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill = '#000' } = props;
                                return (
                                  <g>
                                    <Sector
                                      cx={Number(cx)}
                                      cy={Number(cy)}
                                      innerRadius={Number(innerRadius) - 3}
                                      outerRadius={Number(outerRadius) + 8}
                                      startAngle={Number(startAngle)}
                                      endAngle={Number(endAngle)}
                                      fill={String(fill)}
                                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))', transition: 'all 0.3s ease' }}
                                    />
                                  </g>
                                );
                              }}
                              onMouseEnter={(_, index) => setActiveIncomeIndex(index)}
                              onMouseLeave={() => setActiveIncomeIndex(-1)}
                            >
                              {incomeDistribution.map((entry, index) => (
                                <Cell key={index} fill={entry.color} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)}
                              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                          Keine Daten verfügbar
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 mt-4">
                      {incomeDistribution.map((item, index) => {
                        const pct = (item.value / totalIncomeForPct) * 100;
                        const isActive = activeIncomeIndex === index;
                        return (
                          <div
                            key={item.name}
                            className={`flex items-center justify-between text-sm px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer ${isActive ? 'bg-gray-100 scale-[1.02]' : 'hover:bg-gray-50'}`}
                            onMouseEnter={() => setActiveIncomeIndex(index)}
                            onMouseLeave={() => setActiveIncomeIndex(-1)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full transition-transform duration-200 ${isActive ? 'scale-125' : ''}`} style={{ backgroundColor: item.color }} />
                              <span className={`transition-colors duration-200 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{formatCurrency(item.value)}</span>
                              <span className="text-gray-400 text-xs">({formatPercent(pct)})</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Vermögensverteilung */}
                  <Card className="!p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Vermögensverteilung</h3>
                    <div className="h-48" style={{ animation: 'pieChartFadeIn 0.7s ease-out' }}>
                      {assetDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            {/* @ts-ignore - activeIndex works at runtime in recharts v3 */}
                            <Pie
                              data={assetDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              dataKey="value"
                              paddingAngle={2}
                              isAnimationActive={false}
                              activeIndex={activeAssetIndex}
                              activeShape={(props: PieSectorDataItem) => {
                                const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill = '#000' } = props;
                                return (
                                  <g>
                                    <Sector
                                      cx={Number(cx)}
                                      cy={Number(cy)}
                                      innerRadius={Number(innerRadius) - 3}
                                      outerRadius={Number(outerRadius) + 8}
                                      startAngle={Number(startAngle)}
                                      endAngle={Number(endAngle)}
                                      fill={String(fill)}
                                      style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))', transition: 'all 0.3s ease' }}
                                    />
                                  </g>
                                );
                              }}
                              onMouseEnter={(_, index) => setActiveAssetIndex(index)}
                              onMouseLeave={() => setActiveAssetIndex(-1)}
                            >
                              {assetDistribution.map((entry, index) => (
                                <Cell key={index} fill={entry.color} style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} />
                              ))}
                            </Pie>
                            <Tooltip
                              formatter={(value) => formatCurrency(typeof value === 'number' ? value : 0)}
                              contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                          Keine Daten verfügbar
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 mt-4">
                      {assetDistribution.map((item, index) => {
                        const isActive = activeAssetIndex === index;
                        return (
                          <div
                            key={item.name}
                            className={`flex items-center justify-between text-sm px-2 py-1 rounded-lg transition-all duration-200 cursor-pointer ${isActive ? 'bg-gray-100 scale-[1.02]' : 'hover:bg-gray-50'}`}
                            onMouseEnter={() => setActiveAssetIndex(index)}
                            onMouseLeave={() => setActiveAssetIndex(-1)}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full transition-transform duration-200 ${isActive ? 'scale-125' : ''}`} style={{ backgroundColor: item.color }} />
                              <span className={`transition-colors duration-200 ${isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>{item.name}</span>
                            </div>
                            <span className="font-semibold">{formatCurrency(item.value)}</span>
                          </div>
                        );
                      })}
                      <div className="pt-3 border-t border-gray-100 flex justify-between font-bold">
                        <span>Gesamt</span>
                        <span className="text-[#059669]">{formatCurrency(totalAssetsValue)}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Allocation & Liquidity Row */}
                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Empfohlene Einkommensverteilung mit Ampelsystem */}
                  <Card className="!p-5 sm:!p-6">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-gray-900">Empfohlene Einkommensverteilung</h3>
                      <span className="text-xs font-medium text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">90% gewichtet</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">Wie nah sind Sie am Zielwert?</p>
                    <div className="space-y-2">
                      {(() => {
                        let goodCount = 0;
                        const items = recommendedAllocation.map((item) => {
                          const istPct = (item.ist / totalIncomeForPct) * 100;
                          const targetAmount = (item.targetPct / 100) * totalIncomeForPct;
                          const deltaAmount = item.ist - targetAmount;
                          const deltaPct = Math.abs(istPct - item.targetPct);

                          // Ampel-Status: ≤3.5% grün, 3.5-12% gelb, >12% rot
                          let status: 'green' | 'yellow' | 'red';
                          let statusLabel: string;
                          let statusBg: string;
                          let statusText: string;
                          let statusIcon: string;
                          let points = 0;

                          if (deltaPct <= 3.5) {
                            status = 'green';
                            statusLabel = 'Optimal';
                            statusBg = 'bg-green-100';
                            statusText = 'text-green-700';
                            statusIcon = '✓';
                            points = 2;
                          } else if (deltaPct <= 12) {
                            status = 'yellow';
                            statusLabel = 'Akzeptabel';
                            statusBg = 'bg-amber-100';
                            statusText = 'text-amber-700';
                            statusIcon = '~';
                            points = 1;
                          } else {
                            status = 'red';
                            statusLabel = 'Anpassen';
                            statusBg = 'bg-red-100';
                            statusText = 'text-red-700';
                            statusIcon = '!';
                            points = 0;
                          }
                          goodCount += points;

                          // Ampel-Farben für den Balken
                          const barColor = status === 'green' ? '#10b981' : status === 'yellow' ? '#f59e0b' : '#ef4444';

                          return { item, istPct, targetAmount, deltaAmount, deltaPct, status, statusLabel, statusBg, statusText, statusIcon, barColor };
                        });

                        return (
                          <>
                            {items.map(({ item, istPct, deltaAmount, status, statusLabel, statusBg, statusText, statusIcon, barColor }) => (
                              <div key={item.label} className="p-3 bg-gray-50 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${status === 'green' ? 'bg-green-500' : status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                    <span className="font-medium text-gray-900 text-sm">{item.label}</span>
                                  </div>
                                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBg} ${statusText}`}>
                                    {statusIcon} {statusLabel}
                                  </span>
                                </div>

                                {/* Fortschrittsbalken */}
                                <div className="relative h-3 bg-gray-200 rounded-full overflow-visible mb-5">
                                  <div
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{
                                      width: `${Math.min(istPct, 100)}%`,
                                      backgroundColor: barColor
                                    }}
                                  />
                                  {item.targetPct > 0 && (
                                    <div
                                      className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-gray-800 rounded"
                                      style={{ left: `${Math.min(item.targetPct, 100)}%` }}
                                    >
                                      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-600 whitespace-nowrap">
                                        {item.targetPct}%
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Werte-Zeile */}
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-3">
                                    <span className="text-gray-500">Ist: <span className="font-semibold text-gray-800">{formatPercent(istPct)}</span></span>
                                    <span className="text-gray-300">|</span>
                                    <span className="text-gray-500">Ziel: <span className="font-semibold">{item.targetPct}%</span></span>
                                  </div>
                                  {Math.abs(deltaAmount) >= 1 && (
                                    <span className={`text-xs font-bold ${deltaAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                      {deltaAmount > 0 ? `−${formatCurrency(Math.abs(deltaAmount))}` : `+${formatCurrency(Math.abs(deltaAmount))}`}
                                    </span>
                                  )}
                                  {Math.abs(deltaAmount) < 1 && (
                                    <span className="text-xs font-semibold text-green-600">✓</span>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* Liquidität – 3×Netto-Ziel (separat) */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${liqStatus === 'green' ? 'bg-green-500' : liqStatus === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                  <span className="font-medium text-gray-900 text-sm">Liquidität</span>
                                  <span className="text-[10px] text-gray-400 font-normal">(3× Netto)</span>
                                </div>
                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  liqStatus === 'green' ? 'bg-green-100 text-green-700' :
                                  liqStatus === 'yellow' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {liqStatus === 'green' ? '✓' : liqStatus === 'yellow' ? '~' : '!'} {liqStatusLabel}
                                </span>
                              </div>

                              {/* Fortschrittsbalken mit 3×Netto-Zielstrich */}
                              <div className="relative h-3 bg-gray-200 rounded-full overflow-visible mb-5">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${Math.min(liqVisualIstPos, 100)}%`,
                                    backgroundColor: liqStatus === 'green' ? '#10b981' : liqStatus === 'yellow' ? '#f59e0b' : '#ef4444'
                                  }}
                                />
                                {/* Zielstrich bei 100% = 3×Netto (skaliert) */}
                                <div
                                  className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-gray-800 rounded"
                                  style={{ left: `${Math.min(liqVisualTargetPos, 100)}%` }}
                                >
                                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-600 whitespace-nowrap">
                                    3× Netto
                                  </div>
                                </div>
                              </div>

                              {/* Werte-Zeile */}
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-500">Ist: <span className="font-semibold text-gray-800">{formatCurrency(liqIst)}</span></span>
                                  <span className="text-gray-300">|</span>
                                  <span className="text-gray-500">Ziel: <span className="font-semibold">{formatCurrency(liqTarget)}</span></span>
                                </div>
                                {Math.abs(liqIst - liqTarget) >= 1 && (
                                  <span className={`text-xs font-bold ${liqIst >= liqTarget ? 'text-green-600' : 'text-red-600'}`}>
                                    {liqIst >= liqTarget ? `+${formatCurrency(liqIst - liqTarget)}` : `−${formatCurrency(liqTarget - liqIst)}`}
                                  </span>
                                )}
                                {Math.abs(liqIst - liqTarget) < 1 && (
                                  <span className="text-xs font-semibold text-green-600">✓</span>
                                )}
                              </div>
                            </div>

                            {/* Zusammenfassung */}
                            {(() => {
                              const totalScore = goodCount + liqPoints;
                              return (
                                <div className="mt-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium text-gray-700 text-sm">Gesamtbewertung</span>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-lg font-bold ${totalScore >= 7 ? 'text-green-600' : totalScore >= 4 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {totalScore}/10
                                      </span>
                                      <span className={`w-3.5 h-3.5 rounded-full ${totalScore >= 7 ? 'bg-green-500' : totalScore >= 4 ? 'bg-amber-500' : 'bg-red-500'}`} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </>
                        );
                      })()}
                    </div>
                  </Card>

                  {/* Liquiditätsziel mit Erklärung und Kennzahlen */}
                  <Card className="!p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Liquiditätsziel</h3>
                    <div className="p-4 bg-blue-50 rounded-xl mb-4">
                      <p className="text-sm text-blue-800 leading-relaxed">
                        <span className="font-semibold">Richtwert für eine stabile Liquiditätsplanung:</span> Drei Netto-Monatsgehälter als kurzfristig verfügbare Reserve. Kapital oberhalb dieser Sicherheitsreserve kann je nach Risikoprofil schrittweise renditeorientiert investiert werden, um Kaufkraftverluste durch Inflation zu reduzieren.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <Toggle
                        checked={liquidityGoalAuto}
                        onChange={setLiquidityGoalAuto}
                        label="Automatisch berechnen (3× Netto)"
                      />
                      {!liquidityGoalAuto && (
                        <Input
                          label="Manuelles Ziel"
                          type="number"
                          value={liquidityGoal}
                          onChange={(e) => setLiquidityGoal(parseFloat(e.target.value) || 0)}
                          suffix="€"
                        />
                      )}

                      {/* Gauge */}
                      <div className="text-center pt-4">
                        <div className="relative w-44 h-24 mx-auto mb-3">
                          <svg viewBox="0 0 100 50" className="w-full h-full">
                            <path
                              d="M 10 45 A 40 40 0 0 1 90 45"
                              fill="none"
                              stroke="#e5e7eb"
                              strokeWidth="10"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 10 45 A 40 40 0 0 1 90 45"
                              fill="none"
                              stroke={liquidityCoveragePct >= 100 ? "#059669" : liquidityCoveragePct >= 50 ? "#f59e0b" : "#ef4444"}
                              strokeWidth="10"
                              strokeLinecap="round"
                              strokeDasharray={`${Math.max(0, Math.min(isNaN(liquidityCoveragePct) ? 0 : liquidityCoveragePct, 100)) * 1.26} 126`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-end justify-center pb-1">
                            <span className={`text-3xl font-bold ${liquidityCoveragePct >= 100 ? "text-[#059669]" : "text-gray-900"}`}>
                              {Math.round(Math.min(liquidityCoveragePct, 999))}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">
                          Ziel: {formatCurrency(activeLiqGoal)}
                        </p>
                      </div>

                      {/* Kennzahlen */}
                      <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                          <span className="text-xs font-medium text-red-700">Inflationsverlust (pro Jahr)</span>
                        </div>
                        <span className="text-sm font-bold text-red-700">-{formatCurrency(inflationLoss)}</span>
                      </div>

                      <div className="mt-4">
                        <Button
                          variant="primary"
                          className="w-full justify-center py-3"
                          onClick={() => setShowPdfModal(true)}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          PDF erstellen
                        </Button>
                      </div>

                      <PdfRequestModal
                        isOpen={showPdfModal}
                        onClose={() => setShowPdfModal(false)}
                        onGenerate={handlePdfGenerate}
                        title="Cashflow Analyse laden"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Kapitalüberschuss/-defizit</span>
                      <span className={`font-semibold ${capitalSurplus >= 0 ? "text-[#059669]" : "text-red-500"}`}>
                        {capitalSurplus >= 0 ? "+" : ""}{formatCurrency(capitalSurplus)}
                      </span>
                    </div>

                  </Card>
                </div>

                {/* Überschüssige Liquidität - Größerer Chart */}
                <Card className="!p-6 sm:!p-8 lg:!p-10">
                  <SectionHeader
                    icon={
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                    title="Überschüssige Liquidität"
                    subtitle="Simulation der Vermögensentwicklung bei Investition"
                  />

                  <div className="grid lg:grid-cols-5 gap-8">
                    {/* Inputs - schmalere Spalte */}
                    <div className="lg:col-span-2 space-y-5">
                      <div className="p-4 bg-blue-50 rounded-xl mb-4">
                        <p className="text-xs text-blue-700 font-medium mb-1">💡 Automatische Vorbelegung</p>
                        <p className="text-xs text-blue-600">Startkapital und Sparrate basieren auf Ihrem Kapitalüberschuss und freiem Cashflow.</p>
                      </div>
                      <Input
                        label="Startkapital"
                        type="number"
                        value={surplusStartCapital}
                        onChange={(e) => setSurplusStartCapital(parseFloat(e.target.value) || 0)}
                        suffix="€"
                      />
                      <Input
                        label="Monatliche Sparrate"
                        type="number"
                        value={surplusMonthly}
                        onChange={(e) => setSurplusMonthly(parseFloat(e.target.value) || 0)}
                        suffix="€"
                      />
                      <Slider
                        label="Anlagehorizont"
                        valueLabel={`${surplusYears} Jahre`}
                        min={1}
                        max={40}
                        step={1}
                        value={surplusYears}
                        onChange={(e) => setSurplusYears(parseInt(e.target.value))}
                      />
                      <Slider
                        label="Erwartete Rendite"
                        valueLabel={`${surplusReturnRate}%`}
                        min={0}
                        max={15}
                        step={0.5}
                        value={surplusReturnRate}
                        onChange={(e) => setSurplusReturnRate(parseFloat(e.target.value))}
                      />
                      <Slider
                        label="Inflationsrate"
                        valueLabel={`${surplusInflationRate}%`}
                        min={0}
                        max={10}
                        step={0.5}
                        value={surplusInflationRate}
                        onChange={(e) => setSurplusInflationRate(parseFloat(e.target.value))}
                      />
                      <Input
                        label="Guthabenzins"
                        type="number"
                        value={surplusInterestRate}
                        onChange={(e) => setSurplusInterestRate(parseFloat(e.target.value) || 0)}
                        suffix="%"
                        step={0.1}
                      />
                    </div>

                    {/* Chart - größere Spalte auf Desktop */}
                    <div className="lg:col-span-3">
                      <h4 className="text-sm font-semibold text-gray-700 mb-4">Wachstumsprognose</h4>
                      <div className="h-72 md:h-96 lg:h-[450px]">
                        {growthChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={growthChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                              <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                              />
                              <Tooltip
                                formatter={(value, name) => {
                                  const labels: Record<string, string> = {
                                    realSavings: `${(-surplusInflationRate).toFixed(2)}% Kaufkraftverlust`,
                                    nominalSavings: `${(surplusInterestRate - surplusInflationRate).toFixed(2)}% Eff. Guthabenzins`,
                                    realInvestment: `${(surplusReturnRate - surplusInflationRate).toFixed(2)}% Effektive Rendite`
                                  };
                                  return [formatCurrency(typeof value === 'number' ? value : 0), labels[String(name)] || String(name)];
                                }}
                                contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 10px 40px rgba(0,0,0,0.1)" }}
                              />
                              <Line
                                type="monotone"
                                dataKey="realInvestment"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={false}
                                name="realInvestment"
                              />
                              <Line
                                type="monotone"
                                dataKey="nominalSavings"
                                stroke="#f59e0b"
                                strokeWidth={3}
                                dot={false}
                                name="nominalSavings"
                              />
                              <Line
                                type="monotone"
                                dataKey="realSavings"
                                stroke="#2563eb"
                                strokeWidth={3}
                                dot={false}
                                name="realSavings"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Keine Daten verfügbar
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-6 mt-4 text-sm justify-center">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#2563eb]" />
                          <span className="text-gray-600">{(-surplusInflationRate).toFixed(2)}% Kaufkraftverlust</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                          <span className="text-gray-600">{(surplusInterestRate - surplusInflationRate).toFixed(2)}% Eff. Guthabenzins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[#10b981]" />
                          <span className="text-gray-600">{(surplusReturnRate - surplusInflationRate).toFixed(2)}% Effektive Rendite</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Inflationsverlust */}
                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Inflationsverlust</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Gesamt", value: result.lossTotal },
                        { label: "Pro Jahr", value: result.lossYearly },
                        { label: "Pro Monat", value: result.lossMonthly },
                        { label: "Pro Tag", value: result.lossDaily },
                      ].map((item) => (
                        <div key={item.label} className="text-center p-4 bg-red-50 rounded-xl">
                          <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                          <p className="text-xl font-bold text-red-600">{formatCurrency(item.value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

              </div>
            );
          })()}
        </Tabs >
      </div >
    </Layout >
  );
}

