import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

// 4 Feature Kacheln für "Über mich" Section
const aboutFeatures = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Spezialisiert auf Mediziner",
    description: "Maßgeschneiderte Finanzlösungen für Ärzte, Zahnärzte und Klinikpersonal.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    title: "Versorgungswerk & Praxis",
    description: "Expertise in berufsständischer Versorgung und Praxisfinanzierung.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
    title: "Unabhängige Beratung",
    description: "Honorarbasiert und frei von Produktvorgaben – Ihre Interessen zählen.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Transparente Analysen",
    description: "Verständliche Rechner und Visualisierungen für fundierte Entscheidungen.",
  },
];

const calculators = [
  {
    title: "Cashflow-Analyse",
    description: "Analysieren Sie Ihre monatlichen Einnahmen und Ausgaben.",
    path: "/cashflow-analyse",
    gradient: "from-emerald-500 to-teal-600",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    title: "Rentenlückenrechner",
    description: "Berechnen Sie Ihre Versorgungslücke und die notwendige Sparrate.",
    path: "/rentenrechner",
    gradient: "from-blue-500 to-indigo-600",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    title: "Depot vs. Police",
    description: "Vergleichen Sie die Rendite von Depot-Anlagen und Versicherungen.",
    path: "/depot-versus-police",
    gradient: "from-violet-500 to-purple-600",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    title: "Rürup Steuervorteil",
    description: "Berechnen Sie den Steuervorteil Ihrer Rürup-Rente.",
    path: "/ruerup-steuervorteil",
    gradient: "from-amber-500 to-orange-600",
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const checkmarks = [
  "Kostenlose Erstberatung",
  "Unabhängig und transparent",
  "Spezialisiert auf Mediziner",
];

export function HomePage() {
  return (
    <Layout subtitle="Übersicht & Rechner" transparentHeader>
      {/* ============ HERO SECTION ============ */}
      {/* Desktop: 70-75vh, Mobile: bleibt groß für Above-the-fold Impact */}
      <section className="relative min-h-[85vh] lg:min-h-[72vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
          }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 via-gray-900/75 to-gray-900/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="animate-fade-in-up opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-soft" />
                Finanzplanung für Mediziner
              </span>
            </div>

            {/* Headline */}
            <h1 className="animate-fade-in-up opacity-0" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>
              <span className="block text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                Ihre finanzielle Zukunft.
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl font-bold mt-2 leading-tight tracking-tight gradient-text">
                Professionell geplant.
              </span>
            </h1>

            {/* Subtext */}
            <p className="mt-6 lg:mt-8 text-lg sm:text-xl text-white/80 leading-relaxed max-w-2xl animate-fade-in-up opacity-0" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
              Unabhängige Finanzberatung speziell für Ärzte und medizinisches Fachpersonal.
              Nutzen Sie unsere kostenfreien Rechner für Ihre Finanzplanung.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 lg:mt-10 flex flex-col sm:flex-row gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}>
              <Link to="/rentenrechner">
                <button className="group relative w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.03] overflow-hidden">
                  {/* Shiny overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Rentenlücke berechnen
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </Link>
              <Link to="/cashflow-analyse">
                <button className="group w-full sm:w-auto px-8 py-4 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/20 hover:border-white/40 transition-all duration-300 hover:scale-[1.03]">
                  <span className="flex items-center justify-center gap-2">
                    Cashflow analysieren
                    <svg className="w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator - only on larger screens */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden lg:block">
          <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* ============ ÜBER MICH SECTION ============ */}
      {/* Textblock allein + 4 Kompetenz-Kacheln direkt danach */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12 lg:mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Über mich
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Ihr Partner für unabhängige Finanzberatung im Gesundheitswesen
            </p>
          </div>

          {/* Text Block - zentriert, max-width für Lesbarkeit */}
          <div className="max-w-[820px] mx-auto mb-14 lg:mb-16">
            <div className="prose prose-lg prose-gray max-w-none text-center lg:text-left">
              <p className="text-gray-600 leading-relaxed text-lg">
                Als unabhängiger Finanzberater habe ich mich auf die besonderen Bedürfnisse von Medizinern spezialisiert.
                Mit über 10 Jahren Erfahrung in der Finanzbranche und einem tiefen Verständnis für die Strukturen des
                Gesundheitswesens biete ich maßgeschneiderte Lösungen.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg mt-5">
                Ob Versorgungswerk, Praxisgründung oder Vermögensaufbau – ich begleite Sie durch alle Phasen Ihrer
                beruflichen und privaten Finanzplanung. Meine Beratung basiert auf Honorarbasis, sodass Ihre Interessen
                stets im Mittelpunkt stehen.
              </p>
              <p className="text-gray-600 leading-relaxed text-lg mt-5">
                Die interaktiven Rechner auf dieser Seite ermöglichen Ihnen einen ersten Einblick in Ihre finanzielle
                Situation. Für eine detaillierte Analyse und individuelle Beratung stehe ich Ihnen gerne zur Verfügung.
              </p>
            </div>
          </div>

          {/* 4 Feature Cards - Desktop 4 Spalten, Tablet 2x2, Mobile Stack */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
            {aboutFeatures.map((feature, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl border border-gray-100 shadow-premium p-6 card-hover hover:shadow-premium-hover transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ RECHNER SECTION - Direkt nach Kompetenz-Kacheln ============ */}
      {/* Reduziertes Spacing, nahtloser Übergang */}
      <section className="py-14 lg:py-18 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - kompakt */}
          <div className="text-center mb-10 lg:mb-12">
            <span className="inline-block px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold mb-4">
              Interaktive Tools
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
              Rechner im Überblick
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Nutzen Sie unsere interaktiven Tools für Ihre persönliche Finanzplanung
            </p>
          </div>

          {/* Calculator Cards Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {calculators.map((calc, index) => (
              <Link
                key={index}
                to={calc.disabled ? "#" : calc.path}
                className={calc.disabled ? "cursor-not-allowed" : ""}
              >
                <div
                  className={`group relative h-full bg-white rounded-2xl border border-gray-100 p-6 overflow-hidden transition-all duration-500 ${calc.disabled
                      ? "opacity-60"
                      : "shadow-premium hover:shadow-premium-hover card-hover"
                    }`}
                >
                  {/* Gradient overlay on hover */}
                  {!calc.disabled && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${calc.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                  )}

                  <div className="relative">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${calc.gradient} flex items-center justify-center text-white mb-5 shadow-lg ${!calc.disabled && 'group-hover:scale-110'} transition-transform duration-300`}>
                      {calc.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{calc.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{calc.description}</p>

                    {!calc.disabled ? (
                      <div className="mt-5 flex items-center text-emerald-600 text-sm font-semibold group-hover:text-emerald-700">
                        Zum Rechner
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    ) : (
                      <span className="inline-block mt-5 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                        Demnächst
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============ COMBINED VIDEO + CTA SECTION - Desktop Only ============ */}
      {/* Video Card etwas größer für mehr visuelle Priorität */}
      <section className="hidden lg:block py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 items-center">
            {/* Video Card - Links (3 von 5 Spalten für mehr Präsenz) */}
            <div className="lg:col-span-3 relative">
              <div className="absolute -inset-6 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-3xl blur-3xl opacity-40" />
              <div className="relative bg-white rounded-3xl border border-gray-100 shadow-premium-lg overflow-hidden">
                {/* Video Header */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                    <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Kurzvideo
                  </span>
                </div>
                {/* Video Player Area - etwas größer */}
                <div className="aspect-[16/10] bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <button className="group relative">
                    <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </button>
                </div>
                <div className="px-6 py-5 bg-gray-50/50">
                  <p className="text-gray-700 text-base text-center font-medium">Erfahre mehr über meine Beratung</p>
                </div>
              </div>
            </div>

            {/* CTA Content - Rechts (2 von 5 Spalten) */}
            <div className="lg:col-span-2">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Persönliche Beratung
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                Lassen Sie uns über Ihre Finanzen sprechen
              </h2>

              <p className="mt-6 text-lg text-gray-600 leading-relaxed">
                Die Rechner geben Ihnen einen ersten Überblick. Für eine umfassende Analyse und
                individuelle Strategieentwicklung vereinbaren Sie ein unverbindliches Erstgespräch.
              </p>

              {/* Checkmarks */}
              <ul className="mt-8 space-y-4">
                {checkmarks.map((item, i) => (
                  <li key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <div className="mt-10">
                <button className="group relative px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all duration-300 hover:scale-[1.03] overflow-hidden">
                  {/* Shiny overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative z-10 flex items-center gap-3 text-lg">
                    Jetzt beraten lassen
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ MOBILE VIDEO + CTA SECTION - Mobile Only ============ */}
      {/* Echter vertikaler Video Player (9:16) statt Mini-Button */}
      <section className="lg:hidden py-16 bg-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Persönliche Beratung
            </span>
          </div>

          {/* Vertikaler Video Player Card (9:16) */}
          <div className="relative mb-10">
            <div className="absolute -inset-4 bg-gradient-to-b from-emerald-500/20 to-teal-500/20 rounded-3xl blur-2xl opacity-40" />
            <div className="relative bg-white rounded-3xl border border-gray-100 shadow-premium-lg overflow-hidden">
              {/* Video Header */}
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-600">
                  <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Kurzvideo
                </span>
              </div>

              {/* Video Player Area - 9:16 Portrait Format */}
              <div className="aspect-[9/16] bg-gradient-to-br from-gray-100 via-gray-150 to-gray-200 flex items-center justify-center relative">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5" style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                }} />

                {/* Play Button */}
                <button className="group relative z-10">
                  <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-2xl group-active:scale-95 transition-transform duration-200">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </button>
              </div>

              <div className="px-5 py-4 bg-gray-50/50">
                <p className="text-gray-700 text-sm text-center font-medium">Erfahre mehr über meine Beratung</p>
              </div>
            </div>
          </div>

          {/* CTA Content */}
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight leading-tight">
              Lassen Sie uns über Ihre Finanzen sprechen
            </h2>

            <p className="mt-4 text-gray-600 leading-relaxed">
              Die Rechner geben Ihnen einen ersten Überblick. Für eine umfassende Analyse und
              individuelle Strategieentwicklung vereinbaren Sie ein unverbindliches Erstgespräch.
            </p>

            {/* Checkmarks - compact for mobile */}
            <ul className="mt-6 space-y-3 inline-flex flex-col items-start text-left">
              {checkmarks.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-gray-700 text-sm font-medium">{item}</span>
                </li>
              ))}
            </ul>

            {/* CTA Button */}
            <div className="mt-8">
              <button className="group relative w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-[0.98] transition-all duration-200 overflow-hidden">
                {/* Shiny overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Jetzt beraten lassen
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
