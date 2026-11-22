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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#060709] p-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/[0.09] bg-[#0B0D12] p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center">
          <BrandLogo variant="dark-bg" className="h-8" />
          <h1 className="mt-6 font-display text-xl font-medium tracking-tight text-white">
            Sign in to Admin
          </h1>
          <p className="mt-1.5 text-xs text-[#8A909E]">
            Manage portfolio projects, clients, jobs, applications, and inquiries.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#060709] px-3.5 py-2.5 text-sm text-white"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#A3AAB8]">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-white/10 bg-[#060709] py-2.5 pr-10 pl-3.5 text-sm text-white placeholder-[#525866]"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#6B7280] hover:text-white"
                aria-label="Toggle password"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-white py-2.5 text-sm font-medium text-[#060709] transition-colors hover:bg-[#E6ECF5] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-white/[0.07] pt-5 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-[#8A909E] hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to website
          </Link>
        </div>
      </div>
    </div>
  );
}
