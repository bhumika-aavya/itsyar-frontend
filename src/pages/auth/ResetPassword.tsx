import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/axios';
import axios from 'axios';
import Logo from './Logo';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (!token) { setError('Invalid or missing reset token. Please request a new link.'); return; }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/reset-password', { token, new_password: password, confirm_new_password: confirm });
      setDone(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Reset failed. The link may have expired.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6FC] flex items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="mb-8"><Logo /></div>

        <div className="w-full rounded-[32px] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/40">
          {done ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Password updated!</h2>
              <p className="text-sm font-medium text-slate-500">Your password has been reset successfully.</p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full h-12 rounded-xl bg-[#4F39F6] text-white font-bold text-sm hover:bg-[#3f2dd1] transition-all"
              >
                Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900">Set new password</h2>
                <p className="text-sm font-medium text-slate-500 mt-2">Choose a strong password for your account.</p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
                  {error}
                </div>
              )}

              {!token && (
                <div className="mb-6 p-3 bg-orange-50 text-orange-600 rounded-xl text-sm text-center font-bold border border-orange-100">
                  Invalid reset link. Please request a new one.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col space-y-1.5 items-start">
                  <label className="text-[13px] font-bold text-slate-800 ml-1">New Password</label>
                  <div className="relative w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="h-14 w-full rounded-xl border-2 border-transparent pl-12 pr-12 bg-[#F8F6FC] outline-none transition-all font-medium text-slate-900 focus:border-[#4F39F6] focus:bg-white"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5 items-start">
                  <label className="text-[13px] font-bold text-slate-800 ml-1">Confirm Password</label>
                  <div className="relative w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat your password"
                      className="h-14 w-full rounded-xl border-2 border-transparent pl-12 pr-12 bg-[#F8F6FC] outline-none transition-all font-medium text-slate-900 focus:border-[#4F39F6] focus:bg-white"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !token}
                  className="h-14 w-full rounded-xl bg-[#4F39F6] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#3f2dd1] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Reset Password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
