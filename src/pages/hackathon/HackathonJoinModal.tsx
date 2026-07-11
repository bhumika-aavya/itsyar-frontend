import React, { useState, useEffect } from 'react';
import { X, Users, CheckCircle2, Plus, Trash2, Loader2, ArrowLeft, Calendar, User, Check, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { HackathonService } from '@/services/hackathon.service';
import { Team } from '@/schemas/hackathon.schema';
import { getApiErrorMessage } from '@/lib/getApiErrorMessage';

type Step = 'mode-select' | 'team-select' | 'create-team' | 'team-created' | 'confirm' | 'individual-form' | 'success';

interface IndividualFormValues {
    fullName: string;
    email: string;
    agreeToRules: boolean;
}

interface HackathonRef {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    hackathon: HackathonRef;
}

const formatDate = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function HackathonJoinModal({ isOpen, onClose, hackathon }: Props) {
    const navigate = useNavigate();
    const [step, setStep] = useState<Step>('team-select');
    const [userTeams, setUserTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [joinedTeam, setJoinedTeam] = useState<Team | null>(null);

    // create-team form
    const [teamName, setTeamName] = useState('');
    const [teamDesc, setTeamDesc] = useState('');
    const [inviteInput, setInviteInput] = useState('');
    const [inviteEmails, setInviteEmails] = useState<string[]>([]);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    // individual registration form
    const [indForm, setIndForm] = useState<IndividualFormValues>({
        fullName: '', email: '', agreeToRules: false,
    });
    const [indErrors, setIndErrors] = useState<Record<string, string>>({});

    // team API error
    const [teamApiError, setTeamApiError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStep('mode-select');
            setSelectedTeamId(null);
            setJoinedTeam(null);
            resetCreateForm();
            setIndForm({ fullName: '', email: '', agreeToRules: false });
            setIndErrors({});
            setTeamApiError('');
        }
    }, [isOpen, hackathon.id]);

    const loadUserTeams = async () => {
        setLoading(true);
        const teams = await HackathonService.getUserTeams(hackathon.id);
        setUserTeams(teams || []);
        if (teams?.length > 0) setSelectedTeamId(teams[0].id);
        setLoading(false);
    };

    const resetCreateForm = () => {
        setTeamName('');
        setTeamDesc('');
        setInviteInput('');
        setInviteEmails([]);
        setFormErrors({});
    };

    const handleAddInvite = () => {
        const email = inviteInput.trim();
        if (!email) return;
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFormErrors(p => ({ ...p, invite: 'Enter a valid email address' }));
            return;
        }
        if (inviteEmails.includes(email)) {
            setFormErrors(p => ({ ...p, invite: 'Email already added' }));
            return;
        }
        if (inviteEmails.length >= 3) {
            setFormErrors(p => ({ ...p, invite: 'Maximum 3 additional members' }));
            return;
        }
        setInviteEmails(p => [...p, email]);
        setInviteInput('');
        setFormErrors(p => ({ ...p, invite: '' }));
    };

    const handleCreateTeam = async () => {
        const errs: Record<string, string> = {};
        if (!teamName.trim() || teamName.length < 2) errs.teamName = 'At least 2 characters required';
        if (!teamDesc.trim() || teamDesc.length < 10) errs.teamDesc = 'At least 10 characters required';
        if (Object.keys(errs).length) { setFormErrors(errs); return; }

        setSubmitting(true);
        setTeamApiError('');
        try {
            const created = await HackathonService.createTeam({
                name: teamName,
                description: teamDesc,
                hackathonId: hackathon.id,
                inviteEmails,
            });
            setUserTeams(p => [created, ...p]);
            setSelectedTeamId(created.id);
            setJoinedTeam(created);
            setStep('team-created');
        } catch (err: any) {
            setTeamApiError(err?.message || 'Failed to create team. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleConfirmJoin = async () => {
        setSubmitting(true);
        setTeamApiError('');
        try {
            await HackathonService.joinHackathon(hackathon.id);
            const team = userTeams.find(t => t.id === selectedTeamId) ?? joinedTeam;
            navigate(`/hackathons/${hackathon.id}/registration-success`, {
                state: {
                    hackathonTitle: hackathon.title,
                    formattedDate: formatDate(hackathon.startDate),
                    startDate: hackathon.startDate,
                    endDate: hackathon.endDate,
                    teamName: team?.name ?? null,
                    mode: 'Online',
                },
            });
        } catch (err: any) {
            setTeamApiError(err?.message || 'Failed to join hackathon. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleIndividualRegister = async () => {
        const errs: Record<string, string> = {};
        if (!indForm.fullName.trim()) errs.fullName = 'Full name is required';
        if (!indForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(indForm.email)) errs.email = 'Valid email is required';
        if (!indForm.agreeToRules) errs.agreeToRules = 'You must agree to the rules and terms of service';
        if (Object.keys(errs).length) { setIndErrors(errs); return; }

        setSubmitting(true);
        try {
            await HackathonService.registerHackathon(hackathon.id, {
                fullName: indForm.fullName,
                email: indForm.email,
                role: 'Participant',
                agreeToRules: true,
            });
            navigate(`/hackathons/${hackathon.id}/registration-success`, {
                state: {
                    hackathonTitle: hackathon.title,
                    formattedDate: formatDate(hackathon.startDate),
                    startDate: hackathon.startDate,
                    endDate: hackathon.endDate,
                    teamName: null,
                    mode: 'Online',
                },
            });
        } catch (err) {
            setIndErrors(p => ({ ...p, submit: getApiErrorMessage(err, 'Registration failed. Please try again.') }));
        } finally {
            setSubmitting(false);
        }
    };

    const selectedTeam = userTeams?.find(t => t.id === selectedTeamId) ?? joinedTeam;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* ── Step: mode-select ── */}
                {step === 'mode-select' && (
                    <>
                        <div className="flex items-center justify-between px-7 pt-7 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">Join {hackathon.title}</h2>
                                <p className="text-sm font-medium text-slate-400 mt-0.5">How would you like to participate?</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-7 pb-4 space-y-3">
                            <button
                                onClick={() => setStep('individual-form')}
                                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-[#3AADDD] hover:bg-indigo-50/30 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] shrink-0 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                                    <User size={22} />
                                </div>
                                <div>
                                    <p className="text-base font-extrabold text-slate-800 group-hover:text-[#4F46E5] transition-colors">Join as Individual</p>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">Compete solo — no team required</p>
                                </div>
                            </button>

                            <button
                                onClick={() => { loadUserTeams(); setStep('team-select'); }}
                                className="w-full flex items-center gap-4 p-5 rounded-2xl border-2 border-slate-100 hover:border-[#3AADDD] hover:bg-indigo-50/30 transition-all text-left group"
                            >
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] shrink-0 group-hover:bg-[#4F46E5] group-hover:text-white transition-colors">
                                    <Users size={22} />
                                </div>
                                <div>
                                    <p className="text-base font-extrabold text-slate-800 group-hover:text-[#4F46E5] transition-colors">Join with a Team</p>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">Create a team or join an existing one</p>
                                </div>
                            </button>
                        </div>

                        <div className="px-7 py-4 border-t border-slate-50">
                            <button onClick={onClose} className="w-full py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        </div>
                    </>
                )}

                {/* ── Step: individual-form ── */}
                {step === 'individual-form' && (
                    <>
                        <div className="flex items-center justify-between px-7 pt-7 pb-4">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setStep('mode-select')} className="p-1.5 text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors">
                                    <ArrowLeft size={16} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">Individual Registration</h2>
                                    <p className="text-sm font-medium text-slate-400 mt-0.5">Fill in your details to register solo</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Hackathon badge */}
                        <div className="px-7 pb-3">
                            <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl px-4 py-3 flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#4F46E5] rounded-xl flex items-center justify-center shrink-0">
                                    <Calendar size={15} className="text-white" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-extrabold text-[#4F46E5] truncate">{hackathon.title}</p>
                                    <p className="text-[11px] font-bold text-slate-400">{formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}</p>
                                </div>
                            </div>
                        </div>

                        <div className="px-7 pb-2 space-y-4 max-h-[340px] overflow-y-auto">
                            {/* Full Name */}
                            <div>
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                                    Full Name <span className="text-red-400">*</span>
                                </label>
                                <div className="relative">
                                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                                    <input
                                        value={indForm.fullName}
                                        onChange={e => { setIndForm(p => ({ ...p, fullName: e.target.value })); setIndErrors(p => ({ ...p, fullName: '' })); }}
                                        placeholder="John Doe"
                                        className={`w-full h-11 bg-slate-50 border rounded-xl pl-9 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all ${indErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                                    />
                                </div>
                                {indErrors.fullName && <p className="text-xs font-bold text-red-500 mt-1">{indErrors.fullName}</p>}
                            </div>

                            {/* Email */}
                            <div>
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">
                                    Email <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={indForm.email}
                                    onChange={e => { setIndForm(p => ({ ...p, email: e.target.value })); setIndErrors(p => ({ ...p, email: '' })); }}
                                    placeholder="john.doe@example.com"
                                    className={`w-full h-11 bg-slate-50 border rounded-xl px-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all ${indErrors.email ? 'border-red-400 bg-red-50/30' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                                />
                                {indErrors.email && <p className="text-xs font-bold text-red-500 mt-1">{indErrors.email}</p>}
                            </div>

                            {/* Terms & Conditions */}
                            <div>
                                <label
                                    className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border-2 transition-all ${indErrors.agreeToRules ? 'border-red-200 bg-red-50/30' : indForm.agreeToRules ? 'border-[#4F46E5]/30 bg-indigo-50/40' : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        className="sr-only"
                                        checked={indForm.agreeToRules}
                                        onChange={e => { setIndForm(p => ({ ...p, agreeToRules: e.target.checked })); setIndErrors(p => ({ ...p, agreeToRules: '' })); }}
                                    />
                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all ${indForm.agreeToRules ? 'bg-[#4F46E5] border-[#4F46E5]' : 'border-slate-300 bg-white'}`}>
                                        {indForm.agreeToRules && <Check size={11} className="text-white" strokeWidth={3} />}
                                    </div>
                                    <span className="text-xs font-bold text-slate-600 leading-relaxed select-none">
                                        I have read and agree to the{' '}
                                        <span className="text-[#4F46E5] hover:underline underline-offset-2 cursor-pointer">Hackathon Rules</span>
                                        {' '}and{' '}
                                        <span className="text-[#4F46E5] hover:underline underline-offset-2 cursor-pointer">Terms of Service</span>
                                    </span>
                                </label>
                                {indErrors.agreeToRules && (
                                    <p className="flex items-center gap-1.5 text-xs font-bold text-red-500 mt-1.5">
                                        <AlertCircle size={12} /> {indErrors.agreeToRules}
                                    </p>
                                )}
                            </div>

                            {indErrors.submit && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                                    <AlertCircle size={14} className="text-red-500 shrink-0" />
                                    <p className="text-xs font-bold text-red-600">{indErrors.submit}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 px-7 py-5 border-t border-slate-50">
                            <button onClick={() => setStep('mode-select')} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Back</button>
                            <button
                                onClick={handleIndividualRegister}
                                disabled={submitting}
                                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? <><Loader2 size={16} className="animate-spin" /> Registering...</> : 'Register Now'}
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step: team-select ── */}
                {step === 'team-select' && (
                    <>
                        <div className="flex items-center justify-between px-7 pt-7 pb-4">
                            <div>
                                <h2 className="text-xl font-extrabold text-slate-900">Join {hackathon.title}</h2>
                                <p className="text-sm font-medium text-slate-400 mt-0.5">Select your team or create a new one</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-7 pb-2 space-y-3 max-h-72 overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-[#4F46E5]" size={28} /></div>
                            ) : userTeams.length === 0 ? (
                                <p className="text-sm text-slate-400 font-medium text-center py-6">You have no teams yet. Create one below.</p>
                            ) : (
                                userTeams.map(team => (
                                    <button
                                        key={team.id}
                                        onClick={() => setSelectedTeamId(team.id)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                                            selectedTeamId === team.id
                                                ? 'border-[#4F46E5] bg-indigo-50/50'
                                                : selectedTeamId !== null
                                                    ? 'border-slate-100 opacity-40 cursor-not-allowed'
                                                    : 'border-slate-100 hover:border-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] shrink-0">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-extrabold text-slate-900">
                                                    {team.name}
                                                    {team.leadId === 'current-user' && <span className="text-slate-400 font-bold"> (You)</span>}
                                                </p>
                                                <p className="text-xs font-bold text-slate-400">{team.members.length} Members</p>
                                            </div>
                                        </div>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${selectedTeamId === team.id ? 'border-[#4F46E5] bg-[#4F46E5]' : 'border-slate-200'}`}>
                                            {selectedTeamId === team.id && <div className="w-2 h-2 rounded-full bg-white" />}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="px-7 pt-2 pb-4">
                            <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Other option</p>
                            <button
                                onClick={() => { resetCreateForm(); setStep('create-team'); }}
                                className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-slate-200 hover:border-[#3AADDD] hover:bg-indigo-50/30 transition-all text-left group"
                            >
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-[#4F46E5] transition-colors shrink-0">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-700 group-hover:text-[#4F46E5] transition-colors">Create New Team</p>
                                    <p className="text-xs font-bold text-slate-400">Build a new team and invite members</p>
                                </div>
                            </button>
                        </div>

                        <div className="flex gap-3 px-7 py-5 border-t border-slate-50">
                            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                            <button
                                onClick={() => selectedTeamId && setStep('confirm')}
                                disabled={!selectedTeamId}
                                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step: create-team ── */}
                {step === 'create-team' && (
                    <>
                        <div className="flex items-center justify-between px-7 pt-7 pb-4">
                            <button onClick={() => setStep('team-select')} className="flex items-center gap-1.5 text-[#4F46E5] font-bold text-sm">
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-7 pb-2">
                            <h2 className="text-xl font-extrabold text-slate-900">Create New Team</h2>
                            <p className="text-sm font-medium text-slate-400 mt-0.5">Assemble your squad for the hackathon</p>
                        </div>

                        <div className="px-7 pb-4 space-y-4 max-h-80 overflow-y-auto">
                            <div>
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">Team Name</label>
                                <input
                                    value={teamName}
                                    onChange={e => setTeamName(e.target.value)}
                                    placeholder="e.g. Neural Ninjas"
                                    className={`w-full h-12 bg-slate-50 border rounded-xl px-4 text-sm font-medium outline-none transition-all ${formErrors.teamName ? 'border-red-400' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                                />
                                {formErrors.teamName && <p className="text-xs font-bold text-red-500 mt-1">{formErrors.teamName}</p>}
                            </div>

                            <div>
                                <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide block mb-1.5">Team Description</label>
                                <textarea
                                    value={teamDesc}
                                    onChange={e => setTeamDesc(e.target.value)}
                                    rows={3}
                                    placeholder="Briefly describe your team's focus or goals..."
                                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-all resize-none ${formErrors.teamDesc ? 'border-red-400' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                                />
                                {formErrors.teamDesc && <p className="text-xs font-bold text-red-500 mt-1">{formErrors.teamDesc}</p>}
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Add Members</label>
                                    <span className="text-xs font-bold text-slate-400">{inviteEmails.length}/3 Members</span>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        value={inviteInput}
                                        onChange={e => setInviteInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInvite())}
                                        placeholder="Enter their email"
                                        className={`flex-1 h-12 bg-slate-50 border rounded-xl px-4 text-sm font-medium outline-none transition-all ${formErrors.invite ? 'border-red-400' : 'border-slate-100 focus:border-[#3AADDD]'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddInvite}
                                        className="px-4 h-12 bg-[#4F46E5] text-white rounded-xl font-bold text-sm hover:bg-[#4338CA] transition-all shrink-0"
                                    >
                                        + Add
                                    </button>
                                </div>
                                {formErrors.invite && <p className="text-xs font-bold text-red-500 mt-1">{formErrors.invite}</p>}

                                {inviteEmails.length > 0 && (
                                    <div className="mt-2 space-y-1.5">
                                        {inviteEmails.map(email => (
                                            <div key={email} className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-xl">
                                                <span className="text-xs font-bold text-[#4F46E5]">{email}</span>
                                                <button onClick={() => setInviteEmails(p => p.filter(e => e !== email))} className="text-slate-400 hover:text-red-500 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {teamApiError && (
                            <div className="mx-7 mb-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                                <p className="text-xs font-bold text-red-600">{teamApiError}</p>
                            </div>
                        )}
                        <div className="flex gap-3 px-7 py-5 border-t border-slate-50">
                            <button onClick={() => setStep('team-select')} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                            <button
                                onClick={handleCreateTeam}
                                disabled={submitting}
                                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Team'}
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step: team-created ── */}
                {step === 'team-created' && (
                    <div className="px-7 py-10 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 size={36} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900">Team Created Successfully!</h2>
                            <p className="text-sm font-medium text-slate-400 mt-1">
                                Welcome aboard, <span className="font-bold text-slate-600">{joinedTeam?.name}</span>. Your collaboration hub is ready.
                            </p>
                        </div>
                        <button
                            onClick={() => setStep('confirm')}
                            className="w-full py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all mt-2"
                        >
                            Go to Hackathon
                        </button>
                    </div>
                )}

                {/* ── Step: confirm ── */}
                {step === 'confirm' && (
                    <>
                        <div className="flex items-center justify-between px-7 pt-7 pb-4">
                            <button onClick={() => setStep('team-select')} className="flex items-center gap-1.5 text-[#4F46E5] font-bold text-sm">
                                <ArrowLeft size={16} /> Back
                            </button>
                            <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 transition-colors rounded-xl">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="px-7 pb-2">
                            <h2 className="text-xl font-extrabold text-slate-900">Confirm Join</h2>
                            <p className="text-sm font-medium text-slate-400 mt-0.5">You are about to join</p>
                        </div>

                        <div className="px-7 pb-6 space-y-3">
                            <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
                                <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center shrink-0">
                                    <Calendar size={18} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-slate-900">{hackathon.title}</p>
                                    <p className="text-xs font-bold text-slate-400">{formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}</p>
                                </div>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-4">
                                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Team</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Users size={16} className="text-[#4F46E5]" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-extrabold text-slate-900">{selectedTeam?.name}</p>
                                        <p className="text-xs font-bold text-slate-400">{selectedTeam?.members.length} Members</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {teamApiError && (
                            <div className="mx-7 mb-2 flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                                <AlertCircle size={14} className="text-red-500 shrink-0" />
                                <p className="text-xs font-bold text-red-600">{teamApiError}</p>
                            </div>
                        )}
                        <div className="flex gap-3 px-7 py-5 border-t border-slate-50">
                            <button onClick={onClose} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                            <button
                                onClick={handleConfirmJoin}
                                disabled={submitting}
                                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
                            >
                                {submitting ? <><Loader2 size={16} className="animate-spin" /> Joining...</> : 'Confirm Join'}
                            </button>
                        </div>
                    </>
                )}

                {/* ── Step: success ── */}
                {step === 'success' && (
                    <div className="px-7 py-10 flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 size={36} className="text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900">
                                {joinedTeam ? 'Successfully Joined!' : 'Registration Successful!'}
                            </h2>
                            <p className="text-sm font-medium text-slate-400 mt-1">
                                {joinedTeam
                                    ? <>You've joined <span className="font-bold text-slate-600">{hackathon.title}</span> with <span className="font-bold text-slate-600">{joinedTeam.name}</span></>
                                    : <>You're registered for <span className="font-bold text-slate-600">{hackathon.title}</span> as a solo participant. Good luck!</>
                                }
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all mt-2"
                        >
                            {joinedTeam ? 'Go to Dashboard' : 'View Hackathon'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
