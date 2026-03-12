/**
 * Altersvorsorge / Rentenlücke — Premium PDF Generator
 * Design matches CapitalFlow Finanzgutachten quality.
 */
import jsPDF from "jspdf";
import type { PdfRequestData } from "@/components/ui/PdfRequestModal";

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
    yellow: [234, 179, 8] as RGB,
    purple: [139, 92, 246] as RGB,
    indigo: [99, 102, 241] as RGB, indigoDark: [67, 56, 202] as RGB,
};

/* ═══════════════ LAYOUT ═══════════════ */
const PW = 210; const PH = 297;
const ML = 22; const CW = PW - ML * 2;
const FOOTER_Y = PH - 14;

/* ═══════════════ INPUT TYPES ═══════════════ */
export interface PensionPdfInput {
    mode: "employee" | "versorgungswerk";
    dob: Date;
    jobEntry: Date;
    monthlyGross: number;
    churchTax: boolean;
    retirementAge: number;
    lifeExpectancy: number;
    healthType: "legal" | "private";
    targetNetToday: number;
    inflationPct: number;
    returnSavingPct: number;
    returnTakeoutPct: number;
    desiredSaving: number;
    initialLumpSum: number;
}

export interface PensionPdfResult {
    gap: number;
    pensionNet: number;
    privatePayout: number;
    totalPension: number;
    targetInflated: number;
    requiredCapital: number;
    requiredCapitalFull: number;
    requiredSavingNow: number;
    requiredIn4: number;
    requiredIn8: number;
    coverage: number;
    capitalNow: number;
    capitalIn4: number;
    capitalIn8: number;
    interestNow: number;
    interestIn4: number;
    interestIn8: number;
    retirementYear: number;
    monthsToRet: number;
}

/* ═══════════════ FORMATTERS ═══════════════ */
const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
const fmtShort = (n: number) => isFinite(n) ? n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €" : "∞";
const fmtPct = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + " %";
const fmtDate = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtDateLong = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

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
    d.setFont("helvetica", "bold"); d.setFontSize(r * 2); sc(d, color);
    const tw = d.getTextWidth(symbol);
    d.text(symbol, cx - tw / 2, cy + r * 0.4);
}

function hline(d: jsPDF, y: number) { sd(d, C.slate200); d.setLineWidth(0.15); d.line(ML, y, PW - ML, y); }

let totalPages = 12;

function pageHeader(d: jsPDF, pageNum: number) {
    sf(d, C.emerald); d.rect(0, 0, PW, 1.5, "F");
    sf(d, C.emeraldPale); d.rect(0, 1.5, PW, 0.5, "F");
    drawLogoSmall(d, ML + 5, 15);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre Altersvorsorge", ML + 14, 17.5);
    const arcCx = PW - ML - 5, arcCy = 15, arcR = 7;
    const pct = pageNum / totalPages;
    drawArc(d, arcCx, arcCy, arcR, 0, 360, C.slate200, 1.6);
    if (pct > 0) drawArc(d, arcCx, arcCy, arcR, -90, -90 + pct * 360, C.emerald, 1.8);
    const ea = (-90 + pct * 360) * Math.PI / 180;
    sf(d, C.emerald); d.circle(arcCx + arcR * Math.cos(ea), arcCy + arcR * Math.sin(ea), 1, "F");
}

function pageFooter(d: jsPDF, num: number, name: string) {
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(ML, FOOTER_Y - 5, PW - ML, FOOTER_Y - 5);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text(`\u00A9${new Date().getFullYear()} Medizinerberatung Horbach \u2022 Finanzgutachten f\u00FCr ${name}`, ML, FOOTER_Y);
    d.text(`${num}`, PW - ML, FOOTER_Y, { align: "right" });
}

function para(d: jsPDF, text: string, y: number, opts?: { w?: number; sz?: number; x?: number; color?: RGB; lh?: number; bold?: boolean }): number {
    const w = opts?.w ?? CW - 4; const sz = opts?.sz ?? 10.5;
    const x = opts?.x ?? ML + 4; const lh = opts?.lh ?? 5.2;
    d.setFont("helvetica", opts?.bold ? "bold" : "normal"); d.setFontSize(sz); sc(d, opts?.color ?? C.slate500);
    const lines = d.splitTextToSize(text, w) as string[];
    lines.forEach((line: string, i: number) => d.text(line, x, y + i * lh));
    return y + lines.length * lh + 2;
}

/* ═══════════════ DERIVED HELPERS ═══════════════ */
function derivedValues(inp: PensionPdfInput, res: PensionPdfResult) {
    const ytr = res.monthsToRet / 12;
    const inflFactor = Math.pow(1 + inp.inflationPct / 100, ytr);
    const pensionNetReal = res.pensionNet / inflFactor;
    const privatePayoutReal = res.privatePayout / inflFactor;
    const gapReal = Math.max(0, inp.targetNetToday - pensionNetReal - privatePayoutReal);
    const totalReal = pensionNetReal + privatePayoutReal;
    const coveragePct = res.targetInflated > 0 ? res.totalPension / res.targetInflated * 100 : 0;
    return { ytr, inflFactor, pensionNetReal, privatePayoutReal, gapReal, totalReal, coveragePct };
}

/* ════════════════════════════════════════════════════════
   PAGE 1 — COVER
   ════════════════════════════════════════════════════════ */
function pageCover(d: jsPDF, data: PdfRequestData, res: PensionPdfResult) {
    sf(d, C.emerald); d.rect(0, 0, PW, 3, "F");
    sf(d, C.emeraldPale); d.rect(0, 3, PW, 0.6, "F");
    const cx = PW / 2;

    drawLogo(d, cx, 48, 14);

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.emerald);
    d.text(`Sehr geehrte/r Herr ${data.lastName},`, cx, 80, { align: "center" });

    d.setFont("helvetica", "bold"); d.setFontSize(28); sc(d, C.navy);
    d.text("Ihre Altersvorsorge", cx, 100, { align: "center" });

    d.setFont("helvetica", "normal"); d.setFontSize(10.5); sc(d, C.slate500);
    const sub = d.splitTextToSize("Eine \u00DCbersicht Ihrer bestehenden Anspr\u00FCche und wie Sie Ihre Versorgungsl\u00FCcke schlie\u00DFen k\u00F6nnen.", 130) as string[];
    d.text(sub, cx, 114, { align: "center" });

    d.setFont("helvetica", "normal"); d.setFontSize(11); sc(d, C.slate400);
    d.text(`Erstellt am ${fmtDate(new Date())}`, cx, 135, { align: "center" });

    // Decorative bar chart visual
    const chartX = cx - 40, chartY = 155, chartH = 75;
    card(d, chartX - 16, chartY - 10, 112, chartH + 30, { radius: 8 });

    // Versorgungslücke badge
    sf(d, C.navy); d.roundedRect(cx - 2, chartY - 6, 46, 10, 4, 4, "F");
    sf(d, C.red); d.circle(cx + 2, chartY - 1, 2, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.white);
    d.text("Versorgungsl\u00FCcke", cx + 6, chartY + 1);

    // 3 bars
    const barW = 24, barGap = 8;
    const bars = [
        { h: chartH * 0.4, segs: [{ pct: 1, c: C.slate300 }] },
        { h: chartH * 0.65, segs: [{ pct: 1, c: C.slate400 }] },
        { h: chartH * 0.9, segs: [{ pct: 0.12, c: C.blue }, { pct: 0.15, c: C.emerald }, { pct: 0.2, c: C.yellow }, { pct: 0.53, c: C.red }] },
    ];
    bars.forEach((bar, i) => {
        const bx = chartX + i * (barW + barGap);
        let by = chartY + chartH - bar.h + 8;
        bar.segs.forEach(seg => {
            const segH = bar.h * seg.pct;
            sf(d, seg.c);
            if (by === chartY + chartH - bar.h + 8) d.roundedRect(bx, by, barW, segH, 3, 0, "F");
            else d.rect(bx, by, barW, segH, "F");
            by += segH;
        });
    });

    // Gesamtrente label
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate500);
    d.text("Gesamtrente", cx - 18, chartY + chartH + 14);
    sf(d, C.emerald); d.roundedRect(cx + 6, chartY + chartH + 8, 36, 9, 3, 3, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.white);
    d.text(fmt(res.totalPension), cx + 24, chartY + chartH + 14, { align: "center" });

    hline(d, 250);

    const by2 = 260;
    drawLogoSmall(d, ML + 6, by2 + 2);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Ihre Ansprechperson", ML + 16, by2 - 2);
    d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.navy);
    d.text(`${data.firstName} ${data.lastName}`, ML + 16, by2 + 4);
    sd(d, C.slate200); d.setLineWidth(0.15); d.line(ML + 62, by2 - 4, ML + 62, by2 + 8);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate500);
    d.text(data.phone, ML + 68, by2 - 1);
    d.text(data.email, ML + 68, by2 + 5);

    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("1", PW - ML, FOOTER_Y, { align: "right" });
}

/* ════════════════════════════════════════════════════════
   PAGE 2 — INTRO
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

    y = para(d, `die Altersvorsorge ist eines der wichtigsten Themen f\u00FCr Ihre finanzielle Zukunft. Umso bedeutsamer ist es, fr\u00FChzeitig Klarheit \u00FCber Ihre aktuelle Versorgungssituation zu gewinnen. Genau daf\u00FCr haben wir diese Analyse erstellt: Sie zeigt Ihnen transparent, wo Sie heute stehen, welche L\u00FCcke sich bis zum Renteneintritt auftun k\u00F6nnte und wie Sie diese gezielt schlie\u00DFen k\u00F6nnen.`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 12;

    y = para(d, `Als Mediziner stehen Sie vor besonderen Herausforderungen: hohe berufliche Belastung, komplexe Versorgungswerke und eine Finanzwelt, die sich st\u00E4ndig ver\u00E4ndert. Wir m\u00F6chten Ihnen helfen, den \u00DCberblick zu behalten und die richtigen Entscheidungen f\u00FCr Ihre Zukunft zu treffen. Diese Auswertung ist Ihr erster Schritt zu einer ma\u00DFgeschneiderten Altersvorsorge-Strategie.`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 24;

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Mit besten Gr\u00FC\u00DFen,", ML, y);
    y += 22;

    drawLogoSmall(d, ML + 6, y + 3);
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    d.text(`${data.firstName} ${data.lastName}`, ML + 18, y + 2);
    d.setFont("helvetica", "normal"); d.setFontSize(10); sc(d, C.slate400);
    d.text("Ihre Ansprechperson", ML + 18, y + 9);

    pageFooter(d, 2, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 3 — WARUM IST ALTERSVORSORGE WICHTIG?
   ════════════════════════════════════════════════════════ */
function pageWhyImportant(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 3);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    d.setFont("helvetica", "bold"); d.setFontSize(15); sc(d, C.navy);
    d.text("Warum ist Altersvorsorge wichtig?", ML, y);
    y += 8;
    y = para(d, "Die gesetzliche Rente reicht immer seltener aus, um den Lebensstandard im Alter zu sichern. Faktoren wie der demografische Wandel, Inflation und die steigende Besteuerung f\u00FChren dazu, dass die Versorgungsl\u00FCcken gr\u00F6\u00DFer werden. Eine gut geplante Altersvorsorge ist entscheidend.", y, { sz: 10, lh: 5, x: ML, w: CW });
    y += 6;

    const halfW = (CW - 8) / 2;

    // Left card: Demografischer Wandel
    card(d, ML, y, halfW, 100, { radius: 7 });
    const popX = ML + halfW / 2, popY = y + 14;

    // Population pyramid simplified
    const popBars = [
        { w: 16, c: C.slate300 }, { w: 22, c: C.slate300 }, { w: 28, c: C.slate400 },
        { w: 32, c: C.slate400 }, { w: 26, c: C.blue }, { w: 18, c: C.blue },
    ];
    popBars.forEach((b, i) => {
        sf(d, b.c); d.roundedRect(popX - b.w / 2 - 10, popY + i * 7, b.w / 2, 5.5, 1.5, 1.5, "F");
        sf(d, b.c); d.roundedRect(popX + 10 - b.w / 2, popY + i * 7, b.w / 2, 5.5, 1.5, 1.5, "F");
    });

    // Legend
    sf(d, C.navy); d.roundedRect(ML + 10, popY - 2, 22, 6, 2, 2, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(5); sc(d, C.white); d.text("M\u00E4nner", ML + 12, popY + 2);
    sf(d, C.navy); d.roundedRect(ML + halfW - 32, popY - 2, 22, 6, 2, 2, "F");
    d.text("Frauen", ML + halfW - 30, popY + 2);

    d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
    d.text("Demografischer Wandel", ML + 10, y + 72);
    para(d, "Immer weniger Erwerbst\u00E4tige finanzieren immer mehr Rentner. Das Rentensystem steht unter Druck.", y + 78, { sz: 8, lh: 3.8, x: ML + 10, w: halfW - 20, color: C.slate400 });

    // Right card: Inflation
    card(d, ML + halfW + 8, y, halfW, 100, { radius: 7 });
    const infX = ML + halfW + 18;
    const decades = [2000, 2010, 2020, 2030, 2040];
    const euroVals = ["0,60\u20AC", "1,20\u20AC", "2,20\u20AC", "3,50\u20AC", "4,50\u20AC"];
    const pillColors: RGB[] = [C.emerald, C.emeraldDark, C.amber, C.red, C.red];
    const stepW = (halfW - 28) / 4;

    decades.forEach((dec, i) => {
        const px = infX + i * stepW;
        const pillH = 10 + i * 5;
        sf(d, pillColors[i]); opacity(d, 0.15);
        d.roundedRect(px - 5, popY + 30 - pillH, 12, pillH + 4, 2, 2, "F");
        opacity(d, 1);
        sf(d, pillColors[i]); d.roundedRect(px - 4, popY + 30 - pillH + 2, 10, 7, 2, 2, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(5); sc(d, C.white);
        d.text(euroVals[i], px + 1, popY + 30 - pillH + 6.5, { align: "center" });
        d.setFont("helvetica", "bold"); d.setFontSize(5.5); sc(d, C.navy);
        d.text(`${dec}`, px + 1, popY + 38, { align: "center" });
    });

    d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
    d.text("Inflation", infX - 8, y + 72);
    para(d, "Steigende Preise reduzieren die Kaufkraft Ihrer Rente. Mit dem gleichen Betrag k\u00F6nnen Sie sich im Alter deutlich weniger leisten.", y + 78, { sz: 8, lh: 3.8, x: infX - 8, w: halfW - 20, color: C.slate400 });

    y += 108;

    // Bottom card: Besteuerung
    card(d, ML, y, CW, 80, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
    d.text("Besteuerung", ML + 12, y + 16);
    para(d, "Der zu versteuernde Anteil der gesetzlichen Rente steigt schrittweise und wird bis 2058 bereits 100% erreichen. K\u00FCnftige Renten werden vollst\u00E4ndig besteuert.", y + 22, { sz: 8, lh: 3.8, x: ML + 12, w: halfW - 8, color: C.slate400 });

    // Taxation bar chart
    const taxX = ML + CW / 2 + 10, taxY = y + 12, taxH = 52;
    const taxYears = [2020, 2030, 2040, 2050, 2058];
    const taxPcts = [0.80, 0.90, 0.95, 0.98, 1.0];
    const taxBarW = 10, taxGap = (CW / 2 - 30) / 5;

    // Y-axis labels
    [20, 40, 60, 80, 100].forEach((pct, i) => {
        const ly = taxY + taxH - (pct / 100) * taxH;
        d.setFont("helvetica", "normal"); d.setFontSize(5); sc(d, C.slate400);
        d.text(`${pct}%`, taxX - 6, ly + 1.5, { align: "right" });
        sd(d, C.slate100); d.setLineWidth(0.1);
        if (i < 4) d.line(taxX, ly, taxX + 5 * (taxBarW + taxGap) - taxGap, ly);
    });

    taxYears.forEach((yr, i) => {
        const bx = taxX + i * (taxBarW + taxGap);
        const bh = taxPcts[i] * taxH;
        const bc: RGB = i < 2 ? C.blue : i < 4 ? C.indigo : C.indigoDark;
        sf(d, bc); d.roundedRect(bx, taxY + taxH - bh, taxBarW, bh, 2, 0, "F");
        d.setFont("helvetica", "bold"); d.setFontSize(5.5); sc(d, C.navy);
        d.text(`${yr}`, bx + taxBarW / 2, taxY + taxH + 5, { align: "center" });
    });

    pageFooter(d, 3, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 4 — VERSORGUNGSSITUATION IM ALTER (NOMINAL)
   ════════════════════════════════════════════════════════ */
function pageSituationNominal(d: jsPDF, data: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult) {
    pageHeader(d, 4);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    card(d, ML, y, CW, 240, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre Versorgungssituation im Alter", ML + 12, y + 16);
    y += 20;
    para(d, `Aktuell betr\u00E4gt Ihr monatlicher Rentenanspruch ${fmt(res.pensionNet)} netto, w\u00E4hrend Ihr gew\u00FCnschtes Versorgungsziel bei ${fmt(inp.targetNetToday)} liegt. Um im Alter von ${inp.retirementAge} die gleiche Kaufkraft wie heute zu haben, m\u00FCsste Ihr Versorgungsziel ${fmt(res.targetInflated)} betragen.`, y, { sz: 9, lh: 4.5, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 24;

    // 3 metric cards
    const mw = (CW - 32) / 3;
    const metrics = [
        { label: "Vorhandene Gesamtrente", val: fmt(res.pensionNet), c: C.navy, icon: "R" },
        { label: "Versorgungsziel", val: fmt(res.targetInflated), c: C.emerald, icon: "Z" },
        { label: "Ihre Versorgungsl\u00FCcke", val: fmt(Math.max(0, res.targetInflated - res.pensionNet)), c: C.red, icon: "!" },
    ];
    metrics.forEach((m, i) => {
        const mx = ML + 10 + i * (mw + 6);
        card(d, mx, y, mw, 36, { fill: C.white, radius: 5 });
        iconCircle(d, mx + mw / 2, y + 10, m.c, m.icon, 4.5);
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(m.label, mx + mw / 2, y + 20, { align: "center" });
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, m.c);
        d.text(m.val, mx + mw / 2, y + 30, { align: "center" });
    });
    y += 42;

    // 3-bar chart
    const chartH = 100, chartBottom = y + chartH;
    const maxVal = Math.max(inp.targetNetToday, res.targetInflated, res.pensionNet + res.gap + res.privatePayout) * 1.05;
    const barW = 30, barGap2 = 16;
    const barStartX = ML + CW / 2 - (barW * 3 + barGap2 * 2) / 2;

    // Bar 1: Versorgungsziel
    const h1 = (inp.targetNetToday / maxVal) * chartH;
    sf(d, C.slate300); d.roundedRect(barStartX, chartBottom - h1, barW, h1, 3, 0, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    d.text(fmtShort(inp.targetNetToday), barStartX + barW / 2, chartBottom - h1 + 12, { align: "center" });

    // Bar 2: Versorgungsziel mit Inflation
    const h2 = (res.targetInflated / maxVal) * chartH;
    sf(d, C.slate400); d.roundedRect(barStartX + barW + barGap2, chartBottom - h2, barW, h2, 3, 0, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    d.text(fmtShort(res.targetInflated), barStartX + barW + barGap2 + barW / 2, chartBottom - h2 + 12, { align: "center" });

    // Bar 3: Stacked (pension blue + gap red)
    const stackX = barStartX + 2 * (barW + barGap2);
    const totalStack = res.pensionNet + res.gap;
    const h3 = (totalStack / maxVal) * chartH;
    const pensionH = totalStack > 0 ? (res.pensionNet / totalStack) * h3 : 0;
    const gapH = h3 - pensionH;

    sf(d, C.red); d.roundedRect(stackX, chartBottom - h3, barW, gapH, 3, 0, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(6); sc(d, C.white);
    if (gapH > 14) d.text(fmtShort(res.gap), stackX + barW / 2, chartBottom - h3 + gapH / 2 + 2, { align: "center" });

    sf(d, C.blue); d.rect(stackX, chartBottom - pensionH, barW, pensionH, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(6); sc(d, C.white);
    if (pensionH > 14) d.text(fmtShort(res.pensionNet), stackX + barW / 2, chartBottom - pensionH / 2 + 2, { align: "center" });

    y = chartBottom + 4;

    // Labels
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate500);
    d.text("Versorgungsziel", barStartX + barW / 2, y + 4, { align: "center" });
    d.text("+ Inflation", barStartX + barW + barGap2 + barW / 2, y + 4, { align: "center" });
    d.text("Deckung", stackX + barW / 2, y + 4, { align: "center" });

    y += 10;
    // Timeline labels
    iconCircle(d, ML + 20, y + 4, C.slate400, "T", 3);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Heute", ML + 28, y + 5.5);
    iconCircle(d, ML + CW - 60, y + 4, C.emerald, "R", 3);
    d.text(`Renteneintritt ${res.retirementYear} mit ${inp.retirementAge} Jahren`, ML + CW - 52, y + 5.5);

    pageFooter(d, 4, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 5 — VERSORGUNGSSITUATION NACH HEUTIGER KAUFKRAFT
   ════════════════════════════════════════════════════════ */
function pageSituationReal(d: jsPDF, data: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult) {
    pageHeader(d, 5);
    const name = `${data.firstName} ${data.lastName}`;
    const dv = derivedValues(inp, res);
    let y = 34;

    card(d, ML, y, CW, 240, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(12.5); sc(d, C.navy);
    const headLines = d.splitTextToSize("Ihre Versorgungssituation im Alter nach heutiger Kaufkraft", CW - 24) as string[];
    headLines.forEach((line: string, i: number) => d.text(line, ML + 12, y + 16 + i * 6));
    y += 14 + headLines.length * 6;
    para(d, "Die folgende Grafik zeigt Ihr Versorgungsziel und Ihre Rentenansprüche nach heutiger Kaufkraft. Entscheidend ist die inflationsbereinigte Lücke — das, was Ihr Anspruch wert wäre, wenn Sie morgen in Rente gehen würden.", y, { sz: 9, lh: 4.5, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 20;

    // 3 metric cards (real values)
    const mw = (CW - 32) / 3;
    const metricsReal = [
        { label: "Vorhandene Gesamtrente", val: fmt(dv.pensionNetReal), c: C.navy, icon: "R" },
        { label: "Versorgungsziel", val: fmt(inp.targetNetToday), c: C.emerald, icon: "Z" },
        { label: "Ihre Versorgungsl\u00FCcke", val: fmt(dv.gapReal), c: C.red, icon: "!" },
    ];
    metricsReal.forEach((m, i) => {
        const mx = ML + 10 + i * (mw + 6);
        card(d, mx, y, mw, 36, { fill: C.white, radius: 5 });
        iconCircle(d, mx + mw / 2, y + 10, m.c, m.icon, 4.5);
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
        d.text(m.label, mx + mw / 2, y + 20, { align: "center" });
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, m.c);
        d.text(m.val, mx + mw / 2, y + 30, { align: "center" });
    });
    y += 42;

    // 2-bar chart (no inflation bar in real view)
    const chartH = 100, chartBottom = y + chartH;
    const stackTotal = dv.pensionNetReal + dv.gapReal;
    const maxVal = Math.max(inp.targetNetToday, stackTotal) * 1.05;
    const barW = 36, barGap2 = 30;
    const barStartX = ML + CW / 2 - (barW * 2 + barGap2) / 2;

    const h1 = (inp.targetNetToday / maxVal) * chartH;
    sf(d, C.slate300); d.roundedRect(barStartX, chartBottom - h1, barW, h1, 3, 0, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(8); sc(d, C.white);
    d.text(fmtShort(inp.targetNetToday), barStartX + barW / 2, chartBottom - h1 + 14, { align: "center" });

    const h2 = (stackTotal / maxVal) * chartH;
    const pensionH = stackTotal > 0 ? (dv.pensionNetReal / stackTotal) * h2 : 0;
    const gapH = h2 - pensionH;

    sf(d, C.red); d.roundedRect(barStartX + barW + barGap2, chartBottom - h2, barW, gapH, 3, 0, "F");
    if (gapH > 14) {
        d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.white);
        d.text(fmtShort(dv.gapReal), barStartX + barW + barGap2 + barW / 2, chartBottom - h2 + gapH / 2 + 2, { align: "center" });
    }
    sf(d, C.blue); d.rect(barStartX + barW + barGap2, chartBottom - pensionH, barW, pensionH, "F");
    if (pensionH > 14) {
        d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.white);
        d.text(fmtShort(dv.pensionNetReal), barStartX + barW + barGap2 + barW / 2, chartBottom - pensionH / 2 + 2, { align: "center" });
    }

    y = chartBottom + 4;
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate500);
    d.text("Versorgungsziel", barStartX + barW / 2, y + 4, { align: "center" });
    d.text("Deckung (real)", barStartX + barW + barGap2 + barW / 2, y + 4, { align: "center" });

    y += 10;
    iconCircle(d, ML + 20, y + 4, C.slate400, "T", 3);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Heute", ML + 28, y + 5.5);

    pageFooter(d, 5, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 6 — BENÖTIGTES KAPITAL + SPARRATE
   ════════════════════════════════════════════════════════ */
function pageRequiredCapital(d: jsPDF, data: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult) {
    pageHeader(d, 6);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    // Top card: Required capital
    card(d, ML, y, CW, 150, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ben\u00F6tigtes Kapital zur Schlie\u00DFung der L\u00FCcke", ML + 12, y + 16);
    y += 20;
    para(d, `Um die bestehende Versorgungsl\u00FCcke zu schlie\u00DFen, ben\u00F6tigen Sie ein bestimmtes Kapital, das wir auf Basis einer angenommenen Rendite von ${inp.returnSavingPct.toFixed(2)}% und einer j\u00E4hrlichen Inflation von ${inp.inflationPct.toFixed(2)}% berechnet haben.`, y, { sz: 9, lh: 4.5, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 22;

    // Big capital number
    d.setFont("helvetica", "bold"); d.setFontSize(26); sc(d, C.emerald);
    d.text(fmt(res.requiredCapitalFull), PW / 2, y + 8, { align: "center" });
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text(`Ben\u00F6tigtes Kapital bei einer angenommenen Rendite von ${inp.returnSavingPct.toFixed(2)} %`, PW / 2, y + 18, { align: "center" });
    y += 26;

    // Growth curve
    const curveY = y, curveH = 30;
    sd(d, C.emeraldPale); d.setLineWidth(0.3);
    for (let i = 0; i < 60; i++) {
        const x1 = ML + 12 + i * (CW - 24) / 60;
        const x2 = ML + 12 + (i + 1) * (CW - 24) / 60;
        const t1 = i / 60, t2 = (i + 1) / 60;
        const y1v = curveY + curveH - (Math.pow(t1, 1.5) * curveH * 0.8 + Math.sin(t1 * Math.PI * 3) * 3);
        const y2v = curveY + curveH - (Math.pow(t2, 1.5) * curveH * 0.8 + Math.sin(t2 * Math.PI * 3) * 3);
        sf(d, C.emeraldPale); opacity(d, 0.3);
        d.triangle(x1, y1v, x2, y2v, x2, curveY + curveH, "F");
        opacity(d, 1);
        sd(d, C.emerald); d.setLineWidth(0.6);
        d.line(x1, y1v, x2, y2v);
    }
    sf(d, C.emerald); d.circle(ML + 12 + (CW - 24) * 0.6, curveY + curveH - 18, 2, "F");

    y = curveY + curveH + 16;

    // Bottom card: Sparrate
    card(d, ML, y, CW, 90, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Notwendige monatliche Sparrate", ML + 12, y + 16);
    y += 20;
    para(d, "Damit Sie Ihre Versorgungsl\u00FCcke schlie\u00DFen k\u00F6nnen, ergibt sich folgendes Sparszenario:", y, { sz: 9, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 12;

    // 3 savings rate pills
    const pillW = (CW - 36) / 3;
    const pills = [
        { label: "Heute", val: fmtShort(res.requiredSavingNow), c: C.emerald, bg: C.green50 },
        { label: "In 4 Jahren", val: fmtShort(res.requiredIn4), c: C.amber, bg: C.amberLight },
        { label: "In 8 Jahren", val: fmtShort(res.requiredIn8), c: C.red, bg: C.redLight },
    ];
    pills.forEach((p, i) => {
        const px = ML + 12 + i * (pillW + 6);
        sf(d, p.bg); d.roundedRect(px, y, pillW, 22, 6, 6, "F");
        sd(d, p.c); d.setLineWidth(0.3); d.roundedRect(px, y, pillW, 22, 6, 6, "S");
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, p.c);
        d.text(p.val, px + pillW / 2, y + 10, { align: "center" });
        d.setFont("helvetica", "normal"); d.setFontSize(6.5); sc(d, p.c);
        d.text("monatlich", px + pillW / 2, y + 16, { align: "center" });
        d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate500);
        d.text(p.label, px + pillW / 2, y + 28, { align: "center" });
    });

    y += 38;
    para(d, "Wichtig: Je fr\u00FCher Sie beginnen, desto geringer ist die monatliche Sparrate. Ein sp\u00E4terer Start f\u00FChrt zu einer deutlich h\u00F6heren Belastung.", y, { sz: 8.5, x: ML + 12, w: CW - 24, color: C.red, lh: 4 });

    pageFooter(d, 6, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 7 — IHRE ENTSCHEIDUNG: DIE START-SPARRATE
   ════════════════════════════════════════════════════════ */
function pageDecision(d: jsPDF, data: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult) {
    pageHeader(d, 7);
    const name = `${data.firstName} ${data.lastName}`;
    const dv = derivedValues(inp, res);
    let y = 34;

    card(d, ML, y, CW, 234, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Ihre Entscheidung: Die Start-Sparrate", ML + 12, y + 16);
    y += 20;

    const coverageTxt = dv.coveragePct >= 100
        ? `Sie haben sich f\u00FCr eine monatliche Sparrate von ${fmt(inp.desiredSaving)} entschieden. Damit schlie\u00DFen Sie ${fmtPct(Math.min(100, dv.coveragePct))} Ihrer aktuellen Versorgungsl\u00FCcke.`
        : `Sie haben sich f\u00FCr eine monatliche Sparrate von ${fmt(inp.desiredSaving)} entschieden. Damit schlie\u00DFen Sie ${fmtPct(Math.min(100, dv.coveragePct))} Ihrer aktuellen Versorgungsl\u00FCcke. Mit dieser Sparrate erreichen Sie bereits einen bedeutenden Teil Ihres Versorgungsziels, k\u00F6nnen aber jederzeit flexibel nachsteuern.`;
    para(d, coverageTxt, y, { sz: 9, lh: 4.5, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 26;

    const halfW = (CW - 24) / 2;

    // Left: Savings rate card
    card(d, ML + 8, y, halfW, 60, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 22, y + 16, C.emerald, "€", 5.5);
    d.setFont("helvetica", "bold"); d.setFontSize(24); sc(d, C.navy);
    d.text(fmt(inp.desiredSaving), ML + 18, y + 38);
    d.setFont("helvetica", "normal"); d.setFontSize(8); sc(d, C.slate400);
    d.text("Gew\u00FCnschte monatliche Sparrate", ML + 18, y + 48);

    // Right: Gauge donut
    card(d, ML + 8 + halfW + 8, y, halfW, 60, { fill: C.white, radius: 6 });
    const gaugeCx = ML + 8 + halfW + 8 + halfW / 2, gaugeCy = y + 28, gaugeR = 20;
    drawArc(d, gaugeCx, gaugeCy, gaugeR, 0, 360, C.slate200, 4);
    const gaugeSweep = Math.min(100, dv.coveragePct) / 100 * 360;
    if (gaugeSweep > 0) drawArc(d, gaugeCx, gaugeCy, gaugeR, -90, -90 + gaugeSweep, C.emerald, 4.5);
    d.setFont("helvetica", "normal"); d.setFontSize(6); sc(d, C.slate400);
    d.text("Zielerreichung", gaugeCx, gaugeCy - 6, { align: "center" });
    d.setFont("helvetica", "bold"); d.setFontSize(18); sc(d, C.emerald);
    d.text(`${Math.round(Math.min(100, dv.coveragePct))}%`, gaugeCx, gaugeCy + 6, { align: "center" });
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("erreicht", gaugeCx, gaugeCy + 13, { align: "center" });

    y += 68;

    // 2 bottom cards
    card(d, ML + 8, y, halfW, 44, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 22, y + 14, C.emerald, "+", 4.5);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Verf\u00FCgbares Kapital zu Rentenbeginn", ML + 18, y + 24);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.emerald);
    d.text(`+${fmtShort(res.capitalNow)}`, ML + 18, y + 36);

    card(d, ML + 8 + halfW + 8, y, halfW, 44, { fill: C.white, radius: 6 });
    iconCircle(d, ML + 22 + halfW + 8, y + 14, C.emerald, "+", 4.5);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text(`Zus\u00E4tzliche Rente im Jahr ${res.retirementYear}`, ML + 18 + halfW + 8, y + 24);
    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.emerald);
    d.text(`+${fmtShort(res.privatePayout)}`, ML + 18 + halfW + 8, y + 36);

    y += 50;
    const dv2 = derivedValues(inp, res);
    iconCircle(d, ML + 16, y + 3, C.slate400, "T", 3);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text(`${dv2.ytr.toFixed(1)} Jahre Laufzeit`, ML + 24, y + 4.5);
    iconCircle(d, ML + 62, y + 3, C.emerald, "%", 3);
    d.text(`${inp.returnSavingPct.toFixed(2)} % Rendite`, ML + 70, y + 4.5);
    iconCircle(d, ML + 108, y + 3, C.red, "~", 3);
    d.text(`${inp.inflationPct.toFixed(2)} % Inflation`, ML + 116, y + 4.5);

    pageFooter(d, 7, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 8 — ZINSESZINSEFFEKT
   ════════════════════════════════════════════════════════ */
function pageCompoundInterest(d: jsPDF, data: PdfRequestData, res: PensionPdfResult) {
    pageHeader(d, 8);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    card(d, ML, y, CW, 240, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(12); sc(d, C.navy);
    const ciHead = d.splitTextToSize("Nutzen des Zinseszinseffekts: Warum ein fr\u00FCher Start entscheidend ist", CW - 24) as string[];
    ciHead.forEach((line: string, i: number) => d.text(line, ML + 12, y + 16 + i * 6));
    y += 12 + ciHead.length * 6 + 2;

    para(d, "Dank des fr\u00FChen Starts haben Sie ausreichend Zeit, um Verm\u00F6gen effektiv aufzubauen und den Zinseszinseffekt voll auszunutzen.", y, { sz: 9, lh: 4.5, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 14;
    para(d, "Selbst ein minimal sp\u00E4terer Start in 4 oder 8 Jahren w\u00FCrde den Zinsgewinn deutlich reduzieren und den Aufbau Ihres Altersvorsorgeverm\u00F6gens sp\u00FCrbar beeintr\u00E4chtigen.", y, { sz: 9, lh: 4.5, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 20;

    // 3x2 grid
    const colW = (CW - 32) / 2;
    const periods = [
        { label: "Heute", cap: res.capitalNow, interest: res.interestNow, lossC: 0, lossI: 0 },
        { label: "In 4 Jahren", cap: res.capitalIn4, interest: res.interestIn4, lossC: res.capitalNow - res.capitalIn4, lossI: res.interestNow - res.interestIn4 },
        { label: "In 8 Jahren", cap: res.capitalIn8, interest: res.interestIn8, lossC: res.capitalNow - res.capitalIn8, lossI: res.interestNow - res.interestIn8 },
    ];

    const gridX = ML + 10;
    card(d, gridX, y, CW - 20, 148, { fill: C.white, radius: 6, noBorder: true });
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(gridX + colW + 6, y + 4, gridX + colW + 6, y + 144);

    // Headers
    iconCircle(d, gridX + colW / 2 - 8, y + 12, C.emerald, "+", 4.5);
    d.setFont("helvetica", "bold"); d.setFontSize(10); sc(d, C.navy);
    d.text("Kapital", gridX + colW / 2 + 2, y + 14);

    iconCircle(d, gridX + colW + 12 + colW / 2 - 8, y + 12, C.emerald, "%", 4.5);
    d.text("Zinsgewinn", gridX + colW + 12 + colW / 2 + 2, y + 14);

    y += 24;

    periods.forEach((p, pi) => {
        const rowY = y + pi * 42;

        // Timeline badge
        sf(d, C.slate100); d.roundedRect(gridX + colW - 2, rowY + 6, 20, 9, 4, 4, "F");
        d.setFont("helvetica", "normal"); d.setFontSize(6); sc(d, C.slate500);
        d.text(p.label, gridX + colW + 8, rowY + 12, { align: "center" });

        // Left: Capital
        d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
        d.text(fmtShort(p.cap), gridX + colW / 2, rowY + 10, { align: "center" });
        if (pi > 0 && p.lossC > 0) {
            sf(d, C.redLight); d.roundedRect(gridX + colW / 2 - 14, rowY + 14, 28, 8, 3, 3, "F");
            d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.red);
            d.text(`-${fmtShort(p.lossC)}`, gridX + colW / 2, rowY + 20, { align: "center" });
        }

        // Right: Interest
        d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
        d.text(fmtShort(p.interest), gridX + colW + 12 + colW / 2, rowY + 10, { align: "center" });
        if (pi > 0 && p.lossI > 0) {
            sf(d, C.redLight); d.roundedRect(gridX + colW + 12 + colW / 2 - 14, rowY + 14, 28, 8, 3, 3, "F");
            d.setFont("helvetica", "bold"); d.setFontSize(6.5); sc(d, C.red);
            d.text(`-${fmtShort(p.lossI)}`, gridX + colW + 12 + colW / 2, rowY + 20, { align: "center" });
        }

        if (pi < 2) {
            sd(d, C.slate100); d.setLineWidth(0.1);
            d.line(gridX + 4, rowY + 32, gridX + CW - 24, rowY + 32);
        }
    });

    pageFooter(d, 8, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 9 — ZUSAMMENFASSUNG
   ════════════════════════════════════════════════════════ */
function pageSummary(d: jsPDF, data: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult) {
    pageHeader(d, 9);
    const name = `${data.firstName} ${data.lastName}`;
    const dv = derivedValues(inp, res);
    let y = 34;

    card(d, ML, y, CW, 240, { radius: 7 });
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.navy);
    d.text("Zusammenfassung", ML + 12, y + 16);
    y += 20;
    para(d, "Durch den rechtzeitigen Start Ihrer Altersvorsorge sind Sie auf dem besten Weg, Ihre finanzielle Zukunft abzusichern. Jeder Monat z\u00E4hlt — starten Sie jetzt und sichern Sie sich ein ruhiges und finanziell stabiles Leben im Alter.", y, { sz: 9.5, lh: 4.8, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 22;

    const halfW = (CW - 24) / 2;

    // Side-by-side comparison
    card(d, ML + 8, y, halfW, 72, { fill: C.white, radius: 6 });
    sd(d, C.slate200); d.setLineWidth(0.15);
    d.line(ML + 8 + halfW, y + 4, ML + 8 + halfW, y + 68);

    // Left: Bisherige Gesamtrente
    iconCircle(d, ML + 8 + halfW / 2 - 8, y + 14, C.emerald, "+", 4);
    d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.navy);
    d.text("Ihre bisherige Gesamtrente", ML + 8 + halfW / 2 + 2, y + 16);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Im Alter", ML + 18, y + 30);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.emerald);
    d.text(fmt(res.pensionNet), ML + 18, y + 40);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Nach heutiger Kaufkraft", ML + 18, y + 52);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.emerald);
    d.text(fmt(dv.pensionNetReal), ML + 18, y + 62);

    // Arrow
    card(d, ML + 8 + halfW + 8, y, halfW, 72, { fill: C.white, radius: 6 });
    sf(d, C.emerald); d.circle(ML + 8 + halfW + 4, y + 36, 3, "F");
    sd(d, C.white); d.setLineWidth(0.5);
    d.line(ML + 8 + halfW + 2, y + 36, ML + 8 + halfW + 5, y + 36);
    d.line(ML + 8 + halfW + 4, y + 34.5, ML + 8 + halfW + 6, y + 36);
    d.line(ML + 8 + halfW + 4, y + 37.5, ML + 8 + halfW + 6, y + 36);

    // Right: Neue Gesamtrente
    const rx = ML + 8 + halfW + 16;
    iconCircle(d, rx + halfW / 2 - 16, y + 14, C.emerald, "%", 4);
    d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.navy);
    d.text("Ihre neue Gesamtrente", rx - 4, y + 16);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Im Alter", rx, y + 30);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.emerald);
    d.text(fmt(res.totalPension), rx, y + 40);
    d.setFont("helvetica", "normal"); d.setFontSize(7); sc(d, C.slate400);
    d.text("Nach heutiger Kaufkraft", rx, y + 52);
    d.setFont("helvetica", "bold"); d.setFontSize(13); sc(d, C.emerald);
    d.text(fmt(dv.totalReal), rx, y + 62);

    y += 80;

    // Summary bar chart (simplified)
    const chartH = 80, chartBottom = y + chartH;
    const maxVal = Math.max(res.targetInflated, res.totalPension + res.gap) * 1.05;
    const barW = 30, barGap2 = 20;
    const cbx = ML + CW / 2 - (barW * 3 + barGap2 * 2) / 2;

    // Bar: Versorgungsziel
    const h1 = (inp.targetNetToday / maxVal) * chartH;
    sf(d, C.slate300); d.roundedRect(cbx, chartBottom - h1, barW, h1, 3, 0, "F");

    // Bar: +Inflation
    const h2 = (res.targetInflated / maxVal) * chartH;
    sf(d, C.slate400); d.roundedRect(cbx + barW + barGap2, chartBottom - h2, barW, h2, 3, 0, "F");

    // Bar: Stacked (pension + private + gap)
    const stackTotal = res.totalPension + res.gap;
    const h3 = (stackTotal / maxVal) * chartH;
    const pensionH = stackTotal > 0 ? (res.pensionNet / stackTotal) * h3 : 0;
    const privateH = stackTotal > 0 ? (res.privatePayout / stackTotal) * h3 : 0;
    const gapH2 = h3 - pensionH - privateH;

    const sx = cbx + 2 * (barW + barGap2);
    if (gapH2 > 0) { sf(d, C.red); d.roundedRect(sx, chartBottom - h3, barW, gapH2, 3, 0, "F"); }
    if (privateH > 0) { sf(d, C.emerald); d.rect(sx, chartBottom - pensionH - privateH, barW, privateH, "F"); }
    if (pensionH > 0) { sf(d, C.blue); d.rect(sx, chartBottom - pensionH, barW, pensionH, "F"); }

    pageFooter(d, 9, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 10 — BERECHNUNGSGRUNDLAGEN
   ════════════════════════════════════════════════════════ */
function pageCalcBasis(d: jsPDF, data: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult) {
    pageHeader(d, 10);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    d.setFont("helvetica", "bold"); d.setFontSize(14); sc(d, C.navy);
    d.text("Berechnungsgrundlagen Ihrer Altersvorsorge", ML, y);
    y += 8;

    card(d, ML, y, CW, 225, { radius: 7 });
    y += 8;
    d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
    d.text("Berechnungsgrundlagen Ihrer Altersvorsorge", ML + 12, y + 8);
    y += 4;
    para(d, "Hier finden Sie die wesentlichen Faktoren und Annahmen, die den Berechnungen zugrunde liegen — verst\u00E4ndlich aufbereitet, um Ihnen volle Transparenz zu bieten.", y + 8, { sz: 8.5, lh: 4, x: ML + 12, w: CW - 24, color: C.slate400 });
    y += 24;

    const halfW = (CW - 24) / 2;

    function dataCard(cx: number, cy: number, w: number, h: number, icon: string, iconC: RGB, title: string, rows: [string, string][]) {
        card(d, cx, cy, w, h, { fill: C.white, radius: 6 });
        iconCircle(d, cx + 14, cy + 14, iconC, icon, 4.5);
        d.setFont("helvetica", "bold"); d.setFontSize(9); sc(d, C.navy);
        d.text(title, cx + 24, cy + 16);
        rows.forEach((r, i) => {
            const ry = cy + 28 + i * 10;
            d.setFont("helvetica", "normal"); d.setFontSize(7.5); sc(d, C.slate400);
            d.text(r[0], cx + 10, ry);
            d.setFont("helvetica", "bold"); d.setFontSize(7.5); sc(d, C.navy);
            d.text(r[1], cx + w - 10, ry, { align: "right" });
        });
    }

    // Card 1: Versicherungsnehmer
    dataCard(ML + 8, y, halfW, 68, "P", C.blue, "Versicherungsnehmer", [
        ["Geburtsdatum", fmtDateLong(inp.dob)],
        ["Berufseintritt", fmtDateLong(inp.jobEntry)],
        ["Monatliches Bruttoeinkommen", fmtShort(inp.monthlyGross)],
        ["Kirchensteuerpflichtig", inp.churchTax ? "Ja" : "Nein"],
    ]);

    // Card 2: Annahme zur Rente
    dataCard(ML + 8 + halfW + 8, y, halfW, 68, "R", C.emerald, "Annahme zur Rente", [
        ["Renteneintrittsalter", `${inp.retirementAge} Jahre`],
        ["Lebenserwartung", `${inp.lifeExpectancy} Jahre`],
        ["Art der Krankenversicherung", inp.healthType === "legal" ? "Gesetzlich" : "Privat"],
        [inp.mode === "versorgungswerk" ? "Mit VW" : "Mit KVdR", "Ja"],
    ]);

    y += 76;

    // Card 3: Bestehende Vorsorge (minimal)
    dataCard(ML + 8, y, halfW, 44, "S", C.amber, "Bestehende Vorsorge", [
        [inp.mode === "versorgungswerk" ? "Versorgungswerk" : "Gesetzliche Rente", fmt(res.pensionNet)],
    ]);

    // Card 4: Versorgungsziel
    dataCard(ML + 8 + halfW + 8, y, halfW, 44, "Z", C.emerald, "Versorgungsziel", [
        ["Inflation", fmtPct(inp.inflationPct)],
        ["Rendite Ansparphase", fmtPct(inp.returnSavingPct)],
        ["Rendite Entnahmephase", fmtPct(inp.returnTakeoutPct)],
    ]);

    y += 52;

    // Card 5: Zeiterfassung
    dataCard(ML + 8, y, CW - 16, 44, "T", C.purple, "Zeiterfassung", [
        ["Jahre bis Renteneintritt", `${(res.monthsToRet / 12).toFixed(1)} Jahre`],
        ["Renteneintritt", `${res.retirementYear}`],
        ["Versorgungsziel (heute)", fmt(inp.targetNetToday)],
    ]);

    pageFooter(d, 10, name);
}

/* ════════════════════════════════════════════════════════
   PAGE 11 — WARUM PROFESSIONELLE BERATUNG?
   ════════════════════════════════════════════════════════ */
function pageWhyAdvice(d: jsPDF, data: PdfRequestData) {
    pageHeader(d, 11);
    const name = `${data.firstName} ${data.lastName}`;
    let y = 34;

    d.setFont("helvetica", "bold"); d.setFontSize(15); sc(d, C.navy);
    d.text("Der Weg zu Ihrer sicheren Zukunft", ML, y);
    y += 8;
    y = para(d, "Diese Analyse zeigt Ihnen den Status quo — doch der wahre Mehrwert entsteht erst durch eine individuelle Beratung. Hier sind drei Gr\u00FCnde, warum ein pers\u00F6nliches Gespr\u00E4ch den Unterschied macht:", y, { sz: 10.5, lh: 5.2, x: ML, w: CW });
    y += 8;

    const benefits = [
        {
            icon: "S", color: C.blue, title: "Individuelle Strategie",
            desc: "Ihre Situation ist einzigartig. Ein erfahrener Berater analysiert Ihre Versorgungswerks-Anspr\u00FCche, steuerliche Situation und Lebensplanung, um eine ma\u00DFgeschneiderte Strategie zu entwickeln, die optimal zu Ihnen passt.",
        },
        {
            icon: "€", color: C.emerald, title: "Steuervorteile nutzen",
            desc: "Als Mediziner haben Sie besondere M\u00F6glichkeiten: von der Basisrente \u00FCber das Versorgungswerk bis hin zu intelligenten Anlagestrategien. Wir zeigen Ihnen, wie Sie jeden steuerlichen Vorteil maximieren.",
        },
        {
            icon: "+", color: C.amber, title: "Langfristige Begleitung",
            desc: "Finanzplanung ist kein einmaliges Ereignis. Wir begleiten Sie \u00FCber die Jahre, passen Ihre Strategie an ver\u00E4nderte Lebensumst\u00E4nde an und stellen sicher, dass Sie immer auf dem richtigen Kurs sind.",
        },
        {
            icon: "V", color: C.purple, title: "Unabh\u00E4ngige Expertise",
            desc: "Wir arbeiten produktunabh\u00E4ngig und ausschlie\u00DFlich in Ihrem Interesse. Unsere Empfehlungen basieren auf Ihrer individuellen Situation — nicht auf Provisionsinteressen.",
        },
    ];

    benefits.forEach(b => {
        card(d, ML, y, CW, 44, { radius: 7 });
        iconCircle(d, ML + 16, y + 14, b.color, b.icon, 5.5);
        d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.navy);
        d.text(b.title, ML + 28, y + 16);
        para(d, b.desc, y + 24, { sz: 8.5, lh: 4, x: ML + 28, w: CW - 36, color: C.slate400 });
        y += 50;
    });

    y += 2;
    // CTA
    sf(d, C.emerald); d.roundedRect(ML, y, CW, 16, 6, 6, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(11); sc(d, C.white);
    d.text("Vereinbaren Sie jetzt Ihr pers\u00F6nliches Beratungsgespr\u00E4ch", PW / 2, y + 10.5, { align: "center" });

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

    y = para(d, `ich hoffe, dieses Gutachten hat Ihnen eine hilfreiche \u00DCbersicht und mehr Klarheit \u00FCber Ihre aktuelle Finanzsituation sowie die n\u00E4chsten Schritte f\u00FCr Ihre finanzielle Zukunft verschafft. Der entscheidende Punkt ist jetzt die konsequente Umsetzung der Empfehlungen. Nur so werden Sie langfristig von den geplanten Ma\u00DFnahmen profitieren und sich die Sicherheit aufbauen, die Sie sich w\u00FCnschen.`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 10;

    y = para(d, `Ich freue mich darauf, Sie weiterhin zu begleiten und Sie bei jedem Schritt zu unterst\u00FCtzen. Gemeinsam stellen wir sicher, dass Sie Ihre Ziele erreichen und Ihre finanzielle Situation stetig im Blick behalten. Vielen Dank f\u00FCr Ihr Vertrauen — auf eine erfolgreiche und sichere Zukunft!`, y, { sz: 12, lh: 6.5, x: ML, w: CW });
    y += 22;

    d.setFont("helvetica", "normal"); d.setFontSize(12); sc(d, C.slate500);
    d.text("Mit besten Gr\u00FC\u00DFen,", ML, y);

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
    const qt = d.splitTextToSize("\"Der beste Zeitpunkt, um zu investieren, war vor 20 Jahren. Der zweitbeste Zeitpunkt ist jetzt.\"", CW - 50) as string[];
    d.text(qt, cx, y + 26, { align: "center" });

    sf(d, C.emerald); d.circle(cx - 34, y + qh - 8, 4, "F");
    d.setFont("helvetica", "bold"); d.setFontSize(7); sc(d, C.white);
    d.text("WB", cx - 36, y + qh - 6.5);
    d.setFont("helvetica", "normal"); d.setFontSize(8.5); sc(d, C.slate400);
    d.text("Warren Buffett, US-amerikanischer Investor", cx - 27, y + qh - 6.5);

    pageFooter(d, 12, name);
}

/* ═══════════════ MAIN EXPORT ═══════════════ */
export function generatePensionPdf(data: PdfRequestData, result: PensionPdfResult, input: PensionPdfInput) {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    totalPages = 12;

    pageCover(doc, data, result);
    doc.addPage(); pageIntro(doc, data);
    doc.addPage(); pageWhyImportant(doc, data);
    doc.addPage(); pageSituationNominal(doc, data, input, result);
    doc.addPage(); pageSituationReal(doc, data, input, result);
    doc.addPage(); pageRequiredCapital(doc, data, input, result);
    doc.addPage(); pageDecision(doc, data, input, result);
    doc.addPage(); pageCompoundInterest(doc, data, result);
    doc.addPage(); pageSummary(doc, data, input, result);
    doc.addPage(); pageCalcBasis(doc, data, input, result);
    doc.addPage(); pageWhyAdvice(doc, data);
    doc.addPage(); pageClosing(doc, data);

    doc.save(`Altersvorsorge_${data.lastName}_${fmtDate(new Date()).replace(/\./g, "-")}.pdf`);
}
