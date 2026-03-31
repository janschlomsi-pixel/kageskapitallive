/**
 * Altersvorsorge / Rentenlücke — Premium PDF (HTML→Canvas→PDF)
 * Uses the same pipeline as depotPolicePdfGenerator: renders HTML pages via
 * html2canvas into jsPDF for pixel-perfect, CSS-quality output.
 *
 * 11 pages:
 *  1  Cover            (Ref P4)
 *  2  Anschreiben      (Ref P2)
 *  3  Warum wichtig    (Ref P5)
 *  4  Versorgung       (Ref P6)
 *  5  Kaufkraft        (Ref P8)
 *  6  Kapital          (Ref P10)
 *  7  Start-Sparrate   (Ref P11)
 *  8  Zinseszins       (Ref P12)
 *  9  Zusammenfassung  (Ref P13)
 * 10  Berechnungen     (Ref P14)
 * 11  Abschluss        (Ref P15)
 */
import type { PdfRequestData } from "@/components/ui/PdfRequestModal";

/* ═══════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════ */
export interface PensionPdfInput {
    mode: "employee" | "versorgungswerk" | "selfEmployed";
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

/* ═══════════════════════════════════════════════════════════
   COLORS
   ═══════════════════════════════════════════════════════════ */
const EM = "#059669";
const NV = "#0f172a";
const BL = "#2563eb";
const RD = "#ef4444";
const SL = "#64748b";
const AM = "#f59e0b";
const TOTAL = 12;

/* ═══════════════════════════════════════════════════════════
   FORMATTERS
   ═══════════════════════════════════════════════════════════ */
const fmt = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac";
const fmtPct = (n: number) => n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
const fmtPctShort = (n: number) => Math.round(n).toLocaleString("de-DE") + "%";
const fmtDateLong = (d: Date) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
const fmtTs = (d: Date) => { const p = (v: number) => v.toString().padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`; };

/* ═══════════════════════════════════════════════════════════
   SVG ICONS (Lucide-style)
   ═══════════════════════════════════════════════════════════ */
const IC = {
    clock: (c = SL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    user: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    settings: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    folder: (c = SL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
    check: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    trendUp: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    trendDown: (c = RD, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></svg>`,
    arrowRight: (c = BL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`,
    percent: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
    coins: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/></svg>`,
    quote: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>`,
    shield: (c = BL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>`,
    alertTriangle: (c = "#f59e0b", s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>`,
    banknote: (c = RD, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
    piggy: (c = SL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>`,
    target: (c = BL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
    notEqual: (c = RD, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="9" x2="19" y2="9"/><line x1="5" y1="15" x2="19" y2="15"/><line x1="19" y1="5" x2="5" y2="19"/></svg>`,
    up: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>`,
    wallet: (c = BL, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
    chartLine: (c = EM, s = 24) => `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
};

/* ═══════════════════════════════════════════════════════════
   REUSABLE HTML BUILDING BLOCKS
   ═══════════════════════════════════════════════════════════ */

/** Icon in a circle */
const ib = (icon: string, bg = "#f0fdf4", border = "#d1fae5", sz = 48) =>
    `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};border:1px solid ${border};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;line-height:0;box-sizing:border-box;vertical-align:middle"><span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;line-height:0">${icon}</span></div>`;

/** Page wrapper */
const P = `width:210mm;height:297mm;overflow:hidden;background:#fff;position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${NV};box-sizing:border-box;padding:0;margin:0;`;

/** Header brand mark — subtle rounded-square with clock icon */
const headerBrandMark = (s = 40) => `<div style="width:${s}px;height:${s}px;border-radius:${Math.round(s * 0.3)}px;background:#f8f9f7;border:1px solid #e5e7e3;display:flex;align-items:center;justify-content:center;box-sizing:border-box;flex-shrink:0;line-height:0"><span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;line-height:0">${IC.clock("#f97316", Math.round(s * 0.48))}</span></div>`;

/** Header bar — full-width grey background strip matching cashflow reference */
const hdr = (n: number, title = "Deine Altersvorsorge") => `<div style="background:#f3f4f2;border-bottom:1px solid #e2e5df;padding:0 7%;height:68px;display:flex;align-items:center;justify-content:space-between;gap:18px;box-sizing:border-box"><div style="display:flex;align-items:center;gap:14px">${headerBrandMark(40)}<span style="font-size:20px;font-weight:700;color:${NV};white-space:nowrap;position:relative;top:-9px">${title}</span></div><svg width="42" height="42" viewBox="0 0 36 36" aria-hidden="true" style="flex-shrink:0"><circle cx="18" cy="18" r="16" fill="none" stroke="#d2d8ce" stroke-width="3"/><circle cx="18" cy="18" r="16" fill="none" stroke="#65a30d" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="${(n / TOTAL) * 100.5} 100.5" transform="rotate(-90 18 18)"/></svg></div>`;

/** Footer */
const ftr = (n: number, name: string) => `<div style="position:absolute;bottom:3%;left:7%;right:7%;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between"><span style="font-size:13px;color:#94a3b8">\u00a9${new Date().getFullYear()} Karges Kapital \u2022 Altersvorsorge-Auswertung f\u00fcr ${name}</span><span style="font-size:13px;color:#94a3b8">${n}</span></div>`;

/** Data row */
const R = (l: string, v: string) => `<div style="display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #f1f5f9;align-items:center"><span style="font-size:13px;color:#64748b">${l}</span><span style="font-size:13px;font-weight:600;text-align:right">${v}</span></div>`;

/** KPI card matching reference style (icon above, label, big number) */
const kpi = (label: string, value: string, color: string, icon: string, bgIcon: string, borderIcon: string) =>
    `<div style="border:1px solid #e2e8f0;border-radius:16px;padding:18px 12px;background:#fff;display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
        ${ib(icon, bgIcon, borderIcon, 40)}
        <div style="font-size:12px;color:#64748b;text-align:center">${label}</div>
        <div style="font-size:20px;font-weight:800;color:${color};line-height:1.1">${value}</div>
    </div>`;

/* ═══════════════════════════════════════════════════════════
   SVG CHART HELPERS
   ═══════════════════════════════════════════════════════════ */

/** Stacked bar chart for cover & versorgung pages */
function barChartSvg(opts: {
    bars: Array<{ segments: Array<{ h: number; color: string; label?: string; value?: string }>; bottomLabel?: string }>;
    width?: number;
    height?: number;
    barWidth?: number;
    gap?: number;
    tooltip?: { text: string; barIdx: number };
    bottomExtra?: string;
}): string {
    const { bars, width = 600, height = 380, barWidth = 140, gap = 60 } = opts;
    const totalBarsW = bars.length * barWidth + (bars.length - 1) * gap;
    const startX = (width - totalBarsW) / 2;
    const maxH = height - 60;
    let svg = `<svg width="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;
    // Grid lines
    for (let i = 0; i < 5; i++) {
        const y = 10 + i * (maxH / 4);
        svg += `<line x1="${startX - 10}" y1="${y}" x2="${startX + totalBarsW + 10}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    bars.forEach((bar, idx) => {
        const bx = startX + idx * (barWidth + gap);
        let by = maxH + 10;
        bar.segments.forEach((seg) => {
            by -= seg.h;
            svg += `<rect x="${bx}" y="${by}" width="${barWidth}" height="${seg.h}" rx="8" fill="${seg.color}"/>`;
            if (seg.value && seg.h > 30) {
                svg += `<text x="${bx + barWidth / 2}" y="${by + seg.h / 2 - 4}" text-anchor="middle" fill="#fff" font-size="14" font-weight="700">${seg.value}</text>`;
            }
            if (seg.label && seg.h > 30) {
                svg += `<text x="${bx + barWidth / 2}" y="${by + seg.h / 2 + 14}" text-anchor="middle" fill="#fff" font-size="11">${seg.label}</text>`;
            }
        });
        if (bar.bottomLabel) {
            svg += `<text x="${bx + barWidth / 2}" y="${maxH + 34}" text-anchor="middle" fill="${SL}" font-size="13" font-weight="600">${bar.bottomLabel}</text>`;
        }
    });
    // Connecting line between bar 1 and 2 tops
    if (bars.length >= 2) {
        const x1 = startX + barWidth;
        const y1 = maxH + 10 - bars[0].segments.reduce((a, s) => a + s.h, 0);
        const x2 = startX + barWidth + gap;
        const y2 = maxH + 10 - bars[1].segments.reduce((a, s) => a + s.h, 0);
        svg += `<path d="M${x1},${y1} C${x1 + gap / 3},${y1} ${x2 - gap / 3},${y2} ${x2},${y2}" fill="none" stroke="#cbd5e1" stroke-width="2"/>`;
    }
    // Tooltip
    if (opts.tooltip) {
        const tBar = bars[opts.tooltip.barIdx];
        const barCx = startX + opts.tooltip.barIdx * (barWidth + gap) + barWidth / 2;
        const ty = maxH + 10 - tBar.segments.reduce((a, s) => a + s.h, 0) - 14;
        const tw = opts.tooltip.text.length * 8.5 + 30;
        // Clamp tooltip rect to stay within SVG bounds; keep arrow at bar center
        const tx = Math.min(Math.max(tw / 2 + 5, barCx), width - tw / 2 - 5);
        svg += `<rect x="${tx - tw / 2}" y="${ty - 28}" width="${tw}" height="30" rx="8" fill="#1e293b"/>`;
        svg += `<polygon points="${barCx - 6},${ty + 2} ${barCx + 6},${ty + 2} ${barCx},${ty + 10}" fill="#1e293b"/>`;
        svg += `<circle cx="${tx - tw / 2 + 16}" cy="${ty - 13}" r="4" fill="${RD}"/>`;
        svg += `<text x="${tx - tw / 2 + 28}" y="${ty - 8}" fill="#fff" font-size="13" font-weight="600">${opts.tooltip.text}</text>`;
    }
    svg += `</svg>`;
    return svg;
}

/** Growth area chart for Kapital page — smooth curve style */
function growthChartSvg(width = 660, height = 280): string {
    // Smooth exponential growth curve
    const pts: [number, number][] = [];
    const numPts = 30;
    for (let i = 0; i <= numPts; i++) {
        const t = i / numPts;
        const x = t * (width - 20) + 10;
        const y = height - 20 - (Math.pow(t, 1.8) * (height - 60));
        pts.push([x, y]);
    }
    // Build smooth cubic bezier path
    let path = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
        const prev = pts[i - 1];
        const curr = pts[i];
        const cpx1 = prev[0] + (curr[0] - prev[0]) * 0.5;
        const cpx2 = curr[0] - (curr[0] - prev[0]) * 0.5;
        path += ` C${cpx1},${prev[1]} ${cpx2},${curr[1]} ${curr[0]},${curr[1]}`;
    }
    const areaPath = path + ` L${width - 10},${height} L10,${height} Z`;
    const midIdx = Math.floor(numPts * 0.6);
    const midPt = pts[midIdx];
    return `<svg width="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="display:block">
        <defs>
            <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#10b981" stop-opacity="0.30"/>
                <stop offset="100%" stop-color="#10b981" stop-opacity="0.03"/>
            </linearGradient>
        </defs>
        ${[0, 1, 2, 3, 4].map(i => `<line x1="0" y1="${20 + i * ((height - 40) / 4)}" x2="${width}" y2="${20 + i * ((height - 40) / 4)}" stroke="#e2e8f0" stroke-width="0.5"/>`).join("")}
        <path d="${areaPath}" fill="url(#gGrad)"/>
        <path d="${path}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${midPt[0]}" cy="${midPt[1]}" r="7" fill="#fff" stroke="#10b981" stroke-width="2.5"/>
    </svg>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 1 — COVER  (Ref P4)
   ═══════════════════════════════════════════════════════════ */
function coverChartSvg(): string {
    const w = 520, h = 340;
    const barW = 110, gap = 28;
    const bars = [
        { segments: [{ h: 100, color: "#94a3b8" }] },
        { segments: [{ h: 160, color: "#475569" }] },
        { segments: [
            { h: 80, color: BL },
            { h: 60, color: EM },
            { h: 40, color: AM },
            { h: 60, color: RD },
        ] },
    ];
    const totalBarsW = bars.length * barW + (bars.length - 1) * gap;
    const startX = (w - totalBarsW) / 2;
    const baseY = h - 30;
    let svg = `<svg width="100%" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;
    // Light grid lines
    for (let i = 0; i < 5; i++) {
        const y = 20 + i * ((baseY - 20) / 4);
        svg += `<line x1="${startX - 10}" y1="${y}" x2="${startX + totalBarsW + 10}" y2="${y}" stroke="#f1f5f9" stroke-width="1"/>`;
    }
    bars.forEach((bar, idx) => {
        const bx = startX + idx * (barW + gap);
        let by = baseY;
        bar.segments.forEach((seg) => {
            by -= seg.h;
            svg += `<rect x="${bx}" y="${by}" width="${barW}" height="${seg.h}" rx="6" fill="${seg.color}"/>`;
        });
    });
    // Connecting line between bar 1 top and bar 2 top
    const x1 = startX + barW;
    const y1 = baseY - bars[0].segments.reduce((a, s) => a + s.h, 0);
    const x2 = startX + barW + gap;
    const y2 = baseY - bars[1].segments.reduce((a, s) => a + s.h, 0);
    svg += `<path d="M${x1},${y1} C${x1 + gap / 3},${y1} ${x2 - gap / 3},${y2} ${x2},${y2}" fill="none" stroke="#cbd5e1" stroke-width="2"/>`;
    // Versorgungslücke tooltip centered above all bars
    const tooltipCx = startX + totalBarsW / 2;
    const bar3Top = baseY - bars[2].segments.reduce((a, s) => a + s.h, 0);
    const ty = Math.min(y1, y2, bar3Top) - 18;
    const tw = 190;
    svg += `<rect x="${tooltipCx - tw / 2}" y="${ty - 26}" width="${tw}" height="30" rx="8" fill="#1e293b"/>`;
    svg += `<polygon points="${tooltipCx - 6},${ty + 4} ${tooltipCx + 6},${ty + 4} ${tooltipCx},${ty + 12}" fill="#1e293b"/>`;
    svg += `<circle cx="${tooltipCx - tw / 2 + 16}" cy="${ty - 11}" r="5" fill="${RD}"/>`;
    svg += `<text x="${tooltipCx - tw / 2 + 28}" y="${ty - 6}" fill="#fff" font-size="14" font-weight="700">Versorgungsl\u00fccke</text>`;
    svg += `</svg>`;
    return svg;
}

function p1(d: PdfRequestData, res: PensionPdfResult): string {
    const totalRente = res.pensionNet + res.privatePayout;

    return `<div style="${P}">
        <div style="display:flex;flex-direction:column;align-items:center;padding-top:18%">
            ${ib(IC.clock("#f97316", 28), "#fff7ed", "#fed7aa", 56)}
            <h1 style="font-size:52px;font-weight:800;text-align:center;margin:28px 0 0;line-height:1.1">Deine Altersvorsorge</h1>
            <p style="color:#64748b;font-size:17px;margin-top:16px;text-align:center;max-width:420px;line-height:1.6">Eine \u00dcbersicht deiner bestehenden Anspr\u00fcche und wie du deine Versorgungsl\u00fccke schlie\u00dfen kannst.</p>
        </div>
        <div style="margin:4% 8% 0;border:1px solid #e2e8f0;border-radius:22px;padding:20px 20px 18px;box-shadow:0 8px 28px rgba(15,23,42,0.04)">
            ${coverChartSvg()}
            <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-top:14px;padding-top:10px;border-top:1px solid #f1f5f9"><span style="font-size:15px;color:#64748b;line-height:1">Gesamtrente</span><span style="color:${EM};font-size:16px;font-weight:700;line-height:1">${fmt(totalRente)}</span></div>
        </div>
        ${ftr(1, `${d.firstName} ${d.lastName}`)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 2 — ANSCHREIBEN  (Ref P2)
   ═══════════════════════════════════════════════════════════ */
function p2(d: PdfRequestData, avatarDataUrl: string): string {
    return `<div style="${P}">${hdr(2)}
        <div style="padding:4% 8% 0">
            <div style="border:1px solid #e2e8f0;border-radius:24px;padding:36px 36px;box-shadow:0 10px 28px rgba(15,23,42,0.05)">
                <p style="font-weight:700;font-size:24px;margin:0 0 28px">Hey ${d.firstName},</p>
                <p style="font-size:17px;color:#64748b;line-height:2;margin-bottom:28px">es freut mich, dass du dich mit deiner Altersvorsorge auseinandergesetzt hast. Die meisten schieben dieses Thema viel zu lange vor sich her \u2013 umso besser, dass du jetzt einen klaren Blick auf deine Versorgungssituation hast.</p>
                <p style="font-size:17px;color:#64748b;line-height:2;margin-bottom:28px">In dieser Auswertung siehst du, wie gro\u00df die L\u00fccke zwischen deinem Versorgungsziel und deiner voraussichtlichen Rente ist, welches Kapital daf\u00fcr n\u00f6tig w\u00e4re und wie sich der Zeitpunkt deines Starts auf das Ergebnis auswirkt.</p>
                <p style="font-size:17px;color:#64748b;line-height:2;margin-bottom:36px">Nimm dir einen Moment und geh die folgenden Seiten in Ruhe durch.</p>
                <p style="font-size:17px;color:#64748b;margin-bottom:28px">Beste Gr\u00fc\u00dfe,</p>
                <div style="display:flex;align-items:center;gap:16px"><img src="${avatarDataUrl}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0" /><div><span style="font-weight:700;font-size:18px">Julian Karges</span></div></div>
            </div>
        </div>
        ${ftr(2, `${d.firstName} ${d.lastName}`)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 3 — WARUM IST ALTERSVORSORGE WICHTIG?  (Ref P5)
   ═══════════════════════════════════════════════════════════ */
function p3(d: PdfRequestData): string {
    const name = `${d.firstName} ${d.lastName}`;

    // Population pyramid SVG — cleaner with proper labels, bars contained within grid
    const pyramidSvg = `<svg width="100%" viewBox="0 0 300 256" xmlns="http://www.w3.org/2000/svg" style="display:block">
        <rect x="50" y="10" width="80" height="18" rx="9" fill="${BL}"/>
        <text x="90" y="23" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">M\u00e4nner</text>
        <rect x="170" y="10" width="80" height="18" rx="9" fill="#1e40af"/>
        <text x="210" y="23" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">Frauen</text>
        ${[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0].map((age, i) => {
            const y = 40 + i * 18;
            const wM = [12, 20, 32, 44, 50, 54, 46, 58, 62, 56, 42][i];
            const wF = [14, 22, 34, 46, 52, 56, 48, 60, 64, 58, 44][i];
            return `<rect x="${150 - wM}" y="${y}" width="${wM}" height="15" rx="3" fill="${BL}" opacity="0.8"/>
                    <rect x="150" y="${y}" width="${wF}" height="15" rx="3" fill="#1e40af" opacity="0.8"/>
                    <text x="148" y="${y + 12}" text-anchor="end" fill="#94a3b8" font-size="8" dx="-${wM + 6}">${age}</text>`;
        }).join("")}
        <text x="30" y="238" fill="#94a3b8" font-size="9">600k</text>
        <text x="80" y="238" fill="#94a3b8" font-size="9">300k</text>
        <text x="150" y="238" fill="#94a3b8" font-size="9" text-anchor="middle">0</text>
        <text x="200" y="238" fill="#94a3b8" font-size="9">300k</text>
        <text x="250" y="238" fill="#94a3b8" font-size="9">600k</text>
    </svg>`;

    // Inflation timeline SVG — simple bars with price labels, "Beispiel Eiskugel"
    const inflSvg = `<svg width="100%" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg" style="display:block">
        <text x="150" y="16" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">Beispiel Eiskugel</text>
        <line x1="30" y1="155" x2="280" y2="155" stroke="#e2e8f0" stroke-width="2"/>
        ${[[60, EM, "0,60\u20ac", "2000"], [150, AM, "2,20\u20ac", "2020"], [240, RD, "4,50\u20ac", "2040"]].map(([x, c, v, yr], idx) => {
            const barH = [50, 80, 120][idx];
            const barTop = 155 - barH;
            return `<rect x="${Number(x) - 22}" y="${barTop}" width="44" height="${barH}" rx="8" fill="${c}" opacity="0.15"/>
             <rect x="${Number(x) - 22}" y="${barTop}" width="44" height="${barH}" rx="8" fill="none" stroke="${c}" stroke-width="1" opacity="0.3"/>
             <rect x="${Number(x) - 30}" y="${barTop + barH / 2 - 14}" width="60" height="28" rx="7" fill="${c}"/>
             <text x="${x}" y="${barTop + barH / 2 + 5}" text-anchor="middle" fill="#fff" font-size="13" font-weight="700">${v}</text>
             <text x="${x}" y="175" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="600">${yr}</text>`;
        }).join("")}
        <text x="105" y="175" text-anchor="middle" fill="#94a3b8" font-size="11">2010</text>
        <text x="195" y="175" text-anchor="middle" fill="#94a3b8" font-size="11">2030</text>
    </svg>`;

    // Tax bar chart SVG — taller viewBox so 100% label is visible
    const taxSvg = `<svg width="100%" viewBox="0 0 260 175" xmlns="http://www.w3.org/2000/svg" style="display:block">
        ${[20, 40, 60, 80, 100].map(pct => {
            const y = 135 - pct * 1.1;
            return `<line x1="25" y1="${y}" x2="260" y2="${y}" stroke="#f1f5f9" stroke-width="0.5"/>
                    <text x="20" y="${y + 4}" text-anchor="end" fill="#94a3b8" font-size="9">${pct}%</text>`;
        }).join("")}
        ${[[0, 40, "2020"], [1, 55, "2030"], [2, 70, "2040"], [3, 85, "2050"], [4, 100, "2058"]].map(([i, pct, yr]) => {
            const x = 30 + Number(i) * 48;
            const h = Number(pct) * 1.1;
            return `<rect x="${x}" y="${135 - h}" width="36" height="${h}" rx="6" fill="${BL}"/>
                    <text x="${x + 18}" y="153" text-anchor="middle" fill="#94a3b8" font-size="10">${yr}</text>`;
        }).join("")}
    </svg>`;

    const cardCss = `border:1px solid #e2e8f0;border-radius:16px;padding:20px;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,0.03)`;
    return `<div style="${P}">${hdr(3)}
        <div style="padding:3% 7% 0">
            <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Warum ist Altersvorsorge wichtig?</h2>
            <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 18px">Die gesetzliche Rente reicht immer seltener aus, um den Lebensstandard im Alter zu sichern. Faktoren wie der demografische Wandel, Inflation und die steigende Besteuerung f\u00fchren dazu, dass die Versorgungsl\u00fccken gr\u00f6\u00dfer werden. Eine gut geplante Altersvorsorge ist entscheidend, um im Alter finanziell abgesichert zu sein und sich weiterhin W\u00fcnsche zu erf\u00fcllen.</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px">
                <div style="${cardCss};display:flex;flex-direction:column">
                    <div style="flex:1">${pyramidSvg}</div>
                    <h3 style="font-size:15px;font-weight:700;margin:10px 0 6px">Demografischer Wandel</h3>
                    <p style="font-size:12px;color:#64748b;line-height:1.7;margin:0">Immer weniger Erwerbst\u00e4tige finanzieren immer mehr Rentner. Dieses Ungleichgewicht setzt das Rentensystem unter Druck und senkt die durchschnittlichen Rentenanpr\u00fcche.</p>
                </div>
                <div style="${cardCss};display:flex;flex-direction:column">
                    <div style="flex:1">${inflSvg}</div>
                    <h3 style="font-size:15px;font-weight:700;margin:10px 0 6px">Inflation</h3>
                    <p style="font-size:12px;color:#64748b;line-height:1.7;margin:0">Steigende Preise reduzieren die Kaufkraft deiner Rente. Das bedeutet: Mit dem gleichen Betrag kannst du dir im Alter deutlich weniger leisten.</p>
                </div>
            </div>
            <div style="${cardCss};padding:28px 24px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:center">
                    <div>
                        <h3 style="font-size:15px;font-weight:700;margin:0 0 8px">Besteuerung</h3>
                        <p style="font-size:12px;color:#64748b;line-height:1.7;margin:0">Der zu versteuernde Anteil der gesetzlichen Rente steigt schrittweise an und wird bis 2058 bereits 100% erreichen. Das bedeutet, dass k\u00fcnftige Renten vollst\u00e4ndig besteuert werden, was deine verf\u00fcgbaren Mittel im Ruhestand weiter reduziert.</p>
                    </div>
                    <div>${taxSvg}</div>
                </div>
            </div>
        </div>
        ${ftr(3, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 4 — VERSORGUNGSSITUATION IM ALTER  (Ref P6)
   ═══════════════════════════════════════════════════════════ */
function p4(d: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const fullGap = Math.max(0, res.targetInflated - res.pensionNet);
    const maxV = Math.max(res.targetInflated, inp.targetNetToday) * 1.1;
    const sc = (v: number) => Math.max(8, (v / maxV) * 420);

    const chart = barChartSvg({
        bars: [
            { segments: [{ h: sc(inp.targetNetToday), color: "#94a3b8", value: fmt(inp.targetNetToday), label: "Versorgungsziel" }], bottomLabel: "" },
            { segments: [{ h: sc(res.targetInflated), color: "#475569", value: fmt(res.targetInflated), label: "mit Inflation" }], bottomLabel: "" },
            { segments: [
                { h: sc(res.pensionNet), color: BL, value: fmt(res.pensionNet), label: "Rente netto" },
                { h: sc(fullGap), color: RD, value: fmt(fullGap), label: "Versorgungsl\u00fccke" },
            ], bottomLabel: "" },
        ],
        width: 600, height: 520, barWidth: 155, gap: 30,
    });

    return `<div style="${P}">${hdr(4)}
        <div style="padding:1% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:24px 26px;box-shadow:0 6px 22px rgba(15,23,42,0.04)">
                <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Deine Versorgungssituation im Alter</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 16px">Aktuell betr\u00e4gt dein monatlicher Rentenanspruch ${fmt(res.pensionNet)} netto, w\u00e4hrend dein gew\u00fcnschtes Versorgungsziel bei ${fmt(inp.targetNetToday)} liegt. Um im Alter von ${inp.retirementAge} die gleiche Kaufkraft wie heute zu haben, m\u00fcsste dein Versorgungsziel ${fmt(res.targetInflated)} betragen.</p>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">
                    ${kpi("Vorhandene Gesamtrente", fmt(res.pensionNet), NV, IC.piggy(SL, 20), "#f1f5f9", "#e2e8f0")}
                    ${kpi("Versorgungsziel", fmt(res.targetInflated), EM, IC.target(BL, 20), "#dbeafe", "#bfdbfe")}
                    ${kpi("Deine Versorgungsl\u00fccke", fmt(fullGap), RD, IC.notEqual(RD, 20), "#fee2e2", "#fecaca")}
                </div>
                ${chart}
                <div style="display:flex;align-items:center;justify-content:space-around;margin-top:14px;padding-top:14px;border-top:1px solid #f1f5f9">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#64748b"><span style="display:inline-flex;align-items:center;line-height:0">${IC.clock(SL, 14)}</span><span style="position:relative;top:-7px">Heute</span></span>
                    <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#64748b"><span style="display:inline-flex;align-items:center;line-height:0">${IC.trendUp(SL, 14)}</span><span style="position:relative;top:-7px">Renteneintritt ${res.retirementYear} mit ${inp.retirementAge} Jahren</span></span>
                </div>
            </div>
        </div>
        ${ftr(4, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 5 — NACH HEUTIGER KAUFKRAFT  (Ref P8)
   ═══════════════════════════════════════════════════════════ */
function p5(d: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const inflF = Math.pow(1 + inp.inflationPct / 100, res.monthsToRet / 12);
    const pensionReal = res.pensionNet / inflF;
    const gapReal = Math.max(0, inp.targetNetToday - pensionReal);
    const maxV = Math.max(inp.targetNetToday, gapReal + pensionReal) * 1.1;
    const sc = (v: number) => Math.max(8, (v / maxV) * 460);

    const chart = barChartSvg({
        bars: [
            { segments: [{ h: sc(inp.targetNetToday), color: "#475569", value: fmt(inp.targetNetToday), label: "Versorgungsziel" }], bottomLabel: "" },
            { segments: [
                { h: sc(pensionReal), color: BL, value: fmt(pensionReal), label: "Rente netto" },
                { h: sc(gapReal), color: RD, value: fmt(gapReal), label: "Versorgungsl\u00fccke" },
            ], bottomLabel: "" },
        ],
        width: 500, height: 440, barWidth: 180, gap: 60,
    });

    return `<div style="${P}">${hdr(5)}
        <div style="padding:1% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:24px 26px;box-shadow:0 6px 22px rgba(15,23,42,0.04)">
                <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Deine Versorgungssituation im Alter nach heutiger Kaufkraft</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 16px">Die folgende Grafik zeigt dein Versorgungsziel und deine Rentenansp\u00fcche nach heutiger Kaufkraft. Entscheidend ist die inflationsbereinigte L\u00fccke \u2013 das, was dein Anspruch wert w\u00e4re, wenn du morgen in Rente gehen w\u00fcrdest.</p>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:16px">
                    ${kpi("Vorhandene Gesamtrente", fmt(pensionReal), NV, IC.piggy(SL, 20), "#f1f5f9", "#e2e8f0")}
                    ${kpi("Versorgungsziel", fmt(inp.targetNetToday), EM, IC.target(BL, 20), "#dbeafe", "#bfdbfe")}
                    ${kpi("Deine Versorgungsl\u00fccke", fmt(gapReal), RD, IC.notEqual(RD, 20), "#fee2e2", "#fecaca")}
                </div>
                ${chart}
                <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-top:14px;padding-top:14px;border-top:1px solid #f1f5f9">
                    <span style="display:inline-flex;align-items:center;gap:6px;font-size:13px;color:#64748b"><span style="display:inline-flex;align-items:center;line-height:0">${IC.clock(SL, 14)}</span><span style="position:relative;top:-7px">Heute</span></span>
                </div>
            </div>
        </div>
        ${ftr(5, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 6 — BENÖTIGTES KAPITAL  (Ref P10)
   ═══════════════════════════════════════════════════════════ */
function p6(d: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const savPill = (label: string, value: number, bg: string, barH: number) =>
        `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
            <div style="width:3px;height:${barH}px;border-radius:2px;background:${bg};opacity:0.35"></div>
            <div style="padding:14px 18px;border-radius:14px;background:${bg};color:#fff;text-align:center;min-width:120px;box-shadow:0 4px 16px ${bg}33">
                <div style="font-size:20px;font-weight:800;letter-spacing:-0.5px;line-height:1.2">${fmt(isFinite(value) ? value : 0)}</div>
                <div style="font-size:11px;opacity:0.85;margin-top:3px;text-transform:uppercase;letter-spacing:0.5px;line-height:1">monatlich</div>
            </div>
            <span style="font-size:13px;font-weight:700;color:${NV}">${label}</span>
        </div>`;

    return `<div style="${P}">${hdr(6)}
        <div style="padding:6% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:24px 26px;box-shadow:0 6px 22px rgba(15,23,42,0.04)">
                <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Ben\u00f6tigtes Kapital zur Schlie\u00dfung der L\u00fccke</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 18px">Um die bestehende Versorgungsl\u00fccke zu schlie\u00dfen, ben\u00f6tigst du ein bestimmtes Kapital, das wir auf Basis einer angenommenen Rendite von ${fmtPct(inp.returnSavingPct)} und einer j\u00e4hrlichen Inflation von ${fmtPct(inp.inflationPct)} berechnet haben.</p>
                <div style="text-align:center;margin-bottom:8px">
                    <div style="font-size:44px;font-weight:800;color:#10b981;line-height:1.1">${fmt(res.requiredCapitalFull)}</div>
                    <div style="font-size:14px;color:#64748b;margin-top:8px">Ben\u00f6tigtes Kapital bei einer angenommenen Rendite von ${fmtPct(inp.returnSavingPct)}</div>
                </div>
                ${growthChartSvg(660, 280)}
            </div>
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:26px 26px;box-shadow:0 6px 22px rgba(15,23,42,0.04);margin-top:18px">
                <h3 style="font-size:20px;font-weight:700;margin:0 0 8px">Notwendige monatliche Sparrate</h3>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 22px">Damit du deine Versorgungsl\u00fccke schlie\u00dfen kannst, ergibt sich folgendes Sparszenario:</p>
                <div style="display:flex;gap:20px;justify-content:center;margin-bottom:22px">
                    ${savPill("Heute", res.requiredSavingNow, EM, 50)}
                    ${savPill("In 4 Jahren", res.requiredIn4, AM, 30)}
                    ${savPill("In 8 Jahren", res.requiredIn8, RD, 14)}
                </div>
                <div style="border-radius:12px;background:#f8fafc;padding:14px 18px;font-size:13px;color:#475569;line-height:1.7"><b>Wichtig:</b> Je fr\u00fcher du beginnst, desto geringer ist die monatliche Sparrate, die du aufwenden musst. Ein sp\u00e4terer Start f\u00fchrt zu einer deutlich h\u00f6heren Belastung.</div>
            </div>
        </div>
        ${ftr(6, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 7 — START-SPARRATE  (Ref P11)
   ═══════════════════════════════════════════════════════════ */
function p7(d: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const covPct = Math.round(res.coverage * 100);
    const r = 135;
    const circ = 2 * Math.PI * r;
    const covDash = Math.min(res.coverage, 1) * circ;
    const yrs = (res.monthsToRet / 12).toFixed(2);
    const LG = "#059669"; /* natural emerald for this page */

    /* Large donut — scaled to 320px, viewBox stays 360 for positioning */
    const donutSvg = `<svg width="320" height="320" viewBox="0 0 360 360" xmlns="http://www.w3.org/2000/svg">
        <circle cx="180" cy="180" r="${r}" fill="none" stroke="#e8ede5" stroke-width="24"/>
        <circle cx="180" cy="180" r="${r}" fill="none" stroke="${LG}" stroke-width="26" stroke-linecap="round" stroke-dasharray="${covDash} ${circ}" transform="rotate(-90 180 180)"/>
        <text x="180" y="150" text-anchor="middle" fill="#94a3b8" font-size="15" font-weight="600">Zielerreichung</text>
        <text x="180" y="200" text-anchor="middle" fill="${LG}" font-size="52" font-weight="700">${covPct}%</text>
        <text x="180" y="224" text-anchor="middle" fill="${LG}" font-size="16" font-weight="600">erreicht</text>
    </svg>`;

    /* Target/bullseye icon — self-contained SVG with bg circle, all fills for html2canvas */
    const targetIconSvg = `<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="23" fill="#ecfdf5"/>
        <circle cx="24" cy="24" r="12" fill="#d1fae5"/>
        <circle cx="24" cy="24" r="8" fill="#6ee7b7"/>
        <circle cx="24" cy="24" r="4" fill="${LG}"/>
    </svg>`;

    /* Arrow right — filled rect + polygon for html2canvas */
    const arrowSvg = `<svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="16.5" width="20" height="3" rx="1.5" fill="#cbd5e1"/>
        <polygon points="24,11 32,18 24,25" fill="#cbd5e1"/>
    </svg>`;

    /* Up arrow with bg circle — all fills for html2canvas */
    const upArrowSvg = `<svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
        <circle cx="22" cy="22" r="21" fill="#ecfdf5"/>
        <polygon points="22,11 30,21 26,21 26,33 18,33 18,21 14,21" fill="${LG}"/>
    </svg>`;

    return `<div style="${P}">${hdr(7)}
        <div style="padding:8% 7% 0">
            <div style="border-radius:20px;padding:32px 34px 24px;background:#fafbf9;border:1px solid #eff0ed;min-height:800px;display:flex;flex-direction:column">
                <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Deine Entscheidung: Die Start-Sparrate</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 32px">Du hast dich f\u00fcr eine monatliche Sparrate von ${fmt(inp.desiredSaving)} entschieden. Damit schlie\u00dft du ${fmtPctShort(res.coverage * 100)} deiner aktuellen Versorgungsl\u00fccke. Mit dieser Sparrate erreichst du bereits einen bedeutenden Teil deines Versorgungsziels, kannst aber jederzeit flexibel nachsteuern, falls du deine Absicherung weiter ausbauen m\u00f6chtest.</p>

                <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:36px;flex:1">
                    <div style="border:1px solid #e2e8f0;border-radius:18px;padding:26px 30px;background:#fff;box-shadow:0 2px 12px rgba(15,23,42,0.04);text-align:center;min-width:200px;max-width:240px">
                        <div style="display:inline-block">${targetIconSvg}</div>
                        <div style="font-size:32px;font-weight:800;color:${NV};margin-top:16px;letter-spacing:-0.5px;white-space:nowrap">${fmt(inp.desiredSaving)}</div>
                        <div style="font-size:13px;color:#64748b;margin-top:8px">Gew\u00fcnschte monatliche Sparrate</div>
                    </div>
                    <div style="flex-shrink:0">${arrowSvg}</div>
                    <div style="flex-shrink:0">${donutSvg}</div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:22px">
                    <div style="border:1px solid #e2e8f0;border-radius:16px;padding:24px 20px;background:#fff;text-align:center">
                        <div style="display:inline-block;margin-bottom:12px">${upArrowSvg}</div>
                        <div style="font-size:13px;font-weight:600;color:#64748b;line-height:1.4">Verf\u00fcgbares Kapital zu Rentenbeginn</div>
                        <div style="font-size:24px;font-weight:800;color:${LG};margin-top:10px">+${fmt(res.capitalNow)}</div>
                    </div>
                    <div style="border:1px solid #e2e8f0;border-radius:16px;padding:24px 20px;background:#fff;text-align:center">
                        <div style="display:inline-block;margin-bottom:12px">${upArrowSvg}</div>
                        <div style="font-size:13px;font-weight:600;color:#64748b;line-height:1.4">Zus\u00e4tzliche Rente im Jahr ${res.retirementYear}</div>
                        <div style="font-size:24px;font-weight:800;color:${LG};margin-top:10px">+${fmt(res.privatePayout)}</div>
                    </div>
                </div>

                <div style="border:1px solid #e2e5df;border-radius:12px;padding:14px 0;display:flex;background:#fff">
                    <span style="flex:1;text-align:center;font-size:13px;font-weight:600;color:#94a3b8;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-right:1px solid #e2e5df">${IC.clock("#94a3b8", 15)}<span style="position:relative;top:-7px">${yrs} Jahre Laufzeit</span></span>
                    <span style="flex:1;text-align:center;font-size:13px;font-weight:600;color:#94a3b8;display:inline-flex;align-items:center;justify-content:center;gap:6px;border-right:1px solid #e2e5df">${IC.trendUp("#94a3b8", 15)}<span style="position:relative;top:-7px">${fmtPct(inp.returnSavingPct)} Rendite</span></span>
                    <span style="flex:1;text-align:center;font-size:13px;font-weight:600;color:#94a3b8;display:inline-flex;align-items:center;justify-content:center;gap:6px">${IC.trendDown("#94a3b8", 15)}<span style="position:relative;top:-7px">${fmtPct(inp.inflationPct)} Inflation</span></span>
                </div>
            </div>
        </div>
        ${ftr(7, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 8 — ZINSESZINSEFFEKT  (Ref P12)
   ═══════════════════════════════════════════════════════════ */
function p8(d: PdfRequestData, res: PensionPdfResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const dc4 = res.capitalIn4 - res.capitalNow;
    const di4 = res.interestIn4 - res.interestNow;
    const dc8 = res.capitalIn8 - res.capitalNow;
    const di8 = res.interestIn8 - res.interestNow;
    const LG = "#10b981";

    /* Filled trend-down icon for html2canvas */
    const trendDownFilled = `<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="22,17 13.5,8.5 8.5,13.5 2,7 2,11 8.5,17.5 13.5,12.5 18,17" fill="${RD}"/>
        <polygon points="16,17 22,17 22,11" fill="${RD}"/>
    </svg>`;

    // Today row — green values, plain "Heute" text in green, NO border-bottom
    const todayRow = `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:0;align-items:center;padding:30px 0">
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center">
                <div style="font-size:22px;font-weight:800;color:${LG};white-space:nowrap;width:100%;text-align:center">${fmt(res.capitalNow)}</div>
            </div>
            <div style="display:flex;align-items:center;justify-content:center;padding:0 18px">
                <span style="font-size:14px;font-weight:700;color:${LG};white-space:nowrap;background:#fff;padding:2px 10px;position:relative;z-index:1">Heute</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center">
                <div style="font-size:22px;font-weight:800;color:${LG};white-space:nowrap;width:100%;text-align:center">${fmt(res.interestNow)}</div>
            </div>
        </div>`;

    // Delayed rows — small trend icons, plain label, red diff text (no pill)
    const delayRow = (label: string, capVal: string, intVal: string, capDiff: number, intDiff: number, isLast: boolean) => `
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:0;align-items:center;padding:28px 0;${!isLast ? "border-bottom:1px solid #f1f5f9;" : ""}">
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <div style="width:30px;height:30px;border-radius:50%;background:#fee2e2;display:inline-flex;align-items:center;justify-content:center">${trendDownFilled}</div>
                <div style="font-size:22px;font-weight:800;color:${NV};white-space:nowrap">${capVal}</div>
                <span style="font-size:13px;font-weight:700;color:${RD};white-space:nowrap">${fmt(capDiff)}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:center;padding:0 18px">
                <span style="font-size:14px;font-weight:700;color:#64748b;white-space:nowrap;background:#fff;padding:2px 10px;position:relative;z-index:1">${label}</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
                <div style="width:30px;height:30px;border-radius:50%;background:#fee2e2;display:inline-flex;align-items:center;justify-content:center">${trendDownFilled}</div>
                <div style="font-size:22px;font-weight:800;color:${NV};white-space:nowrap">${intVal}</div>
                <span style="font-size:13px;font-weight:700;color:${RD};white-space:nowrap">${fmt(intDiff)}</span>
            </div>
        </div>`;

    return `<div style="${P}">${hdr(8)}
        <div style="padding:5% 7% 0">
            <div style="border-radius:20px;padding:30px 32px;background:#fff">
                <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Nutzen des Zinseszinseffekts: Warum ein fr\u00fcher Start entscheidend ist</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 8px">Dank des fr\u00fchen Starts hast du ausreichend Zeit, um Verm\u00f6gen effektiv aufzubauen und den Zinseszinseffekt voll auszunutzen.</p>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 24px">Selbst ein minimal sp\u00e4terer Start in 4 oder 8 Jahren w\u00fcrde den Zinsgewinn deutlich reduzieren und den Aufbau deines Altersvorsorgeverm\u00f6gens sp\u00fcrbar beeintr\u00e4chtigen.</p>
                <div style="border:1px solid #e2e8f0;border-radius:18px;padding:0 28px;background:#fff;position:relative;overflow:hidden">
                    <div style="position:absolute;left:50%;top:80px;bottom:0;width:1px;background:#e8ecf0;z-index:0"></div>
                    <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:0;padding:22px 0;border-bottom:1px solid #e8ecf0">
                        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">${ib(IC.up(LG, 20), "#ecfdf5", "#d1fae5", 44)}<span style="font-size:17px;font-weight:700">Kapital</span></div>
                        <div style="width:60px"></div>
                        <div style="display:flex;flex-direction:column;align-items:center;gap:10px">${ib(IC.chartLine(LG, 20), "#ecfdf5", "#d1fae5", 44)}<span style="font-size:17px;font-weight:700">Zinsgewinn</span></div>
                    </div>
                    ${todayRow}
                    ${delayRow("In 4 Jahren", fmt(res.capitalIn4), fmt(res.interestIn4), dc4, di4, false)}
                    ${delayRow("In 8 Jahren", fmt(res.capitalIn8), fmt(res.interestIn8), dc8, di8, true)}
                </div>
            </div>
        </div>
        ${ftr(8, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 9 — ZUSAMMENFASSUNG  (Ref P13)
   ═══════════════════════════════════════════════════════════ */
function p9(d: PdfRequestData, inp: PensionPdfInput, res: PensionPdfResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const inflF = Math.pow(1 + inp.inflationPct / 100, res.monthsToRet / 12);
    const pensionReal = res.pensionNet / inflF;
    const totalReal = res.totalPension / inflF;
    const fullGap = Math.max(0, res.targetInflated - res.pensionNet - res.privatePayout);
    const maxV = Math.max(res.targetInflated, fullGap + res.privatePayout + res.pensionNet, inp.targetNetToday) * 1.1;
    const sc = (v: number) => Math.max(4, (v / maxV) * 370);

    const chart = barChartSvg({
        bars: [
            { segments: [{ h: sc(inp.targetNetToday), color: "#94a3b8", value: fmt(inp.targetNetToday), label: "Versorgungsziel" }], bottomLabel: "" },
            { segments: [{ h: sc(res.targetInflated), color: "#475569", value: fmt(res.targetInflated), label: "mit Inflation" }], bottomLabel: "" },
            { segments: [
                { h: sc(res.pensionNet), color: BL, value: fmt(res.pensionNet), label: "Rente netto" },
                { h: sc(res.privatePayout), color: EM, value: fmt(res.privatePayout), label: "Neue Rente" },
                { h: sc(fullGap), color: RD, value: fmt(fullGap), label: "L\u00fccke" },
            ], bottomLabel: "" },
        ],
        width: 600, height: 400, barWidth: 145, gap: 40,
    });

    const compCard = (title: string, iconHtml: string, nomVal: number, realVal: number) =>
        `<div style="border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;box-shadow:0 4px 16px rgba(15,23,42,0.03);flex:1">
            <div style="background:#fff;padding:20px 24px;display:flex;flex-direction:column;align-items:center;gap:10px">
                ${iconHtml}
                <div style="font-size:16px;font-weight:700;text-align:center">${title}</div>
            </div>
            <div style="height:1px;background:#e8ecf0"></div>
            <div style="background:#f8fafc;padding:16px 24px;display:flex;flex-direction:column;align-items:center">
                <div style="text-align:center;margin-bottom:12px;width:100%">
                    <div style="font-size:12px;color:#94a3b8;margin-bottom:4px">Im Alter</div>
                    <div style="font-size:24px;font-weight:800;color:${EM}">${fmt(nomVal)}</div>
                </div>
                <div style="height:1px;background:#e8ecf0;margin-bottom:12px;width:100%"></div>
                <div style="text-align:center;width:100%">
                    <div style="font-size:12px;color:#94a3b8;margin-bottom:4px">Nach heutiger Kaufkraft</div>
                    <div style="font-size:24px;font-weight:800;color:${EM}">${fmt(realVal)}</div>
                </div>
            </div>
        </div>`;

    return `<div style="${P}">${hdr(9)}
        <div style="padding:1% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:24px 26px;box-shadow:0 6px 22px rgba(15,23,42,0.04)">
                <h2 style="font-size:22px;font-weight:700;margin:0 0 10px">Zusammenfassung</h2>
                <p style="font-size:14px;color:#64748b;line-height:1.7;margin:0 0 20px">Durch den rechtzeitigen Start deiner Altersvorsorge bist du auf dem besten Weg, deine finanzielle Zukunft abzusichern. Jeder Monat z\u00e4hlt \u2013 starte jetzt und sichere dir ein ruhiges und finanziell stabiles Leben im Alter.</p>
                <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;margin-bottom:22px">
                    ${compCard("Deine bisherige Gesamtrente", ib(IC.trendDown("#b91c1c", 26), "#fef2f2", "#fecaca", 52), res.pensionNet, pensionReal)}
                    <div style="display:flex;align-items:center;justify-content:center">${IC.arrowRight("#cbd5e1", 28)}</div>
                    ${compCard("Deine neue Gesamtrente", ib(IC.up("#059669", 26), "#ecfdf5", "#a7f3d0", 52), res.totalPension, totalReal)}
                </div>
                ${chart}
            </div>
        </div>
        ${ftr(9, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 10 — BERECHNUNGSGRUNDLAGEN  (Ref P14)
   ═══════════════════════════════════════════════════════════ */
function p10(d: PdfRequestData, inp: PensionPdfInput): string {
    const name = `${d.firstName} ${d.lastName}`;
    const LG = "#10b981";
    const modeLabel = inp.mode === "employee" ? "Angestellter" : inp.mode === "versorgungswerk" ? "Versorgungswerk" : "Selbstst\u00e4ndig";
    const cardTitle = (icon: string, bg: string, border: string, title: string) =>
        `<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">${ib(icon, bg, border, 34)}<span style="font-weight:700;font-size:16px;line-height:34px">${title}</span></div>`;
    const miniCard = `border:1px solid #e2e8f0;border-radius:16px;padding:20px 22px;background:#fff;box-shadow:0 4px 16px rgba(15,23,42,0.03)`;

    return `<div style="${P}">${hdr(10, "Berechnungsgrundlagen deiner Altersvorsorge")}
        <div style="padding:3.5% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:28px 28px;box-shadow:0 6px 22px rgba(15,23,42,0.04)">
                <h2 style="font-size:21px;font-weight:700;margin:0 0 10px">Berechnungsgrundlagen deiner Altersvorsorge</h2>
                <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 20px">Hier findest du die wesentlichen Faktoren und Annahmen, die den Berechnungen zugrunde liegen \u2013 verst\u00e4ndlich aufbereitet, um dir volle Transparenz zu bieten.</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">
                    <div style="${miniCard}">
                        ${cardTitle(IC.user(LG, 16), "#ecfdf5", "#d1fae5", "Versicherungsnehmer")}
                        ${R("Geburtsdatum", fmtDateLong(inp.dob))}
                        ${R("Berufseintritt", fmtDateLong(inp.jobEntry))}
                        ${R("Berufsart", modeLabel)}
                        ${R("Monatliches Bruttoeinkommen", fmt(inp.monthlyGross))}
                        ${R("Kirchensteuerpflichtig", inp.churchTax ? "Ja" : "Nein")}
                    </div>
                    <div style="${miniCard}">
                        ${cardTitle(IC.settings(LG, 16), "#ecfdf5", "#d1fae5", "Annahme zur Rente")}
                        ${R("Renteneintrittsalter", `${inp.retirementAge} Jahren`)}
                        ${R("Lebenserwartung", `${inp.lifeExpectancy} Jahren`)}
                        ${R("Rentensteigerung", fmtPct(inp.inflationPct))}
                        ${R("Art der Krankenversicherung", inp.healthType === "legal" ? "Gesetzlich" : "Privat")}
                        ${R("Mit KvdR", "Nein")}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
                    <div style="${miniCard}">
                        ${cardTitle(IC.folder(LG, 16), "#ecfdf5", "#d1fae5", "Bestehende Vorsorge")}
                        ${inp.initialLumpSum > 0 ? `${R("Vorhandenes Kapital", fmt(inp.initialLumpSum))}${R("Gew\u00fcnschte Sparrate", fmt(inp.desiredSaving))}` : `<div style="font-size:13px;color:#94a3b8;padding:8px 0">Keine Angabe</div>`}
                    </div>
                    <div style="${miniCard}">
                        ${cardTitle(IC.check(LG, 16), "#ecfdf5", "#d1fae5", "Vorsorgungsziel")}
                        ${R("Inflation", fmtPct(inp.inflationPct))}
                        ${R("Rendite Ansparphase", fmtPct(inp.returnSavingPct))}
                        ${R("Rendite Entnahmephase", fmtPct(inp.returnTakeoutPct))}
                        ${R("Versorgungsziel", fmt(inp.targetNetToday))}
                    </div>
                </div>
            </div>
        </div>
        ${ftr(10, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 11 — ABSCHLUSSBRIEF  (Ref P15)
   ═══════════════════════════════════════════════════════════ */
function p11(d: PdfRequestData, avatarDataUrl: string): string {
    const name = `${d.firstName} ${d.lastName}`;

    return `<div style="${P}">${hdr(11)}
        <div style="padding:4% 8% 0">
            <div style="border:1px solid #e2e8f0;border-radius:24px;padding:36px 36px;box-shadow:0 10px 28px rgba(15,23,42,0.05)">
                <p style="font-weight:700;font-size:24px;margin:0 0 28px">Hey ${d.firstName},</p>
                <p style="font-size:17px;color:#64748b;line-height:2;margin-bottom:28px">du hast jetzt einen klaren Blick auf deine Versorgungssituation im Alter \u2013 auf Basis deiner eigenen Zahlen. Du kennst deine Versorgungsl\u00fccke, das ben\u00f6tigte Kapital und den Effekt eines fr\u00fchen Starts. Das einmal schwarz auf wei\u00df zu haben, ist eine starke Grundlage f\u00fcr deine n\u00e4chsten Entscheidungen.</p>
                <p style="font-size:17px;color:#64748b;line-height:2;margin-bottom:30px">Wenn du m\u00f6chtest, schaue ich mir dein Ergebnis gerne einmal pers\u00f6nlich mit dir an und helfe dir dabei, es auf deine Gesamtsituation einzuordnen. Ich freue mich, von dir zu h\u00f6ren.</p>
                <p style="font-size:17px;color:#64748b;margin-bottom:28px">Beste Gr\u00fc\u00dfe,</p>
                <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px"><img src="${avatarDataUrl}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0" /><div><span style="font-weight:700;font-size:18px">Julian Karges</span></div></div>
                <div style="border:1px solid #e2e8f0;border-radius:16px;padding:28px 32px;text-align:center">
                    <p style="font-size:17px;font-weight:700;line-height:1.7;margin:0 0 14px;color:${NV}">Der beste Zeitpunkt, um zu investieren, war vor 20 Jahren. Der zweitbeste Zeitpunkt ist jetzt.</p>
                    <span style="font-size:13px;color:#94a3b8">Warren Buffet, US-amerikanischer Investor</span>
                </div>
            </div>
        </div>
        ${ftr(11, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   PAGE 12 — DISCLAIMER
   ═══════════════════════════════════════════════════════════ */
function p12(d: PdfRequestData): string {
    const name = `${d.firstName} ${d.lastName}`;
    return `<div style="${P}">${hdr(12)}
        <div style="padding:4% 8% 0">
            <p style="font-weight:700;font-size:22px;margin:0 0 24px;color:${NV}">Disclaimer</p>
            <p style="font-size:14px;color:#64748b;line-height:1.9;margin:0 0 18px">Diese Auswertung wurde mithilfe eines Online-Rechners auf der Website von Julian Karges \u2013 Karges Kapital erstellt. Die zugrunde liegenden Berechnungen dienen der privaten Finanzplanung, insbesondere in den Bereichen Einkommenssicherung, Altersvorsorge und Verm\u00f6gensaufbau, und basieren auf allgemein anerkannten finanzmathematischen Methoden.</p>
            <p style="font-size:14px;color:#64748b;line-height:1.9;margin:0 0 18px">Bitte beachte, dass Modellannahmen wie konstant bleibende Renditen, Inflationsraten oder bestimmte steuerliche Rahmenbedingungen zu Abweichungen von der tats\u00e4chlichen Entwicklung f\u00fchren k\u00f6nnen. Die dargestellten Ergebnisse sind Prognosen auf Basis der von dir eingegebenen Daten \u2013 sie stellen keine Garantie f\u00fcr zuk\u00fcnftige Wertentwicklungen dar.</p>
            <p style="font-size:14px;color:#64748b;line-height:1.9;margin:0 0 18px">Die in diesem Dokument pr\u00e4sentierten Informationen stellen weder ein verbindliches Angebot noch eine Anlageberatung im Sinne des Wertpapierhandelsgesetzes (WpHG), eine steuerliche Beratung oder eine rechtliche Beratung dar. Steuerliche und gesetzliche Vorschriften k\u00f6nnen sich kurzfristig \u00e4ndern und sind von individuellen Faktoren abh\u00e4ngig. F\u00fcr verbindliche Aussagen wende dich bitte an eine qualifizierte Fachperson (z.\u00a0B. Steuerberater*in oder Rechtsanw\u00e4lt*in).</p>
            <p style="font-size:14px;color:#64748b;line-height:1.9;margin:0 0 18px">Weder Julian Karges noch Karges Kapital \u00fcbernehmen eine Gew\u00e4hr f\u00fcr die Richtigkeit, Vollst\u00e4ndigkeit und Aktualit\u00e4t der hier dargestellten Daten und Ergebnisse. Eine Haftung f\u00fcr Sch\u00e4den, die unmittelbar oder mittelbar aus dem Vertrauen auf die Inhalte dieses Dokuments entstehen, ist \u2013 soweit gesetzlich zul\u00e4ssig \u2013 ausgeschlossen. Du bist daf\u00fcr verantwortlich, vollst\u00e4ndige und korrekte Angaben zu deiner pers\u00f6nlichen und finanziellen Situation zu machen, da auf Basis dieser Informationen die Berechnungen durchgef\u00fchrt werden.</p>
            <p style="font-size:14px;color:#64748b;line-height:1.9;margin:0 0 28px">Dieses Dokument dient deiner Orientierung und ersetzt keine professionelle Beratung. F\u00fcr spezielle Fragen oder zur Kl\u00e4rung pers\u00f6nlicher Umst\u00e4nde wende dich bitte an eine entsprechend qualifizierte Fachperson.</p>
            <p style="font-size:14px;font-weight:700;color:${NV};margin:0 0 4px">Julian Karges \u2013 Karges Kapital</p>
            <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0">Selbstst\u00e4ndiger Handelsvertreter gem\u00e4\u00df \u00a7 84 HGB<br/>Darmst\u00e4dter Landstra\u00dfe 110, 60598 Frankfurt am Main<br/>E-Mail: juliankarges03@icloud.com</p>
        </div>
        ${ftr(12, name)}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   MAIN EXPORT — HTML → Canvas → PDF
   ═══════════════════════════════════════════════════════════ */
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

async function createCircularAvatar(imgDataUrl: string, sizePx = 300): Promise<string> {
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

export async function generatePensionPdf(
    requestData: PdfRequestData,
    result: PensionPdfResult,
    input: PensionPdfInput,
): Promise<{ blob: Blob; fileName: string }> {
    const rawAvatar = await loadImageAsDataUrl('/images/julian-karges-profile.png');
    const avatarDataUrl = await createCircularAvatar(rawAvatar, 300);

    const pages = [
        p1(requestData, result),
        p2(requestData, avatarDataUrl),
        p3(requestData),
        p4(requestData, input, result),
        p5(requestData, input, result),
        p6(requestData, input, result),
        p7(requestData, input, result),
        p8(requestData, result),
        p9(requestData, input, result),
        p10(requestData, input),
        p11(requestData, avatarDataUrl),
        p12(requestData),
    ];

    const html2canvas = (await import("html2canvas")).default;
    const jsPDFMod = await import("jspdf");
    const pdf = new jsPDFMod.jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    for (let i = 0; i < pages.length; i++) {
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:fixed;top:0;left:-9999px;z-index:-1;background:#fff;pointer-events:none";
        wrapper.innerHTML = pages[i];
        document.body.appendChild(wrapper);
        const el = wrapper.firstElementChild as HTMLElement;
        const canvas = await html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff" });
        document.body.removeChild(wrapper);
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    const fileName = `Altersvorsorge-${requestData.lastName}-${fmtTs(new Date())}.pdf`;
    pdf.save(fileName);
    return { blob: pdf.output("blob") as Blob, fileName };
}
