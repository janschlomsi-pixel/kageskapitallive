/**
 * Lead Capture — sends contact data + PDF copy to Google Sheets via Apps Script Web App.
 */

import type { PdfRequestData } from "../components/ui/PdfRequestModal";

const SCRIPT_URL = ((import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_GOOGLE_SCRIPT_URL || "").trim();

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
 * Send lead data to Google Sheets. Uses two strategies:
 * 1. First: sendBeacon with just contact info (tiny payload, works on all mobile browsers)
 * 2. Then: try to send PDF via fetch in background (best effort)
 */
export async function captureLead(
    data: PdfRequestData,
    pdfBlob: Blob,
    pdfFileName: string,
    source: LeadSource,
): Promise<void> {
    if (!SCRIPT_URL) {
        console.warn("[LeadCapture] No SCRIPT_URL configured");
        return;
    }

    try {
        // Step 1: Send lead data immediately via sendBeacon (guaranteed on mobile)
        // sendBeacon survives page navigations and component unmounts
        const leadData = {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            source,
            timestamp: new Date().toISOString(),
            pdfFileName,
            pdfBase64: "", // no PDF in beacon — payload must stay small
        };

        const beaconSent = navigator.sendBeacon(
            SCRIPT_URL,
            new Blob([JSON.stringify(leadData)], { type: "text/plain" }),
        );

        if (!beaconSent) {
            // Fallback: try fetch if sendBeacon fails
            await fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(leadData),
                mode: "no-cors",
            });
        }

        // Step 2: Try to send PDF separately in background (best effort, non-blocking)
        // This might fail on mobile — that's OK, the lead is already saved
        try {
            const pdfBase64 = await blobToBase64(pdfBlob);
            const pdfPayload = {
                ...leadData,
                pdfBase64,
                _updateExisting: true, // signal to update, not create new row
            };
            fetch(SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(pdfPayload),
                mode: "no-cors",
            }); // intentionally not awaited
        } catch {
            // PDF upload failed — that's OK
        }

    } catch (err) {
        console.warn("[LeadCapture] Failed to send lead:", err);
    }
}
