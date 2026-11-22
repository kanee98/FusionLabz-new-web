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
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'border-b border-white/[0.07] bg-[#060709]/80 backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6 sm:h-[72px] lg:px-8">
          <Link to="/" className="flex items-center">
            <BrandLogo variant="dark-bg" className="h-7 sm:h-8" />
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary Navigation">
            <Link
              to="/"
              className={`text-[13.5px] font-medium transition-colors ${
                location.pathname === '/' ? 'text-white' : 'text-[#8A909E] hover:text-white'
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
                  className={`inline-flex items-center gap-1.5 text-[13.5px] font-medium transition-colors ${
                    active ? 'text-white' : 'text-[#8A909E] hover:text-white'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.path === '/careers' && openJobsCount > 0 && (
                    <span className="rounded-full bg-white/[0.08] px-1.5 py-0.5 text-[11px] font-medium text-slate-300">
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
              className="hidden items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#060709] transition-all duration-200 hover:bg-[#E6ECF5] sm:inline-flex"
            >
              <span>Start a project</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle Menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 text-white md:hidden"
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Clean Mobile Drawer */}
      <div
        className={`fixed inset-0 z-40 flex flex-col justify-between bg-[#060709] px-6 pt-24 pb-10 transition-opacity duration-300 md:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="flex flex-col divide-y divide-white/[0.08]">
          {[{ label: 'Overview', path: '/' }, ...NAV_LINKS].map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between py-5 font-display text-2xl font-medium tracking-tight text-white"
            >
              <span>{item.label}</span>
              <ArrowUpRight className="h-5 w-5 text-[#8A909E]" />
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] pt-6">
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[#060709]"
          >
            Start a project
            <ArrowUpRight className="h-4 w-4" />
          </Link>
          <Link to="/admin" className="text-xs text-[#8A909E] hover:text-white">
            Admin
          </Link>
        </div>
      </div>
    </>
  );
}
