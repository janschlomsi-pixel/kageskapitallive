/**
 * Vercel Serverless Function — Proxy for Google Apps Script Lead Capture.
 *
 * Solves CORS + mobile browser issues by forwarding requests server-side.
 * Client sends to /api/lead (same origin, no CORS) → this function
 * forwards to Google Apps Script (server-to-server, no restrictions).
 */
export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  if (!SCRIPT_URL) {
    console.error("[lead] GOOGLE_SCRIPT_URL not configured");
    return res.status(500).json({ error: "Server not configured" });
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
      redirect: "follow",
    });

    // Google Apps Script returns HTML after redirect, that's OK
    return res.status(200).json({ status: "ok" });
  } catch (err) {
    console.error("[lead] Failed to forward:", err);
    return res.status(500).json({ error: "Failed to forward lead" });
  }
}
