/**
 * Lead Capture — sends contact data + PDF copy to Google Sheets via Apps Script Web App.
 *
 * Setup:
 *  1. Create a Google Sheet
 *  2. Go to Extensions → Apps Script
 *  3. Paste the code from /google-apps-script/Code.gs
 *  4. Deploy → New deployment → Web App → Anyone can access
 *  5. Copy the URL and set it below (or in .env as VITE_GOOGLE_SCRIPT_URL)
 */

import type { PdfRequestData } from "../components/ui/PdfRequestModal";

// ──────────────────────────────────────────────
// Configure your Google Apps Script Web App URL here
// ──────────────────────────────────────────────
const SCRIPT_URL = ((import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_GOOGLE_SCRIPT_URL || "").trim();

export type LeadSource = "cashflow" | "altersvorsorge" | "depot-vs-privatrente";

interface LeadPayload {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: LeadSource;
    timestamp: string;
    pdfFileName: string;
    pdfBase64: string;
}

/**
 * Convert a jsPDF Blob to a base64 string (without data-URL prefix).
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Strip "data:application/pdf;base64," prefix
            resolve(result.split(",")[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Send lead data + PDF to Google Sheets (fire-and-forget, never blocks the user).
 */
export async function captureLead(
    data: PdfRequestData,
    pdfBlob: Blob,
    pdfFileName: string,
    source: LeadSource,
): Promise<void> {
    if (!SCRIPT_URL) {
        console.warn("[LeadCapture] No SCRIPT_URL configured — skipping lead capture. Set VITE_GOOGLE_SCRIPT_URL in .env");
        return;
    }

    try {
        const pdfBase64 = await blobToBase64(pdfBlob);

        const payload: LeadPayload = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            source,
            timestamp: new Date().toISOString(),
            pdfFileName,
            pdfBase64,
        };

        // mode: "no-cors" is required because Google Apps Script
        // returns a 302 redirect which triggers CORS errors in browsers.
        // We can't read the response, but the request is sent successfully.
        await fetch(SCRIPT_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload),
            mode: "no-cors",
            redirect: "follow",
        });
    } catch (err) {
        // Never let lead capture break the user flow
        console.warn("[LeadCapture] Failed to send lead:", err);
    }
}
