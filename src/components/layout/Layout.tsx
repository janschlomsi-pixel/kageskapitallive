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
];

export function Layout({ children, title = "Karges Kapital", subtitle, transparentHeader = false }: LayoutProps) {
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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const headerBg = transparentHeader
    ? scrolled ? "glass border-b border-white/10 shadow-lg" : "bg-transparent"
    : "bg-white border-b border-gray-100 shadow-sm";

  const textColor = transparentHeader && !scrolled ? "text-white" : "text-gray-900";
  const subtitleColor = transparentHeader && !scrolled ? "text-white/70" : "text-gray-500";
  const linkColor = transparentHeader && !scrolled ? "text-white/90 hover:text-white hover:bg-white/10" : "text-gray-600 hover:bg-gray-50";
  const activeLinkColor = transparentHeader && !scrolled ? "bg-white/20 text-white" : "bg-[#d4af37]/10 text-[#d4af37]";

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
              <img src="/images/karges-kapital-logo.png" alt="Karges Kapital Logo" className="w-11 h-11 rounded-2xl object-cover shadow-lg transition-all duration-300 group-hover:scale-105" />
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
                      ? "bg-[#d4af37]/10 text-[#d4af37]"
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
              <img src="/images/karges-kapital-logo.png" alt="Karges Kapital Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg" />
              <div>
                <p className="text-sm font-medium text-gray-900">Karges Kapital</p>
                <p className="text-xs text-gray-500">© {new Date().getFullYear()} Alle Rechte vorbehalten</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex items-center gap-8">
              <Link to="/impressum" className="text-sm text-gray-500 hover:text-[#d4af37] transition-colors duration-300">
                Impressum
              </Link>
              <Link to="/datenschutz" className="text-sm text-gray-500 hover:text-[#d4af37] transition-colors duration-300">
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
