import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/utils/cn";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  transparentHeader?: boolean;
}

const navLinks = [
  { path: "/", label: "Startseite" },
  { path: "/cashflow-analyse", label: "Cashflow-Analyse" },
  { path: "/rentenrechner", label: "Rentenlückenrechner" },
  { path: "/depot-versus-police", label: "Depot VS Police" },
  { path: "/ruerup-steuervorteil", label: "Rürup Steuervorteil" },
];

export function Layout({ children, title = "Finanzberatung Mediziner", subtitle, transparentHeader = false }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerBg = transparentHeader
    ? scrolled ? "glass border-b border-white/10 shadow-lg" : "bg-transparent"
    : "bg-white border-b border-gray-100 shadow-sm";

  const textColor = transparentHeader && !scrolled ? "text-white" : "text-gray-900";
  const subtitleColor = transparentHeader && !scrolled ? "text-white/70" : "text-gray-500";
  const linkColor = transparentHeader && !scrolled ? "text-white/90 hover:text-white hover:bg-white/10" : "text-gray-600 hover:bg-gray-50";
  const activeLinkColor = transparentHeader && !scrolled ? "bg-white/20 text-white" : "bg-[#059669]/10 text-[#059669]";

  return (
    <div className="min-h-screen bg-[#fafbfc] flex flex-col">
      {/* Premium Sticky Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        headerBg
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18 py-4">
            {/* Logo & Title */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#059669] via-[#10b981] to-[#047857] flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all duration-300 group-hover:scale-105">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className={cn("text-lg font-bold leading-tight transition-colors", textColor)}>{title}</h1>
                {subtitle && <p className={cn("text-xs transition-colors", subtitleColor)}>{subtitle}</p>}
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                    location.pathname === link.path
                      ? activeLinkColor
                      : linkColor
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className={cn(
                "lg:hidden p-2.5 rounded-xl transition-all duration-300",
                transparentHeader && !scrolled ? "hover:bg-white/10 text-white" : "hover:bg-gray-100 text-gray-600"
              )}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={cn(
          "lg:hidden overflow-hidden transition-all duration-300",
          menuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="glass border-t border-gray-100">
            <nav className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300",
                    location.pathname === link.path
                      ? "bg-[#059669]/10 text-[#059669]"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header (only when not transparent) */}
      {!transparentHeader && <div className="h-18 pt-4" />}

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Premium Footer */}
      <footer className="bg-white border-t border-gray-100 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Finanzberatung Mediziner</p>
                <p className="text-xs text-gray-500">© {new Date().getFullYear()} Alle Rechte vorbehalten</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <a href="#" className="text-sm text-gray-500 hover:text-[#059669] transition-colors duration-300">
                Impressum
              </a>
              <a href="#" className="text-sm text-gray-500 hover:text-[#059669] transition-colors duration-300">
                Datenschutz
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
