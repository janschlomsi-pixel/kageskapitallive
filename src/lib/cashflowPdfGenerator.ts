/**
 * Cashflow-Auswertung — Premium PDF Generator
 * Design matches CapitalFlow Finanzgutachten reference.
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
const fmtPct = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " %";
const fmtDate = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

/* ═══════════════ LOW-LEVEL DRAWING ═══════════════ */
const sc = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);
const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);
function opacity(d: jsPDF, o: number) { d.setGState(new (d as any).GState({ opacity: o })); }

function softShadow(d: jsPDF, x: number, y: number, w: number, h: number, r: number, premium?: boolean) {
    sf(d, [0, 0, 0]);
    if (premium) {
        // Ultra-soft 4-layer premium shadow
        opacity(d, 0.008); d.roundedRect(x + 0.8, y + 4, w + 0.4, h + 0.4, r + 1, r + 1, "F");
        opacity(d, 0.012); d.roundedRect(x + 0.5, y + 2.5, w + 0.2, h + 0.2, r, r, "F");
        opacity(d, 0.018); d.roundedRect(x + 0.3, y + 1.2, w, h, r, r, "F");
        opacity(d, 0.025); d.roundedRect(x + 0.1, y + 0.4, w, h, r, r, "F");
    } else {
        opacity(d, 0.02); d.roundedRect(x + 0.3, y + 1.5, w, h, r, r, "F");
        opacity(d, 0.03); d.roundedRect(x + 0.15, y + 0.6, w, h, r, r, "F");
    }
    opacity(d, 1);
}

function card(d: jsPDF, x: number, y: number, w: number, h: number, opts?: { fill?: RGB; border?: RGB; noShadow?: boolean; noBorder?: boolean; radius?: number; premium?: boolean }) {
    const r = opts?.radius ?? 6;
    if (!opts?.noShadow) softShadow(d, x, y, w, h, r, opts?.premium);
    sf(d, opts?.fill ?? C.white);
    if (opts?.noBorder) { d.roundedRect(x, y, w, h, r, r, "F"); }
    else {
        const bw = opts?.premium ? 0.1 : 0.25;
        sd(d, opts?.border ?? C.slate200);
        d.setLineWidth(bw);
        d.roundedRect(x, y, w, h, r, r, "FD");
    }
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

// @ts-ignore — kept as utility
function drawLogo(d: jsPDF, cx: number, cy: number, r: number) {
    sf(d, C.green50); d.circle(cx, cy, r * 1.35, "F");
    sd(d, C.emeraldPale); d.setLineWidth(0.3); d.circle(cx, cy, r * 1.35, "S");
    sf(d, C.emerald); d.circle(cx, cy, r, "F");
    // Draw recycling-style arrows
    sd(d, C.white); d.setLineWidth(r * 0.18);
    drawArc(d, cx, cy, r * 0.48, -30, 150, C.white, r * 0.18);
    drawArc(d, cx, cy, r * 0.48, 150, 330, C.white, r * 0.18);
    // Arrow tips
    const tipR = r * 0.48;
    const tipSize = r * 0.22;
    for (const angle of [-30, 150]) {
        const a = angle * Math.PI / 180;
        const tx = cx + tipR * Math.cos(a);
        const ty = cy + tipR * Math.sin(a);
        sf(d, C.white);
        d.triangle(
            tx + tipSize * Math.cos(a - 0.3), ty + tipSize * Math.sin(a - 0.3),
            tx + tipSize * Math.cos(a + 1.8), ty + tipSize * Math.sin(a + 1.8),
            tx + tipSize * Math.cos(a + 0.8), ty + tipSize * Math.sin(a + 0.8),
            "F"
        );
    }
}

function drawLogoSmall(d: jsPDF, cx: number, cy: number, r = 4.5) {
    // White rounded square background (like reference)
    const boxSize = r * 2.4;
    sf(d, C.white); d.roundedRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize, 2.5, 2.5, "F");
    sd(d, C.slate200); d.setLineWidth(0.15); d.roundedRect(cx - boxSize / 2, cy - boxSize / 2, boxSize, boxSize, 2.5, 2.5, "S");
    // Two green recycling arrows (no filled background)
    const innerR = r * 0.4;
    const lw = r * 0.2;
    drawArc(d, cx, cy, innerR, -30, 150, C.emerald, lw);
    drawArc(d, cx, cy, innerR, 150, 330, C.emerald, lw);
    // Arrow tips
    const tipSize = r * 0.22;
    for (const angle of [-30, 150]) {
        const a = angle * Math.PI / 180;
        const tx = cx + innerR * Math.cos(a);
        const ty = cy + innerR * Math.sin(a);
        sf(d, C.emerald);
        d.triangle(
            tx + tipSize * Math.cos(a - 0.3), ty + tipSize * Math.sin(a - 0.3),
            tx + tipSize * Math.cos(a + 1.8), ty + tipSize * Math.sin(a + 1.8),
            tx + tipSize * Math.cos(a + 0.8), ty + tipSize * Math.sin(a + 0.8),
            "F"
        );
    }
}

function bezierStroke(d: jsPDF, x0: number, y0: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x1: number, y1: number, color: RGB, lineW: number) {
    sd(d, color); d.setLineWidth(lineW);
    const steps = 40;
    for (let i = 0; i < steps; i++) {
        const t1 = i / steps, t2 = (i + 1) / steps;
        const b = (t: number, p0: number, c1: number, c2: number, p1: number) => {
            const mt = 1 - t;
            return mt * mt * mt * p0 + 3 * mt * mt * t * c1 + 3 * mt * t * t * c2 + t * t * t * p1;
        };
        d.line(b(t1, x0, cp1x, cp2x, x1), b(t1, y0, cp1y, cp2y, y1),
               b(t2, x0, cp1x, cp2x, x1), b(t2, y0, cp1y, cp2y, y1));
    }
}

function drawBrandMark(d: jsPDF, cx: number, cy: number) {
    // CapitalFlow swoosh: two flowing leaf strokes forming stylized mark
    // Left leaf: sweeps from lower-left up to upper-right
    bezierStroke(d, cx - 8, cy + 5, cx - 4, cy - 6, cx + 2, cy - 10, cx + 5, cy - 12, C.emerald, 2.5);
    // Right leaf: sweeps from lower-center up and right
    bezierStroke(d, cx - 3, cy + 3, cx + 1, cy - 3, cx + 6, cy - 7, cx + 10, cy - 9, C.emeraldDark, 2.0);
    // Small stem accent
    sd(d, C.emerald); d.setLineWidth(1.0);
    d.line(cx - 1, cy + 2, cx + 1, cy - 3);
}

function iconCircle(d: jsPDF, cx: number, cy: number, color: RGB, symbol: string, sz?: number) {
    const r = sz ?? 5;
    // No fill — clean thin outline only
    sd(d, color); d.setLineWidth(0.5); d.circle(cx, cy, r, "S");

    if (symbol === "lock") {
        // Draw padlock icon
        sd(d, color); d.setLineWidth(0.6);
        const lw = r * 0.55, lh = r * 0.45;
        sf(d, color);
        d.roundedRect(cx - lw / 2, cy - lh * 0.1, lw, lh, 0.5, 0.5, "F");
        drawArc(d, cx, cy - lh * 0.3, r * 0.28, 200, 340, color, 0.6);
    } else if (symbol === "arrow_up") {
        // Draw upward arrow icon
        sd(d, color); d.setLineWidth(0.8);
        d.line(cx, cy + r * 0.3, cx, cy - r * 0.35);
        d.line(cx - r * 0.25, cy - r * 0.1, cx, cy - r * 0.35);
        d.line(cx + r * 0.25, cy - r * 0.1, cx, cy - r * 0.35);
    } else if (symbol === "chart") {
        // Draw trending-up line icon
        sd(d, color); d.setLineWidth(0.7);
        d.line(cx - r * 0.4, cy + r * 0.2, cx - r * 0.1, cy - r * 0.1);
        d.line(cx - r * 0.1, cy - r * 0.1, cx + r * 0.1, cy + r * 0.05);
        d.line(cx + r * 0.1, cy + r * 0.05, cx + r * 0.4, cy - r * 0.3);
    } else if (symbol === "clock") {
        // Clock icon
        sd(d, color); d.setLineWidth(0.5);
        drawArc(d, cx, cy, r * 0.45, 0, 360, color, 0.5);
        d.line(cx, cy - r * 0.25, cx, cy);
        d.line(cx, cy, cx + r * 0.2, cy + r * 0.1);
    } else if (symbol === "wave") {
        // Wave/inflation icon
        sd(d, color); d.setLineWidth(0.6);
        d.line(cx - r * 0.4, cy, cx - r * 0.15, cy - r * 0.25);
        d.line(cx - r * 0.15, cy - r * 0.25, cx + r * 0.15, cy + r * 0.25);
        d.line(cx + r * 0.15, cy + r * 0.25, cx + r * 0.4, cy);
    } else {
        // Draw "+" or "-" symbol centered in circle
        sd(d, color); d.setLineWidth(r * 0.18);
        if (symbol === "+") {
            d.line(cx - r * 0.35, cy, cx + r * 0.35, cy);
            d.line(cx, cy - r * 0.35, cx, cy + r * 0.35);
        } else if (symbol === "-") {
            d.line(cx - r * 0.35, cy, cx + r * 0.35, cy);
        } else {
            d.setFont("helvetica", "bold"); d.setFontSize(r * 1.8);
            sc(d, color);
            const tw = d.getTextWidth(symbol);
            d.text(symbol, cx - tw / 2, cy + r * 0.35);
        }
    }
}

/* ═══════════════ IMAGE HELPERS ═══════════════ */
async function loadImageAsDataUrl(path: string): Promise<string> {
    const resp = await fetch(path);
    const blob = await resp.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

async function createCircularAvatar(imgDataUrl: string, sizePx = 200): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = sizePx;
            canvas.height = sizePx;
            const ctx = canvas.getContext('2d')!;
            ctx.beginPath();
            ctx.arc(sizePx / 2, sizePx / 2, sizePx / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const srcSize = Math.min(img.width, img.height);
            const srcX = (img.width - srcSize) / 2;
            ctx.drawImage(img, srcX, 0, srcSize, srcSize, 0, 0, sizePx, sizePx);
            resolve(canvas.toDataURL('image/png'));
        };
        img.src = imgDataUrl;
    });
}

let totalPages = 12;

/** Render the header refresh-arrows icon as a PNG data URL (matches Pension/Depot SVG style) */
function renderHeaderIconPng(sizePx = 200): string {
    const c = document.createElement('canvas');
    c.width = sizePx; c.height = sizePx;
    const ctx = c.getContext('2d')!;
    const s = sizePx;
    const pad = s * 0.08;

    // Rounded square background — white with subtle border (matches Pension)
    const r = s * 0.22;
    ctx.fillStyle = '#f8f9f7';
    ctx.strokeStyle = '#e5e7e3';
    ctx.lineWidth = s * 0.015;
    ctx.beginPath();
    ctx.roundRect(pad, pad, s - pad * 2, s - pad * 2, r);
    ctx.fill(); ctx.stroke();

    // Two circular arrows — orange #f97316
    const cx = s / 2, cy = s / 2;
    const ar = s * 0.22;
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = s * 0.045;
    ctx.lineCap = 'round';

    // Upper arc (sweeps ~150°)
    ctx.beginPath();
    ctx.arc(cx, cy, ar, Math.PI * 1.2, Math.PI * 1.92);
    ctx.stroke();

    // Lower arc (sweeps ~150°)
    ctx.beginPath();
    ctx.arc(cx, cy, ar, Math.PI * 0.2, Math.PI * 0.92);
    ctx.stroke();

    // Arrowheads — small solid triangles at arc ends
    ctx.fillStyle = '#f97316';
    ctx.lineJoin = 'round';
    const hl = s * 0.08;
    for (const endAngle of [Math.PI * 1.92, Math.PI * 0.92]) {
        const ex = cx + ar * Math.cos(endAngle);
        const ey = cy + ar * Math.sin(endAngle);
        const td = endAngle + Math.PI / 2; // tangent (clockwise)
        ctx.beginPath();
        ctx.moveTo(ex + hl * Math.cos(td), ey + hl * Math.sin(td));
        ctx.lineTo(ex + hl * 0.75 * Math.cos(td + 2.4), ey + hl * 0.75 * Math.sin(td + 2.4));
        ctx.lineTo(ex + hl * 0.75 * Math.cos(td - 2.4), ey + hl * 0.75 * Math.sin(td - 2.4));
        ctx.closePath();
        ctx.fill();
    }

    return c.toDataURL('image/png');
}

const HEADER_H = 22;

let _headerIconPng: string | null = null;
function getHeaderIconPng(): string {
    if (!_headerIconPng) _headerIconPng = renderHeaderIconPng(200);
    return _headerIconPng;
}

function pageHeader(d: jsPDF, pageNum: number) {
    const hdrBg: RGB = [243, 244, 242];    // #f3f4f2 — matches Pension/Depot
    const hdrBorder: RGB = [226, 229, 223]; // #e2e5df
    const progressGreen: RGB = [101, 163, 13]; // #65a30d
    const progressBg: RGB = [210, 216, 206];   // #d2d8ce

    // Full-width grey background strip
    sf(d, hdrBg); d.rect(0, 0, PW, HEADER_H, "F");
    sd(d, hdrBorder); d.setLineWidth(0.3); d.line(0, HEADER_H, PW, HEADER_H);

    // Icon — rendered as PNG image (clean SVG-quality refresh arrows)
    const iconSz = 12;
    const iconX = PW * 0.07; // 7% from left — matches Depot/Pension HTML padding
    const iconY = HEADER_H / 2 - iconSz / 2;
    d.addImage(getHeaderIconPng(), "PNG", iconX, iconY, iconSz, iconSz);

    // Title — bold, 15pt, matching Pension/Depot style
    d.setFont("helvetica", "bold"); d.setFontSize(15); sc(d, C.navy);
    d.text("Deine Cashflow-Auswertung", iconX + iconSz + 4, HEADER_H / 2 + 1.5);

    // Progress ring — green SVG-style ring (matches Pension/Depot)
    const ringR = 5;
    const ringCx = PW - ML - 2;
    const ringCy = HEADER_H / 2;
    const pct = pageNum / totalPages;
    // Background ring
    drawArc(d, ringCx, ringCy, ringR, 0, 360, progressBg, 1.0);
    // Filled progress arc
    if (pct > 0) drawArc(d, ringCx, ringCy, ringR, -90, -90 + pct * 360, progressGreen, 1.2);
    d.setLineWidth(0.2);
}

function pageFooter(d: jsPDF, num: number, name: string) {
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(ML, FOOTER_Y - 5, PW - ML, FOOTER_Y - 5);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text(`©${new Date().getFullYear()} Karges Kapital • Cashflow-Auswertung für ${name}`, ML, FOOTER_Y);
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
    headerBg?: RGB; boldLastRow?: boolean; colWidths?: number[]; isTotalRow?: boolean; totalColor?: RGB;
}): number {
    const rowH = 10;
    const headerH = 11;
    const numCols = headers.length;
    const colW = opts?.colWidths ?? headers.map(() => w / numCols);

    // Header (skip if all empty = total block)
    const hasHeader = headers.some(h => h.length > 0);
    if (hasHeader) {
        sf(d, opts?.headerBg ?? C.slate50);
        d.rect(x, y, w, headerH, "F");
        sd(d, C.slate200); d.setLineWidth(0.15);
        d.line(x, y + headerH, x + w, y + headerH);
        d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
        let cx = x;
        headers.forEach((h, i) => {
            d.text(h, cx + 4, y + 7);
            cx += colW[i];
        });
        y += headerH;
    } else if (opts?.isTotalRow) {
        // Totals get a stronger separator and subtle highlight
        sf(d, C.slate50); d.rect(x, y, w, 1, "F");
        sd(d, C.slate200); d.setLineWidth(0.3);
        d.line(x, y, x + w, y);
        y += 1;
    }

    // Rows
    rows.forEach((row, ri) => {
        if (ri > 0) {
            sd(d, C.slate100); d.setLineWidth(0.1);
            d.line(x + 4, y, x + w - 4, y);
        }
        const isBold = opts?.boldLastRow && ri === rows.length - 1;
        const isTotal = opts?.isTotalRow;
        if (isBold) {
            sf(d, C.slate50); d.rect(x, y, w, rowH, "F");
            sd(d, C.slate200); d.setLineWidth(0.15);
            d.line(x, y, x + w, y);
        }
        d.setFont("helvetica", (isBold || isTotal) ? "bold" : "normal");
        d.setFontSize(8.5);
        let cx = x;
        row.forEach((cell, ci) => {
            const isNumeric = ci >= 1 && !isNaN(parseFloat(cell.replace(/[^\d,-]/g, '')));
            // Use totalColor for numeric cells in total rows
            if (isTotal && isNumeric && opts?.totalColor) {
                sc(d, opts.totalColor);
            } else {
                sc(d, (isBold || isTotal) ? C.navy : C.slate700);
            }
            // Left-align everything (values flush with headers)
            d.text(cell, cx + 4, y + 6);
            cx += colW[ci];
        });
        y += rowH;
    });

    return y;
}

/* ═══════════════ LINE CHART HELPER ═══════════════ */
function drawLineChart(d: jsPDF, x: number, y: number, w: number, h: number,
    datasets: { points: { year: number; value: number }[]; color: RGB; lineW?: number }[]) {
    const maxVal = Math.max(1, ...datasets.flatMap(ds => ds.points.map(p => p.value)));
    const maxYear = Math.max(1, ...datasets.flatMap(ds => ds.points.map(p => p.year)));

    // Y-axis grid lines and labels
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const yPos = y + h - (h * i / ySteps);
        const val = maxVal * i / ySteps;
        sd(d, C.slate100); d.setLineWidth(0.1);
        d.line(x, yPos, x + w, yPos);
        d.setFont("helvetica", "normal"); d.setFontSize(5.5); sc(d, C.slate400);
        if (val >= 1000) d.text(`${Math.round(val / 1000)}k`, x - 2, yPos + 1.5, { align: "right" });
        else d.text(`${Math.round(val)}`, x - 2, yPos + 1.5, { align: "right" });
    }

    // X-axis labels
    const xStep = maxYear <= 10 ? 2 : maxYear <= 25 ? 2 : 5;
    for (let yr = 0; yr <= maxYear; yr += xStep) {
        const xPos = x + (w * yr / maxYear);
        d.setFont("helvetica", "normal"); d.setFontSize(5.5); sc(d, C.slate400);
        d.text(`${yr}`, xPos, y + h + 4, { align: "center" });
    }
    // "Jahre" label
    d.setFont("helvetica", "normal"); d.setFontSize(5); sc(d, C.slate400);
    d.text("Jahre", x + w + 2, y + h + 4);

    // Draw data lines
    datasets.forEach(ds => {
        if (ds.points.length < 2) return;
        sd(d, ds.color); d.setLineWidth(ds.lineW ?? 0.7);
        for (let i = 0; i < ds.points.length - 1; i++) {
            const x1 = x + (w * ds.points[i].year / maxYear);
            const y1 = y + h - (h * Math.max(0, ds.points[i].value) / maxVal);
            const x2 = x + (w * ds.points[i + 1].year / maxYear);
            const y2 = y + h - (h * Math.max(0, ds.points[i + 1].value) / maxVal);
            d.line(x1, y1, x2, y2);
        }
    });
}

/* ═══════════════ MINI DONUT HELPER (stroke-based, kept for inner pages) ═══════════════ */
// @ts-ignore — kept as utility, currently unused after cover migration to drawFilledDonut
function drawMiniDonut(d: jsPDF, cx: number, cy: number, r: number, slices: { pct: number; c: RGB }[], lineW?: number, showLabels?: boolean, labelSize?: number) {
    let startDeg = -90;
    const lw = lineW ?? (r * 0.4);
    const lsz = labelSize ?? 5.5;
    slices.forEach(s => {
        if (s.pct > 0.5) {
            const sweep = s.pct / 100 * 360;
            drawArc(d, cx, cy, r, startDeg, startDeg + sweep, s.c, lw);
            // Draw percentage label on segment
            if (showLabels && s.pct > 4) {
                const midDeg = startDeg + sweep / 2;
                const midRad = midDeg * Math.PI / 180;
                const labelR = r + lw / 2 + 3.5;
                const lx = cx + labelR * Math.cos(midRad);
                const ly = cy + labelR * Math.sin(midRad);
                d.setFont("helvetica", "bold"); d.setFontSize(lsz); sc(d, s.c);
                d.text(`${Math.round(s.pct)}%`, lx, ly + 1.2, { align: "center" });
            }
            startDeg += sweep;
        }
    });
}

/* ═══════════════ SOLID FILLED DONUT (pie-wedge + white center, zero gaps) ═══════════════ */
function drawFilledDonut(d: jsPDF, cx: number, cy: number, outerR: number, thickness: number,
    slices: { pct: number; c: RGB }[], showLabels?: boolean, labelSize?: number) {
    const innerR = outerR - thickness;
    let startDeg = -90;
    const lsz = labelSize ?? 6;

    // Phase 1: Draw filled pie wedges from center → no gaps between adjacent segments
    slices.forEach(s => {
        if (s.pct > 0.5) {
            const sweep = s.pct / 100 * 360;
            sf(d, s.c);
            const steps = Math.max(40, Math.ceil(sweep));
            for (let i = 0; i < steps; i++) {
                const a1 = (startDeg + sweep * i / steps) * Math.PI / 180;
                const a2 = (startDeg + sweep * (i + 1) / steps) * Math.PI / 180;
                d.triangle(cx, cy,
                    cx + outerR * Math.cos(a1), cy + outerR * Math.sin(a1),
                    cx + outerR * Math.cos(a2), cy + outerR * Math.sin(a2), "F");
            }
            startDeg += sweep;
        }
    });

    // Phase 2: Punch out center → creates the donut hole
    sf(d, C.white);
    d.circle(cx, cy, innerR, "F");

    // Phase 3: Percentage labels (drawn after so they're on top)
    startDeg = -90;
    slices.forEach(s => {
        if (s.pct > 0.5) {
            const sweep = s.pct / 100 * 360;
            if (showLabels && s.pct > 4) {
                const midDeg = startDeg + sweep / 2;
                const midRad = midDeg * Math.PI / 180;
                const labelR = outerR + 4;
                const lx = cx + labelR * Math.cos(midRad);
                const ly = cy + labelR * Math.sin(midRad);
                d.setFont("helvetica", "bold"); d.setFontSize(lsz); sc(d, s.c);
                d.text(`${Math.round(s.pct)}%`, lx, ly + 1.2, { align: "center" });
            }
            startDeg += sweep;
        }
    });
}

/* ═══════════════ QUOTE CARD HELPER ═══════════════ */
function drawQuoteCard(d: jsPDF, y: number, quote: string, author: string, initials: string) {
    const qh = 52;
    const cx = PW / 2;
    card(d, ML, y, CW, qh, { fill: C.slate50, noBorder: true, noShadow: true, radius: 10 });
    sd(d, C.slate200); d.setLineWidth(0.2); d.roundedRect(ML, y, CW, qh, 10, 10, "S");

    // Quote marks
    sf(d, C.emerald);
    d.roundedRect(cx - 8, y + 6, 5.5, 4.5, 2, 2, "F");
    d.roundedRect(cx - 8, y + 11.5, 3, 2.5, 1, 1, "F");
    d.roundedRect(cx + 1.5, y + 6, 5.5, 4.5, 2, 2, "F");
    d.roundedRect(cx + 1.5, y + 11.5, 3, 2.5, 1, 1, "F");

    d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
    const qt = d.splitTextToSize(`"${quote}"`, CW - 50) as string[];
    d.text(qt, cx, y + 24, { align: "center" });

    sf(d, C.emerald); d.circle(cx - 34, y + qh - 8, 4, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    d.text(initials, cx - 36, y + qh - 6.5);
    d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate400);
    d.text(author, cx - 27, y + qh - 6.5);
}

/* ════════════════════════════════════════════════════════
   PAGE 1 — COVER (Redesigned to match reference)
   ════════════════════════════════════════════════════════ */
function pageCover(d: jsPDF, _data: PdfRequestData, res: CashflowPdfResult, inp: CashflowPdfInput) {
    const cx = PW / 2;

    /* ── Headline — no logo, starts directly ── */
    d.setFont("helvetica", "bold"); d.setFontSize(48); sc(d, C.navy);
    d.text("Deine Cashflow-", cx, 58, { align: "center" });
    d.text("Auswertung", cx, 73.5, { align: "center" });

    /* ── Subline ── */
    const subY = 82;
    d.setFont("helvetica", "normal"); d.setFontSize(12.5); sc(d, C.slate500);
    const sub = d.splitTextToSize("Deine finanzielle Basis im Überblick – und der Weg zu einer optimalen Einkommensverteilung.", 168) as string[];
    sub.forEach((line: string, i: number) => d.text(line, cx, subY + i * 6, { align: "center" }));

    /* ═══ Card/Chart Cluster — large, editorial overlap composition ═══ */
    const clusterBaseY = subY + sub.length * 6 + 18;

    const income = res.incomeMonthlyNet;
    const alloc = inp.targetAllocation;
    const allocItems = [
        { label: "Altersvorsorge", ist: res.longMonthly, soll: income * alloc.retirement / 100 },
        { label: "Liquidität", ist: res.shortMonthly, soll: income * alloc.liquidity / 100 },
        { label: "Verbindlichkeiten", ist: res.liabilitiesMonthly, soll: income * alloc.liabilities / 100 },
    ];

    /* ── Left card: Vermögensverteilung (anchored lower-left, large) ── */
    const vcx = 12, vcy = clusterBaseY + 34;
    const vcW = 94, vcH = 84;
    card(d, vcx, vcy, vcW, vcH, { radius: 10, premium: true });
    d.setFont("helvetica", "bold"); d.setFontSize(9.5); sc(d, C.navy);
    d.text("Vermögensverteilung", vcx + 10, vcy + 14);

    const totalAssets = res.shortValue + res.midValue + res.longValue;
    const vSlices = [
        { label: "Kurzfristig", pct: totalAssets > 0 ? res.shortValue / totalAssets * 100 : 33, c: C.blue },
        { label: "Mittelfristig", pct: totalAssets > 0 ? res.midValue / totalAssets * 100 : 33, c: C.emerald },
        { label: "Langfristig", pct: totalAssets > 0 ? res.longValue / totalAssets * 100 : 34, c: C.navy },
    ];
    // Solid filled donut — outerR=21, thickness=9
    drawFilledDonut(d, vcx + 30, vcy + 50, 21, 9, vSlices, true, 7);

    // Legend — aligned at donut height, dot vertically centered with text
    let ly = vcy + 38;
    vSlices.forEach(s => {
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate500);
        // Text baseline at ly + 1.0, visual text center ≈ ly + 0.0 → matches dot center at ly
        sf(d, s.c); d.circle(vcx + 60, ly + 0.5, 2.5, "F");
        d.text(s.label, vcx + 65, ly + 1.5);
        ly += 14;
    });

    /* ── Right card: Einkommensverteilung (upper right, dominant) ── */
    const ecx = 102, ecy = clusterBaseY + 2;
    const ecW = 98, ecH = 90;
    card(d, ecx, ecy, ecW, ecH, { radius: 10, premium: true });
    d.setFont("helvetica", "bold"); d.setFontSize(9.5); sc(d, C.navy);
    d.text("Einkommensverteilung", ecx + 10, ecy + 14);

    const total = res.incomeMonthlyNet;
    const eSlices = [
        { label: "Frei", pct: total > 0 ? res.freeMonthly / total * 100 : 0, c: C.emerald },
        { label: "Verbindlichkeiten", pct: total > 0 ? res.liabilitiesMonthly / total * 100 : 0, c: C.red },
        { label: "Vermögenswerte", pct: total > 0 ? res.assetsMonthlyTotal / total * 100 : 0, c: C.blue },
        { label: "Absicherungen", pct: total > 0 ? res.insuranceMonthly / total * 100 : 0, c: C.amber },
    ];
    // Solid filled donut — outerR=21, thickness=9
    drawFilledDonut(d, ecx + 32, ecy + 52, 21, 9, eSlices, true, 7);

    // Legend — aligned at donut height, dot vertically centered with text
    ly = ecy + 30;
    eSlices.forEach(s => {
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate500);
        sf(d, s.c); d.circle(ecx + 62, ly + 0.5, 2.5, "F");
        d.text(s.label, ecx + 67, ly + 1.5);
        ly += 13;
    });

    /* ── Action badge pills — docked to card edges, clean centered text ── */
    const bW = 64, bH = 16;
    const badgePositions = [
        { x: 54, y: clusterBaseY - 6 },
        { x: 6, y: clusterBaseY + 18 },
        { x: ecx + ecW - bW - 2, y: ecy + ecH + 2 },
    ];

    allocItems.forEach((item, i) => {
        const diff = item.soll - item.ist;
        let text: string, badgeColor: RGB, arrowDir: string;
        if (Math.abs(diff) < 1) { text = `${item.label} passend`; badgeColor = C.emerald; arrowDir = "check"; }
        else if (diff > 0) { text = `${item.label} erhöhen`; badgeColor = C.amber; arrowDir = "up"; }
        else { text = `${item.label} senken`; badgeColor = C.red; arrowDir = "down"; }

        const bx = badgePositions[i].x, by = badgePositions[i].y;
        card(d, bx, by, bW, bH, { radius: 9, premium: true });

        // Text — vertically centered in badge
        d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.navy);
        d.text(text, bx + 9, by + bH / 2 + 2.5);

        // Icon circle — clean arrow or checkmark
        const iconR = 3.5;
        sf(d, badgeColor); d.circle(bx + bW - 10, by + bH / 2, iconR, "F");
        sd(d, C.white); d.setLineWidth(0.7);
        const icx = bx + bW - 10, icy = by + bH / 2;
        if (arrowDir === "up") {
            d.line(icx, icy + 1.8, icx, icy - 1.8);
            d.line(icx - 1.5, icy - 0.2, icx, icy - 1.8);
            d.line(icx + 1.5, icy - 0.2, icx, icy - 1.8);
        } else if (arrowDir === "down") {
            d.line(icx, icy - 1.8, icx, icy + 1.8);
            d.line(icx - 1.5, icy + 0.2, icx, icy + 1.8);
            d.line(icx + 1.5, icy + 0.2, icx, icy + 1.8);
        } else {
            // Clean checkmark
            d.line(icx - 1.6, icy + 0.2, icx - 0.3, icy + 1.5);
            d.line(icx - 0.3, icy + 1.5, icx + 1.8, icy - 1.3);
        }
    });

    /* ── Footer ── */
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("1", PW - ML, FOOTER_Y, { align: "right" });
}

/* ════════════════════════════════════════════════════════
   PAGE 2 — INTRO (Letter with signature)
   ════════════════════════════════════════════════════════ */
function pageIntro(d: jsPDF, data: PdfRequestData, avatarImg: string) {
    const name = `${data.firstName} ${data.lastName}`;

    // Standard header (matching all other pages)
    pageHeader(d, 2);

    // Card container (matches Pension p2 style)
    const cardX = ML - 4;
    const cardY = HEADER_H + 12;
    const cardW = CW + 8;
    const cardH = 180;
    const cardR = 7;
    const cardPad = 12;

    // Card background with subtle border and shadow
    sf(d, [248, 250, 252]); // very light shadow underneath
    d.roundedRect(cardX + 0.5, cardY + 0.8, cardW, cardH, cardR, cardR, "F");
    sf(d, C.white);
    sd(d, C.slate200); d.setLineWidth(0.3);
    d.roundedRect(cardX, cardY, cardW, cardH, cardR, cardR, "FD");

    const innerX = cardX + cardPad;
    const innerW = cardW - cardPad * 2;
    let y = cardY + cardPad + 6;

    // Greeting — bold, larger
    d.setFont("helvetica", "bold"); d.setFontSize(16); sc(d, C.navy);
    d.text(`Hey ${data.firstName},`, innerX, y);
    y += 16;

    // Body text — larger, more line height
    y = para(d, `es freut mich, dass du dich mit deiner finanziellen Situation auseinandergesetzt hast. Einen ehrlichen Überblick über die eigenen Finanzen zu haben, ist die Grundlage für jede sinnvolle Entscheidung – egal ob es um Vermögensaufbau, Absicherung oder Optimierung geht.`, y, { sz: 12, lh: 7, x: innerX, w: innerW, color: C.slate500 });
    y += 12;

    y = para(d, `In dieser Auswertung findest du deine Einnahmen, Ausgaben, Vermögenswerte und Absicherungen übersichtlich aufbereitet. Du siehst auf einen Blick, wie dein Einkommen aktuell verteilt ist und wo du im Vergleich zu einer empfohlenen Struktur stehst.`, y, { sz: 12, lh: 7, x: innerX, w: innerW, color: C.slate500 });
    y += 12;

    y = para(d, `Nimm dir einen Moment und geh die folgenden Seiten in Ruhe durch.`, y, { sz: 12, lh: 7, x: innerX, w: innerW, color: C.slate500 });
    y += 16;

    // Grußformel
    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Beste Grüße,", innerX, y);
    y += 14;

    // Avatar with name
    d.addImage(avatarImg, "PNG", innerX, y - 2, 16, 16);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text("Julian Karges", innerX + 22, y + 7);

    pageFooter(d, 2, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 3 — INFO: Wie holst du das Beste aus deinen Finanzen?
   ════════════════════════════════════════════════════════ */
function pageInfo(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 3);
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 12;

    // Heading — good spacing from header, slightly grey tone
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.slate700);
    d.text("Wie holst du das Beste aus deinen Finanzen heraus?", ML, y);
    y += 10;

    // Body text — lighter grey, more line height for readability
    y = para(d, `Deine Finanzen sind weit mehr als nur Zahlen – sie sind der Schlüssel zu einem selbstbestimmten, sicheren und erfüllten Leben. Sie entscheiden darüber, welche Träume du verwirklichen kannst, wie flexibel du auf Veränderungen reagierst und wie entspannt du in die Zukunft blicken kannst. Doch genau wie bei einem Puzzle fügt sich dieses Bild erst dann vollständig zusammen, wenn alle Teile richtig angeordnet sind.`, y, { sz: 9.5, lh: 5, x: ML, w: CW, color: C.slate500 });
    y += 3;

    y = para(d, `Eine klare und durchdachte Finanzplanung ist keine Einschränkung, sondern die Basis, um genau das Leben zu führen, das du dir wünschst. Mit deiner Cashflow-Auswertung erhältst du eine klare Übersicht über deine Einnahmen und Ausgaben – und sie zeigt dir, wo Potenziale schlummern, die du gezielt nutzen kannst. Gemeinsam schaffen wir eine Grundlage, die dir hilft, dein Einkommen sinnvoll zu strukturieren, ohne auf deine Ziele und Wünsche zu verzichten.`, y, { sz: 9.5, lh: 5, x: ML, w: CW, color: C.slate500 });
    y += 10;

    // 3 FAQ cards — grey background, clean icon, better typography
    const faqs = [
        { q: "Was bedeutet die empfohlene Einkommensverteilung?", a: "Die Einkommensverteilung zeigt dir, wie du dein Geld am besten zwischen Verbindlichkeiten, Absicherung, Liquidität, Vermögensaufbau und Altersvorsorge aufteilst. Jede Kategorie hat ihren festen Zweck, damit du für heute und morgen bestens abgesichert bist." },
        { q: "Warum ist ein finanzielles Sicherheitsnetz so wichtig?", a: `Deine kurzfristige Liquidität – oft „Notgroschen" genannt – schützt dich vor unvorhergesehenen Ausgaben und bietet dir Flexibilität. Sie gibt dir Sicherheit, ohne dass du auf langfristige Pläne verzichten musst.` },
        { q: "Welche Rolle spielt die Inflation bei deiner Finanzplanung?", a: "Die Inflation beeinflusst direkt, was dein Geld in Zukunft noch wert ist. Ohne eine kluge Strategie kann die steigende Inflation die Kaufkraft deines Vermögens erheblich schmälern. Mit einer gezielten Finanzplanung sicherst du dir nicht nur deinen Lebensstandard, sondern schützt dein Vermögen langfristig vor Wertverlust." },
    ];

    faqs.forEach(faq => {
        d.setFontSize(9.5);
        const aLines = d.splitTextToSize(faq.a, CW - 28) as string[];
        const cardPadY = 12;
        const qLineH = 9;
        const answerH = aLines.length * 4.8;
        const qH = cardPadY + qLineH + answerH + 10;

        // Very light background card with subtle border
        sf(d, C.white); d.roundedRect(ML, y, CW, qH, 6, 6, "F");
        sd(d, C.slate200); d.setLineWidth(0.3); d.roundedRect(ML, y, CW, qH, 6, 6, "S");

        // Circle with "+" — emerald green (matching reference)
        const iconCx = ML + 13, iconCy = y + cardPadY + 1.5;
        const iconR = 3.5;
        sd(d, C.emerald); d.setLineWidth(0.6); d.circle(iconCx, iconCy, iconR, "S");
        sd(d, C.emerald); d.setLineWidth(0.6);
        d.line(iconCx - 1.6, iconCy, iconCx + 1.6, iconCy);
        d.line(iconCx, iconCy - 1.6, iconCx, iconCy + 1.6);

        // Question — bold, dark
        d.setFont("helvetica", "bold"); d.setFontSize(10.5); sc(d, C.navy);
        d.text(faq.q, ML + 21, y + cardPadY + 2.5);

        // Answer — slightly larger, medium grey, tight below heading
        para(d, faq.a, y + cardPadY + qLineH + 1, { w: CW - 28, x: ML + 21, sz: 9.5, lh: 4.8, color: C.slate400 });

        y += qH + 6;
    });

    pageFooter(d, 3, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 4 — EINNAHMEN TABLE
   ════════════════════════════════════════════════════════ */
function pageIncome(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput, _res: CashflowPdfResult) {
    pageHeader(d, 4);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    card(d, ML - 2, y, CW + 4, 235, { radius: 7 });
    y += 12;

    // Clean green icon (matching reference)
    iconCircle(d, ML + 12, y, C.emerald, "+", 4.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Einnahmen", ML + 22, y + 2.5);
    y += 10;
    para(d, "Hier werden deine monatlichen und jährlichen Einnahmen dargestellt.", y, { sz: 9.5, x: ML + 8, w: CW - 12, color: C.slate400 });
    y += 12;

    const tblX = ML + 4;
    const tblW = CW - 4;
    const colW = [tblW * 0.40, tblW * 0.30, tblW * 0.30];

    // Monthly income
    const monthlyRows = inp.monthlyIncomeRows.filter(r => r.net > 0).map(r => [r.name, fmt(r.net), fmt(r.net)]);
    if (monthlyRows.length > 0) {
        y = drawTable(d, tblX, y, tblW, ["Monatlich", "Einnahmen netto", "Einnahmen brutto"], monthlyRows, { colWidths: colW });
        y += 4;
    }

    // Annual income
    const annualRows = inp.annualIncomeRows.filter(r => r.net > 0).map(r => [r.name, fmt(r.net), fmt(0)]);
    if (annualRows.length > 0) {
        y = drawTable(d, tblX, y, tblW, ["Jährlich", "Einnahmen netto", "Einnahmen brutto"], annualRows, { colWidths: colW });
        y += 4;
    }

    // Totals
    const monthlyTotal = inp.monthlyIncomeRows.reduce((s, r) => s + r.net, 0);
    const annualTotal = inp.annualIncomeRows.reduce((s, r) => s + r.net, 0);
    const totalMonthly = monthlyTotal + annualTotal / 12;
    sf(d, C.slate50); d.roundedRect(tblX, y, tblW, 20, 0, 0, "F");
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(tblX, y, tblX + tblW, y);
    y = drawTable(d, tblX, y, tblW, ["", "", ""], [
        ["Gesamt monatlich", fmt(totalMonthly), fmt(monthlyTotal)],
        ["Gesamt jährlich", fmt(totalMonthly * 12), fmt(monthlyTotal * 12)],
    ], { boldLastRow: false, colWidths: colW, headerBg: C.slate50, isTotalRow: true });

    pageFooter(d, 4, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 5 — AUSGABEN TABLE
   ════════════════════════════════════════════════════════ */
function pageExpenses(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput, res: CashflowPdfResult) {
    pageHeader(d, 5);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    card(d, ML - 2, y, CW + 4, 244, { radius: 7 });
    y += 12;

    // Clean red icon (smaller, matching page 4 style)
    iconCircle(d, ML + 12, y, C.red, "-", 4.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Ausgaben", ML + 22, y + 2.5);
    y += 10;
    para(d, "Hier werden deine monatlichen und jährlichen Ausgaben dargestellt.", y, { sz: 9.5, x: ML + 8, w: CW - 12, color: C.slate400 });
    y += 12;

    const tblX = ML + 4;
    const tblW = CW - 4;
    const colW = [tblW * 0.50, tblW * 0.25, tblW * 0.25];

    // Necessary
    const necRows = inp.expensesNecessary.filter(r => r.amount > 0).map(r => [r.name, "monatlich", fmt(r.amount)]);
    if (necRows.length > 0) {
        y = drawTable(d, tblX, y, tblW, ["Notwendig", "Zahlzyklus", "Wert"], necRows, { colWidths: colW });
        y += 4;
    }

    // Optional
    const optRows = inp.expensesOptional.filter(r => r.amount > 0).map(r => [r.name, "monatlich", fmt(r.amount)]);
    if (optRows.length > 0) {
        y = drawTable(d, tblX, y, tblW, ["Nicht notwendig", "Zahlzyklus", "Wert"], optRows, { colWidths: colW });
        y += 4;
    }

    // Totals
    const totalExp = res.expenseNecessaryMonthly + res.expenseOptionalMonthly;
    sf(d, C.slate50); d.roundedRect(tblX, y, tblW, 20, 0, 0, "F");
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(tblX, y, tblX + tblW, y);
    y = drawTable(d, tblX, y, tblW, ["", "", ""], [
        ["Gesamt monatlich", "", fmt(totalExp)],
        ["Gesamt jährlich", "", fmt(totalExp * 12)],
    ], { boldLastRow: false, colWidths: colW, headerBg: C.slate50, isTotalRow: true });

    pageFooter(d, 5, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 6 — VERMÖGENSWERTE TABLE
   ════════════════════════════════════════════════════════ */
function pageAssets(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput) {
    pageHeader(d, 6);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    card(d, ML - 2, y, CW + 4, 230, { radius: 7 });
    y += 12;

    // Clean blue icon (smaller, matching page 4 style)
    iconCircle(d, ML + 12, y, C.blue, "chart", 4.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Vermögenswerte", ML + 22, y + 2.5);
    y += 10;
    para(d, "Hier werden deine Vermögenswerte – aufgeteilt in kurz-, mittel- und langfristig – dargestellt.", y, { sz: 9.5, x: ML + 8, w: CW - 12, color: C.slate400 });
    y += 12;

    const tblX = ML + 4;
    const tblW = CW - 4;
    const colW = [tblW * 0.38, tblW * 0.17, tblW * 0.22, tblW * 0.23];

    const sections: { label: string; rows: AssetRow[] }[] = [
        { label: "Kurz", rows: inp.assetsShort },
        { label: "Mittel", rows: inp.assetsMid },
        { label: "Lang", rows: inp.assetsLong },
    ];

    sections.forEach(sec => {
        const rows = sec.rows.filter(r => r.monthly > 0 || r.value > 0).map(r => [r.name, "", fmt(r.monthly), fmt(r.value)]);
        if (rows.length > 0) {
            y = drawTable(d, tblX, y, tblW, [sec.label, "Gesellschaft", "monatlich", "Wert"], rows, { colWidths: colW });
            const totalM = sec.rows.reduce((s, r) => s + r.monthly, 0);
            const totalV = sec.rows.reduce((s, r) => s + r.value, 0);
            y = drawTable(d, tblX, y, tblW, ["", "", "", ""], [
                ["Gesamt", "", fmt(totalM), fmt(totalV)],
            ], { boldLastRow: true, colWidths: colW, headerBg: C.white });
            y += 4;
        } else {
            y = drawTable(d, tblX, y, tblW, [sec.label, "Gesellschaft", "monatlich", "Wert"], [], { colWidths: colW });
            y = drawTable(d, tblX, y, tblW, ["", "", "", ""], [
                ["Gesamt", "", fmt(0), fmt(0)],
            ], { boldLastRow: true, colWidths: colW, headerBg: C.white });
            y += 4;
        }
    });

    pageFooter(d, 6, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 7 — BESTEHENDE ABSICHERUNGEN
   ════════════════════════════════════════════════════════ */
function pageInsurance(d: jsPDF, data: PdfRequestData, inp: CashflowPdfInput) {
    pageHeader(d, 7);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    card(d, ML - 2, y, CW + 4, 220, { radius: 7 });
    y += 12;

    // Clean amber icon (smaller, matching page 4 style)
    iconCircle(d, ML + 12, y, C.amber, "lock", 4.5);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Bestehende Absicherungen", ML + 22, y + 2.5);
    y += 10;
    para(d, "Hier werden deine bestehenden Absicherungen dargestellt.", y, { sz: 9.5, x: ML + 8, w: CW - 12, color: C.slate400 });
    y += 12;

    const tblX = ML + 4;
    const tblW = CW - 4;
    const colW = [tblW * 0.38, tblW * 0.22, tblW * 0.18, tblW * 0.22];

    const insRows = inp.insuranceRows.filter(r => r.amount > 0).map(r => [r.name, "", "monatlich", fmt(r.amount)]);
    y = drawTable(d, tblX, y, tblW, ["Art", "Gesellschaft", "Zahlzyklus", "Beitrag"], insRows, { colWidths: colW });
    y += 4;

    const totalIns = inp.insuranceRows.reduce((s, r) => s + r.amount, 0);
    sf(d, C.slate50); d.roundedRect(tblX, y, tblW, 20, 0, 0, "F");
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(tblX, y, tblX + tblW, y);
    y = drawTable(d, tblX, y, tblW, ["", "", "", ""], [
        ["Gesamt monatlich", "", "", fmt(totalIns)],
        ["Gesamt jährlich", "", "", fmt(totalIns * 12)],
    ], { boldLastRow: false, colWidths: colW, headerBg: C.slate50, isTotalRow: true });

    pageFooter(d, 7, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 8 — CASHFLOW OVERVIEW (Donut + freier Cashflow + Quote)
   ════════════════════════════════════════════════════════ */
/** Render donut chart as high-res PNG via canvas — perfectly smooth, no gaps */
function renderDonutPng(slices: { pct: number; color: string }[], centerText: string, sizePx = 300): string {
    const c = document.createElement('canvas');
    c.width = sizePx; c.height = sizePx;
    const ctx = c.getContext('2d')!;
    const cx = sizePx / 2, cy = sizePx / 2;
    const outerR = sizePx * 0.46;
    const innerR = sizePx * 0.30;

    let startAngle = -Math.PI / 2;
    slices.forEach(s => {
        if (s.pct > 0.005) {
            const sweep = s.pct * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx, cy, outerR, startAngle, startAngle + sweep);
            ctx.arc(cx, cy, innerR, startAngle + sweep, startAngle, true);
            ctx.closePath();
            ctx.fillStyle = s.color;
            ctx.fill();
            startAngle += sweep;
        }
    });

    // White center
    ctx.beginPath();
    ctx.arc(cx, cy, innerR - 1, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();

    // Center text
    ctx.fillStyle = '#0f172a';
    ctx.font = `bold ${sizePx * 0.09}px -apple-system, Helvetica, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(centerText, cx, cy + 2);

    return c.toDataURL('image/png');
}

function pageCashflowOverview(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult) {
    pageHeader(d, 8);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 6;

    // Top card: Vermögensverteilung donut
    card(d, ML - 2, y, CW + 4, 100, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Deine aktuelle Vermögensverteilung", ML + 10, y + 16);

    const total = res.incomeMonthlyNet;
    const slices = [
        { label: "Frei", val: res.freeMonthly, c: C.emerald, hex: "#059669" },
        { label: "Verbindlichkeiten", val: res.liabilitiesMonthly, c: C.red, hex: "#ef4444" },
        { label: "Vermögenswerte", val: res.assetsMonthlyTotal, c: C.blue, hex: "#3b82f6" },
        { label: "Absicherungen", val: res.insuranceMonthly, c: C.amber, hex: "#f59e0b" },
    ];

    // Donut — canvas-rendered PNG for perfect quality
    const donutSlices = slices.map(s => ({ pct: total > 0 ? s.val / total : 0, color: s.hex }));
    const donutPng = renderDonutPng(donutSlices, fmt(total), 400);
    const donutSz = 50; // mm size in PDF
    const donutX = ML + 6;
    const donutY = y + 24;
    d.addImage(donutPng, "PNG", donutX, donutY, donutSz, donutSz);

    // Legend — 2x2 grid, tight layout matching reference
    const lgLeft = donutX + donutSz + 8;
    const lgRight = lgLeft + 44;

    function drawLegendItem(lx: number, ly: number, s: { label: string; val: number; c: RGB; hex: string }) {
        const pct = total > 0 ? s.val / total * 100 : 0;
        sf(d, s.c); d.circle(lx, ly, 2, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate500);
        d.text(s.label, lx + 5, ly + 1);
        const labelW = d.getTextWidth(s.label);
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(fmtPct(pct), lx + 5 + labelW + 2, ly + 1);
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
        d.text(fmt(s.val), lx + 5, ly + 8);
    }

    const lgY1 = donutY + 10;
    drawLegendItem(lgLeft, lgY1, slices[0]);
    drawLegendItem(lgRight, lgY1, slices[1]);
    const lgY2 = lgY1 + 24;
    drawLegendItem(lgLeft, lgY2, slices[2]);
    drawLegendItem(lgRight, lgY2, slices[3]);

    y += 108;

    // Bottom card: Freier Cashflow
    card(d, ML - 2, y, CW + 4, 100, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Dein freier Cashflow", ML + 10, y + 16);

    para(d, "Dein freier Cashflow zeigt dir, wie viel Geld dir nach Abzug aller Ausgaben monatlich und jährlich zur Verfügung steht. Dieser Wert ist entscheidend für deine Sparziele und Investitionen.", y + 22, { sz: 9.5, x: ML + 10, w: CW - 16, color: C.slate400 });

    // Two value boxes with clean filled arrow icons
    const hw = (CW - 20) / 2;
    const vy = y + 44;

    for (const [idx, { label, value }] of [
        { label: "monatlich", value: res.freeMonthly },
        { label: "jährlich", value: res.freeYearly },
    ].entries()) {
        const bx = ML + 6 + idx * (hw + 8);
        const bcx = bx + hw / 2;
        card(d, bx, vy, hw, 42, { radius: 6, noShadow: true });

        // Clean filled arrow-up circle
        const aCy = vy + 10;
        sf(d, C.emeraldPale); d.circle(bcx, aCy, 4, "F");
        sd(d, C.emerald); d.setLineWidth(0.4); d.circle(bcx, aCy, 4, "S");
        // Filled arrow
        sf(d, C.emerald);
        d.triangle(bcx, aCy - 2.2, bcx - 1.8, aCy + 0.2, bcx + 1.8, aCy + 0.2, "F");
        d.roundedRect(bcx - 0.6, aCy + 0.2, 1.2, 2, 0.3, 0.3, "F");

        d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate400);
        d.text(label, bcx, vy + 20, { align: "center" });
        d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.emerald);
        d.text(fmt(value), bcx, vy + 34, { align: "center" });
    }

    // Quote — green double-quote mark, larger text
    const qy = y + 106;
    d.setFont("helvetica", "bold"); d.setFontSize(24); sc(d, C.emerald);
    d.text("\u201C", PW / 2, qy + 4, { align: "center" });

    d.setFont("helvetica", "italic"); d.setFontSize(11); sc(d, C.slate700);
    const qt = d.splitTextToSize("\"Es ist schlauer, einen Tag über sein Geld nachzudenken, als einen ganzen Monat dafür zu arbeiten.\"", CW - 20) as string[];
    d.text(qt, PW / 2, qy + 14, { align: "center" });

    d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate400);
    d.text("John D. Rockefeller, US-amerikanischer Unternehmer", PW / 2, qy + 14 + qt.length * 5 + 5, { align: "center" });

    pageFooter(d, 8, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 9 — EINKOMMENSVERTEILUNG (5 category bars)
   ════════════════════════════════════════════════════════ */
function pageAllocation(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult, inp: CashflowPdfInput) {
    pageHeader(d, 9);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    card(d, ML - 2, y, CW + 4, 248, { radius: 7 });
    y += 12;

    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("So passt du deine Einkommensverteilung optimal an", ML + 10, y + 2);
    y += 10;
    para(d, "Eine clevere Einkommensverteilung ist der Schlüssel zu finanzieller Sicherheit. Folgende Analyse zeigt dir, wie du deine Ausgaben effizient aufteilen kannst, um langfristig mehr aus deinem Geld zu machen.", y, { sz: 9, x: ML + 10, w: CW - 16, color: C.slate400 });
    y += 22;

    const income = res.incomeMonthlyNet;
    const alloc = inp.targetAllocation;
    const categories = [
        { label: "Verbindlichkeiten", pct: alloc.liabilities, ist: res.liabilitiesMonthly, soll: income * alloc.liabilities / 100, color: C.red, barLight: C.redLight, desc: "Unter Verbindlichkeiten fällt dein täglicher Konsum – von Lebensmitteln bis hin zu Fixkosten wie Miete und andere Haushaltskosten – alles, was für deinen Lebensstandard unverzichtbar ist." },
        { label: "Absicherungen", pct: alloc.insurance, ist: res.insuranceMonthly, soll: income * alloc.insurance / 100, color: C.amber, barLight: C.amberLight, desc: "Die Basis für finanzielle Sicherheit – mit wichtigen Versicherungen wie Privathaftpflicht und Einkommenssicherung stellst du sicher, dass du weder über- noch unterversichert bist." },
        { label: "Liquidität", pct: alloc.liquidity, ist: res.shortMonthly, soll: income * alloc.liquidity / 100, color: C.blue, barLight: C.blueLight, desc: "Dein kurzfristiger Vermögensaufbau – ein finanzieller Puffer für 1-5 Jahre, der auf sicheren und leicht zugänglichen Konten wie Sparbüchern oder Tagesgeldkonten gehalten wird." },
        { label: "Vermögensaufbau", pct: alloc.wealth, ist: res.midMonthly, soll: income * alloc.wealth / 100, color: C.purple, barLight: C.purpleLight, desc: "Für mittelfristige Ziele in den nächsten 5-20 Jahren – ideal geeignet sind Anlagen wie Fonds, Immobilien oder Bausparverträge, um gezielt Vermögen aufzubauen." },
        { label: "Altersvorsorge", pct: alloc.retirement, ist: res.longMonthly, soll: income * alloc.retirement / 100, color: C.emeraldDark, barLight: C.emeraldPale, desc: "Langfristiger Vermögensaufbau, der deinen Lebensstandard im Alter sichert – mit staatlich geförderten Lösungen wie der Basisrente, Riester- oder Betriebsrente sowie Privatrente." },
    ];

    const barX = ML + 8;
    const barW = 14;

    categories.forEach(cat => {
        const diff = cat.soll - cat.ist;
        const action = diff > 1 ? "erhöhen" : diff < -1 ? "reduzieren" : "passt";
        const actionColor = diff > 1 ? C.emerald : diff < -1 ? C.red : C.emerald;

        // Color bar on left — wider, cleaner, all starting at same X
        sf(d, cat.barLight);
        d.roundedRect(barX, y, barW, 34, 3, 3, "F");
        sf(d, cat.color);
        d.roundedRect(barX, y + 20, barW, 14, 3, 3, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.white);
        const pctStr = `${cat.pct} %`;
        d.text(pctStr, barX + barW / 2 - d.getTextWidth(pctStr) / 2, y + 29);

        // Title
        const textX = barX + barW + 6;
        d.setFont("helvetica", "bold"); d.setFontSize(10.5); sc(d, C.navy);
        d.text(cat.label, textX, y + 7);

        // Ist / Soll
        d.setFont("helvetica", "normal"); d.setFontSize(6.5); sc(d, C.slate400);
        d.text("Ist", textX + 52, y + 4); d.text("Soll", textX + 72, y + 4);
        d.setFont("helvetica", "bold"); d.setFontSize(8.5); sc(d, C.navy);
        d.text(fmt(cat.ist), textX + 52, y + 10);
        d.text(fmt(cat.soll), textX + 72, y + 10);

        // Action text — "Um X € " in navy + "reduzieren/erhöhen" in color + arrow
        const diffText = action === "passt" ? "passt" : `Um ${fmt(Math.abs(diff))}`;
        d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.navy);
        const actionX = textX + 96;
        d.text(diffText, actionX, y + 8);
        if (action !== "passt") {
            const diffW = d.getTextWidth(diffText);
            d.setFont("helvetica", "bold"); d.setFontSize(8); sc(d, actionColor);
            d.text(action, actionX + diffW + 2, y + 8);
            // Small arrow
            const arrowX = actionX + diffW + 2 + d.getTextWidth(action) + 3;
            sd(d, actionColor); d.setLineWidth(0.8);
            if (diff > 1) {
                d.line(arrowX, y + 8, arrowX, y + 4);
                d.line(arrowX - 1.2, y + 5.5, arrowX, y + 4);
                d.line(arrowX + 1.2, y + 5.5, arrowX, y + 4);
            } else {
                d.line(arrowX, y + 4, arrowX, y + 8);
                d.line(arrowX - 1.2, y + 6.5, arrowX, y + 8);
                d.line(arrowX + 1.2, y + 6.5, arrowX, y + 8);
            }
        }

        // Description — larger text, shifted down so it doesn't collide with numbers
        para(d, cat.desc, y + 17, { sz: 8, lh: 3.5, x: textX, w: CW - barW - 18, color: C.slate400 });

        y += 40;
    });

    pageFooter(d, 9, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 10 — VERMÖGENSVERTEILUNG + LIQUIDITÄTSZIEL
   ════════════════════════════════════════════════════════ */
function pageWealth(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult) {
    pageHeader(d, 10);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    // Top card: Vermögensverteilung
    card(d, ML - 2, y, CW + 4, 100, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Deine aktuelle Vermögensverteilung", ML + 10, y + 16);

    const totalAssets = res.shortValue + res.midValue + res.longValue;
    const assetSlices = [
        { label: "Kurzfristig", val: res.shortValue, pct: totalAssets > 0 ? res.shortValue / totalAssets * 100 : 0, c: C.blue, hex: "#3b82f6" },
        { label: "Mittelfristig", val: res.midValue, pct: totalAssets > 0 ? res.midValue / totalAssets * 100 : 0, c: C.purple, hex: "#8b5cf6" },
        { label: "Langfristig", val: res.longValue, pct: totalAssets > 0 ? res.longValue / totalAssets * 100 : 0, c: C.emeraldDark, hex: "#047857" },
    ];

    // Donut — canvas-rendered PNG for perfect quality
    const donutPngSlices = assetSlices.map(s => ({ pct: s.pct / 100, color: s.hex }));
    const donutPng = renderDonutPng(donutPngSlices, fmt(totalAssets), 400);
    const donutSz = 50;
    const donutX = ML + 6;
    const donutY = y + 24;
    d.addImage(donutPng, "PNG", donutX, donutY, donutSz, donutSz);

    // Legend — tight layout matching page 8
    const lgLeft = donutX + donutSz + 8;
    const lgRight = lgLeft + 44;

    function drawLegendItem(lx: number, ly: number, s: { label: string; val: number; pct: number; c: RGB }) {
        sf(d, s.c); d.circle(lx, ly, 2, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate500);
        d.text(s.label, lx + 5, ly + 1);
        const labelW = d.getTextWidth(s.label);
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(fmtPct(s.pct), lx + 5 + labelW + 2, ly + 1);
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
        d.text(fmt(s.val), lx + 5, ly + 8);
    }

    const lgY1 = donutY + 10;
    drawLegendItem(lgLeft, lgY1, assetSlices[0]);
    drawLegendItem(lgRight, lgY1, assetSlices[1]);
    const lgY2 = lgY1 + 24;
    drawLegendItem(lgLeft, lgY2, assetSlices[2]);

    y += 108;

    // Bottom card: Liquiditätsziel
    card(d, ML - 2, y, CW + 4, 145, { radius: 7 });

    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Was solltest du kurzfristig zur Verfügung haben?", ML + 10, y + 14);

    para(d, 'Die kurzfristige Liquidit\u00e4t ist dein finanzielles Sicherheitsnetz f\u00fcr unerwartete Ausgaben oder Anschaffungen. Oft als \u201eNotgroschen\u201c bezeichnet, sorgt sie f\u00fcr Flexibilit\u00e4t und Sicherheit.', y + 22, { sz: 10, x: ML + 10, w: CW - 16, color: C.slate400 });

    // 3 check badges — larger text
    const mw = (CW - 20) / 3;
    const badgeY = y + 40;
    const badges = ["Täglich verfügbar", "Anlage ohne Wertschwankungen", "Ausreichend"];
    badges.forEach((b, i) => {
        const colCx = ML + 6 + i * (mw + 4) + mw / 2;
        d.setFont("helvetica", "normal"); d.setFontSize(8.5);
        const bTextW = d.getTextWidth(b);
        const bStartX = colCx - bTextW / 2 - 5;
        sf(d, C.emerald); d.circle(bStartX, badgeY, 2.2, "F");
        sd(d, C.white); d.setLineWidth(0.5);
        d.line(bStartX - 0.9, badgeY, bStartX - 0.1, badgeY + 0.9);
        d.line(bStartX - 0.1, badgeY + 0.9, bStartX + 1.0, badgeY - 0.7);
        sc(d, C.slate700);
        d.text(b, bStartX + 5, badgeY + 1.2);
    });

    // 3 metric cards — matching reference icons
    const metricY = badgeY + 10;
    const metricColors = [C.navy, C.blue, C.red];
    const metricLabels = ["Vorhandene Liquidität", "Liquiditätsziel", "Kapitalüberschuss"];
    const metricVals = [res.shortValue, res.activeLiquidityGoal, res.liquiditySurplus];

    metricLabels.forEach((label, i) => {
        const mx = ML + 6 + i * (mw + 4);
        const cx = mx + mw / 2;
        card(d, mx, metricY, mw, 46, { radius: 5, noShadow: true });

        const iconY = metricY + 13;
        const iconR = 5;

        if (i === 0) {
            // Vorhandene Liquidität — light navy bg circle with € sign centered
            sf(d, [219, 234, 254]); d.circle(cx, iconY, iconR, "F");
            d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
            d.text("\u20AC", cx, iconY + 1.2, { align: "center" });
        } else if (i === 1) {
            // Target/bullseye — light blue bg with concentric circles
            sf(d, [219, 234, 254]); d.circle(cx, iconY, iconR, "F");
            sd(d, C.blue); d.setLineWidth(0.5);
            d.circle(cx, iconY, 3, "S");
            sf(d, C.blue); d.circle(cx, iconY, 1.2, "F");
        } else {
            // Surplus — light red bg with X/arrows
            sf(d, [254, 226, 226]); d.circle(cx, iconY, iconR, "F");
            sd(d, C.red); d.setLineWidth(0.7);
            d.line(cx - 1.8, iconY - 1.8, cx + 1.8, iconY + 1.8);
            d.line(cx + 1.8, iconY - 1.8, cx - 1.8, iconY + 1.8);
        }

        d.setFont("helvetica", "normal"); d.setFontSize(7.5); sc(d, C.slate400);
        d.text(label, cx, metricY + 27, { align: "center" });
        d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, metricColors[i]);
        d.text(fmt(metricVals[i]), cx, metricY + 38, { align: "center" });
    });

    const resultY = metricY + 50;

    // Arrow down — larger, green filled
    const arrowCx = ML + CW / 2;
    sf(d, C.emerald); d.circle(arrowCx, resultY, 3.5, "F");
    sd(d, C.white); d.setLineWidth(0.6);
    d.line(arrowCx, resultY - 1.8, arrowCx, resultY + 1.8);
    d.line(arrowCx - 1.2, resultY + 0.4, arrowCx, resultY + 1.8);
    d.line(arrowCx + 1.2, resultY + 0.4, arrowCx, resultY + 1.8);

    // Result badge — text only, no icon
    const rbY = resultY + 6;
    sd(d, C.slate200); d.setLineWidth(0.3); d.roundedRect(ML + 6, rbY, CW - 8, 16, 5, 5, "S");
    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.slate700);
    const resultTxt = "Du hast dein Ziel bereits erreicht und verfügst über einen Kapitalüberschuss von";
    d.text(resultTxt, ML + 14, rbY + 9);
    const txtW = d.getTextWidth(resultTxt + "  ");
    d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.red);
    d.text(fmt(res.liquiditySurplus), ML + 14 + txtW, rbY + 9);

    pageFooter(d, 10, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 11 — INFLATION + HOCHRECHNUNG
   ════════════════════════════════════════════════════════ */
function pageInflation(d: jsPDF, data: PdfRequestData, res: CashflowPdfResult, inp: CashflowPdfInput) {
    pageHeader(d, 11);
    sf(d, C.white); d.rect(0, HEADER_H, PW, PH - HEADER_H, "F");
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 4;

    // Top card: Inflation effects
    card(d, ML - 2, y, CW + 4, 100, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Welche negativen Folgen hat zu viel Liquidität?", ML + 10, y + 16);
    y += 22;
    para(d, "Zu viel Geld auf dem Konto? Vorsicht! Durch Inflation verliert dein Erspartes an Wert – jedes Jahr wird es weniger wert, obwohl es gleich bleibt.", y, { sz: 9.5, x: ML + 10, w: CW - 16, color: C.slate400 });
    y += 14;
    para(d, "Sorge dafür, dass dein Geld für dich arbeitet, statt stillschweigend zu verschwinden.", y, { sz: 9.5, x: ML + 10, w: CW - 16, color: C.slate400 });
    y += 12;

    // Inflation price boxes — smaller rounded rects, more spread out
    const iceData = [
        { year: 2000, val: "0,60€", c: C.emerald },
        { year: 2020, val: "2,20€", c: C.amber },
        { year: 2040, val: "4,50€", c: C.red },
    ];
    const boxW = 24, boxH = 13;
    const tlLeft = ML + 8, tlRight = PW - ML - 8;
    const tlW = tlRight - tlLeft;
    const tlY = y + boxH + 5;

    iceData.forEach((cd) => {
        const px = tlLeft + tlW * (cd.year - 1970) / (2060 - 1970);
        // Vertical line from timeline up to box
        sd(d, C.slate200); d.setLineWidth(0.3);
        d.line(px, tlY, px, y + boxH);
        // Colored rounded box
        sf(d, cd.c); d.roundedRect(px - boxW / 2, y, boxW, boxH, 3, 3, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.white);
        d.text(cd.val, px, y + boxH / 2 + 1.5, { align: "center" });
    });

    // Timeline
    sd(d, C.slate200); d.setLineWidth(0.3);
    d.line(tlLeft, tlY, tlRight, tlY);
    const decades = [1970, 1990, 2000, 2010, 2020, 2030, 2040, 2050, 2060];
    decades.forEach(dec => {
        const px = tlLeft + tlW * (dec - 1970) / (2060 - 1970);
        d.setFont("helvetica", "bold"); d.setFontSize(6); sc(d, [2000, 2020, 2040].includes(dec) ? C.navy : C.slate400);
        d.text(`${dec}`, px, tlY + 5, { align: "center" });
    });

    y = tlY + 14;

    // Bottom card: Hochrechnung
    const botCardY = y;
    card(d, ML - 2, y, CW + 4, 156, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(12.5); sc(d, C.navy);
    d.text("Was passiert, wenn du dein Kapital weiterhin auf dem Konto sparst?", ML + 10, y + 14);
    y += 20;
    para(d, `In der folgenden Grafik siehst du eine Hochrechnung deines Anfangskapitals und des monatlichen Überschusses, den wir aus deiner aktuellen Einkommensverteilung übernommen haben.`, y, { sz: 9, x: ML + 10, w: CW - 16, color: C.slate400 });
    y += 16;

    // Key metrics + params — single combined card
    const mkW = CW - 8;
    const metricsH = 24;
    const paramsH = 12;
    const comboH = metricsH + paramsH;
    card(d, ML + 2, y, mkW, comboH, { fill: C.white, radius: 5 });
    // Divider between left/right metrics
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(ML + 2 + mkW / 2, y + 4, ML + 2 + mkW / 2, y + metricsH - 2);
    // Divider between metrics and params
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(ML + 6, y + metricsH, ML + 2 + mkW - 4, y + metricsH);

    // Left: Kapitalüberschuss — bigger, tighter spacing
    const lIconX = ML + 14, lIconY = y + 12;
    sf(d, [254, 226, 226]); d.circle(lIconX, lIconY, 4, "F");
    sd(d, C.red); d.setLineWidth(0.8); d.line(lIconX - 1.8, lIconY, lIconX + 1.8, lIconY);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("Kapitalüberschuss", ML + 22, y + 10);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.red);
    d.text(fmt(Math.max(0, res.liquiditySurplus)), ML + 22, y + 17);

    // Right: Monatlicher Überschuss — bigger, tighter spacing
    const rBase = ML + 2 + mkW / 2 + 6;
    const rIconX = rBase + 4, rIconY = y + 12;
    sf(d, [220, 252, 231]); d.circle(rIconX, rIconY, 4, "F");
    // Clean filled arrow triangle
    sf(d, C.emerald);
    d.triangle(rIconX, rIconY - 2.2, rIconX - 1.6, rIconY - 0.2, rIconX + 1.6, rIconY - 0.2, "F");
    // Arrow stem
    sd(d, C.emerald); d.setLineWidth(0.9);
    d.line(rIconX, rIconY - 0.2, rIconX, rIconY + 1.8);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("Monatlicher Überschuss", rBase + 12, y + 10);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.emerald);
    d.text(fmt(res.freeMonthly), rBase + 12, y + 17);

    // Parameters row — inside same card, below divider
    const paramY = y + metricsH + paramsH / 2 + 1;
    const paramSections = mkW / 3;

    // Clock icon + Laufzeit
    sd(d, C.slate400); d.setLineWidth(0.35);
    const clkX = ML + 2 + paramSections * 0.5;
    drawArc(d, clkX - 12, paramY - 0.5, 2.5, 0, 360, C.slate400, 0.35);
    d.line(clkX - 12, paramY - 1.7, clkX - 12, paramY - 0.5); d.line(clkX - 12, paramY - 0.5, clkX - 11, paramY);
    d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.slate500);
    d.text(`${inp.surplusYears} Jahre Laufzeit`, clkX - 7, paramY + 1);

    // Arrow up + Rendite
    const renX = ML + 2 + paramSections * 1.5;
    sd(d, C.slate400); d.setLineWidth(0.5);
    d.line(renX - 12, paramY + 1.5, renX - 12, paramY - 2);
    d.line(renX - 13, paramY - 0.8, renX - 12, paramY - 2); d.line(renX - 11, paramY - 0.8, renX - 12, paramY - 2);
    d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.slate500);
    d.text(`${inp.surplusReturnRate.toFixed(2)} % Rendite`, renX - 7, paramY + 1);

    // Arrow down + Inflation
    const infX = ML + 2 + paramSections * 2.5;
    d.line(infX - 12, paramY - 1.5, infX - 12, paramY + 2);
    d.line(infX - 13, paramY + 0.8, infX - 12, paramY + 2); d.line(infX - 11, paramY + 0.8, infX - 12, paramY + 2);
    d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.slate500);
    d.text(`${inp.surplusInflationRate.toFixed(2)} % Inflation`, infX - 7, paramY + 1);

    y += comboH + 12;

    // Chart legend
    const realSavingsRate = inp.surplusInterestRate - inp.surplusInflationRate;
    const effectiveRate = inp.surplusReturnRate - inp.surplusInflationRate;
    const legendItems = [
        { label: `${realSavingsRate.toFixed(2)}% Inflation`, c: C.blue },
        { label: `${inp.surplusInterestRate.toFixed(2)}% Guthabenzins`, c: C.amber },
        { label: `${effectiveRate.toFixed(2)}% Effektive Rendite`, c: C.emerald },
    ];
    let legendX = ML + 12;
    legendItems.forEach(li => {
        sf(d, li.c); d.circle(legendX, y, 1.5, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(6); sc(d, C.slate500);
        d.text(li.label, legendX + 3, y + 1.5);
        legendX += 42;
    });
    y += 6;

    // Line chart — wider, extends further right
    const chartX = ML + 20, chartW = CW * 0.55, chartH = 42;
    const datasets = [
        { points: res.growthRealSavings, color: C.blue, lineW: 0.6 },
        { points: res.growthNominalSavings, color: C.amber, lineW: 0.6 },
        { points: res.growthRealInvestment, color: C.emerald, lineW: 0.8 },
    ];
    drawLineChart(d, chartX, y, chartW, chartH, datasets);

    // Loss summary (right side of chart)
    const lossX = chartX + chartW + 8;
    const lossW = PW - ML - lossX - 2;
    d.setFont("helvetica", "bold"); d.setFontSize(8); sc(d, C.navy);
    d.text("Gesamtverlust", lossX, y + 6);
    sd(d, C.slate200); d.setLineWidth(0.2); d.line(lossX, y + 9, lossX + 35, y + 9);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.red);
    d.text(fmt(res.lossTotal), lossX, y + 19);

    const losses = [
        { label: "Jährlicher Verlust", val: res.lossYearly },
        { label: "Monatlich", val: res.lossMonthly },
        { label: "Täglich", val: res.lossDaily },
    ];
    losses.forEach((l, i) => {
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(l.label, lossX, y + 27 + i * 7);
        d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.red);
        d.text(fmt(l.val), lossX + 28, y + 27 + i * 7);
    });

    pageFooter(d, 11, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 12 — CLOSING (with Warren Buffet quote)
   ════════════════════════════════════════════════════════ */
function pageClosing(d: jsPDF, data: PdfRequestData, avatarImg: string) {
    pageHeader(d, 12);
    const name = `${data.firstName} ${data.lastName}`;

    // Card container (matching page 2 style)
    const cardX = ML - 4;
    const cardY = HEADER_H + 12;
    const cardW = CW + 8;
    const cardH = 180;
    const cardR = 7;
    const cardPad = 12;

    // Card background with subtle border and shadow
    sf(d, [248, 250, 252]);
    d.roundedRect(cardX + 0.5, cardY + 0.8, cardW, cardH, cardR, cardR, "F");
    sf(d, C.white);
    sd(d, C.slate200); d.setLineWidth(0.3);
    d.roundedRect(cardX, cardY, cardW, cardH, cardR, cardR, "FD");

    const innerX = cardX + cardPad;
    const innerW = cardW - cardPad * 2;
    let y = cardY + cardPad + 6;

    // Greeting — bold, larger (matching page 2)
    d.setFont("helvetica", "bold"); d.setFontSize(16); sc(d, C.navy);
    d.text(`Hey ${data.firstName},`, innerX, y);
    y += 16;

    // Body text — larger, more line height (matching page 2)
    y = para(d, `du hast jetzt einen klaren Überblick über deinen Cashflow – auf Basis deiner eigenen Zahlen. Du siehst, was reinkommt, was rausgeht und wie viel Spielraum dir tatsächlich zur Verfügung steht. Das einmal strukturiert vor sich zu haben, ist eine starke Grundlage für deine nächsten Schritte.`, y, { sz: 12, lh: 7, x: innerX, w: innerW, color: C.slate500 });
    y += 12;

    y = para(d, `Wenn du möchtest, schaue ich mir deine Auswertung gerne einmal persönlich mit dir an und helfe dir dabei, sie auf deine Gesamtsituation einzuordnen. Ich freue mich, von dir zu hören.`, y, { sz: 12, lh: 7, x: innerX, w: innerW, color: C.slate500 });
    y += 16;

    // Grußformel (matching page 2)
    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Beste Grüße,", innerX, y);
    y += 14;

    // Avatar with name (matching page 2)
    d.addImage(avatarImg, "PNG", innerX, y - 2, 16, 16);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text("Julian Karges", innerX + 22, y + 7);

    pageFooter(d, 12, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 13 — DISCLAIMER
   ════════════════════════════════════════════════════════ */
function pageDisclaimer(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 13);
    const name = `${data.firstName} ${data.lastName}`;
    let y = HEADER_H + 16;

    // Heading
    d.setFont("helvetica", "bold"); d.setFontSize(16); sc(d, C.navy);
    d.text("Disclaimer", ML, y);
    y += 12;

    // Disclaimer paragraphs
    const disclaimerTexts = [
        `Diese Auswertung wurde mithilfe eines Online-Rechners auf der Website von Julian Karges \u2013 Karges Kapital erstellt. Die zugrunde liegenden Berechnungen dienen der privaten Finanzplanung, insbesondere in den Bereichen Einkommenssicherung, Altersvorsorge und Vermögensaufbau, und basieren auf allgemein anerkannten finanzmathematischen Methoden.`,
        `Bitte beachte, dass Modellannahmen wie konstant bleibende Renditen, Inflationsraten oder bestimmte steuerliche Rahmenbedingungen zu Abweichungen von der tatsächlichen Entwicklung führen können. Die dargestellten Ergebnisse sind Prognosen auf Basis der von dir eingegebenen Daten \u2013 sie stellen keine Garantie für zukünftige Wertentwicklungen dar.`,
        `Die in diesem Dokument präsentierten Informationen stellen weder ein verbindliches Angebot noch eine Anlageberatung im Sinne des Wertpapierhandelsgesetzes (WpHG), eine steuerliche Beratung oder eine rechtliche Beratung dar. Steuerliche und gesetzliche Vorschriften können sich kurzfristig ändern und sind von individuellen Faktoren abhängig. Für verbindliche Aussagen wende dich bitte an eine qualifizierte Fachperson (z.\u00a0B. Steuerberater*in oder Rechtsanwält*in).`,
        `Weder Julian Karges noch Karges Kapital übernehmen eine Gewähr für die Richtigkeit, Vollständigkeit und Aktualität der hier dargestellten Daten und Ergebnisse. Eine Haftung für Schäden, die unmittelbar oder mittelbar aus dem Vertrauen auf die Inhalte dieses Dokuments entstehen, ist \u2013 soweit gesetzlich zulässig \u2013 ausgeschlossen. Du bist dafür verantwortlich, vollständige und korrekte Angaben zu deiner persönlichen und finanziellen Situation zu machen, da auf Basis dieser Informationen die Berechnungen durchgeführt werden.`,
        `Dieses Dokument dient deiner Orientierung und ersetzt keine professionelle Beratung. Für spezielle Fragen oder zur Klärung persönlicher Umstände wende dich bitte an eine entsprechend qualifizierte Fachperson.`,
    ];

    for (const txt of disclaimerTexts) {
        y = para(d, txt, y, { sz: 10, lh: 5.5, x: ML, w: PW - ML * 2, color: C.slate500 });
        y += 8;
    }

    // Contact block
    y += 4;
    d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
    d.text("Julian Karges \u2013 Karges Kapital", ML, y);
    y += 5;
    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.slate500);
    d.text("Selbstständiger Handelsvertreter gemäß § 84 HGB", ML, y);
    y += 5;
    d.text("Darmstädter Landstraße 110, 60598 Frankfurt am Main", ML, y);
    y += 5;
    d.text("E-Mail: juliankarges03@icloud.com", ML, y);

    pageFooter(d, 13, name);
}

/* ═══════════════ MAIN EXPORT ═══════════════ */
export async function generateCashflowPdf(data: PdfRequestData, result: CashflowPdfResult, input: CashflowPdfInput): Promise<{ blob: Blob; fileName: string }> {
    // Load profile image for pages 2 & 12
    const profileDataUrl = await loadImageAsDataUrl('/images/julian-karges-profile.png');
    const circularAvatar = await createCircularAvatar(profileDataUrl);

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    totalPages = 13;

    pageCover(doc, data, result, input);                    // 1
    doc.addPage(); pageIntro(doc, data, circularAvatar); // 2
    doc.addPage(); pageInfo(doc, data);                      // 3
    doc.addPage(); pageIncome(doc, data, input, result);     // 4
    doc.addPage(); pageExpenses(doc, data, input, result);   // 5
    doc.addPage(); pageAssets(doc, data, input);             // 6
    doc.addPage(); pageInsurance(doc, data, input);          // 7
    doc.addPage(); pageCashflowOverview(doc, data, result);  // 8
    doc.addPage(); pageAllocation(doc, data, result, input); // 9
    doc.addPage(); pageWealth(doc, data, result);            // 10
    doc.addPage(); pageInflation(doc, data, result, input);  // 11
    doc.addPage(); pageClosing(doc, data, circularAvatar);    // 12
    doc.addPage(); pageDisclaimer(doc, data);                 // 13

    const fileName = `Cashflow_Auswertung_${data.lastName}_${fmtDate(new Date()).replace(/\./g, "-")}.pdf`;
    doc.save(fileName);
    return { blob: doc.output("blob"), fileName };
}
