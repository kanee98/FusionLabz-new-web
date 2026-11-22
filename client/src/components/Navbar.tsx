import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

const NAV_LINKS = [
  { label: 'Work', path: '/portfolio' },
  { label: 'Careers', path: '/careers' },
  { label: 'Contact', path: '/contact' },
];

export function Navbar({ openJobsCount = 0 }: { openJobsCount?: number }) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-[#09152B]/[0.08] bg-white/85 shadow-[0_4px_24px_-12px_rgba(9,21,43,0.12)] backdrop-blur-xl'
            : 'border-b border-transparent bg-white/45 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6 sm:h-[84px] lg:px-8">
          <Link to="/" className="flex items-center py-1">
            <BrandLogo variant="light-bg" className="h-12 sm:h-14" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary Navigation">
            <Link
              to="/"
              className={`text-[14px] font-medium transition-colors ${
                location.pathname === '/'
                  ? 'text-[#0052FF]'
                  : 'text-[#334155] hover:text-[#09152B]'
              }`}
            >
              Overview
            </Link>
            {NAV_LINKS.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-1.5 text-[14px] font-medium transition-colors ${
                    active ? 'text-[#0052FF]' : 'text-[#334155] hover:text-[#09152B]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.path === '/careers' && openJobsCount > 0 && (
                    <span className="rounded-full bg-[#E6F1FE] px-2 py-0.5 text-[11px] font-semibold text-[#0052FF]">
                      {openJobsCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/contact"
              className="hidden items-center gap-1.5 rounded-full bg-[#0052FF] px-5 py-2.5 text-[13.5px] font-medium text-white shadow-[0_8px_20px_-6px_rgba(0,82,255,0.45)] transition-all duration-200 hover:bg-[#0040CC] sm:inline-flex"
            >
              <span>Start a project</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle Menu"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#09152B]/12 bg-white text-[#09152B] md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Clean Light Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-white px-6 pt-28 pb-10 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex flex-col divide-y divide-slate-200/80">
          {[{ label: 'Overview', path: '/' }, ...NAV_LINKS].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between py-5 font-display text-2xl font-medium tracking-tight text-[#09152B]"
            >
              <span>{item.label}</span>
              <ArrowUpRight className="h-5 w-5 text-[#0052FF]" />
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-[#0052FF] px-5 py-2.5 text-sm font-medium text-white"
          >
            Start a project
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link to="/admin" className="text-xs font-medium text-slate-500 hover:text-[#0052FF]">
            Admin Portal
          </Link>
        </div>
      </div>
    </>
  );
}
