import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { InstaVideoPlayer } from "@/components/ui/InstaVideoPlayer";

const resources = [
  {
    title: "Kapitalmarkt Update",
    description: "Aktuelle Entwicklungen bequem per WhatsApp",
    url: "https://04c43c09.sibforms.com/serve/MUIFAA1I2i4M7oolsAMyesdpoHC2sAcUD_Yu4nAqL5RrmZ9GGQX-93Q_zKZxn1PmPQvJepK3pWFOiHvVIqSEQdYq0mL8WwZ8GuoK2f1iEKi8j04OsdyaPhQmmPBT1Msv5qvg4HbNOGbWVDNMYaE18g6pG0etZrJ6LVH2c0ZPm710vkCTA6XmUbQXMd5t5d-x4UhBlyvOvITVnjwa",
    icon: (
      <img src="/images/kapitalmarkt-update.jpg" alt="Kapitalmarkt Update" loading="lazy" className="w-full h-full object-cover rounded-xl" />
    )
  },
  {
    title: "Limitless Shop",
    description: "Mein Onlineshop für exklusive Produkte",
    url: "https://limitless-shop.de",
    icon: (
      <img src="/images/limitless-shop.jpg" alt="Limitless Shop" loading="lazy" className="w-full h-full object-cover rounded-xl" />
    )
  },
  {
    title: "Webinar",
    description: "Kostenloses Immobilien & Finanz-Webinar",
    url: "https://04c43c09.sibforms.com/serve/MUIFAEPwYqM3SiZe7OSseEj5TQnkhYLg59E7S4FNBktlasVG2n2nt3OZmMglcBMZD4lWCjk_Zrqq-BBqQM7u-B6d8Ghn4_X0Y6y66r_XLT3ko5MNMqzTe3SJATSM_gYKa9eIs-CrEo_huEKiM3wTj4bhwzpMP-jTBCATOCc56Vty85N5wFh6ClGf4OYCg5nma3xarYikvaepldUF",
    icon: (
      <img src="/images/webinar.jpg" alt="Webinar" loading="lazy" className="w-full h-full object-cover rounded-xl" />
    )
  },
  {
    title: "Teil des Teams werden",
    description: "Bewirb dich jetzt für mein Team",
    url: "https://survey.forms.app/andrew16/bewerbung",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  }
];

const calculators = [
  {
    title: "Cashflow-Analyse",
    description: "Analysiere deine monatlichen Einnahmen und Ausgaben.",
    path: "/cashflow-analyse",
    gradient: "from-[#d4af37] to-yellow-600",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
  },
  {
    title: "Rentenlückenrechner",
    description: "Berechne deine Versorgungslücke und die notwendige Sparrate.",
    path: "/rentenrechner",
    gradient: "from-[#0f172a] to-slate-800",
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="4" y="2" width="16" height="20" rx="2" strokeWidth={1.5} />
        <rect x="7" y="4" width="10" height="4" rx="1" strokeWidth={1.5} />
        <circle cx="8.5" cy="11" r="1" fill="currentColor" />
        <circle cx="12" cy="11" r="1" fill="currentColor" />
        <circle cx="15.5" cy="11" r="1" fill="currentColor" />
        <circle cx="8.5" cy="14.5" r="1" fill="currentColor" />
        <circle cx="12" cy="14.5" r="1" fill="currentColor" />
        <circle cx="15.5" cy="14.5" r="1" fill="currentColor" />
        <circle cx="8.5" cy="18" r="1" fill="currentColor" />
        <rect x="11" y="17" width="5.5" height="2" rx="0.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Depot vs. Police",
    description: "Vergleiche die Rendite von Depot-Anlagen und Versicherungen.",
    path: "/depot-versus-police",
    gradient: "from-blue-900 to-[#0f172a]",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  }
];

export function HomePage() {
  return (
    <Layout transparentHeader>
      {/* ============ STARTSEITE / HERO SECTION ============ */}
      <section className="relative min-h-0 lg:min-h-[80vh] flex items-center overflow-hidden bg-[#0f172a]">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-[#d4af37] rounded-full blur-[120px] opacity-10" />
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-blue-500 rounded-full blur-[120px] opacity-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column: Text & CTA */}
            <div className="max-w-2xl">
              <h1 className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                <span className="block text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                  Wohlstand und Freiheit sind <span className="text-[#d4af37]">kein Privileg.</span>
                </span>
              </h1>

              <div className="mt-8 flex flex-wrap gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
                <a href="#links" className="px-8 py-4 bg-[#d4af37] text-[#0f172a] font-bold rounded-lg shadow-lg hover:bg-yellow-500 transition-all hover:scale-105">
                  Alle Links
                </a>
                <a href="#rechner" className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-all hover:scale-105 backdrop-blur-sm">
                  Rechner starten
                </a>
              </div>

              {/* Social Icons */}
              <div className="mt-8 flex gap-6 items-center animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
                <a href="https://www.tiktok.com/@kargeskapital?_r=1&_t=ZG-94n6HYCmo0P" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-[#d4af37] transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 15.68a6.34 6.34 0 0012.67-1.55V8.15a8.32 8.32 0 004.77 1.52v-3.4a4.85 4.85 0 01-2.85-.58z"/></svg>
                </a>
                <a href="https://www.instagram.com/kargeskapital?igsh=YzQyMGpsOHhuOTRv" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-[#d4af37] transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.20 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zM18.406 5.594a1.44 1.44 0 11-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
                </a>
                <a href="https://x.com/julikarges/highlights" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-[#d4af37] transition-all">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>
                </a>
                <a href="https://www.linkedin.com/in/julian-karges-6b750b306/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 hover:text-[#d4af37] transition-all">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Right Column: Photo */}
            <div className="hidden lg:flex relative -mr-10 h-[600px] items-end justify-center animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <img
                src="/images/julian-karges.jpg"
                alt="Julian Karges"
                className="h-full w-auto object-contain drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ============ VIDEO SECTION ============ */}
      <section className="py-12 lg:py-16 bg-white">
         <div className="max-w-xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#0f172a] mb-8">Erfahre mehr im Video</h2>

            {/* Video Player */}
            <InstaVideoPlayer src="/video-startseite.mp4" />
         </div>
      </section>

      {/* ============ ÜBER MICH & LINKS (Ressourcen) ============ */}
      <section id="links" className="py-12 lg:py-16 bg-gray-50 border-t border-gray-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Links / Resources Grid */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#0f172a]">Meine Ressourcen & Links</h2>
            <p className="mt-4 text-gray-600">Hier findest du alle meine Links - von meinem persönlichen Newsletter bis zu meinem Shop und auch meine Live-Events</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
             {resources.map((link, idx) => (
                <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer"
                   className="group bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-start gap-4">
                   <div className="w-12 h-12 bg-[#0f172a] rounded-xl flex items-center justify-center text-[#d4af37] shrink-0 group-hover:scale-110 transition-transform">
                      {link.icon}
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#d4af37] transition-colors">{link.title}</h3>
                      <p className="text-gray-500 text-sm mt-1">{link.description}</p>
                   </div>
                </a>
             ))}
          </div>
        </div>
      </section>

      {/* ============ RECHNER SECTION ============ */}
      <section id="rechner" className="py-12 lg:py-16 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-[#d4af37]/10 text-[#0f172a] text-sm font-semibold mb-4">
              Kostenlose Tools
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0f172a] tracking-tight">
              Meine Rechner
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Nutze die Rechner für deine persönliche Finanzplanung
            </p>
          </div>

          <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {calculators.map((calc, index) => (
              <Link
                key={index}
                to={calc.path}
                className="group block"
              >
                <div className="bg-white rounded-2xl border border-gray-100 p-8 h-full shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${calc.gradient} opacity-5 rounded-bl-full group-hover:opacity-10 transition-opacity`} />

                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${calc.gradient} flex items-center justify-center text-white mb-6 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {calc.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{calc.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6">{calc.description}</p>

                  <div className="mt-auto flex items-center text-[#d4af37] text-sm font-semibold group-hover:text-yellow-600">
                    Zum Rechner
                    <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </Layout>
  );
}
