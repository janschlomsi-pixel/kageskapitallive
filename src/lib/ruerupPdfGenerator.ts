/**
 * Rürup Steuervorteil — Premium PDF Generator
 * Matches CapitalFlow Finanzgutachten visual quality.
 */
import jsPDF from "jspdf";
import type { PdfRequestData } from "@/components/ui/PdfRequestModal";
import type { RuerupResult, CurvePoint } from "./ruerupCalculator";

/* ═══════════════ BRAND COLORS ═══════════════ */
type RGB = readonly [number, number, number];
const C = {
    emerald: [5, 150, 105] as RGB,
    emeraldDark: [4, 120, 87] as RGB,
    emeraldPale: [209, 250, 229] as RGB,
    green50: [240, 253, 244] as RGB,
    navy: [15, 23, 42] as RGB,
    slate700: [51, 65, 85] as RGB,
    slate500: [100, 116, 139] as RGB,
    slate400: [148, 163, 184] as RGB,
    slate300: [203, 213, 225] as RGB,
    slate200: [226, 232, 240] as RGB,
    slate100: [241, 245, 249] as RGB,
    slate50: [248, 250, 252] as RGB,
    white: [255, 255, 255] as RGB,
    blue: [59, 130, 246] as RGB,
    blueDark: [29, 78, 216] as RGB,
    blueLight: [219, 234, 254] as RGB,
    red: [239, 68, 68] as RGB,
    redLight: [254, 226, 226] as RGB,
    amber: [245, 158, 11] as RGB,
    amberLight: [254, 243, 199] as RGB,
};

/* ═══════════════ LAYOUT CONSTANTS ═══════════════ */
const PW = 210; const PH = 297;
const ML = 22;
const CW = PW - ML * 2;
const FOOTER_Y = PH - 14;
const TOTAL_PAGES = 8;

export interface RuerupPdfInputState {
    dateOfBirth: Date; retirementAge: number; filingStatus: string;
    churchTaxEnabled: string; healthInsurance: string; taxableIncome: number;
    marginalTaxRate: number; monthlyInvestmentWish: number; existingCapital: number;
    existingMonthlyInvestment: number; annualReturnPct: number; periodMode: string;
    includeSoli: boolean; federalState: string;
}

/* ═══════════════ FORMATTERS ═══════════════ */
const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtPct = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 }) + " %";
const fmtDate = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

/* ═══════════════ LOW-LEVEL DRAWING ═══════════════ */
const sc = (d: jsPDF, c: RGB) => d.setTextColor(c[0], c[1], c[2]);
const sf = (d: jsPDF, c: RGB) => d.setFillColor(c[0], c[1], c[2]);
const sd = (d: jsPDF, c: RGB) => d.setDrawColor(c[0], c[1], c[2]);

function opacity(d: jsPDF, o: number) {
    d.setGState(new (d as any).GState({ opacity: o }));
}

function softShadow(d: jsPDF, x: number, y: number, w: number, h: number, r: number) {
    sf(d, [0, 0, 0]);
    opacity(d, 0.015);
    d.roundedRect(x + 0.5, y + 2.2, w, h + 0.3, r, r, "F");
    opacity(d, 0.03);
    d.roundedRect(x + 0.2, y + 1, w, h, r, r, "F");
    opacity(d, 1);
}

function card(d: jsPDF, x: number, y: number, w: number, h: number, opts?: {
    fill?: RGB; border?: RGB; noShadow?: boolean; noBorder?: boolean; radius?: number;
}) {
    const r = opts?.radius ?? 5;
    if (!opts?.noShadow) softShadow(d, x, y, w, h, r);
    sf(d, opts?.fill ?? C.white);
    if (opts?.noBorder) {
        d.roundedRect(x, y, w, h, r, r, "F");
    } else {
        sd(d, opts?.border ?? C.slate200);
        d.setLineWidth(0.25);
        d.roundedRect(x, y, w, h, r, r, "FD");
    }
}

/** Decorative cover bubble with inner icon drawn via drawFunc */
function iconBubbleDraw(d: jsPDF, cx: number, cy: number, color: RGB, outerR: number, drawFunc: (d: jsPDF, cx: number, cy: number, r: number) => void) {
    sf(d, C.slate100);
    d.circle(cx, cy, outerR, "F");
    sd(d, C.slate300);
    d.setLineWidth(0.25);
    d.circle(cx, cy, outerR, "S");
    sd(d, color);
    d.setLineWidth(0.8);
    d.circle(cx, cy, outerR * 0.62, "S");
    drawFunc(d, cx, cy, outerR * 0.3);
}

/** Small inline icon with drawn symbol */
function iconCircle(d: jsPDF, cx: number, cy: number, color: RGB, drawFn: (d: jsPDF, x: number, y: number, s: number) => void, sz?: number) {
    const r = sz ?? 5;
    sf(d, C.green50);
    d.circle(cx, cy, r, "F");
    sd(d, color);
    d.setLineWidth(0.4);
    d.circle(cx, cy, r, "S");
    drawFn(d, cx, cy, r * 0.5);
}

/* ─── Icon draw functions ─── */
function iconEuro(d: jsPDF, cx: number, cy: number, s: number) {
    d.setFont("helvetica", "bold"); d.setFontSize(s * 5);
    sc(d, C.emerald);
    d.text("€", cx - s * 0.65, cy + s * 0.8);
}
function iconCheck(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.emerald); d.setLineWidth(s * 0.5);
    d.line(cx - s, cy, cx - s * 0.2, cy + s * 0.8);
    d.line(cx - s * 0.2, cy + s * 0.8, cx + s * 1.2, cy - s);
}
function iconShield(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.blue); d.setLineWidth(s * 0.4);
    const pts = [[-s, -s * 0.6], [0, -s * 1.2], [s, -s * 0.6], [s, s * 0.3], [0, s * 1.2], [-s, s * 0.3]];
    for (let i = 0; i < pts.length; i++) {
        const n = (i + 1) % pts.length;
        d.line(cx + pts[i][0], cy + pts[i][1], cx + pts[n][0], cy + pts[n][1]);
    }
}
function iconClock(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.amber); d.setLineWidth(s * 0.35);
    d.circle(cx, cy, s * 1.2, "S");
    d.line(cx, cy - s * 0.6, cx, cy);
    d.line(cx, cy, cx + s * 0.5, cy + s * 0.3);
}
function iconChart(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.emerald); d.setLineWidth(s * 0.35);
    d.line(cx - s, cy + s, cx - s * 0.3, cy - s * 0.3);
    d.line(cx - s * 0.3, cy - s * 0.3, cx + s * 0.3, cy + s * 0.3);
    d.line(cx + s * 0.3, cy + s * 0.3, cx + s, cy - s);
}
function iconArrowUp(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.red); d.setLineWidth(s * 0.45);
    d.line(cx, cy + s, cx, cy - s);
    d.line(cx - s * 0.6, cy - s * 0.3, cx, cy - s);
    d.line(cx + s * 0.6, cy - s * 0.3, cx, cy - s);
}
function iconAvg(d: jsPDF, cx: number, cy: number, s: number) {
    d.setFont("helvetica", "bold"); d.setFontSize(s * 6);
    sc(d, C.emerald);
    const tw = d.getTextWidth("Ø");
    d.text("Ø", cx - tw / 2, cy + s * 1);
}
function iconDiamond(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.blue); d.setLineWidth(s * 0.4);
    d.line(cx, cy - s * 1.2, cx + s, cy); d.line(cx + s, cy, cx, cy + s * 1.2);
    d.line(cx, cy + s * 1.2, cx - s, cy); d.line(cx - s, cy, cx, cy - s * 1.2);
}
function iconPerson(d: jsPDF, cx: number, cy: number, s: number) {
    sf(d, C.emerald); d.circle(cx, cy - s * 0.6, s * 0.5, "F");
    d.setLineWidth(0);
    sf(d, C.emerald);
    d.roundedRect(cx - s * 0.8, cy, s * 1.6, s * 1.2, s * 0.3, s * 0.3, "F");
}
function iconDoc(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.emerald); d.setLineWidth(s * 0.3);
    d.rect(cx - s * 0.7, cy - s * 1.1, s * 1.4, s * 2.2);
    d.line(cx - s * 0.3, cy - s * 0.3, cx + s * 0.3, cy - s * 0.3);
    d.line(cx - s * 0.3, cy + s * 0.3, cx + s * 0.3, cy + s * 0.3);
}
function iconHeart(d: jsPDF, cx: number, cy: number, s: number) {
    sf(d, C.emerald);
    d.circle(cx - s * 0.45, cy - s * 0.2, s * 0.55, "F");
    d.circle(cx + s * 0.45, cy - s * 0.2, s * 0.55, "F");
    d.triangle(cx - s, cy, cx + s, cy, cx, cy + s * 1.1, "F");
}
function iconTarget(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.emerald); d.setLineWidth(s * 0.3);
    d.circle(cx, cy, s * 1.1, "S"); d.circle(cx, cy, s * 0.5, "S");
    sf(d, C.emerald); d.circle(cx, cy, s * 0.2, "F");
}
function iconArrowRight(d: jsPDF, cx: number, cy: number, s: number) {
    sd(d, C.blue); d.setLineWidth(s * 0.4);
    d.line(cx - s, cy, cx + s, cy);
    d.line(cx + s * 0.3, cy - s * 0.5, cx + s, cy);
    d.line(cx + s * 0.3, cy + s * 0.5, cx + s, cy);
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

function pageHeader(d: jsPDF, pageNum: number) {
    sf(d, C.emerald); d.rect(0, 0, PW, 1.5, "F");
    sf(d, C.emeraldPale); d.rect(0, 1.5, PW, 0.5, "F");
    drawLogoSmall(d, ML + 5, 15);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre Basisrente", ML + 14, 17.5);
    const arcCx = PW - ML - 5, arcCy = 15, arcR = 7;
    const pct = pageNum / TOTAL_PAGES;
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

function heading(d: jsPDF, text: string, y: number, opts?: { sz?: number; x?: number }): number {
    d.setFont("helvetica", "bold"); d.setFontSize(opts?.sz ?? 14); sc(d, C.navy);
    d.text(text, opts?.x ?? ML + 8, y);
    return y + 7;
}

function para(d: jsPDF, text: string, y: number, opts?: { w?: number; sz?: number; x?: number; color?: RGB; lh?: number }): number {
    const w = opts?.w ?? CW - 4;
    const sz = opts?.sz ?? 10.5;
    const x = opts?.x ?? ML + 4;
    const lh = opts?.lh ?? 5.2;
    d.setFont("helvetica", "normal"); d.setFontSize(sz); sc(d, opts?.color ?? C.slate500);
    const lines = d.splitTextToSize(text, w) as string[];
    lines.forEach((line: string, i: number) => d.text(line, x, y + i * lh));
    return y + lines.length * lh + 2;
}

function hline(d: jsPDF, y: number) {
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(ML, y, PW - ML, y);
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
    const title = d.splitTextToSize("Ihr persönlicher Rürup-Steuervorteilplan", 152) as string[];
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

    const iconDraws = [
        { x: cx - 56, y: 168, fn: iconCheck, c: C.emerald },
        { x: cx - 20, y: 160, fn: iconDoc, c: C.emerald },
        { x: cx + 16, y: 170, fn: iconClock, c: C.amber },
        { x: cx + 54, y: 162, fn: iconShield, c: C.blue },
        { x: cx - 38, y: 196, fn: iconTarget, c: C.emeraldDark },
        { x: cx, y: 188, fn: iconChart, c: C.emerald },
        { x: cx + 40, y: 198, fn: iconHeart, c: C.blue },
    ];

    sd(d, C.emeraldPale); d.setLineWidth(1.5);
    d.line(cx - 60, 190, cx - 20, 156); d.line(cx - 20, 164, cx + 16, 174);
    d.line(cx + 16, 166, cx + 58, 158);
    d.setLineWidth(1);
    d.line(cx - 42, 200, cx, 184); d.line(cx, 192, cx + 44, 202);

    iconDraws.forEach(b => iconBubbleDraw(d, b.x, b.y, b.c, 12, b.fn));

    hline(d, 230);

    // Contact
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
   PAGE 2 — INTRODUCTION
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

    // Advisor section with logo
    drawLogoSmall(d, ML + 6, y + 3);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text(`${data.firstName} ${data.lastName}`, ML + 18, y + 2);
    d.setFont("helvetica", "normal"); d.setFontSize(10); sc(d, C.slate400);
    d.text("Ihre Ansprechperson", ML + 18, y + 9);

    pageFooter(d, 2, name);
}

/* ════════════════════════════════════════════════════════
   BENEFIT — Tax zone chart
   ════════════════════════════════════════════════════════ */
function drawTaxZoneChart(d: jsPDF, x: number, y: number, w: number, h: number) {
    const zones = [14, 24, 42, 42, 45];
    const labels = ["Tarifzone 1", "Tarifzone 2", "Tarifzone 3", "Tarifzone 4", "Tarifzone 5"];
    const maxR = 50;
    const padT = 16, padB = 14;
    const cTop = y + padT, cBot = y + h - padB, cH = cBot - cTop;
    const zW = w / 5;

    for (let p = 0; p <= maxR; p += 10) {
        const gy = cBot - (p / maxR) * cH;
        sd(d, C.slate100); d.setLineWidth(0.08); d.line(x, gy, x + w, gy);
        if (p > 0) { d.setFont("helvetica", "normal"); d.setFontSize(5.5); sc(d, C.slate400); d.text(`${p}%`, x - 2, gy + 1.2, { align: "right" }); }
    }

    opacity(d, 0.08); sf(d, C.blue);
    for (let i = 0; i < 5; i++) d.rect(x + i * zW + 2, cBot - (zones[i] / maxR) * cH, zW - 4, (zones[i] / maxR) * cH, "F");
    opacity(d, 1);

    sd(d, C.blue); d.setLineWidth(1.2);
    for (let i = 1; i < 5; i++) d.line(x + (i - 1) * zW + zW / 2, cBot - (zones[i - 1] / maxR) * cH, x + i * zW + zW / 2, cBot - (zones[i] / maxR) * cH);

    for (let i = 0; i < 5; i++) {
        const dx = x + i * zW + zW / 2, dy = cBot - (zones[i] / maxR) * cH;
        sf(d, C.white); d.circle(dx, dy, 3.4, "F"); sf(d, C.blue); d.circle(dx, dy, 2.4, "F");
        const txt = `${zones[i]}%`; d.setFont("helvetica", "bold"); d.setFontSize(7);
        const tw = d.getTextWidth(txt);
        sf(d, C.white); d.roundedRect(dx - tw / 2 - 3, dy - 11, tw + 6, 8, 2.5, 2.5, "F");
        sd(d, C.slate200); d.setLineWidth(0.1); d.roundedRect(dx - tw / 2 - 3, dy - 11, tw + 6, 8, 2.5, 2.5, "S");
        sc(d, C.navy); d.text(txt, dx, dy - 5.5, { align: "center" });
        d.setFont("helvetica", "normal"); d.setFontSize(5.5); sc(d, C.slate400);
        d.text(labels[i], dx, cBot + 7, { align: "center" });
    }
}

/* ════════════════════════════════════════════════════════
   BENEFIT — Rent visual (simplified, cleaner)
   ════════════════════════════════════════════════════════ */
function drawRentVisual(d: jsPDF, cx: number, cy: number, maxW: number) {
    const barW = maxW * 0.7, barH = 8, gap = 5, sx = cx - barW * 0.4;

    sf(d, C.slate100); d.roundedRect(cx + barW * 0.25, cy - 20, 18, 8, 3, 3, "F");
    sf(d, C.emerald); d.roundedRect(cx + barW * 0.25, cy - 20, 3, 8, 1, 0, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(6); sc(d, C.navy);
    d.text("Rente", cx + barW * 0.25 + 5.5, cy - 14.5);

    const b1w = barW * 0.55;
    sf(d, C.redLight); d.roundedRect(sx, cy, b1w, barH, 3.5, 3.5, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(5); sc(d, C.red);
    d.text("Ihre Rücklagen fürs Alter", sx + 4, cy + barH / 2 + 1.5);
    sf(d, C.red); d.circle(sx + b1w + 5, cy + barH / 2, 3.5, "F");
    sd(d, C.white); d.setLineWidth(1);
    d.line(sx + b1w + 3.5, cy + barH / 2 - 1.5, sx + b1w + 6.5, cy + barH / 2 + 1.5);
    d.line(sx + b1w + 6.5, cy + barH / 2 - 1.5, sx + b1w + 3.5, cy + barH / 2 + 1.5);

    const b2y = cy + barH + gap;
    sf(d, C.emerald); d.roundedRect(sx, b2y, barW, barH, 3.5, 3.5, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(5); sc(d, C.white);
    d.text("Lebenslange Rente", sx + 4, b2y + barH / 2 + 1.5);
    sf(d, C.emeraldDark); d.circle(sx + barW + 5, b2y + barH / 2, 3.5, "F");
    sd(d, C.white); d.setLineWidth(1);
    const gcx = sx + barW + 5, gcy = b2y + barH / 2;
    d.line(gcx - 2, gcy, gcx - 0.5, gcy + 1.8); d.line(gcx - 0.5, gcy + 1.8, gcx + 2.5, gcy - 2);

    sf(d, C.slate100); d.roundedRect(cx - 14, b2y + barH + 9, 28, 9, 3, 3, "F");
    sf(d, C.slate400); d.circle(cx - 8, b2y + barH + 13.5, 2.2, "F");
    d.setFont("helvetica", "normal"); d.setFontSize(5); sc(d, C.slate500);
    d.text("Durchschn.", cx - 3.5, b2y + barH + 12); d.text("Todeszeitpunkt", cx - 3.5, b2y + barH + 15.5);
}

/* ════════════════════════════════════════════════════════
   BENEFIT — Shield visual (cleaner)
   ════════════════════════════════════════════════════════ */
function drawShieldVisual(d: jsPDF, cx: number, cy: number, size: number) {
    const sw = size * 0.5, sh = size * 0.7, topY = cy - sh * 0.25;

    // Pills
    sf(d, C.redLight); d.roundedRect(cx - sw / 2 - 22, topY - 2, 20, 8, 3, 3, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(5.5); sc(d, C.red);
    d.text("Insolvenz", cx - sw / 2 - 12, topY + 3, { align: "center" });

    sf(d, C.redLight); d.roundedRect(cx + sw / 2 + 3, topY - 2, 22, 8, 3, 3, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(5.5); sc(d, C.red);
    d.text("Bürgergeld", cx + sw / 2 + 14, topY + 3, { align: "center" });

    // X marks
    [cx - sw / 2, cx + sw / 2 + 1].forEach(px => {
        sf(d, C.red); d.circle(px, topY + 2, 2.5, "F");
        sd(d, C.white); d.setLineWidth(0.8);
        d.line(px - 1.2, topY + 0.8, px + 1.2, topY + 3.2);
        d.line(px + 1.2, topY + 0.8, px - 1.2, topY + 3.2);
    });

    // Shield body
    const bodyH = sh * 0.5;
    sf(d, C.blue);
    d.roundedRect(cx - sw / 2, topY + 10, sw, bodyH, 5, 5, "F");
    d.triangle(cx - sw / 2, topY + 10 + bodyH - 2, cx + sw / 2, topY + 10 + bodyH - 2, cx, topY + 10 + bodyH + sh * 0.2, "F");

    opacity(d, 0.12); sf(d, C.white);
    d.roundedRect(cx - sw * 0.35, topY + 14, sw * 0.7, bodyH - 6, 3, 3, "F");
    opacity(d, 1);

    sf(d, C.emerald); d.circle(cx, topY + 10 + sh * 0.28, 5.5, "F");
    sd(d, C.white); d.setLineWidth(1.5);
    const chY = topY + 10 + sh * 0.28;
    d.line(cx - 3, chY, cx - 0.5, chY + 2.5); d.line(cx - 0.5, chY + 2.5, cx + 4, chY - 3);

    const bsY = topY + 10 + sh * 0.72;
    sf(d, C.emeraldPale); d.roundedRect(cx - 16, bsY, 32, 10, 3, 3, "F");
    sd(d, C.emerald); d.setLineWidth(0.2); d.roundedRect(cx - 16, bsY, 32, 10, 3, 3, "S");
    sf(d, C.emerald); d.circle(cx - 10, bsY + 5, 2.5, "F");
    sd(d, C.white); d.setLineWidth(0.6);
    d.line(cx - 11.5, bsY + 5, cx - 10, bsY + 6.5); d.line(cx - 10, bsY + 6.5, cx - 8, bsY + 3.5);
    d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.emeraldDark);
    d.text("Basisrente", cx - 5, bsY + 6.5);
}

/* ════════════════════════════════════════════════════════
   PAGE 3 — BENEFITS
   ════════════════════════════════════════════════════════ */
function pageBenefits(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 3);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    d.setFont("helvetica", "bold"); d.setFontSize(17); sc(d, C.navy);
    d.text("Welche Vorteile hat die Basisrente?", ML, y);
    y += 10;

    y = para(d, `Gerade als Gutverdiener in Deutschland sind Sie sehr schnell im Spitzensteuersatz angesiedelt. Die Basisrente gibt Ihnen die Möglichkeit, Ihre Steuerlast gezielt zu senken und für Ihre Altersvorsorge zu nutzen — statt sie dem Staat zu überlassen. So bauen Sie sich langfristige Sicherheit auf — staatlich gefördert, geschützt und steuerlich lukrativ.`, y, { sz: 10.5, lh: 5.2, x: ML, w: CW });
    y += 5;

    // Card 1: full-width, text left (36%), chart right (60%) — strict separation
    const c1h = 90;
    card(d, ML, y, CW, c1h, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Steuern in Vermögen umwandeln", ML + 14, y + 18);
    para(d, `Bereits ab einem zu versteuernden Einkommen von ca. 67.000 € (2025) fallen Sie in den Spitzensteuersatz von 42 %. Mit der Basisrente nutzen Sie diesen Vorteil und verwandeln einen Teil Ihrer Steuerzahlungen in langfristigen Vermögensaufbau.`, y + 26, {
        w: CW * 0.36, x: ML + 14, sz: 9, lh: 4.4, color: C.slate500
    });
    drawTaxZoneChart(d, ML + CW * 0.40, y + 4, CW * 0.58, c1h - 8);
    y += c1h + 8;

    // Bottom 2 cards side by side
    const halfW = (CW - 10) / 2;
    const c23h = 106;

    card(d, ML, y, halfW, c23h, { radius: 7 });
    drawRentVisual(d, ML + halfW / 2, y + 30, halfW - 10);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text("Lebenslange Rente", ML + 12, y + 66);
    para(d, `Durch den medizinischen Fortschritt steigt die Lebenserwartung stetig. Bei anderen Sparformen kann das Geld im Alter aufgebraucht sein. Mit der Basisrente sichern Sie sich eine lebenslange Rente, auf die Sie sich verlassen können.`, y + 74, {
        w: halfW - 22, x: ML + 12, sz: 9, lh: 4.2, color: C.slate500
    });

    const rx = ML + halfW + 10;
    card(d, rx, y, halfW, c23h, { radius: 7 });
    drawShieldVisual(d, rx + halfW / 2, y + 28, 44);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text("Bürgergeld- & Insolvenzschutz", rx + 10, y + 66);
    para(d, `Ihr Konto, Ihr Depot und auch Ihre Immobilie — vieles kann im Ernstfall angerechnet werden. Nicht so die Basisrente: Sie ist vor Bürgergeld und Insolvenz geschützt — und bleibt ganz allein für Ihre Zukunft reserviert.`, y + 74, {
        w: halfW - 18, x: rx + 10, sz: 9, lh: 4.2, color: C.slate500
    });

    pageFooter(d, 3, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 4 — TAX RATE + MAX INVESTMENT
   ════════════════════════════════════════════════════════ */
function pageTaxRate(d: jsPDF, data: PdfRequestData, r: RuerupResult, inp: RuerupPdfInputState) {
    pageHeader(d, 4);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 35;

    card(d, ML, y, CW, 136);
    y += 14;
    y = heading(d, "Grenzsteuersatz und seine Auswirkungen auf die Investition", y, { sz: 13 });
    y += 2;
    y = para(d, `Ihre steuerliche Ersparnis bei der Basisrente richtet sich nach Ihrem Grenzsteuersatz. Liegt dieser zum Beispiel bei ${fmtPct(r.modeledCombinedMarginalRate)}, erhalten Sie für jeden investierten Euro ${(r.modeledCombinedMarginalRate / 100).toFixed(2)} € vom Staat zurück. Hier sehen Sie, wie hoch Ihr aktueller Durchschnitts- und Grenzsteuersatz ausfällt — und wie stark Sie von der Förderung profitieren können.`, y, { lh: 5 });
    y += 8;

    const hw = (CW - 24) / 2;

    // Durchschnittssteuersatz
    card(d, ML + 8, y, hw, 76, { fill: C.white, radius: 7 });
    iconCircle(d, ML + 20, y + 14, C.emerald, iconAvg, 6);
    d.setFont("helvetica", "normal"); d.setFontSize(9.5); sc(d, C.emerald);
    d.text("Ihr Durchschnittssteuersatz", ML + 30, y + 17);
    d.setFont("helvetica", "bold"); d.setFontSize(30); sc(d, C.navy);
    const avgRate = r.effectiveRate > 0 ? r.modeledMarginalRate * 0.8 : 0;
    d.text(fmtPct(avgRate), ML + 18, y + 38);
    para(d, "Ihr Durchschnittssteuersatz zeigt, wie hoch Ihre durchschnittliche Steuerbelastung auf Ihr gesamtes Einkommen ist. Beispiel: Bei 50.000 € Einkommen und 30 % Durchschnittssteuersatz wären das 15.000 € Steuern.", y + 46, {
        w: hw - 20, x: ML + 18, sz: 7, lh: 3.5, color: C.slate400
    });

    // Grenzsteuersatz
    const gx = ML + 8 + hw + 8;
    card(d, gx, y, hw, 76, { fill: C.white, radius: 7 });
    iconCircle(d, gx + 12, y + 14, C.red, iconArrowUp, 6);
    d.setFont("helvetica", "normal"); d.setFontSize(9.5); sc(d, C.red);
    d.text("Ihr Grenzsteuersatz", gx + 22, y + 17);
    d.setFont("helvetica", "bold"); d.setFontSize(30); sc(d, C.navy);
    d.text(fmtPct(r.modeledCombinedMarginalRate), gx + 10, y + 38);
    para(d, "Ihr Grenzsteuersatz zeigt, wie viel Steuern Sie auf jeden zusätzlich verdienten Euro zahlen. Beispiel: Bei 40 % Grenzsteuersatz zahlen Sie auf 1 € zusätzlich 40 Cent — oder sparen diese, wenn Sie 1 € weniger versteuern müssen.", y + 46, {
        w: hw - 20, x: gx + 10, sz: 7, lh: 3.5, color: C.slate400
    });
    y += 92;

    // Max Investment
    card(d, ML, y, CW, 108);
    y += 12;
    y = heading(d, "Wie viel kann ich maximal investieren?", y);
    y += 2;
    y = para(d, `Der steuerlich förderfähige Höchstbetrag für die Rürup-Rente wird jährlich festgelegt — zunächst sehen Sie, für welchen Investitionsbetrag Sie sich entschieden haben und anschließend, wie viel Sie maximal steuerlich geltend machen könnten.`, y, { lh: 4.8 });
    y += 8;

    // Two metric cards with proper spacing
    card(d, ML + 8, y, hw, 38, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 20, y + 12, C.emerald, iconEuro, 5);
    d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.navy);
    d.text("€ " + fmt(inp.monthlyInvestmentWish).replace(" €", "") + " /mtl.", ML + 30, y + 14);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("Ihr Investitionswunsch", ML + 18, y + 30);

    card(d, gx, y, hw, 38, { fill: C.white, radius: 6 });
    iconCircle(d, gx + 12, y + 12, C.blue, iconDiamond, 5);
    d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.navy);
    d.text("€ " + fmt(r.monthlyLimit).replace(" €", "") + " /mtl.", gx + 22, y + 14);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("Maximal geförderte Investition", gx + 10, y + 30);
    y += 44;

    // Smaller progress bar
    const barX = ML + 8, barW = CW - 16;
    const pct = Math.min(100, r.limitReachedPct);
    sf(d, C.slate100); d.roundedRect(barX, y, barW, 4.5, 2.2, 2.2, "F");
    sd(d, C.slate200); d.setLineWidth(0.15); d.roundedRect(barX, y, barW, 4.5, 2.2, 2.2, "S");
    if (pct > 0) {
        sf(d, C.emerald);
        const fillW = Math.max(5, barW * pct / 100);
        d.roundedRect(barX, y, fillW, 4.5, 2.2, 2.2, "F");
        sf(d, C.white); d.circle(barX + fillW - 1.5, y + 2.25, 2.8, "F");
        sf(d, C.emeraldDark); d.circle(barX + fillW - 1.5, y + 2.25, 2, "F");
    }
    y += 9;

    sf(d, C.navy);
    const badge = `${pct.toFixed(pct < 10 ? 2 : 1)} % erreicht`;
    d.setFont("helvetica", "bold"); d.setFontSize(7);
    const bw = d.getTextWidth(badge) + 10;
    d.roundedRect(ML + 8, y, bw, 7, 3.5, 3.5, "F");
    sc(d, C.white); d.text(badge, ML + 13, y + 5);

    pageFooter(d, 4, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 5 — TAX BENEFIT (DONUT)
   ════════════════════════════════════════════════════════ */
function pageTaxBenefit(d: jsPDF, data: PdfRequestData, r: RuerupResult, inp: RuerupPdfInputState) {
    pageHeader(d, 5);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    d.setFont("helvetica", "bold"); d.setFontSize(17); sc(d, C.navy);
    d.text("Steuervorteil: Ihr persönlicher Rückfluss", ML, y);
    y += 10;

    y = para(d, `Ein wesentlicher Vorteil der Basisrente ist, dass sie in der Steuererklärung zu 100 % abgesetzt werden kann. Wenn Sie ${fmt(inp.monthlyInvestmentWish)} monatlich in die Basisrente einzahlen und Ihr Grenzsteuersatz bei ${fmtPct(r.modeledCombinedMarginalRate)} liegt, erhalten Sie diesen Betrag in Form einer Steuerersparnis zurück. Das bedeutet, dass Ihre effektive Eigeninvestition bei nur ${fmt(r.monthlyActualInvestment)} pro Monat liegt, während der Rest durch die steuerliche Förderung vom Staat refinanziert wird.`, y, { sz: 10.5, lh: 5.2 });
    y += 8;

    // Investment card (left, smaller)
    const leftW = CW * 0.3;
    card(d, ML, y, leftW, 56, { fill: C.slate100, noShadow: true, noBorder: true, radius: 6 });
    iconCircle(d, ML + 14, y + 14, C.emerald, iconEuro, 5);
    d.setFont("helvetica", "bold"); d.setFontSize(24); sc(d, C.navy);
    d.text(fmt(inp.monthlyInvestmentWish), ML + 12, y + 32);
    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.slate400);
    d.text("Ihre Investition", ML + 12, y + 42);

    // Arrow pointing to donut
    const arrowX = ML + leftW + 4;
    sd(d, C.blue); d.setLineWidth(0.5);
    d.line(arrowX, y + 28, arrowX + 10, y + 28);
    d.line(arrowX + 8, y + 26, arrowX + 10, y + 28);
    d.line(arrowX + 8, y + 30, arrowX + 10, y + 28);

    // Donut chart — bigger, centered right, with labels INSIDE
    const donutCx = ML + leftW + 46;
    const donutCy = y + 28;
    const donutR = 28;

    drawArc(d, donutCx, donutCy, donutR, 0, 360, C.slate200, 10);
    const blueDeg = r.actualPct * 360;
    drawArc(d, donutCx, donutCy, donutR, -90, -90 + blueDeg, C.blue, 10);
    drawArc(d, donutCx, donutCy, donutR, -90 + blueDeg, 270, C.emerald, 10);

    // Labels right of donut
    const lx = donutCx + donutR + 14;
    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.emerald);
    d.text("Steuervorteil pro Monat", lx, donutCy - 18);
    d.setFont("helvetica", "bold"); d.setFontSize(20); sc(d, C.emerald);
    d.text(fmt(r.monthlyTaxBenefit), lx, donutCy - 6);

    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.blue);
    d.text("Effektive Investition", lx, donutCy + 10);
    d.setFont("helvetica", "bold"); d.setFontSize(20); sc(d, C.blue);
    d.text(fmt(r.monthlyActualInvestment), lx, donutCy + 22);

    y += 68;

    // Bottom cards: Annual + Lifetime with connecting arrow
    const bw2 = (CW - 16) / 2;

    card(d, ML, y, bw2, 50, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 14, y + 16, C.emerald, iconCheck, 5);
    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.slate400);
    d.text("Steuervorteil pro Jahr", ML + 24, y + 18);
    d.setFont("helvetica", "bold"); d.setFontSize(24); sc(d, C.emerald);
    d.text(fmt(r.annualTaxBenefit), ML + 12, y + 40);

    // Arrow between cards
    const arX = ML + bw2 + 2;
    sd(d, C.blue); d.setLineWidth(0.5);
    d.line(arX, y + 25, arX + 12, y + 25);
    sf(d, C.blue);
    d.triangle(arX + 12, y + 23, arX + 12, y + 27, arX + 15, y + 25, "F");

    const ltx = ML + bw2 + 16;
    const ltBenefit = r.annualTaxBenefit * r.yearsUntilRetirement;
    card(d, ltx, y, bw2, 50, { fill: C.emerald, noBorder: true, radius: 6 });
    iconCircle(d, ltx + 14, y + 16, C.emeraldDark, iconTarget, 5);
    sf(d, C.green50); opacity(d, 0.15); d.circle(ltx + 14, y + 16, 5, "F"); opacity(d, 1);
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    const arIcx = ltx + bw2 - 18;
    sf(d, C.white); opacity(d, 0.2); d.circle(arIcx, y + 16, 5, "F"); opacity(d, 1);
    iconArrowRight(d, arIcx, y + 16, 2.5); sd(d, C.white); d.setLineWidth(0.5);
    d.line(arIcx - 2.5, y + 16, arIcx + 2.5, y + 16);
    d.line(arIcx + 1, y + 14.5, arIcx + 2.5, y + 16);
    d.line(arIcx + 1, y + 17.5, arIcx + 2.5, y + 16);

    d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.emeraldPale);
    d.text("Steuervorteil bis zum Renteneintritt", ltx + 12, y + 18);
    d.setFont("helvetica", "bold"); d.setFontSize(24); sc(d, C.white);
    d.text(fmt(ltBenefit), ltx + 12, y + 40);

    pageFooter(d, 5, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 6 — CHART COMPARISON
   ════════════════════════════════════════════════════════ */
function pageChart(d: jsPDF, data: PdfRequestData, r: RuerupResult) {
    pageHeader(d, 6);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 35;

    card(d, ML, y, CW, 248);
    y += 12;
    y = heading(d, "Die Wertentwicklung Ihrer Basisrente im Vergleich", y, { sz: 13 });
    y += 2;
    y = para(d, `In dieser Darstellung vergleichen wir drei verschiedene Varianten. Variante 1 ist ein Sparplan ohne Steuervorteil, beispielsweise in ein Depot. Variante 2 ist die Investition in eine Basisrente mit Steuerersparnis. Variante 3 ist die Investition in die Basisrente mit einer Reinvestition Ihrer Steuerersparnis.`, y, { lh: 4.8 });
    y += 8;

    const vw = (CW - 28) / 3;
    const vh = 70;
    const variantIcons: ((d: jsPDF, x: number, y: number, s: number) => void)[] = [iconChart, iconShield, iconTarget];
    const variants = [
        { title: "Investition ohne\nSteuervorteil", inv: r.periodTotalInvestment, eff: r.periodTotalInvestment, val: r.finalPoint.savingsWithoutTaxBenefit, bg: C.slate100, fg: C.navy, valBg: C.red, iconC: C.red },
        { title: "Basisrente\nohne Reinvestition", inv: r.periodTotalInvestment, eff: r.periodActualInvestment, val: r.finalPoint.ruerupWithoutReinvest, bg: C.blue, fg: C.white, valBg: C.blueDark, iconC: C.white },
        { title: "Basisrente\nmit Reinvestition", inv: r.periodTotalInvestment, eff: r.periodActualInvestment, val: r.finalPoint.ruerupWithReinvest, bg: C.emerald, fg: C.white, valBg: C.emeraldDark, iconC: C.white },
    ];

    variants.forEach((v, i) => {
        const vx = ML + 8 + i * (vw + 6);
        card(d, vx, y, vw, vh, { fill: v.bg, noBorder: v.bg !== C.slate100, border: C.slate200, radius: 7 });

        if (v.bg === C.slate100) {
            iconCircle(d, vx + 14, y + 14, v.iconC, variantIcons[i], 5);
        } else {
            sf(d, C.white); opacity(d, 0.2); d.circle(vx + 14, y + 14, 5, "F"); opacity(d, 1);
            variantIcons[i](d, vx + 14, y + 14, 2.5);
        }

        d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, v.fg);
        d.text(d.splitTextToSize(v.title, vw - 12) as string[], vx + 8, y + 27);

        const metricC: RGB = v.bg === C.slate100 ? C.slate400 : [200, 220, 240];
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, metricC);
        d.text("Investition", vx + 8, y + 42);
        d.text(fmt(v.inv), vx + vw - 8, y + 42, { align: "right" });
        d.text("Effektive Investition", vx + 8, y + 49);
        d.text(fmt(v.eff), vx + vw - 8, y + 49, { align: "right" });

        sf(d, v.valBg);
        d.roundedRect(vx + 4, y + vh - 15, vw - 8, 11, 4, 4, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.white);
        d.text(fmt(v.val), vx + vw / 2, y + vh - 6, { align: "center" });
    });

    y += vh + 12;

    d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
    d.text("Wertentwicklung", ML + 8, y);
    y += 8;

    const cx = ML + 28, cw = CW - 46, ch = 66;
    const cy = y;
    const pts = r.points;
    const yrs = r.yearsForChart;

    if (pts.length >= 2) {
        const maxV = Math.max(...pts.map(p => Math.max(p.ruerupWithReinvest, p.ruerupWithoutReinvest, p.savingsWithoutTaxBenefit)));
        const maxY = Math.ceil(maxV / 50000) * 50000 || 50000;

        for (let i = 0; i <= 5; i++) {
            const v = maxY * (1 - i / 5);
            const gy = cy + (i / 5) * ch;
            d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
            d.text(v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`, cx - 6, gy + 1.5, { align: "right" });
            sd(d, C.slate100); d.setLineWidth(0.1); d.line(cx, gy, cx + cw, gy);
        }
        const xs = yrs <= 10 ? 1 : yrs <= 20 ? 2 : yrs <= 30 ? 4 : 8;
        for (let yr = 0; yr <= yrs; yr += xs) {
            const tx = cx + (yr / yrs) * cw;
            d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
            d.text(`${yr}`, tx, cy + ch + 6, { align: "center" });
        }

        const curves: { k: keyof CurvePoint; c: RGB; w: number; icon: (d: jsPDF, x: number, y: number, s: number) => void }[] = [
            { k: "savingsWithoutTaxBenefit", c: C.red, w: 1.2, icon: iconChart },
            { k: "ruerupWithoutReinvest", c: C.blue, w: 1.4, icon: iconShield },
            { k: "ruerupWithReinvest", c: C.emerald, w: 1.6, icon: iconTarget },
        ];
        curves.forEach(curve => {
            sd(d, curve.c); d.setLineWidth(curve.w);
            for (let i = 1; i < pts.length; i++) {
                const x1 = cx + (pts[i - 1].year / yrs) * cw;
                const y1 = cy + ch - ((pts[i - 1][curve.k] as number) / maxY) * ch;
                const x2 = cx + (pts[i].year / yrs) * cw;
                const y2 = cy + ch - ((pts[i][curve.k] as number) / maxY) * ch;
                d.line(x1, y1, x2, y2);
            }
            const last = pts[pts.length - 1];
            const ex = cx + (last.year / yrs) * cw;
            const ey = cy + ch - ((last[curve.k] as number) / maxY) * ch;
            sf(d, C.white); d.circle(ex, ey, 4, "F");
            sf(d, curve.c); d.circle(ex, ey, 3, "F");
            curve.icon(d, ex, ey, 1.5);
        });
    }

    y = cy + ch + 14;

    const legend = [
        { l: "Rürup mit Reinvestition", c: C.emerald, v: r.finalPoint.ruerupWithReinvest },
        { l: "Rürup ohne Reinvestition", c: C.blue, v: r.finalPoint.ruerupWithoutReinvest },
        { l: "Sparplan ohne Steuervorteil", c: C.red, v: r.finalPoint.savingsWithoutTaxBenefit },
    ];
    legend.forEach((item, i) => {
        const ly = y + i * 11;
        sf(d, item.c); d.circle(ML + 14, ly - 1.5, 3, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(10); sc(d, C.slate500);
        d.text(item.l, ML + 21, ly);
        d.setFont("helvetica", "bold"); d.setFontSize(10.5); sc(d, C.navy);
        d.text(fmt(item.v), PW - ML - 8, ly, { align: "right" });
    });

    pageFooter(d, 6, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 7 — CALCULATION BASIS
   ════════════════════════════════════════════════════════ */
function pageCalcBasis(d: jsPDF, data: PdfRequestData, _r: RuerupResult, inp: RuerupPdfInputState) {
    pageHeader(d, 7);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 35;

    d.setFont("helvetica", "bold"); d.setFontSize(17); sc(d, C.navy);
    d.text("Berechnungsgrundlage", ML, y);
    y += 10;
    y = para(d, `Hier finden Sie die wesentlichen Faktoren und Annahmen, die den Berechnungen zugrunde liegen — verständlich aufbereitet, um Ihnen volle Transparenz zu bieten.`, y, { sz: 11, lh: 5.5 });
    y += 14;

    function dataCard(x: number, yStart: number, w: number, iconFn: (d: jsPDF, x: number, y: number, s: number) => void, title: string, rows: [string, string][]) {
        const rowH = 12;
        const headerH = 24;
        const h = headerH + rows.length * rowH + 8;
        card(d, x, yStart, w, h, { radius: 6 });
        iconCircle(d, x + 14, yStart + 14, C.emerald, iconFn, 5);
        d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
        const maxTitleW = w - 32;
        const titleLines = d.splitTextToSize(title, maxTitleW) as string[];
        d.text(titleLines[0], x + 24, yStart + 17);
        rows.forEach(([label, value], i) => {
            const ry = yStart + headerH + i * rowH + 6;
            if (i > 0) { sd(d, C.slate100); d.setLineWidth(0.15); d.line(x + 10, ry - 5, x + w - 10, ry - 5); }
            d.setFont("helvetica", "normal"); d.setFontSize(9); sc(d, C.slate500);
            d.text(label, x + 12, ry);
            d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.navy);
            d.text(value, x + w - 12, ry, { align: "right" });
        });
        return h;
    }

    const hw = (CW - 14) / 2;
    const h1 = dataCard(ML, y, hw, iconPerson, "Angaben zur Person", [
        ["Geburtsdatum", fmtDate(inp.dateOfBirth)],
        ["Bundesland", inp.federalState],
        ["Renteneintrittsalter", `${inp.retirementAge} Jahre`],
        ["Familienstand", inp.filingStatus === "single" ? "Ledig" : "Verheiratet"],
    ]);
    const h2 = dataCard(ML + hw + 14, y, hw, iconDoc, "Annahmen zur Steuer", [
        ["Kirchensteuerpflichtig", inp.churchTaxEnabled === "yes" ? "Ja" : "Nein"],
        ["Steuerliche Veranlagung", inp.filingStatus === "single" ? "Ledig" : "Zusammen"],
        ["Zu verst. Einkommen", fmt(inp.taxableIncome)],
    ]);
    y += Math.max(h1, h2) + 14;

    dataCard(ML, y, hw, iconHeart, "Krankenversicherung", [
        ["Art der KV", inp.healthInsurance === "pkv" ? "Privat (PKV)" : "Gesetzlich"],
    ]);
    dataCard(ML + hw + 14, y, hw, iconEuro, "Investition", [
        ["Monatliche Einzahlung", fmt(inp.monthlyInvestmentWish)],
    ]);

    pageFooter(d, 7, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 8 — CLOSING
   ════════════════════════════════════════════════════════ */
function pageClosing(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 8);
    const name = `${data.firstName} ${data.lastName}`;
    const cx = PW / 2;

    drawLogo(d, cx, 44, 10);

    let y = 72;
    d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.navy);
    d.text(`Sehr geehrte/r Herr ${data.lastName},`, ML, y);
    y += 20;

    y = para(d, `ich hoffe, dieses Gutachten hat Ihnen eine hilfreiche Übersicht und mehr Klarheit über Ihre aktuelle Finanzsituation sowie die nächsten Schritte für Ihre finanzielle Zukunft verschafft. Der entscheidende Punkt ist jetzt die konsequente Umsetzung der Empfehlungen. Nur so werden Sie langfristig von den geplanten Maßnahmen profitieren und sich die Sicherheit aufbauen, die Sie sich wünschen.`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 10;

    y = para(d, `Ich freue mich darauf, Sie weiterhin zu begleiten und Sie bei jedem Schritt zu unterstützen. Gemeinsam stellen wir sicher, dass Sie Ihre Ziele erreichen und Ihre finanzielle Situation stetig im Blick behalten. Vielen Dank für Ihr Vertrauen — auf eine erfolgreiche und sichere Zukunft!`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 22;

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Mit besten Grüßen,", ML, y);

    y += 52;

    // Quote card — bigger, more prominent
    const qh = 60;
    card(d, ML, y, CW, qh, { fill: C.slate50, noBorder: true, noShadow: true, radius: 10 });
    sd(d, C.slate200); d.setLineWidth(0.2);
    d.roundedRect(ML, y, CW, qh, 10, 10, "S");

    // Elegant quote marks — two green comma shapes
    sf(d, C.emerald);
    d.roundedRect(cx - 8, y + 10, 5.5, 4.5, 2, 2, "F");
    d.roundedRect(cx - 8, y + 15.5, 3, 2.5, 1, 1, "F");
    d.roundedRect(cx + 1.5, y + 10, 5.5, 4.5, 2, 2, "F");
    d.roundedRect(cx + 1.5, y + 15.5, 3, 2.5, 1, 1, "F");

    d.setFont("helvetica", "bold"); d.setFontSize(11.5); sc(d, C.navy);
    const qt = d.splitTextToSize("Der beste Zeitpunkt, um zu investieren, war vor 20 Jahren. Der zweitbeste Zeitpunkt ist jetzt.", CW - 50) as string[];
    d.text(qt, cx, y + 32, { align: "center" });

    // Attribution
    sf(d, C.emerald); d.circle(cx - 34, y + qh - 10, 4, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    d.text("W", cx - 35.8, y + qh - 8.5);
    d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate400);
    d.text("Warren Buffett, US-amerikanischer Investor", cx - 27, y + qh - 8.5);

    pageFooter(d, 8, name);
}

/* ═══════════════ MAIN EXPORT ═══════════════ */
export function generateRuerupPdf(data: PdfRequestData, result: RuerupResult, input: RuerupPdfInputState) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    pageCover(doc, data);
    doc.addPage(); pageIntro(doc, data);
    doc.addPage(); pageBenefits(doc, data);
    doc.addPage(); pageTaxRate(doc, data, result, input);
    doc.addPage(); pageTaxBenefit(doc, data, result, input);
    doc.addPage(); pageChart(doc, data, result);
    doc.addPage(); pageCalcBasis(doc, data, result, input);
    doc.addPage(); pageClosing(doc, data);

    doc.save(`Ruerup_Steuervorteilplan_${data.lastName}_${fmtDate(new Date()).replace(/\./g, "-")}.pdf`);
}
