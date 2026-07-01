import React, { useState } from 'react';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import axios from 'axios';
import Logo from './Logo';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Email is required.'); return; }
    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Something went wrong. Please try again.');
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
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-slate-400 hover:text-[#4F39F6] text-sm font-bold mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="text-emerald-500" size={32} />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Check your inbox</h2>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                We've sent a password reset link to <span className="font-bold text-slate-700">{email}</span>.
                Check your spam folder if you don't see it.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 w-full h-12 rounded-xl bg-[#4F39F6] text-white font-bold text-sm hover:bg-[#3f2dd1] transition-all"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-black text-slate-900">Forgot password?</h2>
                <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                  Enter the email address associated with your account and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col space-y-1.5 items-start">
                  <label className="text-[13px] font-bold text-slate-800 ml-1">Email Address</label>
                  <div className="relative w-full">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="h-14 w-full rounded-xl border-2 border-transparent pl-12 pr-4 bg-[#F8F6FC] outline-none transition-all font-medium text-slate-900 focus:border-[#4F39F6] focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="h-14 w-full rounded-xl bg-[#4F39F6] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#3f2dd1] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
