import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";

// Lazy-load heavy pages (Rechner + PDF-Libs werden nur geladen wenn nötig)
const CashflowPage = lazy(() => import("@/pages/CashflowPage").then(m => ({ default: m.CashflowPage })));
const PensionPage = lazy(() => import("@/pages/PensionPage").then(m => ({ default: m.PensionPage })));
const DepotPolicePage = lazy(() => import("@/pages/DepotPolicePage").then(m => ({ default: m.DepotPolicePage })));
const DatenschutzPage = lazy(() => import("@/pages/DatenschutzPage").then(m => ({ default: m.DatenschutzPage })));
const ImpressumPage = lazy(() => import("@/pages/ImpressumPage").then(m => ({ default: m.ImpressumPage })));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-10 h-10 border-4 border-[#d4af37] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/cashflow-analyse" element={<CashflowPage />} />
          <Route path="/rentenrechner" element={<PensionPage />} />
          <Route path="/depot-versus-police" element={<DepotPolicePage />} />
          <Route path="/datenschutz" element={<DatenschutzPage />} />
          <Route path="/impressum" element={<ImpressumPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
