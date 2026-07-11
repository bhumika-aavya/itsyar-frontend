import React, { useState, useEffect } from 'react';
import { X, Trash2, Loader2, CheckCircle2, ChevronDown, AlertCircle } from 'lucide-react';
import { TeamService, HackathonOption } from '@/services/team.service';
import { HackathonService } from '@/services/hackathon.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onTeamCreated: () => void;
}

export default function CreateTeamModal({ isOpen, onClose, onTeamCreated }: Props) {
  const [hackathons, setHackathons] = useState<HackathonOption[]>([]);
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDesc, setTeamDesc] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      TeamService.getHackathonOptions().then(setHackathons);
      setSelectedHackathonId('');
      setTeamName('');
      setTeamDesc('');
      setInviteEmails([]);
      setInviteInput('');
      setErrors({});
      setSuccess(false);
      setApiError('');
    }
  }, [isOpen]);

  const handleAddInvite = () => {
    const email = inviteInput.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrors((p) => ({ ...p, invite: 'Enter a valid email address' }));
      return;
    }
    if (inviteEmails.includes(email)) {
      setErrors((p) => ({ ...p, invite: 'Email already added' }));
      return;
    }
    if (inviteEmails.length >= 3) {
      setErrors((p) => ({ ...p, invite: 'Maximum 3 additional members' }));
      return;
    }
    setInviteEmails((p) => [...p, email]);
    setInviteInput('');
    setErrors((p) => ({ ...p, invite: '' }));
  };

  const handleSubmit = async () => {
    const errs: Record<string, string> = {};
    if (!selectedHackathonId) errs.hackathon = 'Please select a hackathon';
    if (!teamName.trim() || teamName.length < 2) errs.teamName = 'At least 2 characters required';
    if (!teamDesc.trim() || teamDesc.length < 10) errs.teamDesc = 'At least 10 characters required';
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setApiError('');
    try {
      await HackathonService.createTeam({
        name: teamName,
        description: teamDesc,
        hackathonId: selectedHackathonId,
        inviteEmails,
      });

      // setSuccess(true);
      setTimeout(() => onTeamCreated(), 1200);
    } catch (err: any) {
      console.log('Error creating team:', err);
      setApiError(err?.message || 'Failed to create team. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">

        {success ? (
          <div className="px-7 py-12 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900">Team Created!</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Your team <span className="font-bold text-slate-600">{teamName}</span> is ready for the hackathon.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-7 pt-7 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Create New Team</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">Assemble your squad for a hackathon</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-slate-500 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-7 pb-4 space-y-4 max-h-[420px] overflow-y-auto">
              {/* Hackathon Select */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Select Hackathon <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedHackathonId}
                    onChange={(e) => {
                      setSelectedHackathonId(e.target.value);
                      setErrors((p) => ({ ...p, hackathon: '' }));
                    }}
                    className={`w-full h-12 bg-slate-50 border rounded-xl px-4 pr-10 text-sm font-medium
                      outline-none transition-all appearance-none cursor-pointer
                      ${errors.hackathon ? 'border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                  >
                    <option value="">Choose a hackathon...</option>
                    {hackathons.map((h) => (
                      <option key={h.id} value={h.id}>{h.title}</option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                  />
                </div>
                {errors.hackathon && (
                  <p className="flex items-center gap-1 text-xs font-bold text-red-500 mt-1">
                    <AlertCircle size={11} /> {errors.hackathon}
                  </p>
                )}
              </div>

              {/* Team Name */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={teamName}
                  onChange={(e) => { setTeamName(e.target.value); setErrors((p) => ({ ...p, teamName: '' })); }}
                  placeholder="e.g. Neural Ninjas"
                  className={`w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-medium
                    outline-none transition-all
                    ${errors.teamName ? 'border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                />
                {errors.teamName && (
                  <p className="flex items-center gap-1 text-xs font-bold text-red-500 mt-1">
                    <AlertCircle size={11} /> {errors.teamName}
                  </p>
                )}
              </div>

              {/* Team Description */}
              <div>
                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                  Team Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={teamDesc}
                  onChange={(e) => { setTeamDesc(e.target.value); setErrors((p) => ({ ...p, teamDesc: '' })); }}
                  rows={3}
                  placeholder="Describe your team's focus or what skills you're looking for..."
                  className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium
                    outline-none transition-all resize-none
                    ${errors.teamDesc ? 'border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                />
                {errors.teamDesc && (
                  <p className="flex items-center gap-1 text-xs font-bold text-red-500 mt-1">
                    <AlertCircle size={11} /> {errors.teamDesc}
                  </p>
                )}
              </div>

              {/* Invite Members */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">
                    Invite Members
                  </label>
                  <span className="text-xs font-bold text-slate-400">{inviteEmails.length}/3</span>
                </div>
                <div className="flex gap-2">
                  <input
                    value={inviteInput}
                    onChange={(e) => setInviteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInvite())}
                    placeholder="Enter email address"
                    className={`flex-1 h-12 bg-slate-50 border rounded-xl px-4 text-sm font-medium
                      outline-none transition-all
                      ${errors.invite ? 'border-red-400' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                  />
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    className="px-4 h-12 bg-[#4F46E5] text-white rounded-xl font-bold text-sm
                      hover:bg-[#4338CA] transition-all shrink-0"
                  >
                    + Add
                  </button>
                </div>
                {errors.invite && (
                  <p className="text-xs font-bold text-red-500 mt-1">{errors.invite}</p>
                )}
                {inviteEmails.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {inviteEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-xl"
                      >
                        <span className="text-xs font-bold text-[#4F46E5]">{email}</span>
                        <button
                          onClick={() => setInviteEmails((p) => p.filter((e) => e !== email))}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {apiError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <p className="text-xs font-bold text-red-600">{apiError}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-7 py-5 border-t border-slate-50">
              <button
                onClick={onClose}
                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm
                  text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm
                  shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all
                  flex items-center justify-center gap-2"
              >
                {submitting
                  ? <><Loader2 size={16} className="animate-spin" /> Creating...</>
                  : 'Create Team'
                }
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
