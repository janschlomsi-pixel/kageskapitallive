/**
 * Lead Capture — sends contact data to Google Sheets via sendBeacon.
 * Reliable on all devices including mobile browsers.
 */

import type { PdfRequestData } from "../components/ui/PdfRequestModal";

const SCRIPT_URL = ((import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_GOOGLE_SCRIPT_URL || "").trim();

export type LeadSource = "cashflow" | "altersvorsorge" | "depot-vs-privatrente";

/**
 * Send lead data to Google Sheets via sendBeacon (guaranteed delivery on mobile).
 */
export async function captureLead(
    data: PdfRequestData,
    _pdfBlob: Blob,
    pdfFileName: string,
    source: LeadSource,
): Promise<void> {
    if (!SCRIPT_URL) {
        console.warn("[LeadCapture] No SCRIPT_URL configured");
        return;
    }

    try {
        const leadData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            source,
            timestamp: new Date().toISOString(),
            pdfFileName,
            pdfBase64: "",
        };

        const sent = navigator.sendBeacon(
            SCRIPT_URL,
            new Blob([JSON.stringify(leadData)], { type: "text/plain" }),
        );

        if (!sent) {
            await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(leadData),
                mode: "no-cors",
            });
        }
    } catch (err) {
        console.warn("[LeadCapture] Failed to send lead:", err);
    }
}
