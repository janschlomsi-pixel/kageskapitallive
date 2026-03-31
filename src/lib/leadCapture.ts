/**
 * Lead Capture — sends contact data + PDF to Google Sheets
 * via our own Vercel serverless proxy (/api/lead).
 *
 * This avoids all CORS and mobile browser issues because
 * the request stays on the same domain.
 */

import type { PdfRequestData } from "../components/ui/PdfRequestModal";

export type LeadSource = "cashflow" | "altersvorsorge" | "depot-vs-privatrente";

/**
 * Convert a jsPDF Blob to a base64 string (without data-URL prefix).
 */
function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(",")[1] || result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * Send lead data + PDF to Google Sheets via /api/lead proxy.
 * Same-origin request — no CORS issues, works on all devices.
 */
export async function captureLead(
    data: PdfRequestData,
    pdfBlob: Blob,
    pdfFileName: string,
    source: LeadSource,
): Promise<void> {
    try {
        const pdfBase64 = await blobToBase64(pdfBlob);

        const payload = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            source,
            timestamp: new Date().toISOString(),
            pdfFileName,
            pdfBase64,
        };

        await fetch("/api/lead", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
    } catch (err) {
        // Never let lead capture break the user flow
        console.warn("[LeadCapture] Failed to send lead:", err);
    }
}
