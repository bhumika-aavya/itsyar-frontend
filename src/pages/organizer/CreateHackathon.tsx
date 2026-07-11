import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronLeft, Save, Loader2, Plus, X, Code2,
    Calendar, Globe, Users, FileText, Trophy, CheckCircle2, AlertCircle
} from 'lucide-react';
import {
    OrganizerCreateHackathonSchema, OrganizerCreateHackathonValues,
    OrganizerCreateProblemSchema, OrganizerCreateProblemValues
} from '@/schemas/hackathon.schema';
import { OrganizerService } from '@/services/organizer.service';

const SUPPORTED_LANGS = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby'];
const DIFFICULTY_OPTS = ['Easy', 'Medium', 'Hard'] as const;

const fieldCls = (hasErr: boolean) =>
    `w-full h-11 rounded-xl border-2 px-4 bg-slate-50 outline-none transition-all font-medium text-slate-800 text-sm ${hasErr ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-[#3AADDD] focus:bg-white'}`;

const textareaCls = (hasErr: boolean) =>
    `w-full rounded-xl border-2 px-4 py-3 bg-slate-50 outline-none transition-all font-medium text-slate-800 text-sm resize-none ${hasErr ? 'border-red-300' : 'border-transparent focus:border-[#3AADDD] focus:bg-white'}`;

const ErrMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs font-bold text-red-500 mt-1">{msg}</p> : null;

export default function CreateHackathon() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = !!id;
    // Shared between the Organizer and Admin flows — return to whichever portal launched this page.
    const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/organizer';
    const portalLabel = basePath === '/admin' ? 'Admin Portal' : 'Organizer Portal';

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [includeProblem, setIncludeProblem] = useState(false);
    const [selectedLangs, setSelectedLangs] = useState<string[]>(['JavaScript', 'Python']);
    const [loadingEdit, setLoadingEdit] = useState(isEdit);

    const hackForm = useForm<OrganizerCreateHackathonValues>({
        resolver: zodResolver(OrganizerCreateHackathonSchema),
    });

    const probForm = useForm<OrganizerCreateProblemValues>({
        resolver: zodResolver(OrganizerCreateProblemSchema),
        defaultValues: { difficulty: 'Medium', points: 100, supportedLanguages: ['JavaScript', 'Python'] },
    });

    const { register: hackReg, handleSubmit: hackHS, formState: { errors: hackErr }, reset: hackReset } = hackForm;
    const { register: probReg, handleSubmit: probHS, formState: { errors: probErr }, setValue: probSet, watch: probWatch } = probForm;

    const selectedDifficulty = probWatch('difficulty');

    // Load existing data in edit mode
    useEffect(() => {
        if (!isEdit || !id) return;
        const load = async () => {
            const data = await OrganizerService.getHackathonById(id);
            if (data) {
                hackReset({
                    title: data.title,
                    description: data.description,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    mode: data.mode,
                    teamSize: data.teamSize,
                    registrationDeadline: data.registrationDeadline,
                });
                if (data.problemCount > 0) setIncludeProblem(true);
            }
            setLoadingEdit(false);
        };
        load();
    }, [id, isEdit, hackReset]);

    const toggleLang = (lang: string) => {
        setSelectedLangs(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const onSave = async (hackData: OrganizerCreateHackathonValues) => {
        setSaving(true);
        try {
            let hackathonId = id;

            if (isEdit && hackathonId) {
                await OrganizerService.updateHackathon(hackathonId, hackData);
            } else {
                const created = await OrganizerService.createHackathon(hackData);
                hackathonId = created.id;
            }

            if (includeProblem) {
                await probHS(async (probData) => {
                    await OrganizerService.upsertProblem(hackathonId!, {
                        ...probData,
                        supportedLanguages: selectedLangs,
                    });
                })();
            }

            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    if (loadingEdit) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
        </div>
    );

    if (saved) return (
        <div className="max-w-xl mx-auto py-32 text-center space-y-6 px-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{isEdit ? 'Changes Saved' : 'Hackathon Created'}</h2>
                <p className="text-slate-500 font-medium mt-2">
                    {isEdit ? 'Your hackathon has been updated successfully.' : 'Your new hackathon is live in the system.'}
                </p>
            </div>
            <button
                onClick={() => navigate(basePath)}
                className="px-8 py-3 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
            >
                Back to Dashboard
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-6 md:px-10 md:py-8 animate-in fade-in duration-500">
            <button
                onClick={() => navigate(basePath)}
                className="flex items-center gap-2 text-[#4F46E5] font-bold text-sm mb-6 hover:opacity-80 transition-all"
            >
                <ChevronLeft size={18} /> Back to Dashboard
            </button>

            <div className="mb-8">
                <p className="text-xs font-extrabold uppercase tracking-widest text-[#4F46E5] mb-1">{portalLabel}</p>
                <h1 className="text-3xl font-extrabold text-slate-900">{isEdit ? 'Edit Hackathon' : 'Create Hackathon'}</h1>
                <p className="text-slate-500 font-medium mt-1">
                    {isEdit ? 'Update hackathon details and problem statement.' : 'Fill in the details to launch a new hackathon event.'}
                </p>
            </div>

            <form onSubmit={hackHS(onSave)} className="space-y-6">
                {/* ── Hackathon Details Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-6">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                        <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Trophy size={18} className="text-[#4F46E5]" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-900">Hackathon Details</h2>
                            <p className="text-xs font-bold text-slate-400">Basic information about the event</p>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Title</label>
                        <input
                            {...hackReg('title')}
                            placeholder="e.g. CodeSprint 2026"
                            className={fieldCls(!!hackErr.title)}
                        />
                        <ErrMsg msg={hackErr.title?.message} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Description</label>
                        <textarea
                            {...hackReg('description')}
                            rows={4}
                            placeholder="Describe the hackathon, its goals, and what participants will build..."
                            className={textareaCls(!!hackErr.description)}
                        />
                        <ErrMsg msg={hackErr.description?.message} />
                    </div>

                    {/* Dates row */}
                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={11} /> Start Date</span>
                            </label>
                            <input type="date" {...hackReg('startDate')} className={fieldCls(!!hackErr.startDate)} />
                            <ErrMsg msg={hackErr.startDate?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={11} /> End Date</span>
                            </label>
                            <input type="date" {...hackReg('endDate')} className={fieldCls(!!hackErr.endDate)} />
                            <ErrMsg msg={hackErr.endDate?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Registration Deadline</label>
                            <input type="date" {...hackReg('registrationDeadline')} className={fieldCls(!!hackErr.registrationDeadline)} />
                            <ErrMsg msg={hackErr.registrationDeadline?.message} />
                        </div>
                    </div>

                    {/* Mode + Team Size */}
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                <span className="flex items-center gap-1.5"><Globe size={11} /> Mode</span>
                            </label>
                            <select {...hackReg('mode')} className={`${fieldCls(!!hackErr.mode)} cursor-pointer`}>
                                <option value="">Select mode</option>
                                <option value="Online">Online</option>
                                <option value="In-Person">In-Person</option>
                                <option value="Hybrid">Hybrid</option>
                            </select>
                            <ErrMsg msg={hackErr.mode?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                <span className="flex items-center gap-1.5"><Users size={11} /> Team Size</span>
                            </label>
                            <select {...hackReg('teamSize')} className={`${fieldCls(!!hackErr.teamSize)} cursor-pointer`}>
                                <option value="">Select team size</option>
                                <option value="Solo (1)">Solo (1)</option>
                                <option value="1-2 Members">1-2 Members</option>
                                <option value="1-3 Members">1-3 Members</option>
                                <option value="1-4 Members">1-4 Members</option>
                                <option value="1-5 Members">1-5 Members</option>
                            </select>
                            <ErrMsg msg={hackErr.teamSize?.message} />
                        </div>
                    </div>
                </div>

                {/* ── Problem Statement Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-violet-50 rounded-xl flex items-center justify-center">
                                <FileText size={18} className="text-violet-500" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900">Problem Statement</h2>
                                <p className="text-xs font-bold text-slate-400">The challenge participants must solve</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIncludeProblem(p => !p)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-extrabold text-xs transition-all ${includeProblem
                                ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                : 'bg-indigo-50 text-[#4F46E5] hover:bg-indigo-100'}`}
                        >
                            {includeProblem ? <><X size={13} /> Remove</> : <><Plus size={13} /> Add Problem</>}
                        </button>
                    </div>

                    {!includeProblem ? (
                        <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl">
                            <AlertCircle size={18} className="text-slate-400 shrink-0" />
                            <p className="text-sm font-bold text-slate-500">
                                No problem statement added yet. Click "Add Problem" to define the challenge for participants.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Problem Title + Difficulty + Points */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Problem Title</label>
                                    <input
                                        {...probReg('title')}
                                        placeholder="e.g. Build a Rate Limiter"
                                        className={fieldCls(!!probErr.title)}
                                    />
                                    <ErrMsg msg={probErr.title?.message} />
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Difficulty</label>
                                    <div className="flex gap-2">
                                        {DIFFICULTY_OPTS.map(d => (
                                            <button
                                                key={d}
                                                type="button"
                                                onClick={() => probSet('difficulty', d)}
                                                className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs border-2 transition-all ${selectedDifficulty === d
                                                    ? d === 'Easy' ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                                                    : d === 'Medium' ? 'border-amber-400 bg-amber-50 text-amber-600'
                                                    : 'border-red-400 bg-red-50 text-red-500'
                                                    : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                            >
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Points</label>
                                    <input
                                        {...probReg('points')}
                                        type="number"
                                        min={1}
                                        placeholder="100"
                                        className={fieldCls(!!probErr.points)}
                                    />
                                    <ErrMsg msg={probErr.points?.message} />
                                </div>
                            </div>

                            {/* Problem Description */}
                            <div>
                                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Problem Description</label>
                                <textarea
                                    {...probReg('description')}
                                    rows={6}
                                    placeholder="Describe the problem clearly. Include context, what to build, expected behavior, and any edge cases..."
                                    className={textareaCls(!!probErr.description)}
                                />
                                <ErrMsg msg={probErr.description?.message} />
                            </div>

                            {/* Constraints */}
                            <div>
                                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                    Constraints <span className="font-bold text-slate-400 normal-case tracking-normal">(one per line)</span>
                                </label>
                                <textarea
                                    {...probReg('constraintsText')}
                                    rows={4}
                                    placeholder={"Solution must handle at least 100 concurrent requests\nMaximum response time: 200ms\nNo external databases allowed"}
                                    className={textareaCls(false)}
                                />
                            </div>

                            {/* Supported Languages */}
                            <div>
                                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-3">
                                    <span className="flex items-center gap-1.5"><Code2 size={11} /> Supported Languages</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {SUPPORTED_LANGS.map(lang => (
                                        <button
                                            key={lang}
                                            type="button"
                                            onClick={() => toggleLang(lang)}
                                            className={`px-4 py-2 rounded-xl font-extrabold text-xs border-2 transition-all ${selectedLangs.includes(lang)
                                                ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                                                : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                        >
                                            {lang}
                                        </button>
                                    ))}
                                </div>
                                {selectedLangs.length === 0 && (
                                    <p className="text-xs font-bold text-red-500 mt-1">Select at least one language</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Submit */}
                <div className="flex items-center justify-end gap-3 pb-8">
                    <button
                        type="button"
                        onClick={() => navigate(basePath)}
                        className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-extrabold text-sm hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving || (includeProblem && selectedLangs.length === 0)}
                        className="flex items-center gap-2 px-8 py-3 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
                    >
                        {saving
                            ? <><Loader2 size={15} className="animate-spin" /> Saving...</>
                            : <><Save size={15} /> {isEdit ? 'Save Changes' : 'Create Hackathon'}</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
