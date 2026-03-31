import { Layout } from "@/components/layout/Layout";
import { Scale } from "lucide-react";

export function ImpressumPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#b8960c] flex items-center justify-center shadow-lg">
              <Scale className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
              <p className="text-gray-500 text-sm mt-1">Angaben gemäß § 5 DDG</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-10 text-gray-700 leading-relaxed">

            {/* Anbieter */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Angaben zum Anbieter</h2>
              <p>
                Julian Karges<br />
                Beratungsdienstleistungen im Bereich Finanzdienstleistungen<br />
                Selbstständiger Handelsvertreter gemäß § 84 HGB
              </p>
              <p className="mt-3">
                Darmstädter Landstraße 110<br />
                60598 Frankfurt am Main<br />
                Deutschland
              </p>
            </section>

            {/* Kontakt */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Kontakt</h2>
              <p>
                <strong>Telefon:</strong> +49 1512 1653 941<br />
                <strong>E-Mail:</strong> juliankarges03@icloud.com
              </p>
            </section>

            {/* Aufsichtsbehörde */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Aufsichtsbehörde</h2>
              <p>
                IHK Frankfurt am Main<br />
                Börsenplatz 4, 60313 Frankfurt am Main
              </p>
              <p className="mt-3">
                <a href="http://www.frankfurt-main.ihk.de/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  www.frankfurt-main.ihk.de
                </a>
              </p>
            </section>

            {/* Redaktionell verantwortlich */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Redaktionell verantwortlich</h2>
              <p>Julian Karges</p>
            </section>

            {/* EU-Streitschlichtung */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">EU-Streitschlichtung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{" "}
                <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[#d4af37] hover:underline">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p className="mt-3">
                Unsere E-Mail-Adresse finden Sie oben im Impressum.
              </p>
            </section>

            {/* Verbraucherstreitbeilegung */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h2>
              <p>
                Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>

            {/* DSA */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Zentrale Kontaktstelle nach dem Digital Services Act – DSA (Verordnung (EU) 2022/265)</h2>
              <p>
                Unsere zentrale Kontaktstelle für Nutzer und Behörden nach Art. 11, 12 DSA erreichen Sie wie folgt:
              </p>
              <p className="mt-3">
                <strong>E-Mail:</strong> juliankarges03@icloud.com<br />
                <strong>Telefon:</strong> +49 1512 1653 941
              </p>
              <p className="mt-3">
                Die für den Kontakt zur Verfügung stehenden Sprachen sind: Deutsch, Englisch.
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
