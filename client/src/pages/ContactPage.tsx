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
    <div ref={containerRef} className="relative z-10 min-h-screen pt-36 pb-24">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid gap-14 lg:grid-cols-12">
          {/* Left Column */}
          <div className="contact-fade lg:col-span-5">
            <div className="text-xs font-semibold tracking-wide text-[#0052FF]">Contact</div>
            <h1 className="mt-3 font-display text-4xl leading-[1.06] font-semibold tracking-[-0.04em] text-[#09152B] sm:text-5xl">
              Let’s talk about your{' '}
              <span className="bg-gradient-to-r from-[#0052FF] to-[#00B8F4] bg-clip-text text-transparent">
                next build.
              </span>
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[#475569]">
              Share a short overview of what you’re building. Our engineering directors reply within
              one business day with clear next steps.
            </p>

            <div className="mt-10 space-y-5 rounded-2xl border border-[#DCE8FA] bg-white/90 p-7 text-sm shadow-sm backdrop-blur-md">
              <a
                href={`mailto:${settings?.email || 'hello@fusionlabz.lk'}`}
                className="flex items-center gap-3.5 font-medium text-[#09152B] transition-colors hover:text-[#0052FF]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
                  <Mail className="h-4 w-4" />
                </span>
                <span>{settings?.email || 'hello@fusionlabz.lk'}</span>
              </a>

              <a
                href={`tel:${(settings?.phone || '+94774508890').replace(/\s+/g, '')}`}
                className="flex items-center gap-3.5 font-medium text-[#09152B] transition-colors hover:text-[#0052FF]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
                  <Phone className="h-4 w-4" />
                </span>
                <span>{settings?.phone || '+94 77 450 8890'}</span>
              </a>

              <div className="flex items-start gap-3.5 text-[#52627A]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#0052FF]">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="pt-1 leading-relaxed">
                  {settings?.address || 'Level 08, Orion City IT Park, Colombo 09, Sri Lanka'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Elevated Form Card */}
          <div className="contact-fade lg:col-span-7">
            <div className="rounded-2xl border border-[#DCE8FA] bg-white p-6 shadow-[0_24px_60px_-24px_rgba(9,21,43,0.12)] sm:p-10">
              {ticket ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
                  <h2 className="mt-4 font-display text-2xl font-semibold text-[#09152B]">
                    Message received
                  </h2>
                  <p className="mx-auto mt-2 max-w-sm text-sm text-[#52627A]">
                    Thank you for reaching out. Your reference number is{' '}
                    <span className="font-semibold text-[#0052FF]">{ticket}</span>. We’ll be in
                    touch shortly.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTicket('')}
                    className="mt-7 rounded-full border border-[#DCE8FA] px-6 py-2.5 text-sm font-medium text-[#09152B] hover:border-[#0052FF] hover:text-[#0052FF]"
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
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="mb-2.5 block text-xs font-semibold text-[#334155]">
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
                                ? 'bg-[#0052FF] text-white shadow-sm'
                                : 'border border-[#DCE8FA] bg-[#F8FBFF] text-[#475569] hover:border-[#0052FF]/40 hover:text-[#0052FF]'
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
                      <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                        Full name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B] placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                        Work email *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@company.com"
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B] placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                        Company
                      </label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="Company name"
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B] placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+94 77 000 0000"
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B] placeholder-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                        Estimated budget
                      </label>
                      <select
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B]"
                      >
                        {BUDGET_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                        Timeline
                      </label>
                      <select
                        value={timeline}
                        onChange={(e) => setTimeline(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B]"
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
                    <label className="mb-1.5 block text-xs font-medium text-[#334155]">
                      Project details *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us about your goals, timeline, and any technical context..."
                      className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B] placeholder-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-500">NDA available on request</span>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-[#0052FF] px-7 py-3 text-sm font-medium text-white shadow-[0_10px_25px_-8px_rgba(0,82,255,0.5)] transition-colors hover:bg-[#0040CC] disabled:opacity-50"
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
