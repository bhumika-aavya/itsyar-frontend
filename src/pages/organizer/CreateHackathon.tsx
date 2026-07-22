import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronLeft, Save, Loader2, Plus, X, Code2,
    Calendar, FileText, Trophy, AlertCircle,
    ListChecks, Scale, Gift, HelpCircle, Milestone, Sparkles, Trash2,
    Cpu, Zap, Database, Settings, Cloud, Link as LinkIcon, ImagePlus, Users,
} from 'lucide-react';
import {
    OrganizerCreateHackathonSchema, OrganizerCreateHackathonValues,
    OrganizerCreateProblemSchema, OrganizerCreateProblemValues
} from '@/schemas/hackathon.schema';
import { OrganizerService } from '@/services/organizer.service';
import { AdminService } from '@/services/admin.service';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const SUPPORTED_LANGS = ['JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust', 'Ruby'];
const DIFFICULTY_OPTS = ['Easy', 'Medium', 'Hard'] as const;
const HACKATHON_DIFFICULTY_OPTS = ['Beginner', 'Intermediate', 'Advanced'] as const;

// Keep in sync with the `iconMap` in HackathonListing.tsx — same keys render
// the same lucide icon everywhere a hackathon's icon shows up.
const ICON_OPTS: { key: string; icon: React.ElementType }[] = [
    { key: 'trophy', icon: Trophy },
    { key: 'cpu', icon: Cpu },
    { key: 'zap', icon: Zap },
    { key: 'database', icon: Database },
    { key: 'settings', icon: Settings },
    { key: 'cloud', icon: Cloud },
    { key: 'link', icon: LinkIcon },
];
const DEFAULT_ICON = 'trophy';

const fieldCls = (hasErr: boolean) =>
    `w-full h-11 rounded-xl border-2 px-4 bg-slate-50 outline-none transition-all font-medium text-slate-800 text-sm ${hasErr ? 'border-red-300 focus:border-red-400' : 'border-transparent focus:border-[#3AADDD] focus:bg-white'}`;

const textareaCls = (hasErr: boolean) =>
    `w-full rounded-xl border-2 px-4 py-3 bg-slate-50 outline-none transition-all font-medium text-slate-800 text-sm resize-none ${hasErr ? 'border-red-300' : 'border-transparent focus:border-[#3AADDD] focus:bg-white'}`;

const ErrMsg = ({ msg }: { msg?: string }) =>
    msg ? <p className="text-xs font-bold text-red-500 mt-1">{msg}</p> : null;

const RemoveRowBtn = ({ onClick }: { onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
        aria-label="Remove"
    >
        <Trash2 size={15} />
    </button>
);

const AddRowBtn = ({ onClick, label }: { onClick: () => void; label: string }) => (
    <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-[#4F46E5] rounded-xl font-extrabold text-xs hover:bg-indigo-100 transition-all"
    >
        <Plus size={13} /> {label}
    </button>
);

export default function CreateHackathon() {
    const { id } = useParams<{ id?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const isEdit = !!id;
    // Shared between the Organizer and Admin flows — return to whichever portal launched this page.
    const basePath = location.pathname.startsWith('/admin') ? '/admin' : '/organizer';
    const portalLabel = basePath === '/admin' ? 'Admin Portal' : 'Organizer Portal';
    // Role-based API routing: admins manage hackathons via /admin/hackathons
    // (their own, higher-privilege endpoint); organizers via /admin/organizer/hackathons.
    // Driven by the authenticated user's actual role, not just the URL, so this
    // stays correct even if the two flows ever share a route.
    const isAdmin = ['admin'].includes((user?.role ?? '').toLowerCase());
    const hackathonService = isAdmin ? AdminService : OrganizerService;

    const [saving, setSaving] = useState(false);
    const [includeProblem, setIncludeProblem] = useState(false);
    const [selectedLangs, setSelectedLangs] = useState<string[]>(['JavaScript', 'Python']);
    const [loadingEdit, setLoadingEdit] = useState(isEdit);
    const [availableJudges, setAvailableJudges] = useState<{ id: string; name: string; email: string }[]>([]);

    const hackForm = useForm<OrganizerCreateHackathonValues>({
        resolver: zodResolver(OrganizerCreateHackathonSchema),
        defaultValues: {
            difficultyLevel: 'Intermediate',
            platform: 'standard',
            foundryLink: '',
            iconType: DEFAULT_ICON,
            pricing: '',
            judges: [],
            rulesText: '',
            criteria: [],
            prizes: [],
            faqs: [],
            timeline: [],
        },
    });

    const probForm = useForm<OrganizerCreateProblemValues>({
        resolver: zodResolver(OrganizerCreateProblemSchema),
        defaultValues: { difficulty: 'Medium', points: 100, supportedLanguages: ['JavaScript', 'Python'] },
    });

    const {
        register: hackReg, handleSubmit: hackHS, formState: { errors: hackErr },
        reset: hackReset, control: hackControl, watch: hackWatch, setValue: hackSetValue,
    } = hackForm;
    const { register: probReg, handleSubmit: probHS, formState: { errors: probErr }, setValue: probSet, watch: probWatch } = probForm;

    const selectedDifficulty = probWatch('difficulty');
    const platform = hackWatch('platform');
    const isFoundry = platform === 'foundry';
    const foundryLink = hackWatch('foundryLink');
    const selectedIcon = hackWatch('iconType') || DEFAULT_ICON;
    const selectedJudges = hackWatch('judges') || [];

    const criteriaArray = useFieldArray({ control: hackControl, name: 'criteria' });
    const prizesArray = useFieldArray({ control: hackControl, name: 'prizes' });
    const faqsArray = useFieldArray({ control: hackControl, name: 'faqs' });
    const timelineArray = useFieldArray({ control: hackControl, name: 'timeline' });

    // Load available judges
    useEffect(() => {
        const loadJudges = async () => {
            const judges = await OrganizerService.getAvailableJudges();
            setAvailableJudges(judges);
        };
        loadJudges();
    }, []);

    // Load existing data in edit mode
    useEffect(() => {
        if (!isEdit || !id) return;
        const load = async () => {
            const data = await hackathonService.getHackathonById(id);
            if (data) {
                hackReset({
                    title: data.title,
                    description: data.description,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    platform: (data as any).platform ?? 'standard',
                    foundryLink: (data as any).foundryLink ?? '',
                    iconType: data.iconType ?? DEFAULT_ICON,
                    registrationsDeadline: data.registrationsDeadline,
                    difficultyLevel: data.difficultyLevel ?? 'Intermediate',
                    pricing: (data as any).pricing ?? '',
                    judges: (data as any).judges ?? [],
                    rulesText: (data.rules ?? []).join('\n'),
                    criteria: data.criteria ?? [],
                    prizes: data.prizes ?? [],
                    faqs: data.faqs ?? [],
                    timeline: data.timeline ?? [],
                });
                if (data.problemCount > 0) setIncludeProblem(true);
            }
            setLoadingEdit(false);
        };
        load();
    }, [id, isEdit, hackReset, hackathonService]);

    const toggleLang = (lang: string) => {
        setSelectedLangs(prev =>
            prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
        );
    };

    const toggleJudge = (judge: { id: string; name: string; email: string }) => {
        const current = hackWatch('judges') || [];
        const exists = current.some(j => j.id === judge.id);
        if (exists) {
            hackSetValue('judges', current.filter(j => j.id !== judge.id));
        } else {
            hackSetValue('judges', [...current, judge]);
        }
    };

    const onSave = async (hackData: OrganizerCreateHackathonValues) => {
        setSaving(true);
        try {
            let hackathonId = id;

            if (isEdit && hackathonId) {
                await hackathonService.updateHackathon(hackathonId, hackData);
            } else {
                const created = await hackathonService.createHackathon(hackData);
                hackathonId = created.id;
            }

            if (!isFoundry && includeProblem) {
                await probHS(async (probData) => {
                    await OrganizerService.upsertProblem(hackathonId!, {
                        ...probData,
                        supportedLanguages: selectedLangs,
                    });
                })();
            }

            toast.success(isEdit ? 'Hackathon updated successfully!' : 'Hackathon created successfully!');
            // Navigate to the hackathons listing page on success
            navigate(isAdmin ? '/admin/hackathons' : '/organizer/hackathons');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
            toast.error(message);
            // Stay on the same page — do not navigate on error
        } finally {
            setSaving(false);
        }
    };

    if (loadingEdit) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
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
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Title <span className="text-red-500">*</span></label>
                        <input
                            {...hackReg('title')}
                            placeholder="e.g. CodeSprint 2026"
                            className={fieldCls(!!hackErr.title)}
                        />
                        <ErrMsg msg={hackErr.title?.message} />
                    </div>

                    {/* Platform */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                            <span className="flex items-center gap-1.5"><Sparkles size={11} /> Platform <span className="text-red-500">*</span></span>
                        </label>
                        <p className="text-[11px] font-bold text-slate-400 mb-2">Selecting Foundry tags this hackathon distinctly from other-language hackathons on its detail header and swaps the problem statement for a Foundry link.</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isFoundry}
                                onClick={() => hackSetValue('platform', isFoundry ? 'standard' : 'foundry')}
                                className={`relative w-14 h-8 rounded-full transition-colors shrink-0 ${isFoundry ? 'bg-[#4F46E5]' : 'bg-slate-200'}`}
                            >
                                <span
                                    className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform ${isFoundry ? 'translate-x-6' : 'translate-x-0'}`}
                                />
                            </button>
                            <span className={`font-extrabold text-sm ${isFoundry ? 'text-[#4F46E5]' : 'text-slate-500'}`}>
                                {isFoundry ? 'Foundry' : 'Other'}
                            </span>
                        </div>
                        <ErrMsg msg={(hackErr as any).platform?.message} />
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                            <span className="flex items-center gap-1.5"><ImagePlus size={11} /> Hackathon Icon</span>
                        </label>
                        <p className="text-[11px] font-bold text-slate-400 mb-2">Shown next to the title in listings. Defaults to the trophy icon if none is picked.</p>
                        <div className="flex flex-wrap gap-2">
                            {ICON_OPTS.map(({ key, icon: OptIcon }) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => hackSetValue('iconType', key)}
                                    aria-label={key}
                                    className={`w-11 h-11 rounded-xl border-2 flex items-center justify-center transition-all ${selectedIcon === key
                                        ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                                        : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <OptIcon size={18} />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Description <span className="text-red-500">*</span></label>
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
                                <span className="flex items-center gap-1.5"><Calendar size={11} /> Start Date <span className="text-red-500">*</span></span>
                            </label>
                            <input type="date" {...hackReg('startDate')} className={fieldCls(!!hackErr.startDate)} />
                            <ErrMsg msg={hackErr.startDate?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                <span className="flex items-center gap-1.5"><Calendar size={11} /> End Date <span className="text-red-500">*</span></span>
                            </label>
                            <input type="date" {...hackReg('endDate')} className={fieldCls(!!hackErr.endDate)} />
                            <ErrMsg msg={hackErr.endDate?.message} />
                        </div>
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Registration Deadline <span className="text-red-500">*</span></label>
                            <input type="date" {...hackReg('registrationsDeadline')} className={fieldCls(!!hackErr.registrationsDeadline)} />
                            <ErrMsg msg={hackErr.registrationsDeadline?.message} />
                        </div>
                    </div>

                    {/* Pricing */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                            <span className="flex items-center gap-1.5"><Sparkles size={11} /> Pricing <span className="text-red-500">*</span></span>
                        </label>
                        <ErrMsg msg={hackErr.pricing?.message} />
                        <input
                            {...hackReg('pricing')}
                            placeholder="e.g. $5,000 total prize pool, $1,000 for 1st place"
                            className={fieldCls(false)}
                        />
                        <p className="text-[11px] font-bold text-slate-400 mt-1">Set the prize money or pricing details for the hackathon</p>
                    </div>

                    {/* Judges Multi-Select Dropdown */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                            <span className="flex items-center gap-1.5"><Users size={11} /> Select Judges</span>
                        </label>
                        <p className="text-[11px] font-bold text-slate-400 mb-2">Choose the judges who will evaluate submissions for this hackathon.</p>
                        <div className="flex flex-wrap gap-2">
                            {availableJudges.map(judge => {
                                const isSelected = selectedJudges.some(j => j.id === judge.id);
                                return (
                                    <button
                                        key={judge.id}
                                        type="button"
                                        onClick={() => toggleJudge(judge)}
                                        className={`px-4 py-2 rounded-xl font-extrabold text-xs border-2 transition-all ${isSelected
                                            ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        {judge.name}
                                    </button>
                                );
                            })}
                        </div>
                        {selectedJudges.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {selectedJudges.map(judge => (
                                    <span
                                        key={judge.id}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-[#4F46E5] rounded-lg font-extrabold text-xs"
                                    >
                                        {judge.name}
                                        <button
                                            type="button"
                                            onClick={() => toggleJudge(judge)}
                                            className="hover:text-red-500 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Difficulty Level */}
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                            <span className="flex items-center gap-1.5"><Scale size={11} /> Difficulty Level <span className="text-red-500">*</span></span>
                        </label>
                        <div className="flex gap-2">
                            {HACKATHON_DIFFICULTY_OPTS.map(d => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => hackSetValue('difficultyLevel', d)}
                                    className={`flex-1 py-2.5 rounded-xl font-extrabold text-xs border-2 transition-all ${hackWatch('difficultyLevel') === d
                                        ? 'border-[#4F46E5] bg-indigo-50 text-[#4F46E5]'
                                        : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                        <ErrMsg msg={hackErr.difficultyLevel?.message} />
                    </div>
                </div>

                {/* ── Rules Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-4">
                    <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                        <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                            <ListChecks size={18} className="text-amber-500" />
                        </div>
                        <div>
                            <h2 className="font-extrabold text-slate-900">Rules</h2>
                            <p className="text-xs font-bold text-slate-400">Guidelines participants must follow</p>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                            Rules <span className="font-bold text-slate-400 normal-case tracking-normal">(one per line)</span>
                        </label>
                        <textarea
                            {...hackReg('rulesText')}
                            rows={5}
                            placeholder={"Teams must consist of 1-4 members\nAll code must be written during the hackathon\nUse of external libraries is allowed"}
                            className={textareaCls(false)}
                        />
                    </div>
                </div>

                {/* ── Judging Criteria Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                                <Scale size={18} className="text-blue-500" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900">Judging Criteria</h2>
                                <p className="text-xs font-bold text-slate-400">How submissions will be evaluated</p>
                            </div>
                        </div>
                        <AddRowBtn label="Add Criterion" onClick={() => criteriaArray.append({ category: '', description: '', weight: 10 })} />
                    </div>

                    {criteriaArray.fields.length === 0 ? (
                        <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl">
                            <AlertCircle size={18} className="text-slate-400 shrink-0" />
                            <p className="text-sm font-bold text-slate-500">No judging criteria added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {criteriaArray.fields.map((field, i) => (
                                <div key={field.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex-1 grid md:grid-cols-[1fr_2fr_auto] gap-3">
                                        <div>
                                            <input
                                                {...hackReg(`criteria.${i}.category`)}
                                                placeholder="Category e.g. Innovation"
                                                className={fieldCls(!!hackErr.criteria?.[i]?.category)}
                                            />
                                            <ErrMsg msg={hackErr.criteria?.[i]?.category?.message} />
                                        </div>
                                        <div>
                                            <input
                                                {...hackReg(`criteria.${i}.description`)}
                                                placeholder="What judges should look for"
                                                className={fieldCls(!!hackErr.criteria?.[i]?.description)}
                                            />
                                            <ErrMsg msg={hackErr.criteria?.[i]?.description?.message} />
                                        </div>
                                        <div>
                                            <input
                                                {...hackReg(`criteria.${i}.weight`)}
                                                type="number"
                                                min={1}
                                                max={100}
                                                placeholder="Weight %"
                                                className={fieldCls(!!hackErr.criteria?.[i]?.weight)}
                                            />
                                            <ErrMsg msg={hackErr.criteria?.[i]?.weight?.message} />
                                        </div>
                                    </div>
                                    <RemoveRowBtn onClick={() => criteriaArray.remove(i)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Prizes Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-yellow-50 rounded-xl flex items-center justify-center">
                                <Gift size={18} className="text-yellow-500" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900">Prizes</h2>
                                <p className="text-xs font-bold text-slate-400">Rewards for top-performing teams</p>
                            </div>
                        </div>
                        <AddRowBtn label="Add Prize" onClick={() => prizesArray.append({ rank: '', amount: '', perk: '' })} />
                    </div>

                    {prizesArray.fields.length === 0 ? (
                        <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl">
                            <AlertCircle size={18} className="text-slate-400 shrink-0" />
                            <p className="text-sm font-bold text-slate-500">No prizes added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {prizesArray.fields.map((field, i) => (
                                <div key={field.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex-1 grid md:grid-cols-3 gap-3">
                                        <div>
                                            <input
                                                {...hackReg(`prizes.${i}.rank`)}
                                                placeholder="Rank e.g. 1st Place"
                                                className={fieldCls(!!hackErr.prizes?.[i]?.rank)}
                                            />
                                            <ErrMsg msg={hackErr.prizes?.[i]?.rank?.message} />
                                        </div>
                                        <div>
                                            <input
                                                {...hackReg(`prizes.${i}.amount`)}
                                                placeholder="Amount e.g. $5,000"
                                                className={fieldCls(!!hackErr.prizes?.[i]?.amount)}
                                            />
                                            <ErrMsg msg={hackErr.prizes?.[i]?.amount?.message} />
                                        </div>
                                        <div>
                                            <input
                                                {...hackReg(`prizes.${i}.perk`)}
                                                placeholder="Perk (optional)"
                                                className={fieldCls(false)}
                                            />
                                        </div>
                                    </div>
                                    <RemoveRowBtn onClick={() => prizesArray.remove(i)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── FAQs Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center">
                                <HelpCircle size={18} className="text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900">FAQs</h2>
                                <p className="text-xs font-bold text-slate-400">Answer common participant questions</p>
                            </div>
                        </div>
                        <AddRowBtn label="Add FAQ" onClick={() => faqsArray.append({ q: '', a: '' })} />
                    </div>

                    {faqsArray.fields.length === 0 ? (
                        <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl">
                            <AlertCircle size={18} className="text-slate-400 shrink-0" />
                            <p className="text-sm font-bold text-slate-500">No FAQs added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {faqsArray.fields.map((field, i) => (
                                <div key={field.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex-1 space-y-2">
                                        <div>
                                            <input
                                                {...hackReg(`faqs.${i}.q`)}
                                                placeholder="Question"
                                                className={fieldCls(!!hackErr.faqs?.[i]?.q)}
                                            />
                                            <ErrMsg msg={hackErr.faqs?.[i]?.q?.message} />
                                        </div>
                                        <div>
                                            <textarea
                                                {...hackReg(`faqs.${i}.a`)}
                                                rows={2}
                                                placeholder="Answer"
                                                className={textareaCls(!!hackErr.faqs?.[i]?.a)}
                                            />
                                            <ErrMsg msg={hackErr.faqs?.[i]?.a?.message} />
                                        </div>
                                    </div>
                                    <RemoveRowBtn onClick={() => faqsArray.remove(i)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── Timeline Card ── */}
                <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                                <Milestone size={18} className="text-rose-500" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900">Timeline</h2>
                                <p className="text-xs font-bold text-slate-400">Key events and phases participants should track</p>
                            </div>
                        </div>
                        <AddRowBtn label="Add Milestone" onClick={() => timelineArray.append({ date: '', description: '' })} />
                    </div>

                    {timelineArray.fields.length === 0 ? (
                        <div className="flex items-center gap-3 p-5 bg-slate-50 rounded-2xl">
                            <AlertCircle size={18} className="text-slate-400 shrink-0" />
                            <p className="text-sm font-bold text-slate-500">No timeline milestones added yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {timelineArray.fields.map((field, i) => (
                                <div key={field.id} className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex-1 grid md:grid-cols-[2fr_1fr_1fr] gap-3">
                                        <div>
                                            <input
                                                {...hackReg(`timeline.${i}.label`)}
                                                placeholder="Label e.g. Opening Ceremony"
                                                className={fieldCls(!!hackErr.timeline?.[i]?.label)}
                                            />
                                            <ErrMsg msg={hackErr.timeline?.[i]?.label?.message} />
                                        </div>
                                        <div>
                                            <input
                                                type="date"
                                                {...hackReg(`timeline.${i}.date`)}
                                                className={fieldCls(!!hackErr.timeline?.[i]?.date)}
                                            />
                                            <ErrMsg msg={hackErr.timeline?.[i]?.date?.message} />
                                        </div>
                                        <div className="md:col-span-3">
                                            <input
                                                {...hackReg(`timeline.${i}.description`)}
                                                placeholder="Description (optional)"
                                                className={fieldCls(false)}
                                            />
                                        </div>
                                    </div>
                                    <RemoveRowBtn onClick={() => timelineArray.remove(i)} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {isFoundry ? (
                    /* ── Foundry Link Card ── */
                    <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-4">
                        <div className="flex items-center gap-3 pb-2 border-b border-slate-50">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <LinkIcon size={18} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <h2 className="font-extrabold text-slate-900">Foundry Link</h2>
                                <p className="text-xs font-bold text-slate-400">Where participants access the Foundry workspace for this hackathon</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">
                                Foundry Link <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...hackReg('foundryLink')}
                                placeholder="https://foundry.example.com/workspace/..."
                                className={fieldCls(isFoundry && !foundryLink?.trim())}
                            />
                            {isFoundry && !foundryLink?.trim() && (
                                <p className="text-xs font-bold text-red-500 mt-1">Foundry link is required</p>
                            )}
                        </div>
                    </div>
                ) : (
                    /* ── Problem Statement Card ── */
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
                                        <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Problem Title <span className="text-red-500">*</span></label>
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
                                    <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block mb-1.5">Problem Description <span className="text-red-500">*</span></label>
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
                )}

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
                        disabled={saving || (!isFoundry && includeProblem && selectedLangs.length === 0) || (isFoundry && !foundryLink?.trim())}
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
