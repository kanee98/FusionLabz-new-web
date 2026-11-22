import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import type { SiteSettings } from '../types';
import { publicApi } from '../lib/api';

const SERVICE_OPTIONS = [
  'Custom Software',
  'Web & SaaS Platform',
  'Mobile App',
  'E-Commerce',
  'Cloud & DevOps',
  'AI & Data',
  'Product Redesign',
];

const BUDGET_OPTIONS = ['< $10K', '$10K – $25K', '$25K – $50K', '$50K+', 'Retainer'];

const TIMELINE_OPTIONS = ['< 1 Month', '1 – 3 Months', '3 – 6 Months', 'Flexible'];

export function ContactPage({ settings }: { settings: SiteSettings | null }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [services, setServices] = useState<string[]>(['Web & SaaS Platform']);
  const [budget, setBudget] = useState('$10K – $25K');
  const [timeline, setTimeline] = useState('1 – 3 Months');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState('');

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.contact-fade',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power3.out' }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const toggleService = (srv: string) => {
    setServices((prev) =>
      prev.includes(srv) ? prev.filter((item) => item !== srv) : [...prev, srv]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await publicApi.submitContact({
        fullName,
        email,
        company,
        phone,
        services,
        budget,
        timeline,
        message,
        website: honeypot,
      });
      setTicket(res.ticketId);
      setFullName('');
      setEmail('');
      setCompany('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative z-10 min-h-screen pt-32 pb-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-12">
          {/* Left Column: Clean Direct Contact */}
          <div className="contact-fade lg:col-span-5">
            <div className="text-xs font-medium tracking-wide text-[#00B8F4]">Contact</div>
            <h1 className="mt-3 font-display text-4xl leading-[1.06] font-medium tracking-[-0.04em] text-white sm:text-5xl">
              Let’s talk about your next build.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#8A909E]">
              Share a short overview of what you’re building. Our engineering directors reply within
              one business day with clear next steps.
            </p>

            <div className="mt-12 space-y-6 border-t border-white/[0.08] pt-8 text-sm">
              <a
                href={`mailto:${settings?.email || 'hello@fusionlabz.lk'}`}
                className="flex items-center gap-3.5 text-[#C4CAD4] transition-colors hover:text-white"
              >
                <Mail className="h-4 w-4 text-[#00B8F4]" />
                <span>{settings?.email || 'hello@fusionlabz.lk'}</span>
              </a>

              <a
                href={`tel:${(settings?.phone || '+94774508890').replace(/\s+/g, '')}`}
                className="flex items-center gap-3.5 text-[#C4CAD4] transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 text-[#00B8F4]" />
                <span>{settings?.phone || '+94 77 450 8890'}</span>
              </a>

              <div className="flex items-start gap-3.5 text-[#8A909E]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#00B8F4]" />
                <span>{settings?.address || 'Level 08, Orion City IT Park, Colombo 09, Sri Lanka'}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Project Brief Form */}
          <div className="contact-fade lg:col-span-7">
            <div className="rounded-2xl border border-white/[0.09] bg-[#0B0D12]/90 p-6 backdrop-blur-xl sm:p-10">
              {ticket ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                  <h2 className="mt-4 font-display text-2xl font-medium text-white">
                    Message received
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#8A909E]">
                    Thank you for reaching out. Your reference number is{' '}
                    <span className="font-medium text-white">{ticket}</span>. We’ll be in touch
                    shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTicket('')}
                    className="mt-7 rounded-full border border-white/15 px-6 py-2.5 text-sm font-medium text-white hover:border-white/35"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <input
                    type="text"
                    name="website"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                    className="hidden"
                  />

                  {error && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-2.5 block text-xs font-medium text-[#A3AAB8]">
                      How can we help?
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICE_OPTIONS.map((srv) => {
                        const selected = services.includes(srv);
                        return (
                          <button
                            key={srv}
                            type="button"
                            onClick={() => toggleService(srv)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                              selected
                                ? 'bg-white text-[#060709]'
                                : 'border border-white/10 text-[#8A909E] hover:border-white/25 hover:text-white'
                            }`}
                          >
                            {srv}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                        Full name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                        Work email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                        Company
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 77 000 0000"
                        className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                        Estimated budget
                      </label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
                      >
                        {BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                        Timeline
                      </label>
                      <select
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
                      >
                        {TIMELINE_OPTIONS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">
                      Project details *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your goals, timeline, and any technical context..."
                      className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white placeholder-[#525866]"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-[#6B7280]">NDA available on request</span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-white px-7 py-3 text-sm font-medium text-[#060709] transition-colors hover:bg-[#E6ECF5] disabled:opacity-50"
                    >
                      {submitting ? 'Sending...' : 'Send message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
