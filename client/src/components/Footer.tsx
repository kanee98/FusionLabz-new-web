import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { SiteSettings } from '../types';

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 overflow-hidden bg-gradient-to-b from-[#07183B] via-[#06132E] to-[#040D21] text-[#9BB0D3]">
      {/* Subtle luminous blue atmospheric glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-[#0077FF]/20 blur-[120px]"
      />

      {/* Executive CTA */}
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold tracking-wide text-[#38BDF8]">
              Ready when you are
            </div>
            <h2 className="mt-3 font-display text-3xl leading-[1.08] font-medium tracking-[-0.035em] text-white sm:text-5xl">
              Have a product in mind?
              <br />
              <span className="text-[#8EB6F8]">Let’s build it properly.</span>
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#00B8F4] px-6 py-3 text-sm font-semibold text-[#041129] shadow-[0_12px_30px_-8px_rgba(0,184,244,0.45)] transition-colors hover:bg-white"
            >
              <span>Get in touch</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:${settings?.email || 'hello@fusionlabz.lk'}`}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-colors hover:border-white/35"
            >
              {settings?.email || 'hello@fusionlabz.lk'}
            </a>
          </div>
        </div>
      </div>

      {/* Directory */}
      <div className="relative border-t border-white/[0.09]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 sm:grid-cols-2 md:grid-cols-12 lg:px-8">
          <div className="space-y-4 md:col-span-5">
            <BrandLogo variant="dark-bg" className="h-12 sm:h-14" />
            <p className="max-w-xs text-[13.5px] leading-relaxed text-[#9BB0D3]">
              Software engineering, product design, and cloud infrastructure built in Colombo for
              teams worldwide.
            </p>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="text-xs font-semibold text-white">Company</div>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <Link to="/" className="transition-colors hover:text-white">
                  Overview
                </Link>
              </li>
              <li>
                <Link to="/portfolio" className="transition-colors hover:text-white">
                  Work
                </Link>
              </li>
              <li>
                <Link to="/careers" className="transition-colors hover:text-white">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-white">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3 md:col-span-3">
            <div className="text-xs font-semibold text-white">Office</div>
            <p className="text-[13.5px] leading-relaxed">
              {settings?.address || 'Level 08, Orion City IT Park, Colombo 09, Sri Lanka'}
            </p>
            <p className="text-[13.5px] text-white/85">{settings?.phone || '+94 77 450 8890'}</p>
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="text-xs font-semibold text-white">Connect</div>
            <ul className="space-y-2.5 text-[13.5px]">
              {settings?.linkedin && (
                <li>
                  <a
                    href={settings.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    LinkedIn
                  </a>
                </li>
              )}
              {settings?.github && (
                <li>
                  <a
                    href={settings.github}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    GitHub
                  </a>
                </li>
              )}
              {settings?.x && (
                <li>
                  <a
                    href={settings.x}
                    target="_blank"
                    rel="noreferrer"
                    className="transition-colors hover:text-white"
                  >
                    X
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal */}
      <div className="relative border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-[#7992BD] lg:px-8">
          <span>© {year} {settings?.companyName || 'FusionLabz'}. All rights reserved.</span>
          <Link to="/admin" className="font-medium transition-colors hover:text-white">
            Admin Portal
          </Link>
        </div>
      </div>
    </footer>
  );
}
