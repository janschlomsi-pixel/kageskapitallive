/**
 * Cashflow-Auswertung — Premium PDF Generator
 * Design matches CapitalFlow Finanzgutachten quality.
 */
import jsPDF from "jspdf";
import type { PdfRequestData } from "@/components/ui/PdfRequestModal";
import type { IncomeRow, ExpenseRow, AssetRow } from "./cashflowCalculator";

/* ═══════════════ BRAND COLORS ═══════════════ */
type RGB = readonly [number, number, number];
const C = {
    emerald: [5, 150, 105] as RGB, emeraldDark: [4, 120, 87] as RGB,
    emeraldPale: [209, 250, 229] as RGB, green50: [240, 253, 244] as RGB,
    navy: [15, 23, 42] as RGB, slate700: [51, 65, 85] as RGB,
    slate500: [100, 116, 139] as RGB, slate400: [148, 163, 184] as RGB,
    slate300: [203, 213, 225] as RGB, slate200: [226, 232, 240] as RGB,
    slate100: [241, 245, 249] as RGB, slate50: [248, 250, 252] as RGB,
    white: [255, 255, 255] as RGB,
    blue: [59, 130, 246] as RGB, blueDark: [29, 78, 216] as RGB,
    blueLight: [219, 234, 254] as RGB,
    red: [239, 68, 68] as RGB, redLight: [254, 226, 226] as RGB,
    amber: [245, 158, 11] as RGB, amberLight: [254, 243, 199] as RGB,
    yellow: [234, 179, 8] as RGB, yellowLight: [254, 249, 195] as RGB,
    purple: [139, 92, 246] as RGB, purpleLight: [237, 233, 254] as RGB,
};

/* ═══════════════ LAYOUT ═══════════════ */
const PW = 210; const PH = 297;
const ML = 22; const CW = PW - ML * 2;
const FOOTER_Y = PH - 14;

/* ═══════════════ INPUT TYPE ═══════════════ */
export interface CashflowPdfInput {
    monthlyIncomeRows: IncomeRow[];
    annualIncomeRows: IncomeRow[];
    expensesNecessary: ExpenseRow[];
    expensesOptional: ExpenseRow[];
    insuranceRows: ExpenseRow[];
    assetsShort: AssetRow[];
    assetsMid: AssetRow[];
    assetsLong: AssetRow[];
    targetAllocation: { liabilities: number; insurance: number; liquidity: number; wealth: number; retirement: number };
    liquidityGoal: number;
    surplusStartCapital: number;
    surplusMonthly: number;
    surplusYears: number;
    surplusReturnRate: number;
    surplusInflationRate: number;
    surplusInterestRate: number;
}

export interface CashflowPdfResult {
    incomeMonthlyNet: number;
    freeMonthly: number;
    freeYearly: number;
    liabilitiesMonthly: number;
    insuranceMonthly: number;
    shortValue: number; midValue: number; longValue: number;
    shortMonthly: number; midMonthly: number; longMonthly: number;
    activeLiquidityGoal: number;
    liquidityCoverage: number;
    liquiditySurplus: number;
    growthNominalSavings: { year: number; value: number }[];
    growthRealSavings: { year: number; value: number }[];
    growthRealInvestment: { year: number; value: number }[];
    growthNominalInvestment: { year: number; value: number }[];
    lossTotal: number; lossYearly: number; lossMonthly: number; lossDaily: number;
    recommendedLiquidityGoal: number;
    assetsMonthlyTotal: number;
    expenseNecessaryMonthly: number;
    expenseOptionalMonthly: number;
}

/* ═══════════════ FORMATTERS ═══════════════ */
const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtShort = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
const fmtPct = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " %";
const fmtDate = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

/* ═══════════════ LOW-LEVEL DRAWING ═══════════════ */
const sc = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);
const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
function opacity(d: jsPDF, o: number) { d.setGState(new (d as any).GState({ opacity: o })); }

function softShadow(d: jsPDF, x: number, y: number, w: number, h: number, r: number) {
    sf(d, [0, 0, 0]);
    opacity(d, 0.02); d.roundedRect(x + 0.3, y + 1.5, w, h, r, r, "F");
    opacity(d, 0.03); d.roundedRect(x + 0.15, y + 0.6, w, h, r, r, "F");
    opacity(d, 1);
}

function card(d: jsPDF, x: number, y: number, w: number, h: number, opts?: { fill?: RGB; border?: RGB; noShadow?: boolean; noBorder?: boolean; radius?: number }) {
    const r = opts?.radius ?? 6;
    if (!opts?.noShadow) softShadow(d, x, y, w, h, r);
    sf(d, opts?.fill ?? C.white);
    if (opts?.noBorder) { d.roundedRect(x, y, w, h, r, r, "F"); }
    else { sd(d, opts?.border ?? C.slate200); d.setLineWidth(0.25); d.roundedRect(x, y, w, h, r, r, "FD"); }
}

function drawArc(d: jsPDF, cx: number, cy: number, r: number, startDeg: number, endDeg: number, color: RGB, lineW: number) {
    sd(d, color); d.setLineWidth(lineW);
    const steps = Math.max(60, Math.abs(endDeg - startDeg));
    for (let i = 0; i < steps; i++) {
        const a1 = (startDeg + (endDeg - startDeg) * i / steps) * Math.PI / 180;
        const a2 = (startDeg + (endDeg - startDeg) * (i + 1) / steps) * Math.PI / 180;
        d.line(cx + r * Math.cos(a1), cy + r * Math.sin(a1), cx + r * Math.cos(a2), cy + r * Math.sin(a2));
    }
}

function drawLogo(d: jsPDF, cx: number, cy: number, r: number) {
    sf(d, C.green50); d.circle(cx, cy, r * 1.35, "F");
    sd(d, C.emeraldPale); d.setLineWidth(0.3); d.circle(cx, cy, r * 1.35, "S");
    sf(d, C.emerald); d.circle(cx, cy, r, "F");
    sf(d, C.white);
    const a = r * 0.26, b = r * 0.62;
    d.roundedRect(cx - a, cy - b, a * 2, b * 2, a * 0.4, a * 0.4, "F");
    d.roundedRect(cx - b, cy - a, b * 2, a * 2, a * 0.4, a * 0.4, "F");
}

function drawLogoSmall(d: jsPDF, cx: number, cy: number) {
    sf(d, C.emerald); d.circle(cx, cy, 5.5, "F");
    sf(d, C.white);
    d.roundedRect(cx - 1.1, cy - 3, 2.2, 6, 0.4, 0.4, "F");
    d.roundedRect(cx - 3, cy - 1.1, 6, 2.2, 0.4, 0.4, "F");
}

function iconCircle(d: jsPDF, cx: number, cy: number, color: RGB, symbol: string, sz?: number) {
    const r = sz ?? 5;
    sf(d, C.green50); d.circle(cx, cy, r, "F");
    sd(d, color); d.setLineWidth(0.4); d.circle(cx, cy, r, "S");
    d.setFont("helvetica", "bold"); d.setFontSize(r * 2);
    sc(d, color);
    const tw = d.getTextWidth(symbol);
    d.text(symbol, cx - tw / 2, cy + r * 0.4);
}

let totalPages = 12;

function pageHeader(d: jsPDF, pageNum: number) {
    sf(d, C.emerald); d.rect(0, 0, PW, 1.5, "F");
    sf(d, C.emeraldPale); d.rect(0, 1.5, PW, 0.5, "F");
    drawLogoSmall(d, ML + 5, 15);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre Cashflow-Auswertung", ML + 14, 17.5);
    const arcCx = PW - ML - 5, arcCy = 15, arcR = 7;
    const pct = pageNum / totalPages;
    drawArc(d, arcCx, arcCy, arcR, 0, 360, C.slate200, 1.6);
    if (pct > 0) drawArc(d, arcCx, arcCy, arcR, -90, -90 + pct * 360, C.emerald, 1.8);
    const ea = (-90 + pct * 360) * Math.PI / 180;
    sf(d, C.emerald); d.circle(arcCx + arcR * Math.cos(ea), arcCy + arcR * Math.sin(ea), 1, "F");
    d.setLineWidth(0.2);
}

function pageFooter(d: jsPDF, num: number, name: string) {
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(ML, FOOTER_Y - 5, PW - ML, FOOTER_Y - 5);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text(`©${new Date().getFullYear()} Medizinerberatung Horbach • Finanzgutachten für ${name}`, ML, FOOTER_Y);
    d.text(`${num}`, PW - ML, FOOTER_Y, { align: "right" });
}

function para(d: jsPDF, text: string, y: number, opts?: { w?: number; sz?: number; x?: number; color?: RGB; lh?: number }): number {
    const w = opts?.w ?? CW - 4; const sz = opts?.sz ?? 10.5;
    const x = opts?.x ?? ML + 4; const lh = opts?.lh ?? 5.2;
    d.setFont("helvetica", "normal"); d.setFontSize(sz); sc(d, opts?.color ?? C.slate500);
    const lines = d.splitTextToSize(text, w) as string[];
    lines.forEach((line: string, i: number) => d.text(line, x, y + i * lh));
    return y + lines.length * lh + 2;
}

function hline(d: jsPDF, y: number) { sd(d, C.slate200); d.setLineWidth(0.15); d.line(ML, y, PW - ML, y); }

/* ═══════════════ TABLE HELPER ═══════════════ */
function drawTable(d: jsPDF, x: number, y: number, w: number, headers: string[], rows: string[][], opts?: {
    headerBg?: RGB; boldLastRow?: boolean; colWidths?: number[];
}): number {
    const rowH = 9;
    const headerH = 10;
    const numCols = headers.length;
    const colW = opts?.colWidths ?? headers.map(() => w / numCols);

    // Header
    sf(d, opts?.headerBg ?? C.slate50);
    d.rect(x, y, w, headerH, "F");
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(x, y + headerH, x + w, y + headerH);
    d.setFont("helvetica", "normal"); d.setFontSize(7.5); sc(d, C.slate400);
    let cx = x;
    headers.forEach((h, i) => {
        d.text(h, cx + 4, y + 6.5);
        cx += colW[i];
    });
    y += headerH;

    // Rows
    rows.forEach((row, ri) => {
        if (ri > 0) {
            sd(d, C.slate100); d.setLineWidth(0.1);
            d.line(x + 4, y, x + w - 4, y);
        }
        const isBold = opts?.boldLastRow && ri === rows.length - 1;
        if (isBold) {
            sf(d, C.slate50); d.rect(x, y, w, rowH, "F");
            sd(d, C.slate200); d.setLineWidth(0.15);
            d.line(x, y, x + w, y);
        }
        d.setFont("helvetica", isBold ? "bold" : "normal");
        d.setFontSize(8.5);
        sc(d, isBold ? C.navy : C.slate700);
        cx = x;
        row.forEach((cell, ci) => {
            const align = ci >= 1 && !isNaN(parseFloat(cell.replace(/[^\d,-]/g, ''))) ? "right" : "left";
            if (align === "right") d.text(cell, cx + colW[ci] - 4, y + 6, { align: "right" });
            else d.text(cell, cx + 4, y + 6);
            cx += colW[ci];
        });
        y += rowH;
    });

    return y;
}

/* ════════════════════════════════════════════════════════
   PAGE 1 — COVER
   ════════════════════════════════════════════════════════ */
function pageCover(d: jsPDF, data: PdfRequestData) {
    sf(d, C.emerald); d.rect(0, 0, PW, 3, "F");
    sf(d, C.emeraldPale); d.rect(0, 3, PW, 0.6, "F");
    const cx = PW / 2;

    drawLogo(d, cx, 48, 14);

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.emerald);
    d.text(`Sehr geehrte/r Herr ${data.lastName},`, cx, 80, { align: "center" });

    d.setFont("helvetica", "bold"); d.setFontSize(28); sc(d, C.navy);
    const title = d.splitTextToSize("Ihre persönliche Cashflow-Auswertung", 155) as string[];
    d.text(title, cx, 98, { align: "center" });

    d.setFont("helvetica", "normal"); d.setFontSize(11); sc(d, C.slate500);
    d.text(`Erstellt am ${fmtDate(new Date())}`, cx, 127, { align: "center" });

    // Gradient band
    opacity(d, 0.18); sf(d, C.emeraldPale); d.rect(0, 140, PW, 86, "F");
    opacity(d, 0.25); sf(d, C.green50); d.rect(0, 152, PW, 60, "F");
    opacity(d, 1);

    // Vertical accent
    sd(d, C.emerald); d.setLineWidth(0.8);
    d.line(cx, 138, cx, 224);
    sf(d, C.emerald); d.circle(cx, 144, 1.4, "F");

    // Themed bubbles
    const bubbleSymbols = ["€", "+", "%", "S", "~", "R", "V"];
    const bubbleColors = [C.emerald, C.emerald, C.amber, C.blue, C.emeraldDark, C.amber, C.blue];
    const bubblePos = [
        { x: cx - 56, y: 168 }, { x: cx - 20, y: 160 }, { x: cx + 16, y: 170 },
        { x: cx + 54, y: 162 }, { x: cx - 38, y: 196 }, { x: cx, y: 188 }, { x: cx + 40, y: 198 },
    ];

    sd(d, C.emeraldPale); d.setLineWidth(1.5);
    d.line(cx - 60, 190, cx - 20, 156); d.line(cx - 20, 164, cx + 16, 174);
    d.line(cx + 16, 166, cx + 58, 158);
    d.setLineWidth(1);
    d.line(cx - 42, 200, cx, 184); d.line(cx, 192, cx + 44, 202);

    bubblePos.forEach((b, i) => {
        sf(d, C.slate100); d.circle(b.x, b.y, 12, "F");
        sd(d, C.slate300); d.setLineWidth(0.25); d.circle(b.x, b.y, 12, "S");
        sd(d, bubbleColors[i]); d.setLineWidth(0.8); d.circle(b.x, b.y, 7.5, "S");
        d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, bubbleColors[i]);
        const tw = d.getTextWidth(bubbleSymbols[i]);
        d.text(bubbleSymbols[i], b.x - tw / 2, b.y + 3);
    });

    hline(d, 230);

    const by = 244;
    drawLogoSmall(d, ML + 6, by + 2);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Ihre Ansprechperson", ML + 16, by - 2);
    d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.navy);
    d.text(`${data.firstName} ${data.lastName}`, ML + 16, by + 4);
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(ML + 62, by - 4, ML + 62, by + 8);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate500);
    d.text(data.phone, ML + 68, by - 1);
    d.text(data.email, ML + 68, by + 5);

    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("1", PW - ML, FOOTER_Y, { align: "right" });
}

/* ════════════════════════════════════════════════════════
   PAGE 2 — INTRO (Lead-oriented, no prior contact)
   ════════════════════════════════════════════════════════ */
function pageIntro(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 2);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 40;

    drawLogo(d, PW / 2, y, 10);
    y += 34;

    d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.navy);
    d.text(`Sehr geehrte/r Herr ${data.lastName},`, ML, y);
    y += 20;

    y = para(d, `herzlichen Glückwunsch zu Ihrer Entscheidung, Ihre Finanzplanung auf ein solides Fundament zu stellen. Sie haben den absolut richtigen Schritt gemacht, um Ihre Zukunft optimal zu gestalten. Gemeinsam werden wir in den kommenden Jahren und Jahrzehnten daran arbeiten, Ihre finanziellen Ziele zu erreichen und Ihnen die Sicherheit zu geben, die Sie verdienen.`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 16;

    y = para(d, `Unsere Zusammenarbeit wird Ihnen ermöglichen, nicht nur die Gegenwart, sondern auch Ihre Zukunft mit Zuversicht zu planen. Ich freue mich darauf, Sie auf diesem Weg zu begleiten und Ihnen dabei zu helfen, das Beste aus Ihren finanziellen Möglichkeiten herauszuholen. Sie dürfen sich auf eine sichere und erfolgreiche Zukunft freuen!`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 24;

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Mit besten Grüßen,", ML, y);
    y += 22;

    drawLogoSmall(d, ML + 6, y + 3);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text(`${data.firstName} ${data.lastName}`, ML + 18, y + 2);
    d.setFont("helvetica", "normal"); d.setFontSize(10); sc(d, C.slate400);
    d.text("Ihre Ansprechperson", ML + 18, y + 9);

    pageFooter(d, 2, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 3 — INFO: Wie holen Sie das Beste aus Ihren Finanzen?
   ════════════════════════════════════════════════════════ */
function pageInfo(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 3);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    d.setFont("helvetica", "bold"); d.setFontSize(17); sc(d, C.navy);
    d.text("Wie holen Sie das Beste aus Ihren Finanzen heraus?", ML, y);
    y += 10;

    y = para(d, `Ihre Finanzen sind weit mehr als nur Zahlen — sie sind der Schlüssel zu einem selbstbestimmten, sicheren und erfüllten Leben. Sie entscheiden darüber, welche Träume Sie verwirklichen können, wie flexibel Sie auf Veränderungen reagieren und wie entspannt Sie in die Zukunft blicken können. Doch genau wie bei einem Puzzle fügt sich dieses Bild erst dann vollständig zusammen, wenn alle Teile richtig angeordnet sind.`, y, { sz: 10.5, lh: 5.2, x: ML, w: CW });
    y += 6;

    y = para(d, `Eine klare und durchdachte Finanzplanung ist keine Einschränkung, sondern die Basis, um genau das Leben zu führen, das Sie sich wünschen. Mit Ihrer Cashflow-Auswertung erhalten Sie eine klare Übersicht über Ihre Einnahmen und Ausgaben — und sie zeigt Ihnen, wo Potenziale schlummern, die Sie gezielt nutzen können. Gemeinsam schaffen wir eine Grundlage, die Ihnen hilft, Ihr Einkommen sinnvoll zu strukturieren, ohne auf Ihre Ziele und Wünsche zu verzichten.`, y, { sz: 10.5, lh: 5.2, x: ML, w: CW });
    y += 14;

    // 3 FAQ cards
    const faqs = [
        { q: "Was bedeutet die empfohlene Einkommensverteilung?", a: "Die Einkommensverteilung zeigt Ihnen, wie Sie Ihr Geld am besten zwischen Verbindlichkeiten, Absicherung, Liquidität, Vermögensaufbau und Altersvorsorge aufteilen. Jede Kategorie hat Ihren festen Zweck, damit Sie für heute und morgen bestens abgesichert sind." },
        { q: "Warum ist ein finanzielles Sicherheitsnetz so wichtig?", a: "Ihre kurzfristige Liquidität — oft auch Notgroschen genannt — schützt Sie vor unvorhergesehenen Ausgaben und bietet Ihnen Flexibilität. Sie gibt Ihnen Sicherheit, ohne dass Sie auf langfristige Pläne verzichten müssen." },
        { q: "Welche Rolle spielt die Inflation bei Ihrer Finanzplanung?", a: "Die Inflation beeinflusst direkt, was Ihr Geld in Zukunft noch wert ist. Ohne eine kluge Strategie kann die steigende Inflation die Kaufkraft Ihres Vermögens erheblich schmälern. Mit einer gezielten Finanzplanung sichern Sie sich nicht nur Ihren Lebensstandard, sondern schützen Ihr Vermögen langfristig vor Wertverlust." },
    ];

    faqs.forEach(faq => {
        const qH = 42;
        card(d, ML, y, CW, qH, { radius: 7 });
        iconCircle(d, ML + 14, y + 14, C.emerald, "+", 5);
        d.setFont("helvetica", "bold"); d.setFontSize(10.5); sc(d, C.navy);
        d.text(faq.q, ML + 24, y + 16);
        para(d, faq.a, y + 24, { w: CW - 28, x: ML + 24, sz: 8.5, lh: 4, color: C.slate500 });
        y += qH + 6;
    });

    pageFooter(d, 3, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 4 — EINNAHMEN TABLE
   ════════════════════════════════════════════════════════ */
function pageIncome(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput, res: CashflowPdfResult) {
    pageHeader(d, 4);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    const cardTop = y;
    card(d, ML, y, CW, 240, { radius: 7 });
    y += 12;

    iconCircle(d, ML + 14, y, C.emerald, "€", 6);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Einnahmen", ML + 26, y + 3);
    y += 10;
    para(d, "Hier werden Ihre monatlichen und jährlichen Einnahmen dargestellt.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 12;

    const tw = CW - 16;
    const colW = [tw * 0.42, tw * 0.29, tw * 0.29];

    // Monthly income
    const monthlyRows = inp.monthlyIncomeRows.filter(r => r.net > 0).map(r => [r.name, fmtShort(r.net), fmtShort(r.net * 12)]);
    if (monthlyRows.length > 0) {
        y = drawTable(d, ML + 8, y, CW - 16, ["Monatlich", "Einnahmen netto", "Einnahmen brutto"], monthlyRows, { colWidths: colW });
        y += 4;
    }

    // Annual income
    const annualRows = inp.annualIncomeRows.filter(r => r.net > 0).map(r => [r.name, fmtShort(r.net), ""]);
    if (annualRows.length > 0) {
        y = drawTable(d, ML + 8, y, CW - 16, ["Jährlich", "Einnahmen netto", "Einnahmen brutto"], annualRows, { colWidths: colW });
        y += 4;
    }

    // Totals
    const monthlyTotal = inp.monthlyIncomeRows.reduce((s, r) => s + r.net, 0);
    const annualTotal = inp.annualIncomeRows.reduce((s, r) => s + r.net, 0);
    const totalMonthly = monthlyTotal + annualTotal / 12;
    y = drawTable(d, ML + 8, y, CW - 16, ["", "", ""], [
        ["Gesamt monatlich", fmtShort(totalMonthly), fmtShort(totalMonthly)],
        ["Gesamt jährlich", fmtShort(totalMonthly * 12), fmtShort(totalMonthly * 12)],
    ], { boldLastRow: false, colWidths: colW, headerBg: C.white });

    // Adjust card height
    const cardH = y - cardTop + 12;
    d.setFillColor(255, 255, 255);
    // Redraw card with correct height (overlay trick not ideal but works with jsPDF)

    pageFooter(d, 4, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 5 — AUSGABEN TABLE
   ════════════════════════════════════════════════════════ */
function pageExpenses(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput, res: CashflowPdfResult) {
    pageHeader(d, 5);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    card(d, ML, y, CW, 244, { radius: 7 });
    y += 12;

    iconCircle(d, ML + 14, y, C.red, "-", 5.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Ausgaben", ML + 24, y + 3);
    y += 10;
    para(d, "Hier werden Ihre monatlichen und jährlichen Ausgaben dargestellt.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 12;

    const tw = CW - 16;
    const colW = [tw * 0.50, tw * 0.25, tw * 0.25];

    // Necessary
    const necRows = inp.expensesNecessary.filter(r => r.amount > 0).map(r => [r.name, "monatlich", fmtShort(r.amount)]);
    if (necRows.length > 0) {
        y = drawTable(d, ML + 8, y, CW - 16, ["Notwendig", "Zahlzyklus", "Wert"], necRows, { colWidths: colW });
        y += 4;
    }

    // Optional
    const optRows = inp.expensesOptional.filter(r => r.amount > 0).map(r => [r.name, "monatlich", fmtShort(r.amount)]);
    if (optRows.length > 0) {
        y = drawTable(d, ML + 8, y, CW - 16, ["Nicht notwendig", "Zahlzyklus", "Wert"], optRows, { colWidths: colW });
        y += 4;
    }

    // Totals
    const totalExp = res.expenseNecessaryMonthly + res.expenseOptionalMonthly;
    y = drawTable(d, ML + 8, y, CW - 16, ["", "", ""], [
        ["Gesamt monatlich", "", fmtShort(totalExp)],
        ["Gesamt jährlich", "", fmtShort(totalExp * 12)],
    ], { boldLastRow: false, colWidths: colW, headerBg: C.white });

    pageFooter(d, 5, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 6 — EINNAHMEN (Einkommen) TABLE
   ════════════════════════════════════════════════════════ */
function pageInsurance(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput) {
    pageHeader(d, 6);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    card(d, ML, y, CW, 220, { radius: 7 });
    y += 12;

    iconCircle(d, ML + 14, y, C.amber, "S", 5.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Bestehende Absicherungen", ML + 24, y + 3);
    y += 10;
    para(d, "Hier werden Ihre bestehenden Absicherungen dargestellt.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 12;

    const tw = CW - 16;
    const colW = [tw * 0.38, tw * 0.22, tw * 0.18, tw * 0.22];

    const insRows = inp.insuranceRows.filter(r => r.amount > 0).map(r => [r.name, "", "monatlich", fmtShort(r.amount)]);
    y = drawTable(d, ML + 8, y, CW - 16, ["Art", "Gesellschaft", "Zahlzyklus", "Beitrag"], insRows, { colWidths: colW });
    y += 4;

    const totalIns = inp.insuranceRows.reduce((s, r) => s + r.amount, 0);
    y = drawTable(d, ML + 8, y, CW - 16, ["", "", "", ""], [
        ["Gesamt monatlich", "", "", fmtShort(totalIns)],
        ["Gesamt jährlich", "", "", fmtShort(totalIns * 12)],
    ], { boldLastRow: false, colWidths: colW, headerBg: C.white });

    pageFooter(d, 6, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 7 — VERMÖGENSWERTE TABLE
   ════════════════════════════════════════════════════════ */
function pageAssets(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput) {
    pageHeader(d, 7);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    card(d, ML, y, CW, 230, { radius: 7 });
    y += 12;

    iconCircle(d, ML + 14, y, C.blue, "~", 5.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Vermögenswerte", ML + 24, y + 3);
    y += 10;
    para(d, "Hier werden Ihre Vermögenswerte — aufgeteilt in kurz-, mittel- und langfristig — dargestellt.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 12;

    const tw = CW - 16;
    const colW = [tw * 0.38, tw * 0.17, tw * 0.22, tw * 0.23];

    const sections: { label: string; rows: AssetRow[] }[] = [
        { label: "Kurz", rows: inp.assetsShort },
        { label: "Mittel", rows: inp.assetsMid },
        { label: "Lang", rows: inp.assetsLong },
    ];

    sections.forEach(sec => {
        const rows = sec.rows.filter(r => r.monthly > 0 || r.value > 0).map(r => [r.name, "", fmtShort(r.monthly), fmtShort(r.value)]);
        if (rows.length > 0) {
            y = drawTable(d, ML + 8, y, CW - 16, [sec.label, "Gesellschaft", "monatlich", "Wert"], rows, { colWidths: colW });

            const totalM = sec.rows.reduce((s, r) => s + r.monthly, 0);
            const totalV = sec.rows.reduce((s, r) => s + r.value, 0);
            y = drawTable(d, ML + 8, y, CW - 16, ["", "", "", ""], [
                ["Gesamt", "", fmtShort(totalM), fmtShort(totalV)],
            ], { boldLastRow: true, colWidths: colW, headerBg: C.white });
            y += 4;
        }
    });

    pageFooter(d, 7, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 8 — CASHFLOW OVERVIEW (Donut + freier Cashflow)
   ════════════════════════════════════════════════════════ */
function pageCashflowOverview(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult) {
    pageHeader(d, 8);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    // Top card: Vermögensverteilung donut
    card(d, ML, y, CW, 120, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre aktuelle Vermögensverteilung", ML + 12, y + 18);

    const total = res.incomeMonthlyNet;
    const slices = [
        { label: "Frei", val: res.freeMonthly, c: C.emerald },
        { label: "Verbindlichkeiten", val: res.liabilitiesMonthly, c: C.red },
        { label: "Vermögenswerte", val: res.assetsMonthlyTotal, c: C.blue },
        { label: "Absicherungen", val: res.insuranceMonthly, c: C.amber },
    ];

    const donutCx = ML + 52, donutCy = y + 70, donutR = 30;
    let startDeg = -90;
    slices.forEach(s => {
        const pct = total > 0 ? s.val / total : 0;
        if (pct > 0.005) {
            const sweep = pct * 360;
            drawArc(d, donutCx, donutCy, donutR, startDeg, startDeg + sweep, s.c, 11);
            startDeg += sweep;
        }
    });

    // Center text
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text(fmtShort(total), donutCx, donutCy + 2, { align: "center" });
    d.setFont("helvetica", "normal"); d.setFontSize(6); sc(d, C.slate400);
    d.text("Einkommen/Monat", donutCx, donutCy + 8, { align: "center" });

    // Legend (right side)
    let lx = ML + 96, ly = y + 36;
    slices.forEach(s => {
        const pct = total > 0 ? (s.val / total * 100) : 0;
        sf(d, s.c); d.circle(lx, ly, 2.5, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate500);
        d.text(s.label, lx + 6, ly + 1);
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(fmtPct(pct), lx + 44, ly + 1);
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
        d.text(fmtShort(s.val), lx + 6, ly + 10);
        ly += 22;
    });

    y += 130;

    // Bottom card: Freier Cashflow
    card(d, ML, y, CW, 110, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihr freier Cashflow", ML + 12, y + 18);
    y += 24;

    para(d, "Ihr freier Cashflow zeigt Ihnen, wie viel Geld Ihnen nach Abzug aller Ausgaben monatlich und jährlich zur Verfügung steht. Dieser Wert ist entscheidend für Ihre Sparziele und Investitionen.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 22;

    // Two value cards
    const hw = (CW - 24) / 2;
    card(d, ML + 8, y, hw, 38, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 20, y + 12, C.emerald, "^", 5);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("monatlich", ML + 30, y + 14);
    d.setFont("helvetica", "bold"); d.setFontSize(22); sc(d, C.emerald);
    d.text(fmtShort(res.freeMonthly), ML + 18, y + 30);

    card(d, ML + 8 + hw + 8, y, hw, 38, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 20 + hw + 8, y + 12, C.emerald, "^", 5);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("jährlich", ML + 30 + hw + 8, y + 14);
    d.setFont("helvetica", "bold"); d.setFontSize(22); sc(d, C.emerald);
    d.text(fmtShort(res.freeYearly), ML + 18 + hw + 8, y + 30);

    pageFooter(d, 8, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 9 — EINKOMMENSVERTEILUNG (5 category bars)
   ════════════════════════════════════════════════════════ */
function pageAllocation(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult, inp: CashflowPdfInput) {
    pageHeader(d, 9);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    card(d, ML, y, CW, 238, { radius: 7 });
    y += 12;

    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("So passen Sie Ihre Einkommensverteilung optimal an", ML + 12, y + 2);
    y += 10;
    para(d, "Eine clevere Einkommensverteilung ist der Schlüssel zu finanzieller Sicherheit. Folgende Analyse zeigt Ihnen, wie Sie Ihre Ausgaben effizient aufteilen, um langfristig mehr aus Ihrem Geld zu machen.", y, { sz: 9, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 22;

    const income = res.incomeMonthlyNet;
    const alloc = inp.targetAllocation;
    const categories = [
        { label: "Verbindlichkeiten", pct: alloc.liabilities, ist: res.liabilitiesMonthly, soll: income * alloc.liabilities / 100, color: C.red, desc: "Unter Verbindlichkeiten fällt Ihr täglicher Konsum — von Lebensmitteln bis hin zu Fixkosten wie Miete und andere Haushaltskosten — alles, was für Ihren Lebensstandard unverzichtbar ist." },
        { label: "Absicherungen", pct: alloc.insurance, ist: res.insuranceMonthly, soll: income * alloc.insurance / 100, color: C.amber, desc: "Die Basis für finanzielle Sicherheit — mit wichtigen Versicherungen wie Privathaftpflicht und Einkommenssicherung stellen Sie sicher, dass Sie weder über- noch unterversichert sind." },
        { label: "Liquidität", pct: alloc.liquidity, ist: res.shortMonthly, soll: income * alloc.liquidity / 100, color: C.blue, desc: "Ihr kurzfristiger Vermögensaufbau — ein finanzieller Puffer für 1-5 Jahre, der auf sicheren und leicht zugänglichen Konten wie Sparbüchern oder Tagesgeldkonten gehalten wird." },
        { label: "Vermögensaufbau", pct: alloc.wealth, ist: res.midMonthly, soll: income * alloc.wealth / 100, color: C.purple, desc: "Für mittelfristige Ziele in den nächsten 5-20 Jahren — ideal geeignet sind Anlagen wie Fonds, Immobilien oder Bausparverträge, um gezielt Vermögen aufzubauen." },
        { label: "Altersvorsorge", pct: alloc.retirement, ist: res.longMonthly, soll: income * alloc.retirement / 100, color: C.emeraldDark, desc: "Langfristiger Vermögensaufbau, der Ihren Lebensstandard im Alter sichert — mit staatlich geförderten Lösungen wie der Basisrente, Riester- oder Betriebsrente sowie Privatrente." },
    ];

    categories.forEach(cat => {
        const diff = cat.soll - cat.ist;
        const action = diff > 0 ? "erhöhen" : diff < 0 ? "reduzieren" : "passt";
        const actionColor = diff > 0 ? C.emerald : diff < 0 ? C.red : C.emerald;

        // Color bar on left
        sf(d, cat.color);
        d.roundedRect(ML + 12, y, 7, 30, 3, 3, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(5.5); sc(d, C.white);
        d.text(`${cat.pct}%`, ML + 12, y + 17);

        // Title
        d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
        d.text(cat.label, ML + 26, y + 7);

        // Ist / Soll
        d.setFont("helvetica", "normal"); d.setFontSize(6.5); sc(d, C.slate400);
        d.text("Ist", ML + 76, y + 4); d.text("Soll", ML + 96, y + 4);
        d.setFont("helvetica", "bold"); d.setFontSize(8.5); sc(d, C.navy);
        d.text(fmtShort(cat.ist), ML + 76, y + 10);
        d.text(fmtShort(cat.soll), ML + 96, y + 10);

        // Action badge
        sf(d, actionColor); opacity(d, 0.1);
        d.roundedRect(ML + 116, y + 1, 38, 12, 4, 4, "F");
        opacity(d, 1);
        d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, actionColor);
        d.text(`Um ${fmtShort(Math.abs(diff))} ${action}`, ML + 120, y + 9);
        sf(d, actionColor); d.circle(ML + CW - 16, y + 7, 3, "F");
        sd(d, C.white); d.setLineWidth(0.7);
        if (diff > 0) { d.line(ML + CW - 16, y + 8.5, ML + CW - 16, y + 5.5); d.line(ML + CW - 17, y + 6.5, ML + CW - 16, y + 5.5); d.line(ML + CW - 15, y + 6.5, ML + CW - 16, y + 5.5); }
        else if (diff < 0) { d.line(ML + CW - 16, y + 5.5, ML + CW - 16, y + 8.5); d.line(ML + CW - 17, y + 7.5, ML + CW - 16, y + 8.5); d.line(ML + CW - 15, y + 7.5, ML + CW - 16, y + 8.5); }
        else { d.line(ML + CW - 17.5, y + 6, ML + CW - 16, y + 7.5); d.line(ML + CW - 16, y + 7.5, ML + CW - 14.5, y + 5); }

        // Description
        para(d, cat.desc, y + 15, { sz: 7, lh: 3.2, x: ML + 26, w: CW - 52, color: C.slate400 });

        y += 37;
    });

    pageFooter(d, 9, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 10 — VERMÖGENSVERTEILUNG + LIQUIDITÄTSZIEL
   ════════════════════════════════════════════════════════ */
function pageWealth(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult) {
    pageHeader(d, 10);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    // Top card: Vermögensverteilung
    card(d, ML, y, CW, 110, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre aktuelle Vermögensverteilung", ML + 12, y + 18);

    const totalAssets = res.shortValue + res.midValue + res.longValue;
    const assetSlices = [
        { label: "Kurzfristig", val: res.shortValue, pct: totalAssets > 0 ? res.shortValue / totalAssets * 100 : 0, c: C.blue },
        { label: "Mittelfristig", val: res.midValue, pct: totalAssets > 0 ? res.midValue / totalAssets * 100 : 0, c: C.emerald },
        { label: "Langfristig", val: res.longValue, pct: totalAssets > 0 ? res.longValue / totalAssets * 100 : 0, c: C.navy },
    ];

    const donutCx = ML + 52, donutCy = y + 70, donutR = 28;
    let startDeg = -90;
    assetSlices.forEach(s => {
        if (s.pct > 0.5) {
            drawArc(d, donutCx, donutCy, donutR, startDeg, startDeg + s.pct / 100 * 360, s.c, 10);
            startDeg += s.pct / 100 * 360;
        }
    });

    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text(fmtShort(totalAssets), donutCx, donutCy + 2, { align: "center" });

    let lx = ML + 94, ly = y + 42;
    assetSlices.forEach(s => {
        sf(d, s.c); d.circle(lx, ly, 2.5, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate500);
        d.text(`${s.label} ${fmtPct(s.pct)}`, lx + 6, ly + 1);
        d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
        d.text(fmtShort(s.val), lx + 6, ly + 12);
        ly += 24;
    });

    y += 116;

    // Bottom card: Liquiditätsziel
    card(d, ML, y, CW, 118, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Was sollten Sie kurzfristig zur Verfügung haben?", ML + 12, y + 18);
    y += 22;

    para(d, "Die kurzfristige Liquidität ist Ihr finanzielles Sicherheitsnetz für unerwartete Ausgaben oder Anschaffungen. Oft als Notgroschen bezeichnet, sorgt sie für Flexibilität und Sicherheit.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 16;

    // 3 badges
    const badges = ["Täglich verfügbar", "Ohne Wertschwankungen", "Ausreichend"];
    let bx = ML + 12;
    badges.forEach(b => {
        sf(d, C.emerald); d.circle(bx + 3, y + 2, 3, "F");
        sd(d, C.white); d.setLineWidth(0.6);
        d.line(bx + 1.5, y + 2, bx + 2.5, y + 3.2); d.line(bx + 2.5, y + 3.2, bx + 4.5, y + 0.8);
        d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate700);
        d.text(b, bx + 8, y + 3.5);
        bx += 50;
    });
    y += 12;

    // 3 metric cards
    const mw = (CW - 28) / 3;
    const metrics = [
        { label: "Vorhandene Liquidität", val: res.shortValue, icon: "~", c: C.blue },
        { label: "Liquiditätsziel", val: res.activeLiquidityGoal, icon: "T", c: C.emerald },
        { label: "Kapitalüberschuss", val: res.liquiditySurplus, icon: "%", c: res.liquiditySurplus >= 0 ? C.emerald : C.red },
    ];

    metrics.forEach((m, i) => {
        const mx = ML + 8 + i * (mw + 6);
        card(d, mx, y, mw, 38, { fill: C.white, radius: 5 });
        iconCircle(d, mx + mw / 2, y + 10, m.c, m.icon, 4.5);
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(m.label, mx + mw / 2, y + 22, { align: "center" });
        d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, m.c);
        d.text(fmtShort(m.val), mx + mw / 2, y + 32, { align: "center" });
    });
    y += 42;

    // Result badge
    if (res.liquiditySurplus >= 0) {
        sf(d, C.green50); d.roundedRect(ML + 8, y, CW - 16, 12, 5, 5, "F");
        sd(d, C.emerald); d.setLineWidth(0.15); d.roundedRect(ML + 8, y, CW - 16, 12, 5, 5, "S");
        iconCircle(d, ML + 18, y + 6, C.emerald, "V", 3.5);
        d.setFont("helvetica", "normal"); d.setFontSize(7.5); sc(d, C.slate700);
        d.text("Ziel erreicht! Kapitalüberschuss:", ML + 26, y + 7.5);
        sf(d, C.emerald); d.roundedRect(ML + CW - 48, y + 2, 34, 8, 3, 3, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.white);
        d.text(fmtShort(res.liquiditySurplus), ML + CW - 31, y + 7.5, { align: "center" });
    }

    pageFooter(d, 10, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 11 — INFLATION + HOCHRECHNUNG
   ════════════════════════════════════════════════════════ */
function pageInflation(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult, inp: CashflowPdfInput) {
    pageHeader(d, 11);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    // Top card: Inflation effects
    card(d, ML, y, CW, 108, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Welche negativen Folgen hat zu viel Liquidität?", ML + 12, y + 18);
    y += 24;
    para(d, "Zu viel Geld auf dem Konto? Vorsicht! Durch Inflation verliert Ihr Erspartes an Wert — jedes Jahr wird es weniger wert, obwohl es gleich bleibt.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 18;
    para(d, "Sorgen Sie dafür, dass Ihr Geld für Sie arbeitet, statt stillschweigend zu verschwinden.", y, { sz: 9.5, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 16;

    // Inflation timeline
    const decades = [1970, 1990, 2010, 2030, 2050];
    const euroValues = ["0,60€", "1,20€", "2,20€", "3,50€", "4,50€"];
    const colors = [C.emerald, C.emeraldDark, C.amber, C.red, C.red];
    const timeY = y + 4;
    const startX = ML + 20;
    const stepW = (CW - 40) / 4;

    // Timeline line
    sd(d, C.slate200); d.setLineWidth(0.3);
    d.line(startX, timeY + 18, startX + stepW * 4, timeY + 18);

    decades.forEach((dec, i) => {
        const px = startX + i * stepW;
        // Pillar with value
        const pillH = 14 + i * 5;
        sf(d, colors[i]); opacity(d, 0.15);
        d.roundedRect(px - 8, timeY + 14 - pillH, 16, pillH + 4, 3, 3, "F");
        opacity(d, 1);
        sf(d, colors[i]); d.roundedRect(px - 6, timeY + 14 - pillH + 2, 12, 8, 3, 3, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.white);
        d.text(euroValues[i], px, timeY + 14 - pillH + 7.5, { align: "center" });

        // Year label
        d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.navy);
        d.text(`${dec}`, px, timeY + 26, { align: "center" });
    });

    y = timeY + 34;
    y += 14;

    // Bottom card: Hochrechnung
    card(d, ML, y, CW, 128, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(12.5); sc(d, C.navy);
    const infHead = d.splitTextToSize("Was passiert, wenn Sie Ihr Kapital weiterhin auf dem Konto sparen?", CW - 24) as string[];
    infHead.forEach((line: string, i: number) => d.text(line, ML + 12, y + 16 + i * 6));
    y += 12 + infHead.length * 6 + 4;
    para(d, `In der folgenden Grafik sehen Sie eine Hochrechnung Ihres Anfangskapitals und des monatlichen Überschusses aus Ihrer aktuellen Einkommensverteilung.`, y, { sz: 9, x: ML + 12, w: CW - 20, color: C.slate400 });
    y += 14;

    // Key metrics side by side
    const mw = (CW - 28) / 2;
    card(d, ML + 8, y, mw, 26, { fill: C.white, radius: 5 });
    iconCircle(d, ML + 18, y + 9, C.red, "!", 4);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Kapitalüberschuss", ML + 27, y + 7);
    d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.red);
    d.text(fmtShort(Math.max(0, res.liquiditySurplus)), ML + 27, y + 17);

    card(d, ML + 8 + mw + 12, y, mw, 26, { fill: C.white, radius: 5 });
    iconCircle(d, ML + 18 + mw + 12, y + 9, C.emerald, "+", 4);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Monatlicher Überschuss", ML + 27 + mw + 12, y + 7);
    d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.emerald);
    d.text(fmtShort(res.freeMonthly), ML + 27 + mw + 12, y + 17);

    y += 30;
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text(`${inp.surplusYears} Jahre Laufzeit  •  ${inp.surplusReturnRate.toFixed(2)} % Rendite  •  ${inp.surplusInflationRate.toFixed(2)} % Inflation`, ML + 12, y);
    y += 8;

    // Loss summary card
    sf(d, C.red); opacity(d, 0.05);
    d.roundedRect(ML + 8, y, CW - 16, 34, 5, 5, "F");
    opacity(d, 1);
    sd(d, C.red); d.setLineWidth(0.15);
    d.roundedRect(ML + 8, y, CW - 16, 34, 5, 5, "S");

    iconCircle(d, ML + 20, y + 11, C.red, "!", 4.5);
    d.setFont("helvetica", "bold"); d.setFontSize(9.5); sc(d, C.navy);
    d.text("Gesamtverlust durch Inflation", ML + 30, y + 9);
    d.setFont("helvetica", "bold"); d.setFontSize(15); sc(d, C.red);
    d.text(fmtShort(res.lossTotal), ML + 30, y + 22);

    const losses = [
        { label: "Jährlicher Verlust", val: res.lossYearly },
        { label: "Monatlich", val: res.lossMonthly },
        { label: "Täglich", val: res.lossDaily },
    ];
    losses.forEach((l, i) => {
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(l.label, ML + CW / 2 + 8, y + 8 + i * 9);
        d.setFont("helvetica", "bold"); d.setFontSize(8); sc(d, C.red);
        d.text(fmtShort(l.val), ML + CW - 14, y + 8 + i * 9, { align: "right" });
    });

    pageFooter(d, 11, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 12 — CLOSING
   ════════════════════════════════════════════════════════ */
function pageClosing(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 12);
    const name = `${data.firstName} ${data.lastName}`;
    const cx = PW / 2;

    drawLogo(d, cx, 44, 10);

    let y = 72;
    d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.navy);
    d.text(`Sehr geehrte/r Herr ${data.lastName},`, ML, y);
    y += 20;

    y = para(d, `ich hoffe, diese Cashflow-Auswertung hat Ihnen eine hilfreiche Übersicht und mehr Klarheit über Ihre aktuelle Finanzsituation verschafft. Der entscheidende Punkt ist jetzt die konsequente Umsetzung der Empfehlungen. Nur so werden Sie langfristig von den geplanten Maßnahmen profitieren und sich die finanzielle Sicherheit aufbauen, die Sie sich wünschen.`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 10;

    y = para(d, `Ich freue mich darauf, Sie weiterhin zu begleiten und Sie bei jedem Schritt zu unterstützen. Gemeinsam stellen wir sicher, dass Sie Ihre Ziele erreichen und Ihre finanzielle Situation stetig im Blick behalten. Vielen Dank für Ihr Vertrauen — auf eine erfolgreiche und sichere Zukunft!`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 22;

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Mit besten Grüßen,", ML, y);

    y += 28;

    // Quote card
    const qh = 52;
    card(d, ML, y, CW, qh, { fill: C.slate50, noBorder: true, noShadow: true, radius: 10 });
    sd(d, C.slate200); d.setLineWidth(0.2); d.roundedRect(ML, y, CW, qh, 10, 10, "S");

    sf(d, C.emerald);
    d.roundedRect(cx - 8, y + 6, 5.5, 4.5, 2, 2, "F");
    d.roundedRect(cx - 8, y + 11.5, 3, 2.5, 1, 1, "F");
    d.roundedRect(cx + 1.5, y + 6, 5.5, 4.5, 2, 2, "F");
    d.roundedRect(cx + 1.5, y + 11.5, 3, 2.5, 1, 1, "F");

    d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
    const qt = d.splitTextToSize("\"Es ist schlauer, einen Tag über sein Geld nachzudenken, als einen ganzen Monat dafür zu arbeiten.\"", CW - 50) as string[];
    d.text(qt, cx, y + 24, { align: "center" });

    sf(d, C.emerald); d.circle(cx - 34, y + qh - 8, 4, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    d.text("JR", cx - 36, y + qh - 6.5);
    d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate400);
    d.text("John D. Rockefeller, US-amerikanischer Unternehmer", cx - 27, y + qh - 6.5);

    pageFooter(d, 12, name);
}

/* ═══════════════ MAIN EXPORT ═══════════════ */
export function generateCashflowPdf(data: PdfRequestData, result: CashflowPdfResult, input: CashflowPdfInput) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    totalPages = 12;

    pageCover(doc, data);
    doc.addPage(); pageIntro(doc, data);
    doc.addPage(); pageInfo(doc, data);
    doc.addPage(); pageIncome(doc, data, input, result);
    doc.addPage(); pageExpenses(doc, data, input, result);
    doc.addPage(); pageInsurance(doc, data, input);
    doc.addPage(); pageAssets(doc, data, input);
    doc.addPage(); pageCashflowOverview(doc, data, result);
    doc.addPage(); pageAllocation(doc, data, result, input);
    doc.addPage(); pageWealth(doc, data, result);
    doc.addPage(); pageInflation(doc, data, result, input);
    doc.addPage(); pageClosing(doc, data);

    doc.save(`Cashflow_Auswertung_${data.lastName}_${fmtDate(new Date()).replace(/\./g, "-")}.pdf`);
}
