import React, { useState, useEffect } from 'react';
import {
    Code2, ChevronDown, Upload, Send, CheckCircle2, Loader2,
    FileCode, RotateCcw, Lock, Maximize2, Minimize2, AlertTriangle, X
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { HackathonProblem } from '@/schemas/hackathon.schema';

interface Props {
    hackathonId: string;
    hackathonStatus: string;
}

const FILE_EXT_MAP: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
    'c++': 'cpp', go: 'go', rust: 'rs', ruby: 'rb',
};

const difficultyStyle = (d: string) =>
    d === 'Hard' ? 'bg-red-50 text-red-500' : d === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600';

export default function HackathonCodeSandbox({ hackathonId, hackathonStatus }: Props) {
    const [problem, setProblem] = useState<HackathonProblem | null>(null);
    const [loading, setLoading] = useState(true);
    const [language, setLanguage] = useState('JavaScript');
    const [code, setCode] = useState('');
    const [notes, setNotes] = useState('');
    const [langOpen, setLangOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [tab, setTab] = useState<'problem' | 'editor'>('problem');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [warningMsg, setWarningMsg] = useState('');
    const [showWarning, setShowWarning] = useState(false);

    const isActive = hackathonStatus === 'Running';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const p = await HackathonService.getProblem(hackathonId);
            setProblem(p);
            const defaultLang = p.supportedLanguages[0] ?? 'JavaScript';
            setLanguage(defaultLang);
            setCode(p.starterCode[defaultLang] ?? '');
            setLoading(false);
        };
        load();
    }, [hackathonId]);

    // Fullscreen restriction handlers — attached only while fullscreen is active
    useEffect(() => {
        if (!isFullscreen) return;

        const triggerViolation = (msg: string) => {
            setViolations(v => v + 1);
            setWarningMsg(msg);
            setShowWarning(true);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();
            const blocked =
                (ctrl && ['t', 'n', 'w', 'r', 'p', 'u'].includes(key)) ||
                e.key === 'F12' || e.key === 'F5' ||
                (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(key));
            if (blocked) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const handleContextMenu = (e: MouseEvent) => e.preventDefault();

        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerViolation('Tab switch detected! Stay on this page during the hackathon.');
            }
        };

        const handleBlur = () => {
            triggerViolation('Window focus lost! Switching away from the sandbox is not allowed.');
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) setIsFullscreen(false);
        };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [isFullscreen]);

    const enterFullscreen = () => {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
        setViolations(0);
        setShowWarning(false);
    };

    const exitFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
    };

    const handleLangChange = (lang: string) => {
        setLanguage(lang);
        setCode(problem?.starterCode[lang] ?? `// ${lang} starter code\n// Write your solution here\n`);
        setLangOpen(false);
    };

    const handleReset = () => setCode(problem?.starterCode[language] ?? '');

    const handleSubmit = async () => {
        if (!isActive) return;
        setSubmitting(true);
        await HackathonService.submitSolution(hackathonId, { language, code, notes });
        setSubmitting(false);
        setSubmitted(true);
        if (isFullscreen) exitFullscreen();
    };

    const languages = problem?.supportedLanguages ?? [];
    const fileExt = (lang: string) => FILE_EXT_MAP[lang.toLowerCase()] ?? lang.toLowerCase();

    // ── Locked ──
    if (!isActive) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white border border-slate-100 rounded-3xl animate-in slide-in-from-bottom-2 duration-300">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Lock size={28} className="text-slate-300" />
            </div>
            <div className="text-center">
                <h3 className="text-lg font-black text-slate-700">Code Sandbox Locked</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">
                    {hackathonStatus === 'UpComing' || hackathonStatus === 'Open'
                        ? 'The sandbox opens once the hackathon starts.'
                        : 'Submissions are closed — this hackathon has ended.'}
                </p>
            </div>
        </div>
    );

    // ── Loading ──
    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
        </div>
    );

    // ── Submitted ──
    if (submitted) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-4 bg-white border border-slate-100 rounded-3xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-black text-slate-800">Solution Submitted!</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">Your code has been recorded. Results will be announced after judging.</p>
            </div>
            <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">
                Edit Submission
            </button>
        </div>
    );

    // ── Shared sub-renders ──
    const LangDropdown = () => (
        <div className="relative">
            <button
                onClick={() => setLangOpen(p => !p)}
                className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all"
            >
                <Code2 size={15} className="text-[#4F39F6]" />
                {language}
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
                <div className="absolute top-12 left-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 w-44 animate-in fade-in zoom-in-95 duration-150">
                    {languages.map(lang => (
                        <button
                            key={lang}
                            onClick={() => handleLangChange(lang)}
                            className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${lang === language ? 'text-[#4F39F6] bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const EditorArea = ({ minRows = 20 }: { minRows?: number }) => (
        <div className="bg-[#1E1E2E] rounded-[24px] overflow-hidden shadow-2xl">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/70" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                <div className="flex items-center gap-1.5 ml-3">
                    <FileCode size={13} className="text-white/40" />
                    <span className="text-xs font-bold text-white/40">solution.{fileExt(language)}</span>
                </div>
            </div>
            <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                spellCheck={false}
                rows={Math.max(minRows, code.split('\n').length + 3)}
                className="w-full bg-transparent text-[#CDD6F4] font-mono text-[13px] leading-relaxed p-5 outline-none resize-none"
                style={{ tabSize: 2, userSelect: 'text' }}
            />
        </div>
    );

    const NotesArea = () => (
        <div>
            <label className="text-xs font-black text-slate-600 uppercase tracking-wide block mb-1.5">
                Submission Notes <span className="font-bold text-slate-400 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="Explain your approach, assumptions, or anything the judges should know..."
                className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#4F39F6] transition-all resize-none"
                style={{ userSelect: 'text' }}
            />
        </div>
    );

    const ActionBar = () => (
        <div className="flex items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                <Upload size={15} className="text-slate-400" /> Upload File
                <input type="file" accept=".js,.ts,.py,.java,.cpp,.go,.rs,.rb,.txt,.zip" className="hidden" />
            </label>
            <button
                onClick={handleSubmit}
                disabled={submitting || !code.trim()}
                className="flex items-center gap-2 px-8 py-2.5 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
            >
                {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting...</> : <><Send size={15} /> Submit Solution</>}
            </button>
        </div>
    );

    // ── Fullscreen overlay (browser fullscreen + fixed overlay + restrictions) ──
    if (isFullscreen) return (
        <div className="fixed inset-0 z-[500] bg-[#F8F9FC] flex flex-col" style={{ userSelect: 'none' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Code2 size={16} className="text-[#4F39F6]" />
                    </div>
                    <div>
                        <p className="text-sm font-black text-slate-900">Secure Code Sandbox</p>
                        <p className="text-xs font-bold text-slate-400">All activity is monitored</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {violations > 0 && (
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 rounded-lg text-xs font-black">
                            <AlertTriangle size={13} />
                            {violations} Violation{violations !== 1 ? 's' : ''} Detected
                        </div>
                    )}
                    <button
                        onClick={exitFullscreen}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all"
                    >
                        <Minimize2 size={13} /> Exit Fullscreen
                    </button>
                </div>
            </div>

            {/* Violation toast */}
            {showWarning && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[600] bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200 w-[360px]">
                    <AlertTriangle size={18} className="shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-black">Violation Detected!</p>
                        <p className="text-xs font-medium opacity-90 mt-0.5">{warningMsg}</p>
                    </div>
                    <button onClick={() => setShowWarning(false)} className="p-1 hover:bg-red-700 rounded-lg transition-colors shrink-0">
                        <X size={15} />
                    </button>
                </div>
            )}

            {/* Split: Problem | Editor */}
            <div className="flex flex-1 overflow-hidden">
                {/* Problem panel */}
                <div className="w-[380px] shrink-0 bg-white border-r border-slate-100 overflow-y-auto p-6 space-y-5">
                    {problem && (
                        <>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{problem.title}</h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${difficultyStyle(problem.difficulty)}`}>
                                        {problem.difficulty}
                                    </span>
                                    <span className="px-3 py-1 bg-indigo-50 text-[#4F39F6] rounded-lg text-xs font-black">{problem.points} pts</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2">Description</h3>
                                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm" style={{ userSelect: 'text' }}>{problem.description}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-3">Constraints</h3>
                                <ul className="space-y-2">
                                    {problem.constraints.map((c, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#4F39F6] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                                            {c}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-3">Examples</h3>
                                <div className="space-y-3">
                                    {problem.examples.map((ex, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Input</p>
                                            <p className="text-sm font-bold text-slate-700">{ex.label}</p>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wide mt-2">Expected Output</p>
                                            <p className="text-sm font-bold text-emerald-600">{ex.result}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Editor panel */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ userSelect: 'none' }}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <LangDropdown />
                            <button onClick={handleReset} className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                <RotateCcw size={13} /> Reset
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                            <button
                                onClick={exitFullscreen}
                                className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all"
                            >
                                <Minimize2 size={13} /> Exit
                            </button>
                        </div>
                    </div>
                    <EditorArea minRows={22} />
                    <NotesArea />
                    <ActionBar />
                </div>
            </div>
        </div>
    );

    // ── Normal (tabbed) view ──
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 w-fit">
                {(['problem', 'editor'] as const).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all capitalize ${tab === t ? 'bg-white text-[#4F39F6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        {t === 'problem' ? 'Problem Statement' : 'Code Editor'}
                    </button>
                ))}
            </div>

            {/* Problem Statement */}
            {tab === 'problem' && problem && (
                <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">{problem.title}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${difficultyStyle(problem.difficulty)}`}>
                                    {problem.difficulty}
                                </span>
                                <span className="px-3 py-1 bg-indigo-50 text-[#4F39F6] rounded-lg text-xs font-black">{problem.points} pts</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button
                                onClick={enterFullscreen}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all"
                            >
                                <Maximize2 size={14} /> Fullscreen
                            </button>
                            <button onClick={() => setTab('editor')} className="px-5 py-2.5 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all">
                                Open Editor
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-black text-slate-800 mb-2">Description</h3>
                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm">{problem.description}</p>
                    </div>

                    <div>
                        <h3 className="text-base font-black text-slate-800 mb-3">Constraints</h3>
                        <ul className="space-y-2">
                            {problem.constraints.map((c, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#4F39F6] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-base font-black text-slate-800 mb-3">Examples</h3>
                        <div className="space-y-3">
                            {problem.examples.map((ex, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Input</p>
                                    <p className="text-sm font-bold text-slate-700">{ex.label}</p>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide mt-2">Expected Output</p>
                                    <p className="text-sm font-bold text-emerald-600">{ex.result}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Code Editor */}
            {tab === 'editor' && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-3">
                            <LangDropdown />
                            <button onClick={handleReset} className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                <RotateCcw size={13} /> Reset
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live
                            </span>
                            <button
                                onClick={enterFullscreen}
                                className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all"
                            >
                                <Maximize2 size={13} /> Fullscreen
                            </button>
                        </div>
                    </div>
                    <EditorArea />
                    <NotesArea />
                    <ActionBar />
                </div>
            )}
        </div>
    );
}
