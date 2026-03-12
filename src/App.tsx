import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { CashflowPage } from "@/pages/CashflowPage";
import { PensionPage } from "@/pages/PensionPage";
import { DepotPolicePage } from "@/pages/DepotPolicePage";
import { RuerupPage } from "@/pages/RuerupPage";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/cashflow-analyse" element={<CashflowPage />} />
        <Route path="/rentenrechner" element={<PensionPage />} />
        <Route path="/depot-versus-police" element={<DepotPolicePage />} />
        <Route path="/ruerup-steuervorteil" element={<RuerupPage />} />
      </Routes>
    </BrowserRouter>
  );
}
