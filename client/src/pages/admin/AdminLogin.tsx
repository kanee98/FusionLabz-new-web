import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { adminApi } from '../../lib/api';
import type { AdminUser } from '../../types';

export function AdminLogin({ onSuccess }: { onSuccess: (admin: AdminUser) => void }) {
  const [email, setEmail] = useState('admin@fusionlabz.lk');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminApi.login(email, password);
      onSuccess(res.admin);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-[#EEF5FF] via-[#F8FBFF] to-[#E0F2FE] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-[#DCE8FA] bg-white p-8 shadow-[0_24px_60px_-20px_rgba(0,82,255,0.16)]">
        <div className="flex flex-col items-center text-center">
          <BrandLogo variant="light-bg" className="h-14" />
          <h1 className="mt-6 font-display text-xl font-semibold tracking-tight text-[#09152B]">
            Sign in to Admin
          </h1>
          <p className="mt-1.5 text-xs text-[#52627A]">
            Manage portfolio projects, clients, jobs, applications, and inquiries.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#334155]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] px-3.5 py-2.5 text-sm text-[#09152B]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#334155]">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-slate-200 bg-[#F8FBFF] py-2.5 pr-10 pl-3.5 text-sm text-[#09152B] placeholder-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-[#0052FF]"
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-[#0052FF] py-2.5 text-sm font-medium text-white shadow-[0_8px_20px_-6px_rgba(0,82,255,0.45)] transition-colors hover:bg-[#0040CC] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-5 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#52627A] hover:text-[#0052FF]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to website
          </Link>
        </div>
      </div>
    </div>
  );
}
