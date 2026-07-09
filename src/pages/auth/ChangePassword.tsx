import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { getAuthHeaders } from '@/services/auth';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) { setError('Current password is required.'); return; }
    if (newPassword.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }

    setIsLoading(true);
    setError('');
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmPassword,
      }, getAuthHeaders());
      setDone(true);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to change password. Please check your current password.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-12 px-6 text-left">
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 text-slate-400 hover:text-[#4F39F6] text-sm font-bold mb-8 transition-colors"
      >
        <ChevronLeft size={16} /> Back to Profile
      </button>

      <div className="bg-white border border-slate-100 rounded-[32px] p-10 shadow-sm">
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-emerald-500" size={32} />
            </div>
            <h2 className="text-2xl font-black text-slate-900">Password changed!</h2>
            <p className="text-sm font-medium text-slate-500">Your password has been updated successfully.</p>
            <button
              onClick={() => navigate('/profile')}
              className="mt-4 w-full h-12 rounded-xl bg-[#4F39F6] text-white font-bold text-sm hover:bg-[#3f2dd1] transition-all"
            >
              Back to Profile
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Change Password</h2>
            <p className="text-sm font-medium text-slate-500 mb-8">Update your account password below.</p>

            {error && (
              <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {[
                { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword, show: showCurrent, setShow: setShowCurrent },
                { label: 'New Password', value: newPassword, onChange: setNewPassword, show: showNew, setShow: setShowNew },
                { label: 'Confirm New Password', value: confirmPassword, onChange: setConfirmPassword, show: showConfirm, setShow: setShowConfirm },
              ].map(({ label, value, onChange, show, setShow }) => (
                <div key={label} className="flex flex-col space-y-1.5 items-start">
                  <label className="text-[13px] font-bold text-slate-800 ml-1">{label}</label>
                  <div className="relative w-full">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                      placeholder="••••••••"
                      className="h-14 w-full rounded-xl border-2 border-transparent pl-12 pr-12 bg-[#F8F6FC] outline-none transition-all font-medium text-slate-900 focus:border-[#4F39F6] focus:bg-white"
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-xl bg-[#4F39F6] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#3f2dd1] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100 mt-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
