/**
 * Depot vs Privatrente — Premium PDF Generator (HTML→Canvas→PDF)
 *
 * 10 pages:
 *  1  Cover — Die richtige Wahl: Depot oder Privatrente?
 *  2  Anschreiben
 *  3  Was zeichnet eine gute Altersvorsorge aus?
 *  4  Vergleichsgrundlagen
 *  5  Einleitung + Kriterien Ansparphase
 *  6  Planbarkeit: Fondswechsel + Abgeltungssteuer
 *  7  Wertentwicklung in der Ansparphase
 *  8  Auszahlungsmöglichkeiten
 *  9  Berechnungsgrundlage
 * 10  Abschluss
 */
import type { PdfRequestData } from "@/components/ui/PdfRequestModal";
import {
    simulateDepotVsPolice,
    type DepotPoliceInput,
    type DepotPoliceResult,
} from "./depotPoliceCalculator";

/* ═══════════════ COLORS ═══════════════ */
const EM = "#059669";
const NV = "#0f172a";
const BL = "#2563eb";
const RD = "#ef4444";
const SL = "#64748b";
const AM = "#f59e0b";
const TEAL = "#0d9488";
const TOTAL = 11;

/* ═══════════════ FORMATTERS ═══════════════ */
const fmt = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " \u20ac";
const fmtPct = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " %";
const fmtDate = (d: Date) =>
    d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTs = (d: Date) => {
    const p = (v: number) => v.toString().padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
};

/* ═══════════════ SVG ICONS ═══════════════ */
const IC = {
    scale: (c = "#f97316", s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="8" y1="21" x2="16" y2="21"/><path d="M4 7h16"/><circle cx="12" cy="3" r="1.2" fill="${c}" stroke="none"/><path d="M2 14l2-7 2 7" /><path d="M2 14a2 2 0 0 0 4 0"/><path d="M18 14l2-7 2 7"/><path d="M18 14a2 2 0 0 0 4 0"/></svg>`,
    bike: (c = "#f97316", s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1" fill="${c}"/><path d="M12 17.5V14l-3-3 4-3 2 3h3"/></svg>`,
    shield: (c = BL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>`,
    clock: (c = SL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    trendUp: (c = EM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    check: (c = EM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`,
    arrowDown: (c = RD, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m19 12-7 7-7-7"/></svg>`,
    shuffle: (c = SL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>`,
    user: (c = EM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    settings: (c = EM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
    folder: (c = SL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>`,
    heart: (c = EM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    piggy: (c = SL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/></svg>`,
    coins: (c = AM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/></svg>`,
    wallet: (c = BL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>`,
    star: (c = BL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="${c}" stroke="${c}" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    quote: (c = EM, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>`,
    pieChart: (c = BL, s = 24) =>
        `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>`,
};

/* ═══════════════ REUSABLE HTML BUILDING BLOCKS ═══════════════ */
const ib = (icon: string, bg = "#f0fdf4", border = "#d1fae5", sz = 48) =>
    `<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${bg};border:1px solid ${border};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;line-height:0;box-sizing:border-box;vertical-align:middle"><span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;line-height:0">${icon}</span></div>`;

const ibSquare = (icon: string, bg = "#fff7ed", border = "#fed7aa", sz = 48) =>
    `<div style="width:${sz}px;height:${sz}px;border-radius:${Math.round(sz * 0.25)}px;background:${bg};border:1px solid ${border};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;line-height:0;box-sizing:border-box"><span style="display:inline-flex;align-items:center;justify-content:center;width:100%;height:100%;line-height:0">${icon}</span></div>`;

const P = `width:210mm;height:297mm;overflow:hidden;background:#fff;position:relative;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${NV};box-sizing:border-box;padding:0;margin:0;`;

const hdr = (n: number) =>
    `<div style="background:#f3f4f2;border-bottom:1px solid #e2e5df;padding:0 7%;height:68px;display:flex;align-items:center;justify-content:space-between;gap:18px;box-sizing:border-box"><div style="display:flex;align-items:center;gap:14px">${ibSquare(IC.scale("#f97316", Math.round(40 * 0.48)), "#fff7ed", "#fed7aa", 40)}<span style="font-size:20px;font-weight:700;color:${NV};white-space:nowrap;position:relative;top:-9px">Depot oder Privatrente</span></div><svg width="42" height="42" viewBox="0 0 36 36" aria-hidden="true" style="flex-shrink:0"><circle cx="18" cy="18" r="16" fill="none" stroke="#d2d8ce" stroke-width="3"/><circle cx="18" cy="18" r="16" fill="none" stroke="#65a30d" stroke-width="3.2" stroke-linecap="round" stroke-dasharray="${(n / TOTAL) * 100.5} 100.5" transform="rotate(-90 18 18)"/></svg></div>`;

const ftr = (n: number, name: string) =>
    `<div style="position:absolute;bottom:3%;left:7%;right:7%;border-top:1px solid #e2e8f0;padding-top:10px;display:flex;justify-content:space-between"><span style="font-size:13px;color:#94a3b8">\u00a9${new Date().getFullYear()} Karges Kapital \u2022 Depot vs. Privatrente f\u00fcr ${name}</span><span style="font-size:13px;color:#94a3b8">${n}</span></div>`;

const R = (l: string, v: string) =>
    `<div style="display:flex;justify-content:space-between;gap:16px;padding:9px 0;border-bottom:1px solid #f1f5f9;align-items:center"><span style="font-size:13px;color:#64748b">${l}</span><span style="font-size:13px;font-weight:600;text-align:right">${v}</span></div>`;

const brandMark = () =>
    `<div style="text-align:center;padding-top:3%"><svg width="46" height="38" viewBox="0 0 46 38" xmlns="http://www.w3.org/2000/svg"><path d="M23 34 C13 24 5 14 10 4" fill="none" stroke="${EM}" stroke-width="3.5" stroke-linecap="round"/><path d="M23 34 C30 26 38 14 32 4" fill="none" stroke="#065f46" stroke-width="2.8" stroke-linecap="round"/><line x1="22" y1="30" x2="24" y2="20" stroke="${EM}" stroke-width="1.5" stroke-linecap="round"/></svg></div>`;

/* ═══════════════ CHART HELPERS ═══════════════ */
function lineChartSvg(
    points: Array<{ year: number; payment: number; depot: number; policy: number }>,
    opts: { width?: number; height?: number; showLegend?: boolean; showAxes?: boolean; showWinner?: boolean } = {},
): string {
    const w = opts.width ?? 660;
    const h = opts.height ?? 300;
    const pad = { left: opts.showAxes ? 50 : 10, right: 20, top: 15, bottom: opts.showLegend ? 60 : 30 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    const maxY = Math.max(1, ...points.map(p => Math.max(p.policy, p.depot, p.payment)));
    const maxX = Math.max(1, ...points.map(p => p.year));
    const sx = (x: number) => pad.left + (x / maxX) * cw;
    const sy = (y: number) => pad.top + ch - (y / maxY) * ch;

    let svg = `<svg width="100%" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;

    // Grid lines
    const ySteps = 5;
    for (let i = 0; i <= ySteps; i++) {
        const yVal = (maxY / ySteps) * i;
        const yp = sy(yVal);
        svg += `<line x1="${pad.left}" y1="${yp}" x2="${w - pad.right}" y2="${yp}" stroke="#f1f5f9" stroke-width="1"/>`;
        if (opts.showAxes) {
            let label: string;
            if (yVal >= 1_000_000) label = `${(yVal / 1_000_000).toFixed(1)}M`;
            else if (yVal >= 1000) label = `${Math.round(yVal / 1000)}k`;
            else label = `${Math.round(yVal)}`;
            svg += `<text x="${pad.left - 6}" y="${yp + 4}" text-anchor="end" fill="#94a3b8" font-size="11">${label}</text>`;
        }
    }

    // X-axis labels
    if (opts.showAxes) {
        const xStep = maxX <= 10 ? 2 : maxX <= 20 ? 3 : maxX <= 30 ? 5 : maxX <= 50 ? 5 : 10;
        for (let yr = 0; yr <= maxX; yr += xStep) {
            const xp = sx(yr);
            svg += `<text x="${xp}" y="${pad.top + ch + 18}" text-anchor="middle" fill="#94a3b8" font-size="11">${yr}</text>`;
        }
    }

    // Lines: Payment (red/dark), Depot (amber), Policy (blue)
    const lines = [
        { key: "payment" as const, color: "#ef4444", width: 1.5, dash: "" },
        { key: "depot" as const, color: AM, width: 2.5, dash: "" },
        { key: "policy" as const, color: BL, width: 2.5, dash: "" },
    ];

    lines.forEach(line => {
        const pts = points.map(p => `${sx(p.year)},${sy(p[line.key])}`).join(" ");
        svg += `<polyline points="${pts}" fill="none" stroke="${line.color}" stroke-width="${line.width}" stroke-linejoin="round" stroke-linecap="round" ${line.dash ? `stroke-dasharray="${line.dash}"` : ""}/>`;
    });

    // Winner badge
    if (opts.showWinner && points.length > 3) {
        const winnerIdx = Math.floor(points.length * 0.7);
        const wp = points[winnerIdx];
        const isPolicy = wp.policy >= wp.depot;
        const bx = sx(wp.year);
        const by = sy(isPolicy ? wp.policy : wp.depot) - 8;
        svg += `<rect x="${bx - 52}" y="${by - 17}" width="104" height="28" rx="14" fill="#1e293b"/>`;
        svg += `<circle cx="${bx - 38}" cy="${by - 3}" r="7" fill="${BL}"/>`;
        svg += `<text x="${bx - 38}" y="${by + 1}" text-anchor="middle" fill="#fff" font-size="9" font-weight="700">\u2605</text>`;
        svg += `<text x="${bx - 24}" y="${by + 2}" fill="#fff" font-size="13" font-weight="600">Gewinner</text>`;
    }

    // Legend
    if (opts.showLegend) {
        const ly = pad.top + ch + 36;
        const items = [
            { label: "Privatrente", color: BL },
            { label: "Deine Einzahlung", color: "#ef4444" },
            { label: "Depot", color: AM },
        ];
        let lx = pad.left;
        items.forEach(item => {
            svg += `<rect x="${lx}" y="${ly - 4}" width="10" height="10" rx="2" fill="${item.color}"/>`;
            svg += `<text x="${lx + 14}" y="${ly + 5}" fill="#64748b" font-size="11">${item.label}</text>`;
            lx += item.label.length * 7 + 30;
        });
    }

    svg += `</svg>`;
    return svg;
}

function coverChartSvg(
    points: Array<{ year: number; depot: number; policy: number }>,
): string {
    const w = 520, h = 320;
    const pad = { left: 12, right: 12, top: 20, bottom: 20 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;
    const maxY = Math.max(1, ...points.map(p => Math.max(p.policy, p.depot)));
    const maxX = Math.max(1, ...points.map(p => p.year));
    const sx = (x: number) => pad.left + (x / maxX) * cw;
    const sy = (y: number) => pad.top + ch - (y / maxY) * ch;

    let svg = `<svg width="100%" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="display:block">`;

    // Horizontal grid lines only (clean look like reference)
    for (let i = 0; i <= 4; i++) {
        const yp = pad.top + (ch / 4) * i;
        svg += `<line x1="${pad.left}" y1="${yp}" x2="${w - pad.right}" y2="${yp}" stroke="#f1f5f9" stroke-width="0.6"/>`;
    }

    // Depot line (amber)
    const depotPts = points.map(p => `${sx(p.year)},${sy(p.depot)}`).join(" ");
    svg += `<polyline points="${depotPts}" fill="none" stroke="${AM}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`;

    // Policy line (blue, thicker — winner)
    const policyPts = points.map(p => `${sx(p.year)},${sy(p.policy)}`).join(" ");
    svg += `<polyline points="${policyPts}" fill="none" stroke="${BL}" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round"/>`;

    svg += `</svg>`;
    return svg;
}

/* ═══════════════ CHECKMARK / CIRCLE HELPERS ═══════════════ */
const checkCircle = (color = TEAL) =>
    `<div style="width:24px;height:24px;border-radius:50%;background:${color};display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>`;

const emptyCircle = () =>
    `<div style="width:24px;height:24px;border-radius:50%;background:#e2e8f0;flex-shrink:0"></div>`;

const grayCheck = () =>
    `<div style="width:24px;height:24px;border-radius:50%;background:#cbd5e1;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>`;

/* ═══════════════ PAGE 1 — COVER ═══════════════ */
function p1(_d: PdfRequestData, result: DepotPoliceResult): string {
    const chartPoints = result.points.filter((_, i) => i % 2 === 0 || i === result.points.length - 1);

    return `<div style="${P}">
        <div style="display:flex;flex-direction:column;align-items:center;padding-top:18%">
            ${ibSquare(IC.scale("#f97316", 28), "#fff7ed", "#fed7aa", 56)}
            <h1 style="font-size:52px;font-weight:800;text-align:center;margin:28px 0 0;line-height:1.1">Die richtige Wahl:</h1>
            <h1 style="font-size:52px;font-weight:800;text-align:center;margin:4px 0 0;line-height:1.1">Depot oder Privatrente?</h1>
            <p style="color:#64748b;font-size:17px;margin-top:18px;text-align:center">Der beste Weg zur Altersvorsorge</p>
        </div>
        <div style="margin:5% 7% 0;position:relative">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:24px 26px 20px;box-shadow:0 8px 28px rgba(15,23,42,0.04);background:#fff">
                <div style="font-size:15px;font-weight:700;color:${NV};margin-bottom:14px">Wertentwicklung</div>
                ${coverChartSvg(chartPoints)}
            </div>
            <!-- Pie chart icon (right side, upper area of chart) -->
            <div style="position:absolute;top:30%;right:-28px;width:60px;height:60px;border-radius:50%;background:#eff6ff;border:2px solid #dbeafe;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(37,99,235,0.1)">
                ${IC.pieChart(BL, 26)}
            </div>
            <!-- Clock icon (bottom-left, below chart) -->
            <div style="position:absolute;bottom:-34px;left:-16px;width:60px;height:60px;border-radius:50%;background:#fff7ed;border:2px solid #fed7aa;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(245,158,11,0.12)">
                ${IC.clock(AM, 26)}
            </div>
            <!-- Legend card (bottom-right, overlapping chart edge) -->
            <div style="position:absolute;bottom:-38px;right:16px;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:18px 28px;box-shadow:0 6px 20px rgba(0,0,0,0.07)">
                <div style="display:flex;align-items:center;gap:14px;margin-bottom:12px;background:#eff6ff;border-radius:10px;padding:10px 18px;line-height:34px">
                    ${ib(IC.star(BL, 18), "#dbeafe", "#bfdbfe", 34)}
                    <span style="font-size:17px;font-weight:700;color:${BL};line-height:34px;position:relative;top:-7px">Privatrente</span>
                    <div style="width:64px;height:4px;background:${BL};border-radius:2px;margin-left:16px"></div>
                </div>
                <div style="display:flex;align-items:center;gap:14px;padding:8px 18px;line-height:34px">
                    ${ib(IC.trendUp(AM, 18), "#fef3c7", "#fde68a", 34)}
                    <span style="font-size:17px;font-weight:600;color:#64748b;line-height:34px;position:relative;top:-7px">Depot</span>
                    <div style="width:64px;height:4px;background:#94a3b8;border-radius:2px;margin-left:16px"></div>
                </div>
            </div>
        </div>
        <div style="position:absolute;bottom:4%;left:0;right:0;text-align:center">
            <span style="font-size:12px;color:#94a3b8">1</span>
        </div>
    </div>`;
}

/* ═══════════════ PAGE 2 — ANSCHREIBEN ═══════════════ */
function p2(d: PdfRequestData, avatarDataUrl: string): string {
    const name = `${d.firstName} ${d.lastName}`;
    return `<div style="${P}">
        ${hdr(2)}
        <div style="padding:4% 10% 0">
            <p style="font-weight:700;font-size:22px;margin:36px 0 28px">Hey ${d.firstName},</p>
            <p style="font-size:16px;color:#64748b;line-height:2;margin-bottom:28px">es freut mich, dass du dich mit dem Thema Depot und Privatrente auseinandergesetzt hast. Die Frage, welche Anlageform die richtige ist, besch\u00e4ftigt viele \u2013 und eine fundierte Entscheidung f\u00e4ngt damit an, die Unterschiede wirklich zu verstehen.</p>
            <p style="font-size:16px;color:#64748b;line-height:2;margin-bottom:28px">In dieser Auswertung findest du einen detaillierten Vergleich beider Anlageformen auf Basis deiner pers\u00f6nlichen Angaben: Wertentwicklung, Kostenstruktur, steuerliche Behandlung und Auszahlungsm\u00f6glichkeiten \u2013 alles \u00fcbersichtlich gegen\u00fcbergestellt.</p>
            <p style="font-size:16px;color:#64748b;line-height:2;margin-bottom:36px">Nimm dir einen Moment und geh die folgenden Seiten in Ruhe durch.</p>
            <p style="font-size:16px;color:#64748b;margin-bottom:28px">Beste Gr\u00fc\u00dfe,</p>
            <div style="display:flex;align-items:center;gap:16px">
                <img src="${avatarDataUrl}" style="width:52px;height:52px;border-radius:50%;object-fit:cover;flex-shrink:0"/>
                <div><span style="font-weight:700;font-size:17px">Julian Karges</span></div>
            </div>
        </div>
        ${ftr(2, name)}
    </div>`;
}

/* ═══════════════ PAGE 3 — WAS ZEICHNET EINE GUTE ALTERSVORSORGE AUS? ═══════════════ */
function p3(d: PdfRequestData): string {
    const name = `${d.firstName} ${d.lastName}`;
    const cardCss = `border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;background:#fff;box-shadow:0 3px 12px rgba(15,23,42,0.03)`;

    const shieldSvg = `<svg width="100%" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <radialGradient id="shGlow3" cx="50%" cy="48%" r="45%"><stop offset="0%" stop-color="#93c5fd" stop-opacity="0.3"/><stop offset="60%" stop-color="#bfdbfe" stop-opacity="0.12"/><stop offset="100%" stop-color="#dbeafe" stop-opacity="0"/></radialGradient>
            <linearGradient id="shB3" x1="0.5" y1="0" x2="0.5" y2="1"><stop offset="0%" stop-color="#60a5fa"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient>
            <filter id="shSh3" x="-20%" y="-10%" width="140%" height="140%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#2563eb" flood-opacity="0.18"/></filter>
        </defs>
        <circle cx="110" cy="55" r="48" fill="url(#shGlow3)"/>
        <path d="M110 25 L138 40 L138 66 C138 82 125 93 110 98 C95 93 82 82 82 66 L82 40 Z" fill="url(#shB3)" filter="url(#shSh3)"/>
        <path d="M100 60 L107 67 L121 53" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const timelineSvg = `<svg width="100%" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
        <rect x="10" y="48" width="200" height="20" rx="4" fill="#f1f5f9"/>
        <rect x="10" y="48" width="80" height="20" rx="4" fill="#dbeafe"/>
        <text x="50" y="62" text-anchor="middle" fill="${BL}" font-size="8.5" font-weight="600">Ansparphase</text>
        <rect x="90" y="48" width="120" height="20" rx="4" fill="#dcfce7"/>
        <text x="150" y="62" text-anchor="middle" fill="${EM}" font-size="8.5" font-weight="600">Entnahmephase</text>
        <rect x="5" y="30" width="58" height="15" rx="3.5" fill="#1e293b"/>
        <text x="34" y="41" text-anchor="middle" fill="#fff" font-size="7.5" font-weight="600">Sparbeginn</text>
        <rect x="153" y="30" width="62" height="15" rx="3.5" fill="#1e293b"/>
        <text x="184" y="41" text-anchor="middle" fill="#fff" font-size="7.5" font-weight="600">Rentenbeginn</text>
        <text x="110" y="84" text-anchor="middle" fill="#94a3b8" font-size="8.5">40 Jahre</text>
    </svg>`;

    const effSvg = `<svg width="100%" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="effArea3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${EM}" stop-opacity="0.1"/><stop offset="100%" stop-color="${EM}" stop-opacity="0.01"/></linearGradient>
        </defs>
        <line x1="30" y1="15" x2="30" y2="100" stroke="#e2e8f0" stroke-width="0.4"/>
        <line x1="30" y1="100" x2="200" y2="100" stroke="#e2e8f0" stroke-width="0.4"/>
        <line x1="30" y1="40" x2="200" y2="40" stroke="#f1f5f9" stroke-width="0.4" stroke-dasharray="2 3"/>
        <line x1="30" y1="60" x2="200" y2="60" stroke="#f1f5f9" stroke-width="0.4" stroke-dasharray="2 3"/>
        <line x1="30" y1="80" x2="200" y2="80" stroke="#f1f5f9" stroke-width="0.4" stroke-dasharray="2 3"/>
        <line x1="75" y1="15" x2="75" y2="100" stroke="#f1f5f9" stroke-width="0.3" stroke-dasharray="2 3"/>
        <line x1="120" y1="15" x2="120" y2="100" stroke="#f1f5f9" stroke-width="0.3" stroke-dasharray="2 3"/>
        <line x1="165" y1="15" x2="165" y2="100" stroke="#f1f5f9" stroke-width="0.3" stroke-dasharray="2 3"/>
        <polygon points="30,100 60,97 90,92 120,82 150,65 175,42 200,20 200,100" fill="url(#effArea3)"/>
        <polyline points="30,100 60,97 90,92 120,82 150,65 175,42 200,20" fill="none" stroke="${EM}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.6"/>
        <circle cx="200" cy="20" r="3" fill="${EM}" opacity="0.5"/>
        <rect x="52" y="32" width="116" height="56" rx="10" fill="#fff" stroke="#e2e8f0" stroke-width="0.8"/>
        <text x="110" y="58" text-anchor="middle" fill="${EM}" font-size="18" font-weight="800">+7%</text>
        <circle cx="136" cy="42" r="3.5" fill="${EM}" opacity="0.25"/>
        <circle cx="138" cy="44" r="1.8" fill="${EM}" opacity="0.45"/>
        <text x="110" y="78" text-anchor="middle" fill="#94a3b8" font-size="7">Rendite \u00fcber 40 Jahre Laufzeit</text>
    </svg>`;

    const costSvg = `<svg width="100%" viewBox="0 0 220 120" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="38" r="5.5" fill="${BL}"/>
        <rect x="52" y="31" width="130" height="14" rx="4" fill="${BL}" opacity="0.75"/>
        <circle cx="32" cy="60" r="5.5" fill="#f97316"/>
        <rect x="52" y="53" width="155" height="14" rx="4" fill="#f97316" opacity="0.7"/>
        <circle cx="32" cy="82" r="5.5" fill="${EM}"/>
        <rect x="52" y="75" width="110" height="14" rx="4" fill="${EM}" opacity="0.7"/>
    </svg>`;

    return `<div style="${P}">${hdr(3)}
        <div style="padding:10% 7% 0">
            <h2 style="font-size:19px;font-weight:700;margin:0 0 8px">Was zeichnet eine gute Altersvorsorge aus?</h2>
            <p style="font-size:12px;color:#64748b;line-height:1.7;margin:0 0 20px">Eine solide Altersvorsorge ist entscheidend, um im Alter finanzielle Sicherheit zu genie\u00dfen und den Lebensstandard zu halten. Da es keine universelle L\u00f6sung gibt, muss die Strategie individuell zu deinen Zielen passen. Die wichtigsten Kriterien helfen dir, die richtige Entscheidung zu treffen.</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;grid-auto-rows:1fr">
                <div style="${cardCss};display:flex;flex-direction:column">
                    <div style="flex:1;display:flex;align-items:center;justify-content:center">${shieldSvg}</div>
                    <h3 style="font-size:14px;font-weight:700;margin:6px 0 5px">Sicherheit</h3>
                    <p style="font-size:11px;color:#64748b;line-height:1.7;margin:0">Eine gute Altersvorsorge sch\u00fctzt dein Kapital vor Marktschwankungen und Unsicherheiten, bietet Stabilit\u00e4t und erm\u00f6glicht den langfristigen Verm\u00f6gensaufbau.</p>
                </div>
                <div style="${cardCss};display:flex;flex-direction:column">
                    <div style="flex:1;display:flex;align-items:center;justify-content:center">${timelineSvg}</div>
                    <h3 style="font-size:14px;font-weight:700;margin:6px 0 5px">Planbarkeit</h3>
                    <p style="font-size:11px;color:#64748b;line-height:1.7;margin:0">Planbarkeit bedeutet, die Entwicklung deiner Altersvorsorge vorherzusehen und zu steuern. Klare Strukturen, stabile Kosten und transparente Steuern sichern den \u00dcberblick.</p>
                </div>
                <div style="${cardCss};display:flex;flex-direction:column">
                    <div style="flex:1;display:flex;align-items:center;justify-content:center">${effSvg}</div>
                    <h3 style="font-size:14px;font-weight:700;margin:6px 0 5px">Effizienz</h3>
                    <p style="font-size:11px;color:#64748b;line-height:1.7;margin:0">Effizienz bedeutet, mit minimalem Aufwand maximale Renditen zu erzielen. Kluge Strategien wie Rebalancing und der Zinseszinseffekt lassen dein Verm\u00f6gen nachhaltig und zielgerichtet wachsen.</p>
                </div>
                <div style="${cardCss};display:flex;flex-direction:column">
                    <div style="flex:1;display:flex;align-items:center;justify-content:center">${costSvg}</div>
                    <h3 style="font-size:14px;font-weight:700;margin:6px 0 5px">Kosten</h3>
                    <p style="font-size:11px;color:#64748b;line-height:1.7;margin:0">Jede Anlageform verursacht Kosten \u2013 f\u00fcr Anbieter, Verwaltung oder Steuern. Transparente und planbare Geb\u00fchren helfen, den \u00dcberblick zu behalten und unerwartete Belastungen zu vermeiden, damit deine Rendite optimal bleibt.</p>
                </div>
            </div>
        </div>
        ${ftr(3, name)}
    </div>`;
}

/* ═══════════════ PAGE 4 — VERGLEICHSGRUNDLAGEN ═══════════════ */
function p4(d: PdfRequestData, input: DepotPoliceInput, result: DepotPoliceResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const miniCard = `border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,0.03)`;
    const miniCardGray = `border:1px solid #e2e8f0;border-radius:12px;padding:14px 16px;background:#f8fafc;box-shadow:0 2px 10px rgba(15,23,42,0.03)`;
    const yrs = result.yearsToRetirement.toFixed(2);

    const policyName = "Privatrente Testsieger";
    const policyYears = `${Math.round(result.yearsToRetirement)} Jahre`;

    const totalPolicyCost = input.policyCosts.acquisitionCostPct + input.policyCosts.adminCostFirstYearPct * 0.01 + input.policyCosts.assetBasedAdminPct;
    const displayTotalCost = input.policyCosts.acquisitionCostPct + input.policyCosts.assetBasedAdminPct;

    return `<div style="${P}">${hdr(4)}
        <div style="padding:2% 7% 0">
            <h2 style="font-size:19px;font-weight:700;margin:0 0 8px">Vergleichsgrundlagen</h2>
            <p style="font-size:11px;color:#64748b;line-height:1.7;margin:0 0 14px">Hier findest du die Berechnungsgrundlagen des Vergleichs zwischen Depot und Privatrente \u2013 inklusive der unterschiedlichen Kostenstrukturen und Annahmen, die eine fundierte Gegen\u00fcberstellung erm\u00f6glichen.</p>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
                <div style="${miniCard};display:flex;align-items:center;gap:10px">
                    ${ib(IC.piggy(SL, 16), "#f1f5f9", "#e2e8f0", 32)}
                    <div><div style="font-size:11px;color:#94a3b8">Anfangskapital</div><div style="font-size:14px;font-weight:700">${fmt(input.initialCapital)}</div></div>
                </div>
                <div style="${miniCard};display:flex;align-items:center;gap:10px">
                    ${ib(IC.trendUp(EM, 16), "#ecfdf5", "#d1fae5", 32)}
                    <div><div style="font-size:11px;color:#94a3b8">Monatliche Einzahlung</div><div style="font-size:14px;font-weight:700;color:${EM}">${fmt(input.monthlyContribution)}</div></div>
                </div>
            </div>

            <div style="display:flex;gap:20px;margin-bottom:14px;padding:6px 0">
                <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b">${IC.clock(SL, 13)}<span style="position:relative;top:-7px">${yrs} Jahre Laufzeit</span></span>
                <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b">${IC.trendUp(SL, 13)}<span style="position:relative;top:-7px">${fmtPct(input.annualReturnPct)} Rendite</span></span>
                <span style="display:flex;align-items:center;gap:6px;font-size:11px;color:#64748b">${IC.trendUp(SL, 13)}<span style="position:relative;top:-7px">${fmtPct(input.contributionGrowthPct)} Dynamik</span></span>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                <div style="${miniCardGray}">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                        ${ib(IC.coins(AM, 14), "#fef3c7", "#fde68a", 28)}
                        <span style="font-weight:700;font-size:13px;position:relative;top:-7px">Depot</span>
                    </div>
                    ${R("Effektivkosten", fmtPct(input.depotCosts.effectiveCostPct))}
                    ${R("Geb\u00fchren bei Neuanlage", fmtPct(input.depotCosts.switchBuyPct))}
                    ${R("Geb\u00fchren bei Verkauf", fmtPct(input.depotCosts.switchSellPct))}
                </div>
                <div style="${miniCard};background:#f8fafc">
                    <p style="font-size:11px;color:#64748b;line-height:1.7;margin:0">Die Effektivkosten zeigen, wie stark die Rendite durch alle anfallenden Kosten gemindert wird. Darin sind s\u00e4mtliche Kostenarten, einschlie\u00dflich Fondskosten, vollst\u00e4ndig ber\u00fccksichtigt.</p>
                </div>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                <div style="${miniCardGray}">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
                        ${ib(IC.shield(EM, 14), "#ecfdf5", "#d1fae5", 28)}
                        <span style="font-weight:700;font-size:12px;position:relative;top:-7px">${policyName} ${policyYears}</span>
                    </div>
                    ${R("Abschlusskosten", fmtPct(input.policyCosts.acquisitionCostPct))}
                    ${R("Abschlusskostenperiode", `${input.policyCosts.acquisitionPeriodYears.toFixed(2)} Jahren`)}
                    <div style="height:1px;background:#e2e8f0;margin:3px 0"></div>
                    ${R("Art der Verwaltungskosten p.a.", input.policyCosts.adminCostType === "falling" ? "fallend" : "konstant")}
                    ${R("J\u00e4hrliche Verwaltungskosten", fmtPct(input.policyCosts.adminCostFirstYearPct))}
                    ${R("Guthabenabh. Verwaltungskosten", fmtPct(input.policyCosts.assetBasedAdminPct))}
                    ${R("Deckelung", "Nein")}
                    <div style="height:1px;background:#e2e8f0;margin:3px 0"></div>
                    ${R("Kosten bei Einmalzahlungen", fmtPct(input.policyCosts.oneTimePaymentCostPct))}
                    ${R("Kosten bei Auszahlungen", fmtPct(0))}
                    ${R("Aktueller Rentenfaktor", "30,00")}
                </div>
                <div style="display:flex;flex-direction:column;justify-content:flex-end">
                    <div style="text-align:right;padding:6px 0">
                        <span style="font-size:11px;color:#94a3b8">Zusammengefasste Kosten</span>
                        <span style="font-size:13px;font-weight:700;color:${NV};margin-left:10px">${fmtPct(Math.max(displayTotalCost, input.policyCosts.acquisitionCostPct))}</span>
                    </div>
                </div>
            </div>
        </div>
        ${ftr(4, name)}
    </div>`;
}

/* ═══════════════ PAGE 5 — EINLEITUNG + KRITERIEN ANSPARPHASE ═══════════════ */
function p5(d: PdfRequestData, input: DepotPoliceInput, _result: DepotPoliceResult): string {
    const name = `${d.firstName} ${d.lastName}`;

    const criteria = [
        { label: "Anlage in Fonds & ETFs", depot: "check", policy: "check" },
        { label: "Flexibilit\u00e4t", depot: "check", policy: "gray" },
        { label: "Steuerfreie Fondswechsel", depot: "empty", policy: "check" },
        { label: "Steuerliche Sicherheit", depot: "empty", policy: "check" },
        { label: "Entfall der Vorabpauschale", depot: "empty", policy: "check" },
        { label: "Transparenz der Kosten", depot: "gray", policy: "check" },
        { label: "Planbarkeit der Kosten", depot: "text:K\u00f6nnen sich ver\u00e4ndern", policy: "text:Vertraglich gesichert" },
        { label: "Automatisiertes Rebalancing", depot: "empty", policy: "check" },
    ];

    const renderCell = (type: string) => {
        if (type === "check") return checkCircle(BL);
        if (type === "gray") return grayCheck();
        if (type === "empty") return emptyCircle();
        if (type.startsWith("text:")) return `<span style="font-size:10px;color:#64748b;text-align:center">${type.slice(5)}</span>`;
        return "";
    };

    const tableRows = criteria.map(c =>
        `<div style="display:grid;grid-template-columns:1fr 150px 150px;align-items:center;padding:16px 28px;border-bottom:1px solid #f1f5f9">
            <span style="font-size:12px;color:#475569">${c.label}</span>
            <div style="text-align:center;display:flex;justify-content:center;padding-right:20px">${renderCell(c.depot)}</div>
            <div style="text-align:center;display:flex;justify-content:center">${renderCell(c.policy)}</div>
        </div>`,
    ).join("");

    return `<div style="${P}">${hdr(5)}
        <div style="padding:2% 7% 0">
            <h2 style="font-size:19px;font-weight:700;margin:0 0 14px">Einleitung zu den Halbzeiten der Altersvorsorge</h2>
            <p style="font-size:12px;color:#64748b;line-height:1.8;margin:0 0 10px">Die Altersvorsorge l\u00e4sst sich in zwei Phasen unterteilen: die Ansparphase (erste Halbzeit) und die Entnahmephase (zweite Halbzeit). In der ersten Halbzeit liegt der Fokus darauf, ein m\u00f6glichst hohes Kapital f\u00fcr die sp\u00e4tere Rente aufzubauen, w\u00e4hrend in der zweiten Halbzeit dieses Kapital sinnvoll genutzt und gesichert wird.</p>
            <p style="font-size:12px;color:#64748b;line-height:1.8;margin:0 0 28px">Zun\u00e4chst widmen wir uns der ersten Halbzeit, um zu verstehen, wie unterschiedliche Modelle wie das Depot und die Privatrente in dieser Phase abschneiden. Hierbei spielen Faktoren wie Kosten, Sicherheit, Planbarkeit und Rendite eine entscheidende Rolle.</p>

            <div style="display:flex;margin-bottom:10px">
                <div style="background:${BL};color:#fff;padding:16px 0;border-radius:8px 0 0 8px;font-size:14px;font-weight:600;text-align:center;line-height:1;width:50%;box-sizing:border-box">Ansparphase</div>
                <div style="background:#f1f5f9;padding:16px 0;border-radius:0 8px 8px 0;width:50%"></div>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 4px 58px;font-size:10px;color:#94a3b8">
                <span>\u2022 Heute</span>
                <span>\u2192 Renteneintritt mit ${input.retirementAge} Jahren</span>
                <span>\u2192 Lebenserwartung mit 88 Jahren</span>
            </div>

            <div style="border:1px solid #e2e8f0;border-radius:16px;overflow:hidden">
                <div style="text-align:center;padding:22px 0 16px">
                    <span style="font-size:15px;font-weight:700;color:${NV}">Vergleich der relevanten Kriterien in der </span>
                    <span style="font-size:15px;font-weight:700;color:${BL}">\u2022 Ansparphase</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 150px 150px;padding:10px 28px;border-bottom:1px solid #e2e8f0">
                    <span style="font-size:11px;color:#94a3b8;font-weight:600">Kriterien Ansparphase</span>
                    <span style="font-size:11px;color:#94a3b8;font-weight:600;text-align:center;padding-right:20px">Depot</span>
                    <span style="font-size:11px;color:#94a3b8;font-weight:600;text-align:center">Privatrente</span>
                </div>
                ${tableRows}
            </div>
        </div>
        ${ftr(5, name)}
    </div>`;
}

/* ═══════════════ PAGE 6 — PLANBARKEIT ═══════════════ */
function p6(d: PdfRequestData, input: DepotPoliceInput, result: DepotPoliceResult): string {
    const name = `${d.firstName} ${d.lastName}`;

    // Compute switch years
    const switchEvery = input.switchEveryYears > 0 ? input.switchEveryYears : 7;
    const switchYears: number[] = [];
    for (let y = switchEvery; y <= result.yearsToRetirement; y += switchEvery) {
        switchYears.push(y);
    }
    const switchCount = switchYears.length;
    const switchYearsStr = switchYears.length > 1
        ? switchYears.slice(0, -1).join(", ") + " und " + switchYears[switchYears.length - 1]
        : switchYears.join(", ");

    // Simulate WITHOUT fund switching to get loss
    const noSwitchResult = simulateDepotVsPolice({ ...input, switchSimulation: "no" });
    const switchLossDepot = result.finalDepot - noSwitchResult.finalDepot;

    // Simulate with higher tax rate (42%)
    const higherTaxRate = 42.0;
    const higherTaxResult = simulateDepotVsPolice({ ...input, abgeltungTaxPct: higherTaxRate });
    const taxLossDepot = higherTaxResult.finalDepot - result.finalDepot;

    const comparisonBlock = (policyVal: number, depotVal: number) =>
        `<div style="display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;gap:0;margin-top:20px">
            <div style="background:#3b82f6;border-radius:14px;padding:24px 20px;text-align:center;color:#fff">
                <div style="margin-bottom:10px"><img src="data:image/svg+xml,${encodeURIComponent(IC.shield("#fff", 28))}" width="28" height="28" style="display:inline-block"/></div>
                <div style="font-size:15px;font-weight:700;margin-bottom:6px">Privatrente</div>
                <div style="font-size:22px;font-weight:800">${fmt(policyVal)}</div>
            </div>
            <div style="padding:0 14px;font-size:11px;color:#94a3b8;font-weight:600;display:grid;align-items:center">Verlust</div>
            <div style="background:#f1f5f9;border-radius:14px;padding:24px 20px;text-align:center">
                <div style="margin-bottom:10px"><img src="data:image/svg+xml,${encodeURIComponent(IC.arrowDown(RD, 28))}" width="28" height="28" style="display:inline-block"/></div>
                <div style="font-size:15px;font-weight:700;color:${NV};margin-bottom:6px">Depot</div>
                <div style="font-size:22px;font-weight:800;color:${RD}">${fmt(depotVal)}</div>
            </div>
        </div>`;

    return `<div style="${P}">${hdr(6)}
        <div style="padding:5% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:30px 28px;margin-bottom:26px;box-shadow:0 4px 16px rgba(15,23,42,0.03)">
                <h3 style="font-size:18px;font-weight:700;margin:0 0 14px">Planbarkeit: Fondswechsel, ein unvermeidlicher Faktor</h3>
                <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 18px">Laut Statistik wechselt der durchschnittliche Anleger alle 6\u20137 Jahre seine Fonds. \u00dcber einen Zeitraum von 30 bis 40 Jahren ist es unwahrscheinlich, dein Portfolio unver\u00e4ndert zu lassen. Marktbedingungen \u00e4ndern sich, und Anpassungen deiner Anlagestrategie sind oft unerl\u00e4sslich \u2013 sei es, um auf neue Chancen zu reagieren oder vor Rentenbeginn dein Kapital abzusichern. So reduzierst du Verlustrisiken und schaffen die notwendige Planbarkeit f\u00fcr eine sichere und entspannte Rente.</p>
                <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
                    ${IC.shuffle(SL, 18)}
                    <span style="font-size:13px;color:${NV}">Simulation von <span style="color:${BL};font-weight:700">${switchCount} Fondswechseln</span> in den Jahren ${switchYearsStr}.</span>
                </div>
                ${comparisonBlock(0, switchLossDepot)}
            </div>

            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:30px 28px;box-shadow:0 4px 16px rgba(15,23,42,0.03)">
                <h3 style="font-size:18px;font-weight:700;margin:0 0 14px">Sicherheit: Was passiert, wenn die Abgeltungssteuer abgeschafft wird?</h3>
                <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 18px">Steuerliche Regelungen \u00e4ndern sich regelm\u00e4\u00dfig \u2013 und die Diskussion um die Abschaffung der Abgeltungssteuer zugunsten des pers\u00f6nlichen Steuersatzes ist aktueller denn je. Das bedeutet f\u00fcr die meisten Sparer eine h\u00f6here Steuerlast und erschwert die Planbarkeit deiner Rente.</p>
                <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
                    ${IC.shuffle(SL, 18)}
                    <span style="font-size:13px;color:${NV}">Erh\u00f6hung der Steuer von der Abgeltungssteuer ${fmtPct(input.abgeltungTaxPct)} auf den <span style="color:${BL};font-weight:700">individuellen Steuersatz von ${fmtPct(higherTaxRate)}</span></span>
                </div>
                ${comparisonBlock(0, taxLossDepot)}
            </div>
        </div>
        ${ftr(6, name)}
    </div>`;
}

/* ═══════════════ PAGE 7 — WERTENTWICKLUNG IN DER ANSPARPHASE ═══════════════ */
function p7(d: PdfRequestData, _input: DepotPoliceInput, result: DepotPoliceResult): string {
    const name = `${d.firstName} ${d.lastName}`;

    return `<div style="${P}">${hdr(7)}
        <div style="padding:8% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:26px 28px;box-shadow:0 4px 16px rgba(15,23,42,0.03)">
                <h3 style="font-size:20px;font-weight:700;margin:0 0 10px">Wertentwicklung in der Ansparphase</h3>
                <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 24px">Im ersten Schritt betrachten wir die Ansparphase \u2013 also, welche Strategie dir zu Rentenbeginn mehr Kapital zur Verf\u00fcgung stellt. Zwar punktet das Depot zu Beginn mit einer niedrigeren Kostenbelastung, doch langfristig zeigt sich der Vorteil der Privatrente: Steuerfreie Fondswechsel und der Wegfall der Vorabpauschale sorgen f\u00fcr einen st\u00e4rkeren Zinseszinseffekt. So w\u00e4chst dein Kapital planbar und effizient \u2013 f\u00fcr einen optimalen Start in die Rente.</p>

                <div style="display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:14px;margin-bottom:28px;align-items:end">
                    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:22px 16px;text-align:center">
                        <div style="margin-bottom:14px"><img src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="18" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1"/><g transform="translate(9,9)">${IC.wallet(EM, 20)}</g></svg>`)}" width="38" height="38" style="display:inline-block"/></div>
                        <div style="font-size:20px;font-weight:800">${fmt(result.finalPayment)}</div>
                        <div style="font-size:12px;color:#94a3b8;margin-top:6px">Deine Einzahlung</div>
                    </div>
                    <div style="background:#3b82f6;border-radius:14px;padding:28px 20px;text-align:center;color:#fff">
                        <div style="margin-bottom:14px"><img src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 42 42"><circle cx="21" cy="21" r="20" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/><g transform="translate(11,11)">${IC.star("#fff", 20)}</g></svg>`)}" width="42" height="42" style="display:inline-block"/></div>
                        <div style="font-size:15px;font-weight:600">Privatrente</div>
                        <div style="font-size:26px;font-weight:800;margin-top:6px">${fmt(result.finalPolicy)}</div>
                    </div>
                    <div style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:14px;padding:22px 16px;text-align:center">
                        <div style="margin-bottom:14px"><img src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" viewBox="0 0 38 38"><circle cx="19" cy="19" r="18" fill="#fef3c7" stroke="#fde68a" stroke-width="1"/><g transform="translate(9,9)">${IC.piggy(AM, 20)}</g></svg>`)}" width="38" height="38" style="display:inline-block"/></div>
                        <div style="font-size:14px;font-weight:600;color:#94a3b8">Depot</div>
                        <div style="font-size:20px;font-weight:800;color:${AM};margin-top:6px">${fmt(result.finalDepot)}</div>
                    </div>
                </div>

                <div style="font-size:14px;font-weight:700;margin-bottom:10px">Wertentwicklung</div>
                ${lineChartSvg(result.points, { width: 660, height: 420, showLegend: true, showAxes: true, showWinner: true })}
            </div>
        </div>
        ${ftr(7, name)}
    </div>`;
}

/* ═══════════════ PAGE 8 — AUSZAHLUNGSMÖGLICHKEITEN ═══════════════ */
function p8(d: PdfRequestData): string {
    const name = `${d.firstName} ${d.lastName}`;

    const payoutIcon1 = `<svg width="100%" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <rect x="35" y="20" width="110" height="80" rx="12" fill="#dbeafe"/>
        <rect x="48" y="32" width="88" height="58" rx="8" fill="${BL}" opacity="0.7"/>
        <circle cx="92" cy="61" r="15" fill="#fff" opacity="0.3"/>
        <text x="92" y="67" text-anchor="middle" fill="#fff" font-size="17" font-weight="700">\u20ac</text>
        <circle cx="125" cy="80" r="20" fill="${EM}"/>
        <path d="M118 80 L123 85 L132 75" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    const payoutIcon2 = `<svg width="100%" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="20" width="150" height="95" rx="10" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
        <line x1="45" y1="40" x2="75" y2="55" stroke="${BL}" stroke-width="3" stroke-linecap="round"/>
        <line x1="75" y1="55" x2="105" y2="70" stroke="${BL}" stroke-width="3" stroke-linecap="round"/>
        <line x1="105" y1="70" x2="135" y2="88" stroke="${BL}" stroke-width="3" stroke-linecap="round"/>
        <line x1="135" y1="88" x2="155" y2="100" stroke="${BL}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="45" cy="40" r="4" fill="${BL}"/>
        <circle cx="75" cy="55" r="4" fill="${BL}"/>
        <circle cx="105" cy="70" r="4" fill="${BL}"/>
        <circle cx="135" cy="88" r="4" fill="${BL}"/>
        <circle cx="155" cy="100" r="4" fill="${BL}"/>
        <text x="40" y="128" fill="#94a3b8" font-size="12">Start</text>
        <text x="138" y="128" fill="#94a3b8" font-size="12">Ende</text>
    </svg>`;

    const payoutIcon3 = `<svg width="100%" viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
        <rect x="25" y="20" width="150" height="95" rx="10" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
        <line x1="45" y1="68" x2="155" y2="68" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="45" cy="68" r="4.5" fill="#94a3b8"/>
        <circle cx="72" cy="68" r="4.5" fill="#94a3b8"/>
        <circle cx="100" cy="68" r="4.5" fill="#94a3b8"/>
        <circle cx="127" cy="68" r="4.5" fill="#94a3b8"/>
        <circle cx="155" cy="68" r="4.5" fill="#94a3b8"/>
        <text x="65" y="128" fill="#94a3b8" font-size="12">lebenslang</text>
    </svg>`;

    const cardCss = `border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;display:grid;grid-template-columns:200px 1fr;box-shadow:0 2px 10px rgba(15,23,42,0.03)`;

    const payouts = [
        {
            title: "Einmalauszahlung",
            icon: payoutIcon1,
            text: "Bei der Einmalzahlung wird dein gesamtes Kapital auf einmal ausgezahlt. Im Depot werden die Ertr\u00e4ge mit der Abgeltungssteuer oder deinem pers\u00f6nlichen Steuersatz versteuert. Die Privatrente profitiert hier vom Halbeink\u00fcnfteverfahren: Nur die H\u00e4lfte der Gewinne ist steuerpflichtig \u2013 deine Steuerlast sinkt deutlich und es bleibt mehr von deinem Kapital.",
        },
        {
            title: "Entnahmeplan",
            icon: payoutIcon2,
            text: "Beim Entnahmeplan wird dein Kapital monatlich \u00fcber einen festgelegten Zeitraum ausgezahlt \u2013 flexibel angepasst an deine Bed\u00fcrfnisse. W\u00e4hrend beim Depot die Steuerbelastung kontinuierlich anf\u00e4llt, profitiert die Privatrente doppelt. Nur die H\u00e4lfte der Gewinne wird dank des Halbeink\u00fcnfteverfahrens versteuert, und die monatliche Auszahlung h\u00e4lt deinen pers\u00f6nlichen Steuersatz niedrig. So maximierst du langfristig deinen finanziellen Vorteil.",
        },
        {
            title: "Lebenslange Rente",
            icon: payoutIcon3,
            text: "Die lebenslange Rente bietet finanzielle Sicherheit bis ins hohe Alter. W\u00e4hrend beim Depot das Kapital irgendwann aufgebraucht ist, zahlt die Privatrente monatlich \u2013 ein Leben lang. Besonders vorteilhaft bei der Privatrente: Nur der Ertragsanteil wird versteuert, mit 67 sind das lediglich 17%.",
        },
    ];

    return `<div style="${P}">${hdr(8)}
        <div style="padding:3% 7% 0">
            <h2 style="font-size:22px;font-weight:700;margin:0 0 12px">Auszahlungsm\u00f6glichkeiten</h2>
            <p style="font-size:13px;color:#64748b;line-height:1.7;margin:0 0 36px">Sowohl beim Depot als auch bei der Privatrente kannst du flexibel entscheiden, wie du dein Kapital auszahlen l\u00e4sst \u2013 ideal, um es an deine Lebenssituation anzupassen. Der Vorteil der Privatrente: Du profitierst von vielf\u00e4ltigen steuerlichen F\u00f6rderungen.</p>
            <div style="display:grid;grid-template-rows:1fr 1fr 1fr;gap:16px">
                ${payouts.map(po => `
                    <div style="${cardCss}">
                        <div style="background:#f8fafc;display:grid;align-items:center;justify-content:center;padding:28px 22px">${po.icon}</div>
                        <div style="padding:28px 28px">
                            <h3 style="font-size:17px;font-weight:700;margin:0 0 12px">${po.title}</h3>
                            <p style="font-size:12.5px;color:#64748b;line-height:1.75;margin:0">${po.text}</p>
                        </div>
                    </div>
                `).join("")}
            </div>
        </div>
        ${ftr(8, name)}
    </div>`;
}

/* ═══════════════ PAGE 9 — BERECHNUNGSGRUNDLAGE ═══════════════ */
function p9(d: PdfRequestData, input: DepotPoliceInput, _result: DepotPoliceResult): string {
    const name = `${d.firstName} ${d.lastName}`;
    const miniCard = `border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;background:#fff;box-shadow:0 2px 10px rgba(15,23,42,0.03)`;
    const LG = "#22c55e";

    const cardTitle = (icon: string, title: string) =>
        `<div style="margin-bottom:10px;white-space:nowrap;overflow:visible"><img src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="13" fill="#f0fdf4" stroke="#86efac" stroke-width="1"/><g transform="translate(6,6)">${icon}</g></svg>`)}" width="28" height="28" style="display:inline-block;vertical-align:top;margin-right:8px"/><span style="font-weight:700;font-size:14px;display:inline-block;vertical-align:top;position:relative;top:-5px">${title}</span></div>`;

    const Rs = (l: string, v: string) =>
        `<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid #f1f5f9;align-items:center"><span style="font-size:11px;color:#64748b">${l}</span><span style="font-size:11px;font-weight:600;text-align:right">${v}</span></div>`;

    const partialExemptionLabel = input.partialExemptionKind === "equity" ? "> 50% Aktien" : input.partialExemptionKind === "mixed" ? "< 50% Aktien" : "Immobilien";
    const partialExemptionPct = input.partialExemptionKind === "equity" ? "30%" : input.partialExemptionKind === "mixed" ? "15%" : "60%";
    const hasChurchTax = input.abgeltungTaxPct > 26.5;

    return `<div style="${P}">${hdr(9)}
        <div style="padding:5% 7% 0">
            <div style="border:1px solid #e2e8f0;border-radius:20px;padding:24px 26px;box-shadow:0 4px 16px rgba(15,23,42,0.03)">
                <h2 style="font-size:18px;font-weight:700;margin:0 0 6px">Berechnungsgrundlage</h2>
                <p style="font-size:12px;color:#64748b;line-height:1.7;margin:0 0 16px">Hier findest du die wesentlichen Faktoren und Annahmen, die den Berechnungen zugrunde liegen \u2013 verst\u00e4ndlich aufbereitet, um dir volle Transparenz zu bieten.</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div style="${miniCard}">
                        ${cardTitle(IC.user(LG, 16), "Angaben zur Person")}
                        ${Rs("Geburtsdatum", fmtDate(input.dob))}
                        ${Rs("Renteneintrittsalter", `${input.retirementAge} Jahren`)}
                        ${Rs("Lebenserwartung", "88 Jahren")}
                    </div>
                    <div style="${miniCard}">
                        ${cardTitle(IC.settings(LG, 16), "Annahmen zur Steuer")}
                        ${Rs("Kirchensteuerpflichtig", hasChurchTax ? "Ja" : "Nein")}
                        ${Rs("Teilfreistellung", partialExemptionLabel)}
                        ${Rs("Sich ergebende Teilfreistellung", partialExemptionPct)}
                        ${Rs("Kirchensteuer", hasChurchTax ? "8,00 %" : "0,00 %")}
                        ${Rs("Abgeltungssteuer", fmtPct(input.abgeltungTaxPct))}
                        ${Rs("Basiszins", fmtPct(input.basiszinsPct))}
                        ${Rs("Freibetrag", fmt(input.allowanceEUR))}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
                    <div style="${miniCard}">
                        ${cardTitle(IC.arrowDown(LG, 16), "Entnahmephase")}
                        ${Rs("Teilfreistellung Privatrente", "15,00 %")}
                        ${Rs("Halbeink\u00fcnfteverfahren", "50,00 %")}
                        ${Rs("Ertragsanteilbesteuerung", "17,00 %")}
                    </div>
                    <div style="${miniCard}">
                        ${cardTitle(IC.heart(LG, 16), "Angaben zur Krankenversicherung")}
                        ${Rs("Art der Krankenversicherung", "Gesetzlich")}
                        ${Rs("Mit KvdR", "Ja")}
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
                    <div style="${miniCard}">
                        ${cardTitle(IC.wallet(LG, 16), "Investition")}
                        ${Rs("Monatliche Einzahlung", fmt(input.monthlyContribution))}
                        ${Rs("Beitragsdynamik", fmtPct(input.contributionGrowthPct))}
                        ${Rs("Anfangskapital", fmt(input.initialCapital))}
                    </div>
                    <div style="${miniCard}">
                        ${cardTitle(IC.folder(LG, 16), "Bestehende Vorsorge")}
                        <div style="font-size:11px;color:#94a3b8;padding:6px 0">Keine Angabe</div>
                    </div>
                </div>
            </div>
        </div>
        ${ftr(9, name)}
    </div>`;
}

/* ═══════════════ PAGE 10 — ABSCHLUSS ═══════════════ */
function p10(d: PdfRequestData, avatarDataUrl: string): string {
    const name = `${d.firstName} ${d.lastName}`;

    return `<div style="${P}">${hdr(10)}
        <div style="padding:6% 10% 0">
            <p style="font-weight:700;font-size:22px;margin:36px 0 28px">Hey ${d.firstName},</p>
            <p style="font-size:16px;color:#64748b;line-height:2;margin-bottom:28px">du hast jetzt einen klaren Vergleich zwischen Depot und Privatrente vor dir \u2013 auf Basis deiner eigenen Zahlen. Du siehst, wie sich Kosten, Steuern und Wertentwicklung \u00fcber deinen Anlagehorizont unterscheiden. Das einmal schwarz auf wei\u00df zu haben, ist eine starke Grundlage f\u00fcr deine n\u00e4chsten Entscheidungen.</p>
            <p style="font-size:16px;color:#64748b;line-height:2;margin-bottom:30px">Wenn du m\u00f6chtest, schaue ich mir dein Ergebnis gerne einmal pers\u00f6nlich mit dir an und helfe dir dabei, es auf deine Gesamtsituation einzuordnen. Ich freue mich, von dir zu h\u00f6ren.</p>
            <p style="font-size:16px;color:#64748b;margin-bottom:28px">Beste Gr\u00fc\u00dfe,</p>
            <div style="margin-bottom:36px"><img src="${avatarDataUrl}" width="52" height="52" style="display:inline-block;vertical-align:top;border-radius:50%;margin-right:14px"/><span style="display:inline-block;vertical-align:top;position:relative;top:-3px"><span style="font-weight:700;font-size:17px;display:block">Julian Karges</span></span></div>
            <div style="border:1px solid #e2e8f0;border-radius:16px;padding:28px 32px;text-align:center">
                <p style="font-size:17px;font-weight:700;line-height:1.7;margin:0 0 14px;color:${NV}">Der beste Zeitpunkt, um zu investieren, war vor 20 Jahren. Der zweitbeste Zeitpunkt ist jetzt.</p>
                <div style="text-align:center"><img src="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#ecfdf5" stroke="#d1fae5" stroke-width="1"/><g transform="translate(4,4)">${IC.user(EM, 16)}</g></svg>`)}" width="24" height="24" style="display:inline-block;vertical-align:middle;margin-right:6px"/><span style="font-size:13px;color:#94a3b8;display:inline-block;vertical-align:middle">Warren Buffet, US-amerikanischer Investor</span></div>
            </div>
        </div>
        ${ftr(10, name)}
    </div>`;
}

/* ═══════════════ PAGE 11 — DISCLAIMER ═══════════════ */
function p11Disclaimer(d: PdfRequestData): string {
    const name = `${d.firstName} ${d.lastName}`;
    return `<div style="${P}">${hdr(11)}
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
        ${ftr(11, name)}</div>`;
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

async function createCircularAvatar(imgDataUrl: string, sizePx = 300): Promise<string> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = sizePx;
            canvas.height = sizePx;
            const ctx = canvas.getContext("2d")!;
            ctx.beginPath();
            ctx.arc(sizePx / 2, sizePx / 2, sizePx / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            const srcSize = Math.min(img.width, img.height);
            const srcX = (img.width - srcSize) / 2;
            ctx.drawImage(img, srcX, 0, srcSize, srcSize, 0, 0, sizePx, sizePx);
            resolve(canvas.toDataURL("image/png"));
        };
        img.src = imgDataUrl;
    });
}

/* ═══════════════ MAIN EXPORT ═══════════════ */
export async function generateDepotPolicePdf(
    requestData: PdfRequestData,
    input: DepotPoliceInput,
    result: DepotPoliceResult,
): Promise<{ blob: Blob; fileName: string }> {
    const rawAvatar = await loadImageAsDataUrl("/images/julian-karges-profile.png");
    const avatarDataUrl = await createCircularAvatar(rawAvatar, 300);

    const pages = [
        p1(requestData, result),
        p2(requestData, avatarDataUrl),
        p3(requestData),
        p4(requestData, input, result),
        p5(requestData, input, result),
        p6(requestData, input, result),
        p7(requestData, input, result),
        p8(requestData),
        p9(requestData, input, result),
        p10(requestData, avatarDataUrl),
        p11Disclaimer(requestData),
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
        const canvas = await html2canvas(el, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: "#ffffff",
        });
        document.body.removeChild(wrapper);
        if (i > 0) pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297, undefined, "FAST");
    }

    const fileName = `Depot-vs-Privatrente-${requestData.lastName}-${fmtTs(new Date())}.pdf`;
    pdf.save(fileName);
    return { blob: pdf.output("blob") as Blob, fileName };
}
