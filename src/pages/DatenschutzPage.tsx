import { Layout } from "@/components/layout/Layout";
import { Shield } from "lucide-react";

export function DatenschutzPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Datenschutzerklärung</h1>
              <p className="text-gray-500 text-sm mt-1">Stand: März 2026</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-10 text-gray-700 leading-relaxed">

            {/* 1. Verantwortlicher */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Verantwortlicher</h2>
              <p>
                Julian Karges<br />
                Beratungsdienstleistungen im Bereich Finanzdienstleistungen<br />
                Selbstständiger Handelsvertreter gemäß § 84 HGB<br />
                Darmstädter Landstraße 110<br />
                60598 Frankfurt am Main, Deutschland
              </p>
              <p className="mt-3">
                <strong>Telefon:</strong> +49 1512 1653 941<br />
                <strong>E-Mail:</strong> juliankarges03@icloud.com
              </p>
              <p className="mt-3">
                <strong>Aufsichtsbehörde:</strong><br />
                IHK Frankfurt am Main<br />
                Börsenplatz 4, 60313 Frankfurt am Main<br />
                <a href="http://www.frankfurt-main.ihk.de/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  www.frankfurt-main.ihk.de
                </a>
              </p>
            </section>

            {/* 2. Überblick */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Überblick der Verarbeitungen</h2>
              <p>
                Die nachfolgende Übersicht fasst die Arten der verarbeiteten Daten und die Zwecke ihrer Verarbeitung zusammen
                und verweist auf die betroffenen Personen.
              </p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Arten der verarbeiteten Daten</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Bestandsdaten (z.B. Vor- und Nachname)</li>
                <li>Kontaktdaten (z.B. E-Mail-Adresse, Telefonnummer)</li>
                <li>Inhaltsdaten (z.B. Eingaben in Formularen)</li>
                <li>Finanzdaten (z.B. Eingaben in den Finanzrechnern zur Erstellung personalisierter PDF-Auswertungen)</li>
                <li>Nutzungsdaten (z.B. besuchte Webseiten, Zugriffszeiten)</li>
                <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen, Geräte-Informationen)</li>
              </ul>
            </section>

            {/* 3. Rechtsgrundlagen */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Maßgebliche Rechtsgrundlagen</h2>
              <p>
                Im Folgenden erhalten Sie eine Übersicht der Rechtsgrundlagen der DSGVO, auf deren Basis wir personenbezogene Daten verarbeiten.
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Einwilligung (Art. 6 Abs. 1 S. 1 lit. a DSGVO):</strong> Die betroffene Person hat ihre Einwilligung
                  in die Verarbeitung der sie betreffenden personenbezogenen Daten für einen spezifischen Zweck gegeben.
                </li>
                <li>
                  <strong>Vertragserfüllung und vorvertragliche Anfragen (Art. 6 Abs. 1 S. 1 lit. b DSGVO):</strong> Die Verarbeitung
                  ist für die Erfüllung eines Vertrags oder zur Durchführung vorvertraglicher Maßnahmen erforderlich.
                </li>
                <li>
                  <strong>Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f DSGVO):</strong> Die Verarbeitung ist zur Wahrung
                  der berechtigten Interessen des Verantwortlichen oder eines Dritten erforderlich.
                </li>
              </ul>
            </section>

            {/* 4. Sicherheitsmaßnahmen */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Sicherheitsmaßnahmen</h2>
              <p>
                Wir treffen nach Maßgabe der gesetzlichen Vorgaben unter Berücksichtigung des Stands der Technik,
                der Implementierungskosten und der Art, des Umfangs, der Umstände und der Zwecke der Verarbeitung
                sowie der unterschiedlichen Eintrittswahrscheinlichkeiten und des Ausmaßes der Bedrohung geeignete
                technische und organisatorische Maßnahmen, um ein dem Risiko angemessenes Schutzniveau zu gewährleisten.
              </p>
              <p className="mt-3">
                Zu den Maßnahmen gehören insbesondere die Sicherung der Vertraulichkeit, Integrität und Verfügbarkeit
                von Daten durch Kontrolle des physischen und elektronischen Zugangs zu den Daten als auch des sie
                betreffenden Zugriffs, der Eingabe, der Weitergabe, der Sicherung der Verfügbarkeit und ihrer Trennung.
                Die Übertragung der Daten erfolgt verschlüsselt via SSL/TLS.
              </p>
            </section>

            {/* 5. Rechte der Betroffenen */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Rechte der betroffenen Personen</h2>
              <p>Ihnen stehen als Betroffene nach der DSGVO verschiedene Rechte zu:</p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>
                  <strong>Widerspruchsrecht:</strong> Sie haben das Recht, aus Gründen, die sich aus Ihrer besonderen Situation
                  ergeben, jederzeit gegen die Verarbeitung der Sie betreffenden personenbezogenen Daten Widerspruch einzulegen.
                </li>
                <li>
                  <strong>Widerrufsrecht bei Einwilligungen:</strong> Sie haben das Recht, erteilte Einwilligungen jederzeit zu widerrufen.
                </li>
                <li>
                  <strong>Auskunftsrecht:</strong> Sie haben das Recht, eine Bestätigung darüber zu verlangen, ob betreffende
                  Daten verarbeitet werden und auf Auskunft über diese Daten.
                </li>
                <li>
                  <strong>Berichtigungsrecht:</strong> Sie haben das Recht, die Vervollständigung oder Berichtigung
                  unrichtiger Daten zu verlangen.
                </li>
                <li>
                  <strong>Recht auf Löschung und Einschränkung:</strong> Sie haben das Recht, die Löschung oder
                  Einschränkung der Verarbeitung Ihrer Daten zu verlangen.
                </li>
                <li>
                  <strong>Recht auf Datenübertragbarkeit:</strong> Sie haben das Recht, die Sie betreffenden Daten
                  in einem strukturierten, gängigen und maschinenlesbaren Format zu erhalten.
                </li>
                <li>
                  <strong>Beschwerderecht:</strong> Sie haben das Recht, sich bei einer Aufsichtsbehörde zu beschweren.
                </li>
              </ul>
            </section>

            {/* 6. Bereitstellung des Onlineangebots */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Bereitstellung des Onlineangebots und Webhosting</h2>
              <p>
                Wir verarbeiten die Daten der Nutzer, um ihnen unsere Online-Dienste zur Verfügung stellen zu können.
                Zu diesem Zweck verarbeiten wir die IP-Adresse des Nutzers, die notwendig ist, um die Inhalte und
                Funktionen unserer Online-Dienste an den Browser bzw. das Endgerät der Nutzer zu übermitteln.
              </p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Verarbeitete Datenarten</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nutzungsdaten (z.B. besuchte Webseiten, Zugriffszeiten)</li>
                <li>Meta-/Kommunikationsdaten (z.B. IP-Adressen, Geräte-Informationen)</li>
              </ul>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Hosting</h3>
              <p>
                Die von uns in Anspruch genommenen Hosting-Leistungen dienen der Zurverfügungstellung der folgenden
                Leistungen: Infrastruktur- und Plattformdienstleistungen, Rechenkapazität, Speicherplatz und Datenbankdienste.
                Unser Hoster ist Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
              </p>
            </section>

            {/* 7. Finanzrechner und PDF-Auswertungen */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Finanzrechner und PDF-Auswertungen</h2>
              <p>
                Unsere Webseite bietet verschiedene Finanzrechner an (Cashflow-Analyse, Altersvorsorge-Rechner,
                Depot vs. Privatrente Vergleich). Bei der Anforderung einer personalisierten PDF-Auswertung
                werden folgende Daten erhoben und verarbeitet:
              </p>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Erhobene Daten</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Vorname und Nachname (Pflichtfeld)</li>
                <li>Telefonnummer (Pflichtfeld)</li>
                <li>E-Mail-Adresse (freiwillige Angabe)</li>
                <li>Die im jeweiligen Finanzrechner eingegebenen Daten (z.B. Einkommen, Ausgaben, Sparraten, Renteninformationen), soweit diese in die PDF-Auswertung einfließen</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Zweck der Verarbeitung</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Erstellung und Bereitstellung einer personalisierten PDF-Auswertung auf Grundlage Ihrer Eingaben</li>
                <li>Persönliche Kontaktaufnahme zur individuellen Finanzberatung</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Rechtsgrundlage</h3>
              <p>
                Die Verarbeitung erfolgt auf Grundlage Ihrer Einwilligung gemäß Art. 6 Abs. 1 S. 1 lit. a DSGVO.
                Durch das aktive Setzen des Häkchens bei „Ich akzeptiere die Datenschutzverordnung" vor der
                PDF-Erstellung erklären Sie sich mit der beschriebenen Datenverarbeitung einverstanden.
                Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen (siehe Abschnitt 5).
              </p>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Speicherung und Auftragsverarbeitung</h3>
              <p>
                Ihre Kontaktdaten sowie die erstellte PDF-Auswertung werden in Google Sheets und Google Drive
                gespeichert. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
                Die Datenverarbeitung durch Google erfolgt auf Grundlage eines Auftragsverarbeitungsvertrags (AVV)
                gemäß Art. 28 DSGVO. Google verarbeitet die Daten in unserem Auftrag und ausschließlich nach unserer
                Weisung. Die Übertragung der Daten erfolgt verschlüsselt.
              </p>
              <p className="mt-3">
                Google kann Daten in die USA übertragen. Die Datenübermittlung in die USA wird auf das
                EU-U.S. Data Privacy Framework gestützt. Weitere Informationen finden Sie in der{" "}
                <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  Datenschutzerklärung von Google
                </a>.
              </p>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Speicherdauer</h3>
              <p>
                Ihre Daten werden für die Dauer von maximal zwei Jahren nach der letzten Interaktion gespeichert,
                sofern keine gesetzlichen Aufbewahrungspflichten bestehen. Kommt es zu einem Beratungs- oder
                Vertragsverhältnis, gelten die gesetzlichen Aufbewahrungsfristen (bis zu 10 Jahre gemäß
                HGB und AO). Sie können jederzeit die vorzeitige Löschung Ihrer Daten verlangen, indem Sie
                uns unter den oben genannten Kontaktdaten erreichen. Die Löschung erfolgt innerhalb von 30 Tagen
                nach Eingang Ihres Löschersuchens, sofern dem keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
              </p>
            </section>

            {/* 8. Kontaktaufnahme */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Kontaktaufnahme</h2>
              <p>
                Bei der Kontaktaufnahme mit uns (z.B. per Kontaktformular, E-Mail, Telefon oder via soziale Medien)
                werden die Angaben der anfragenden Personen verarbeitet, soweit dies zur Beantwortung der Kontaktanfragen
                und etwaiger angefragter Maßnahmen erforderlich ist.
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-3">
                <li><strong>Verarbeitete Datenarten:</strong> Kontaktdaten, Inhaltsdaten, Nutzungsdaten, Meta-/Kommunikationsdaten</li>
                <li><strong>Betroffene Personen:</strong> Kommunikationspartner</li>
                <li><strong>Zwecke:</strong> Kontaktanfragen und Kommunikation</li>
                <li><strong>Rechtsgrundlagen:</strong> Vertragserfüllung (Art. 6 Abs. 1 S. 1 lit. b DSGVO), Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f DSGVO)</li>
              </ul>
            </section>

            {/* 9. Eingebundene Inhalte */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Eingebundene Dienste und Inhalte Dritter</h2>
              <p>
                Wir setzen innerhalb unseres Onlineangebotes auf Grundlage unserer berechtigten Interessen Inhalts- oder
                Serviceangebote von Drittanbietern ein, um deren Inhalte und Services einzubinden.
              </p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Instagram</h3>
              <p>
                Wir binden Videos von Instagram (Meta Platforms Ireland Limited, 4 Grand Canal Square, Grand Canal Harbour,
                Dublin 2, Irland) ein. Datenschutzerklärung:{" "}
                <a href="https://privacycenter.instagram.com/policy" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  https://privacycenter.instagram.com/policy
                </a>
              </p>
              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Sendinblue / Brevo (Newsletter)</h3>
              <p>
                Für den Versand unseres Newsletters nutzen wir Brevo (ehemals Sendinblue), Sendinblue GmbH,
                Köpenicker Str. 126, 10179 Berlin. Ihre E-Mail-Adresse wird zum Zweck des Newsletter-Versands gespeichert.
                Datenschutzerklärung:{" "}
                <a href="https://www.brevo.com/de/legal/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  https://www.brevo.com/de/legal/privacypolicy/
                </a>
              </p>
            </section>

            {/* 10. Cookies */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Einsatz von Cookies</h2>
              <p>
                Diese Webseite verwendet keine Tracking-Cookies. Es werden lediglich technisch notwendige Cookies eingesetzt,
                die für den Betrieb der Webseite erforderlich sind. Diese dienen dazu, Ihre Sitzung zu verwalten
                und grundlegende Funktionen zu ermöglichen.
              </p>
              <p className="mt-3">
                <strong>Rechtsgrundlage:</strong> Berechtigte Interessen (Art. 6 Abs. 1 S. 1 lit. f DSGVO).
              </p>
            </section>

            {/* 11. Änderungen */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Änderung und Aktualisierung der Datenschutzerklärung</h2>
              <p>
                Wir bitten Sie, sich regelmäßig über den Inhalt unserer Datenschutzerklärung zu informieren.
                Wir passen die Datenschutzerklärung an, sobald die Änderungen der von uns durchgeführten Datenverarbeitungen
                dies erforderlich machen. Wir informieren Sie, sobald durch die Änderungen eine Mitwirkungshandlung
                Ihrerseits (z.B. Einwilligung) oder eine sonstige individuelle Benachrichtigung erforderlich wird.
              </p>
            </section>

            {/* Quelle */}
            <section className="pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-400">
                Erstellt mit Hilfe von{" "}
                <a href="https://www.e-recht24.de" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  e-recht24.de
                </a>
              </p>
            </section>

          </div>
        </div>
      </div>
    </Layout>
  );
}
