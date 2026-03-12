import jsPDF from "jspdf";
import { PdfRequestData } from "@/components/ui/PdfRequestModal";

export function generateSimplePdf(data: PdfRequestData, pageName: string, calculationData?: Record<string, string | number>) {
    const doc = new jsPDF();

    // Header
    // doc.setFontSize(22); // Replaced with custom font if needed, but standard is fine
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(5, 150, 105); // Emerald 600
    doc.text("Finanzanalyse", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(16);
    doc.setTextColor(60, 60, 60);
    doc.text(pageName, 20, 30);

    // User Info
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Erstellt für: ${data.firstName} ${data.lastName}`, 20, 50);
    doc.text(`E-Mail: ${data.email}`, 20, 58);
    doc.text(`Telefon: ${data.phone}`, 20, 66);
    doc.text(`Datum: ${new Date().toLocaleDateString('de-DE')}`, 20, 74);

    // Content Divider
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 80, 190, 80);

    // Calculation Data
    let yPos = 90;
    if (calculationData) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Ergebnisse", 20, yPos);
        yPos += 10;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);

        Object.entries(calculationData).forEach(([key, value]) => {
            doc.text(`${key}:`, 20, yPos);
            doc.text(`${value}`, 120, yPos); // Align values
            yPos += 8;
        });

        yPos += 10;
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Dies ist ein automatisch generiertes Dokument.", 20, yPos);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generiert von ArenaAI Financial Calculator", 20, 280);

    doc.save(`${pageName.replace(/\s+/g, '_').toLowerCase()}_report.pdf`);
}
