/**
 * Google Apps Script — Lead Capture for Karges Kapital
 *
 * SETUP:
 * 1. Erstelle ein neues Google Sheet
 * 2. Erstelle einen Ordner in Google Drive fuer die PDFs (z.B. "Karges Kapital - PDFs")
 * 3. Kopiere die Ordner-ID aus der URL und trage sie unten bei PDF_FOLDER_ID ein
 * 4. Gehe im Sheet auf: Erweiterungen → Apps Script
 * 5. Loesche den bestehenden Code und fuege diesen Code ein
 * 6. Klicke auf "Bereitstellen" → "Neue Bereitstellung"
 * 7. Typ: "Web-App"
 * 8. Ausfuehren als: "Ich" (dein Google Account)
 * 9. Zugriff: "Jeder"
 * 10. Klicke "Bereitstellen" und kopiere die URL
 * 11. Trage die URL in deine .env Datei ein: VITE_GOOGLE_SCRIPT_URL=https://script.google.com/...
 *
 * SHEET-SPALTEN (werden automatisch erstellt):
 * A: Datum | B: Vorname | C: Nachname | D: E-Mail | E: Telefon | F: Rechner | G: PDF-Link
 */

// ===== KONFIGURATION =====
var PDF_FOLDER_ID = "DEINE_ORDNER_ID_HIER"; // Google Drive Ordner-ID fuer PDFs
var SHEET_NAME = "Leads";                    // Name des Tabellenblatts
// =========================

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    // Sheet erstellen falls nicht vorhanden
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      sheet.appendRow(["Datum", "Vorname", "Nachname", "E-Mail", "Telefon", "Rechner", "PDF-Link"]);
      // Header formatieren
      var headerRange = sheet.getRange(1, 1, 1, 7);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f4f6");
      sheet.setFrozenRows(1);
      // Spaltenbreiten
      sheet.setColumnWidth(1, 160);
      sheet.setColumnWidth(2, 120);
      sheet.setColumnWidth(3, 120);
      sheet.setColumnWidth(4, 220);
      sheet.setColumnWidth(5, 150);
      sheet.setColumnWidth(6, 180);
      sheet.setColumnWidth(7, 300);
    }

    // PDF in Google Drive speichern
    var pdfLink = "";
    if (data.pdfBase64 && data.pdfFileName) {
      var folder;
      try {
        folder = DriveApp.getFolderById(PDF_FOLDER_ID);
      } catch (err) {
        // Fallback: Root-Ordner
        folder = DriveApp.getRootFolder();
      }

      var pdfBytes = Utilities.base64Decode(data.pdfBase64);
      var blob = Utilities.newBlob(pdfBytes, "application/pdf", data.pdfFileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      pdfLink = file.getUrl();
    }

    // Datum formatieren
    var now = new Date();
    var datum = Utilities.formatDate(now, "Europe/Berlin", "dd.MM.yyyy HH:mm");

    // Rechner-Name lesbarer machen
    var sourceMap = {
      "cashflow": "Cashflow-Auswertung",
      "altersvorsorge": "Altersvorsorge",
      "depot-vs-privatrente": "Depot vs. Privatrente"
    };
    var sourceName = sourceMap[data.source] || data.source;

    // Zeile in Sheet schreiben
    sheet.appendRow([
      datum,
      data.firstName || "",
      data.lastName || "",
      data.email || "",
      data.phone || "",
      sourceName,
      pdfLink
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "ok" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET-Handler (fuer Test im Browser)
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", message: "Karges Kapital Lead Capture is running." }))
    .setMimeType(ContentService.MimeType.JSON);
}
