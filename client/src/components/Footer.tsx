import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import type { SiteSettings } from '../types';

gsap.registerPlugin(ScrollTrigger);

function formatWhatsAppUrl(raw?: string): string {
  const digits = String(raw || '').replace(/[^\d]/g, '');
  return digits.length >= 7 ? `https://wa.me/${digits}` : '';
}

export function Footer({ settings }: { settings: SiteSettings | null }) {
  const footerRef = useRef<HTMLElement>(null);
  const year = new Date().getFullYear();
  const email = settings?.email || 'connect@fusionlabz.lk';
  const address = settings?.address || 'Kandy, Sri Lanka';
  const facebookUrl =
    settings?.facebook || 'https://www.facebook.com/profile.php?id=61589241403873';
  const instagramUrl = settings?.instagram || 'https://www.instagram.com/fusionlabz.lk/';
  const whatsappUrl = formatWhatsAppUrl(settings?.whatsapp || settings?.phone);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.footer-cta-reveal',
        { y: 32, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.85,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 85%',
            once: true,
          },
        }
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  return (
    <footer
      ref={footerRef}
      className="relative z-10 overflow-hidden bg-gradient-to-b from-[#07183B] via-[#06132E] to-[#040D21] text-[#9BB0D3]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-[#0077FF]/20 blur-[120px]"
      />

      {/* Executive CTA */}
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div className="footer-cta-reveal max-w-2xl">
            <div className="text-xs font-semibold tracking-wide text-[#38BDF8]">
              Ready when you are
            </div>
            <h2 className="mt-3 font-display text-3xl leading-[1.08] font-medium tracking-[-0.035em] text-white sm:text-5xl">
              Have a product in mind?
              <br />
              <span className="text-[#8EB6F8]">Let’s build it properly.</span>
            </h2>
          </div>

          <div className="footer-cta-reveal flex flex-wrap items-center gap-4">
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-full bg-[#00B8F4] px-6 py-3 text-sm font-semibold text-[#041129] shadow-[0_12px_30px_-8px_rgba(0,184,244,0.45)] transition-colors hover:bg-white"
            >
              <span>Get in touch</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition-colors hover:border-white/35"
            >
              {email}
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
              Software engineering, AI vision systems, and bespoke web platforms crafted in Kandy,
              Sri Lanka for clients worldwide.
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
            <div className="text-xs font-semibold text-white">Location</div>
            <p className="text-[13.5px] leading-relaxed text-white/90">{address}</p>
            <a
              href={`mailto:${email}`}
              className="block text-[13.5px] text-[#9BB0D3] transition-colors hover:text-white"
            >
              {email}
            </a>
            {settings?.phone && (
              <p className="text-[13.5px] text-white/85">{settings.phone}</p>
            )}
          </div>

          <div className="space-y-3 md:col-span-2">
            <div className="text-xs font-semibold text-white">Connect</div>
            <ul className="space-y-2.5 text-[13.5px]">
              <li>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-white"
                >
                  Facebook <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 transition-colors hover:text-white"
                >
                  Instagram <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              </li>
              <li>
                {whatsappUrl ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 transition-colors hover:text-white"
                  >
                    WhatsApp <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <Link
                    to="/contact"
                    className="inline-flex items-center gap-1 transition-colors hover:text-white"
                  >
                    WhatsApp <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Legal (Zero Admin Links Exposed Publicly) */}
      <div className="relative border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-[#7992BD] lg:px-8">
          <span>
            © {year} {settings?.companyName || 'FusionLabz'}. All rights reserved.
          </span>
          <span>Kandy, Sri Lanka</span>
        </div>
      </div>
    </footer>
  );
}
