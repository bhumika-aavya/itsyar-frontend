import React, { useState, useEffect, useCallback } from 'react';
import {
    Code2, ChevronDown, Upload, Send, CheckCircle2, Loader2,
    FileCode, RotateCcw, Lock, Maximize2, Minimize2, AlertTriangle, X, Clock,
    Play, Terminal,
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { HackathonProblem } from '@/schemas/hackathon.schema';

interface Props {
    hackathonId: string;
    hackathonStatus: string;
    hackathonEndDate?: string;
    initialFullscreen?: boolean;
    onClose?: () => void;
}

const MAX_VIOLATIONS = 5;

const FILE_EXT_MAP: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
    'c++': 'cpp', go: 'go', rust: 'rs', ruby: 'rb',
};

const difficultyStyle = (d: string) =>
    d === 'Hard' ? 'bg-red-50 text-red-500' : d === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600';

// ── Code-execution types ───────────────────────────────────────────────
type CaseStatus = 'idle' | 'running' | 'accepted' | 'wrong' | 'error' | 'tle';

interface CaseResult {
    id: string;
    label: string;
    stdin: string;
    expected: string;
    stdout: string | null;
    stderr: string | null;
    compileError: string | null;
    status: CaseStatus;
    exitCode: number;
    durationMs: number;
}

const normalizeOut = (s: string) =>
    s.trim().split('\n').map(l => l.trim()).filter(Boolean).join('\n');

const formatTimeLeft = (tl: { h: number; m: number; s: number }) => {
    const days = Math.floor(tl.h / 24);
    const hours = tl.h % 24;
    const hh = String(hours).padStart(2, '0');
    const mm = String(tl.m).padStart(2, '0');
    const ss = String(tl.s).padStart(2, '0');
    return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
};

const STATUS_CFG: Record<CaseStatus, { label: string; pill: string; dot: string; bar: string }> = {
    idle: { label: 'Not Run', pill: 'bg-slate-50 border-slate-200 text-slate-500', dot: 'bg-slate-300', bar: 'bg-slate-100 text-slate-500 border-slate-200' },
    running: { label: 'Running…', pill: 'bg-blue-50 border-blue-200 text-blue-600', dot: 'bg-blue-500 animate-pulse', bar: 'bg-blue-50 text-blue-600 border-blue-200' },
    accepted: { label: 'Accepted', pill: 'bg-emerald-50 border-emerald-200 text-emerald-600', dot: 'bg-emerald-500', bar: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    wrong: { label: 'Wrong Answer', pill: 'bg-red-50 border-red-200 text-red-600', dot: 'bg-red-500', bar: 'bg-red-50 text-red-700 border-red-200' },
    error: { label: 'Runtime Error', pill: 'bg-orange-50 border-orange-200 text-orange-600', dot: 'bg-orange-500', bar: 'bg-orange-50 text-orange-700 border-orange-200' },
    tle: { label: 'Time Limit', pill: 'bg-yellow-50 border-yellow-200 text-yellow-600', dot: 'bg-yellow-500', bar: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

export default function HackathonCodeSandbox({
    hackathonId, hackathonStatus: _hackathonStatus, hackathonEndDate, initialFullscreen = false, onClose,
}: Props) {
    // ── Core state ──
    const [problem, setProblem] = useState<HackathonProblem | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);
    const [language, setLanguage] = useState('JavaScript');
    const [code, setCode] = useState('');
    const [notes, setNotes] = useState('');
    const [langOpen, setLangOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittedAt, setSubmittedAt] = useState<Date | null>(null);
    const [submissionId, setSubmissionId] = useState<string | null>(null);
    const [tab, setTab] = useState<'problem' | 'editor'>('problem');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [warningMsg, setWarningMsg] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);

    // ── Execution state ──
    const [caseResults, setCaseResults] = useState<CaseResult[]>([]);
    const [selectedCase, setSelectedCase] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [resultView, setResultView] = useState<'cases' | 'custom'>('cases');
    const [customStdin, setCustomStdin] = useState('');
    const [customResult, setCustomResult] = useState<{
        stdout: string | null; stderr: string | null; compileError: string | null; durationMs: number;
    } | null>(null);
    const [isRunningCustom, setIsRunningCustom] = useState(false);

    // ── Load problem ──
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setLoadError(false);
            try {
                const problems = await HackathonService.getProblem(hackathonId);
                const p = problems[0] ?? null;
                if (!p) throw new Error('No problem found for this hackathon.');
                setProblem(p);
                const defaultLang = p.supportedLanguages?.[0] ?? 'JavaScript';
                setLanguage(defaultLang);
                setCode(p.starterCode?.[defaultLang] ?? '');
            } catch {
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [hackathonId, retryKey]);

    // ── Auto fullscreen ──
    useEffect(() => {
        if (initialFullscreen && !loading) {
            document.documentElement.requestFullscreen?.().catch(() => { });
            setIsFullscreen(true);
            setViolations(0);
            setShowWarning(false);
        }
    }, [initialFullscreen, loading]);

    // ── Countdown timer ──
    useEffect(() => {
        if (!hackathonEndDate) return;
        const end = new Date(hackathonEndDate);
        const tick = () => {
            const diff = end.getTime() - Date.now();
            if (diff <= 0) { setTimeLeft({ h: 0, m: 0, s: 0 }); return; }
            setTimeLeft({
                h: Math.floor(diff / 3_600_000),
                m: Math.floor((diff % 3_600_000) / 60_000),
                s: Math.floor((diff % 60_000) / 1_000),
            });
        };
        tick();
        const id = setInterval(tick, 1_000);
        return () => clearInterval(id);
    }, [hackathonEndDate]);

    // ── Back-button trap + beforeunload (fullscreen only) ──
    useEffect(() => {
        if (!isFullscreen) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.history.pushState(null, '', window.location.href);
        const handlePopState = () => { window.history.pushState(null, '', window.location.href); setShowExitConfirm(true); };
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isFullscreen]);

    // ── Violation handlers (fullscreen only) ──
    useEffect(() => {
        if (!isFullscreen) return;

        const triggerViolation = (msg: string) => {
            setViolations(v => {
                const next = v + 1;
                setWarningMsg(next >= MAX_VIOLATIONS
                    ? `Maximum violations reached (${MAX_VIOLATIONS}). Your session is at risk of disqualification.`
                    : next >= MAX_VIOLATIONS - 1 ? `${msg} — 1 violation remaining before disqualification.` : msg);
                return next;
            });
            setShowWarning(true);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            const ctrl = e.ctrlKey || e.metaKey;
            const key = e.key.toLowerCase();
            if (ctrl && !e.shiftKey && key === 'v') { e.preventDefault(); e.stopPropagation(); triggerViolation('Paste detected! Pasting external code is not allowed.'); return; }
            if (ctrl && !e.shiftKey && (key === 'c' || key === 'x')) { e.preventDefault(); e.stopPropagation(); return; }
            const blocked = (ctrl && ['t', 'n', 'w', 'r', 'p', 'u'].includes(key)) || e.key === 'F12' || e.key === 'F5' || (ctrl && e.shiftKey && ['i', 'j', 'c'].includes(key));
            if (blocked) { e.preventDefault(); e.stopPropagation(); }
        };
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleVisibilityChange = () => { if (document.hidden) triggerViolation('Tab switch detected! Stay on this page during the hackathon.'); };
        const handleBlur = () => triggerViolation('Window focus lost! Switching away from the sandbox is not allowed.');
        const handleFullscreenChange = () => { if (!document.fullscreenElement) setIsFullscreen(false); };
        const handleCopy = (e: ClipboardEvent) => e.preventDefault();
        const handleCut = (e: ClipboardEvent) => e.preventDefault();
        const handlePaste = (e: ClipboardEvent) => { e.preventDefault(); triggerViolation('Paste detected! Pasting external code is not allowed.'); };

        document.addEventListener('keydown', handleKeyDown, true);
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('copy', handleCopy);
        document.addEventListener('cut', handleCut);
        document.addEventListener('paste', handlePaste);
        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('copy', handleCopy);
            document.removeEventListener('cut', handleCut);
            document.removeEventListener('paste', handlePaste);
        };
    }, [isFullscreen]);

    // ── Handlers ──
    const enterFullscreen = () => {
        document.documentElement.requestFullscreen?.().catch(() => { });
        setIsFullscreen(true);
        setViolations(0);
        setShowWarning(false);
    };

    const exitFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });
        setIsFullscreen(false);
        onClose?.();
    };

    const handleLangChange = useCallback((lang: string) => {
        setLanguage(lang);
        setCode(problem?.starterCode?.[lang] ?? `// ${lang} starter code\n// Write your solution here\n`);
        setLangOpen(false);
        setCaseResults([]);
        setCustomResult(null);
    }, [problem]);

    const handleReset = useCallback(() => {
        setCode(problem?.starterCode?.[language] ?? '');
        setCaseResults([]);
        setCustomResult(null);
    }, [problem, language]);

    const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = evt => { if (typeof evt.target?.result === 'string') setCode(evt.target.result); };
        reader.readAsText(file);
        e.target.value = '';
    }, []);

    const handleSubmit = async () => {
        if (!code.trim()) return;
        setSubmitting(true);
        try {
            const result = await HackathonService.submitSolution(hackathonId, { language, code, notes });
            setSubmitted(true);
            setSubmittedAt(new Date());
            setSubmissionId(result?.submissionId ?? null);
            if (isFullscreen) exitFullscreen();
        } catch {
            // submission error — keep form open
        } finally {
            setSubmitting(false);
        }
    };

    // ── Run against test cases ──
    const handleRunCode = useCallback(async () => {
        const cases = (problem?.testCases ?? []).filter(tc => !tc.isHidden);
        if (!cases.length || !code.trim()) return;
        setIsRunning(true);
        setResultsOpen(true);
        setResultView('cases');
        setSelectedCase(0);
        setCaseResults(cases.map(tc => ({
            id: tc.id, label: tc.label, stdin: tc.stdin, expected: tc.expectedOutput,
            stdout: null, stderr: null, compileError: null, status: 'running' as CaseStatus,
            exitCode: 0, durationMs: 0,
        })));
        const results = await Promise.all(cases.map(async (tc) => {
            const res = await HackathonService.runCode(language, code, tc.stdin);
            const actual = normalizeOut(res.stdout ?? '');
            const expected = normalizeOut(tc.expectedOutput);
            let status: CaseStatus;
            if (res.compileError) status = 'error';
            else if (res.timedOut) status = 'tle';
            else if (res.exitCode !== 0) status = 'error';
            else if (actual === expected) status = 'accepted';
            else status = 'wrong';
            return {
                id: tc.id, label: tc.label, stdin: tc.stdin, expected: tc.expectedOutput,
                stdout: res.stdout, stderr: res.stderr, compileError: res.compileError,
                status, exitCode: res.exitCode, durationMs: res.durationMs,
            };
        }));
        setCaseResults(results);
        setIsRunning(false);
    }, [problem, language, code]);

    // ── Run with custom input ──
    const handleRunCustom = useCallback(async () => {
        if (!code.trim()) return;
        setIsRunningCustom(true);
        const res = await HackathonService.runCode(language, code, customStdin);
        setCustomResult({ stdout: res.stdout, stderr: res.stderr, compileError: res.compileError, durationMs: res.durationMs });
        setIsRunningCustom(false);
    }, [language, code, customStdin]);

    const languages = problem?.supportedLanguages ?? [];
    const fileExt = (lang: string) => FILE_EXT_MAP[lang.toLowerCase()] ?? lang.toLowerCase();

    // ── Sub-renders ──
    const renderLangDropdown = () => (
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
                        <button key={lang} onClick={() => handleLangChange(lang)}
                            className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${lang === language ? 'text-[#4F39F6] bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {lang}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderEditorArea = (minRows = 20) => (
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

    const renderNotesArea = () => (
        <div>
            <label className="text-xs font-black text-slate-600 uppercase tracking-wide block mb-1.5">
                Submission Notes <span className="font-bold text-slate-400 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Explain your approach, assumptions, or anything the mentor should know..."
                className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#4F39F6] transition-all resize-none"
                style={{ userSelect: 'text' }} />
        </div>
    );

    const renderActionBar = () => (
        <div className="flex items-center justify-between gap-4 pt-2">
            <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all cursor-pointer">
                <Upload size={15} className="text-slate-400" /> Upload File
                <input type="file" accept=".js,.ts,.py,.java,.cpp,.go,.rs,.rb,.txt" className="hidden" onChange={handleFileUpload} />
            </label>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleRunCode}
                    disabled={isRunning || !code.trim() || !(problem?.testCases?.length)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl font-black text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {isRunning ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                    {isRunning ? 'Running…' : 'Run Code'}
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !code.trim()}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                    {submitting ? <><Loader2 size={15} className="animate-spin" /> Submitting…</> : <><Send size={15} /> Submit</>}
                </button>
            </div>
        </div>
    );

    // ── Results panel ──
    const renderResultsPanel = (inFullscreen = false) => {
        const cases = (problem?.testCases ?? []).filter(tc => !tc.isHidden);
        const hiddenCount = (problem?.testCases ?? []).filter(tc => tc.isHidden).length;
        const allPassed = caseResults.length > 0 && caseResults.every(r => r.status === 'accepted');
        const anyRunning = caseResults.some(r => r.status === 'running');
        const anyError = caseResults.some(r => r.status === 'error' || r.status === 'tle');
        const failCount = caseResults.filter(r => r.status === 'wrong').length;
        const sel = caseResults[selectedCase];
        const selCase = cases[selectedCase];

        return (
            <div className={`${inFullscreen ? 'border-t border-slate-200 shrink-0' : 'rounded-2xl border border-slate-100 shadow-sm mt-2'} bg-white overflow-hidden`}>
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                    onClick={() => setResultsOpen(p => !p)}
                >
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5" onClick={e => e.stopPropagation()}>
                            {(['cases', 'custom'] as const).map(v => (
                                <button key={v}
                                    onClick={() => { setResultView(v); setResultsOpen(true); }}
                                    className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${resultView === v && resultsOpen ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {v === 'cases' ? 'Test Results' : 'Custom Input'}
                                </button>
                            ))}
                        </div>
                        {caseResults.length > 0 && !anyRunning && (
                            <span className={`text-xs font-black px-2.5 py-1 rounded-full ${allPassed ? 'bg-emerald-50 text-emerald-600' : anyError ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                {allPassed ? `✓ ${caseResults.length}/${caseResults.length} Passed` :
                                    anyError ? '⚠ Error' :
                                        `✗ ${failCount} Failed`}
                            </span>
                        )}
                        {anyRunning && (
                            <span className="flex items-center gap-1.5 text-xs font-black text-blue-600 px-2.5 py-1 rounded-full bg-blue-50">
                                <Loader2 size={11} className="animate-spin" /> Running…
                            </span>
                        )}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${resultsOpen ? 'rotate-180' : ''}`} />
                </div>

                {resultsOpen && (
                    <div className={`border-t border-slate-100 overflow-y-auto ${inFullscreen ? 'h-[256px]' : 'max-h-[320px]'}`}>

                        {/* ── Test cases tab ── */}
                        {resultView === 'cases' && (
                            <div className="p-4 space-y-4">
                                {/* Case pills */}
                                <div className="flex flex-wrap gap-2 items-center">
                                    {cases.map((tc, i) => {
                                        const r = caseResults[i];
                                        const s = STATUS_CFG[r?.status ?? 'idle'];
                                        return (
                                            <button key={tc.id} onClick={() => setSelectedCase(i)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${selectedCase === i ? s.pill : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                                <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                                                Case {i + 1}
                                            </button>
                                        );
                                    })}
                                    {hiddenCount > 0 && (
                                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-slate-200 text-xs font-bold text-slate-400">
                                            <Lock size={11} /> +{hiddenCount} hidden
                                        </div>
                                    )}
                                    {cases.length === 0 && (
                                        <p className="text-xs font-medium text-slate-400">
                                            Click <span className="font-black text-slate-600">Run Code</span> to test against sample cases.
                                        </p>
                                    )}
                                </div>

                                {/* Selected case detail */}
                                {selCase && (
                                    <div className="space-y-3">
                                        {/* Status bar */}
                                        {sel && sel.status !== 'idle' && (
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-black ${STATUS_CFG[sel.status].bar}`}>
                                                {sel.status === 'running' && <Loader2 size={12} className="animate-spin" />}
                                                {STATUS_CFG[sel.status].label}
                                                {sel.durationMs > 0 && sel.status !== 'running' && (
                                                    <span className="ml-auto font-bold opacity-60">{sel.durationMs}ms</span>
                                                )}
                                            </div>
                                        )}

                                        {/* Label */}
                                        <p className="text-xs font-bold text-slate-500">{selCase.label}</p>

                                        {/* Compile error */}
                                        {sel?.compileError && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Compilation Error</p>
                                                <pre className="bg-[#180000] text-red-300 text-xs p-3 rounded-xl font-mono overflow-x-auto max-h-28 whitespace-pre-wrap leading-relaxed">{sel.compileError}</pre>
                                            </div>
                                        )}

                                        {/* I/O grid */}
                                        {!sel?.compileError && (
                                            <div className="grid grid-cols-3 gap-2">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Input</p>
                                                    <pre className="bg-slate-50 border border-slate-100 text-slate-600 text-xs p-3 rounded-xl font-mono overflow-auto max-h-28 whitespace-pre">{selCase.stdin}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expected Output</p>
                                                    <pre className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl font-mono overflow-auto max-h-28 whitespace-pre">{selCase.expectedOutput}</pre>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Your Output</p>
                                                    <pre className={`text-xs p-3 rounded-xl font-mono overflow-auto max-h-28 whitespace-pre border ${sel?.status === 'accepted' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                                                        sel?.status === 'wrong' ? 'bg-red-50 border-red-100 text-red-700' :
                                                            sel?.status === 'running' ? 'bg-blue-50 border-blue-100 text-blue-400 italic' :
                                                                'bg-slate-50 border-slate-100 text-slate-400'}`}>
                                                        {sel?.status === 'running' ? 'Running…'
                                                            : sel?.stdout != null ? sel.stdout
                                                                : sel ? '(no output)' : '—'}
                                                    </pre>
                                                </div>
                                            </div>
                                        )}

                                        {/* Stderr */}
                                        {sel?.stderr && !sel.compileError && (
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Standard Error</p>
                                                <pre className="bg-[#130800] text-orange-300 text-xs p-3 rounded-xl font-mono overflow-x-auto max-h-24 whitespace-pre-wrap leading-relaxed">{sel.stderr}</pre>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Empty state */}
                                {cases.length === 0 && (
                                    <div className="flex flex-col items-center py-6 gap-2">
                                        <Terminal size={28} className="text-slate-200" />
                                        <p className="text-xs text-slate-400 font-medium">No test cases available for this problem.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Custom input tab ── */}
                        {resultView === 'custom' && (
                            <div className="p-4 space-y-3">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Custom Input (stdin)</label>
                                    <textarea
                                        value={customStdin}
                                        onChange={e => setCustomStdin(e.target.value)}
                                        rows={4}
                                        placeholder={`Paste your own test input here, e.g.\n3\nApple 10 500\nBanana 5 200\nApple 5 500`}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-700 outline-none focus:border-[#4F39F6] transition-all resize-none"
                                        style={{ userSelect: 'text' }}
                                    />
                                </div>
                                <button
                                    onClick={handleRunCustom}
                                    disabled={isRunningCustom || !code.trim()}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl font-black text-xs hover:bg-slate-700 disabled:opacity-50 transition-all"
                                >
                                    {isRunningCustom ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                                    Run Custom Input
                                </button>

                                {customResult && (
                                    <div className="space-y-2.5">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Output</p>
                                            <span className="text-[10px] font-bold text-slate-400">{customResult.durationMs}ms</span>
                                        </div>
                                        {customResult.compileError ? (
                                            <pre className="bg-[#180000] text-red-300 text-xs p-3 rounded-xl font-mono overflow-x-auto max-h-32 whitespace-pre-wrap leading-relaxed">{customResult.compileError}</pre>
                                        ) : (
                                            <>
                                                <pre className="bg-[#1E1E2E] text-[#CDD6F4] text-xs p-3 rounded-xl font-mono overflow-auto min-h-[56px] max-h-36 whitespace-pre">
                                                    {customResult.stdout || <span className="text-white/25 italic">No output</span>}
                                                </pre>
                                                {customResult.stderr && (
                                                    <pre className="bg-[#130800] text-orange-300 text-xs p-3 rounded-xl font-mono overflow-auto max-h-24 whitespace-pre-wrap leading-relaxed">{customResult.stderr}</pre>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                )}
            </div>
        );
    };

    // ── Loading ──
    if (loading) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
            <p className="text-sm font-bold text-slate-400">Loading problem…</p>
        </div>
    );

    // ── Error / fallback ──
    if (loadError) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-5 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertTriangle size={28} className="text-red-400" />
            </div>
            <div>
                <h3 className="text-xl font-black text-slate-900">Could not load problem</h3>
                <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs leading-relaxed">
                    Failed to fetch the hackathon problem. Please check your connection and try again.
                </p>
            </div>
            <button
                onClick={() => setRetryKey(k => k + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
            >
                Try Again
            </button>
        </div>
    );

    // ── Submitted ──
    if (submitted) return (
        <div className="flex flex-col items-center justify-center py-20 space-y-5 bg-white border border-slate-100 rounded-3xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center">
                <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <div className="text-center space-y-1.5">
                <h3 className="text-xl font-black text-slate-800">Solution Submitted!</h3>
                <p className="text-sm font-medium text-slate-400">Your code has been sent to a mentor for review.</p>
                {submissionId && <p className="text-xs font-bold text-slate-300 font-mono">ID: {submissionId}</p>}
                {submittedAt && (
                    <p className="text-xs font-bold text-indigo-400">
                        {submittedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {' · '}
                        {submittedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                    </p>
                )}
            </div>
            <button onClick={() => setSubmitted(false)} className="px-6 py-2.5 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">
                Edit Submission
            </button>
        </div>
    );

    // ── Fullscreen overlay ──
    if (isFullscreen) return (
        <div className="fixed inset-0 z-[500] bg-[#F8F9FC] flex flex-col">
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
                    {timeLeft && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black tabular-nums ${timeLeft.h === 0 && timeLeft.m < 30 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                            <Clock size={13} />
                            {formatTimeLeft(timeLeft)}
                        </div>
                    )}
                    {violations > 0 && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black ${violations >= MAX_VIOLATIONS ? 'bg-red-600 text-white' : violations >= MAX_VIOLATIONS - 2 ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-500'}`}>
                            <AlertTriangle size={13} />
                            {violations}/{MAX_VIOLATIONS} Violation{violations !== 1 ? 's' : ''}
                        </div>
                    )}
                    <button onClick={() => setShowExitConfirm(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                        <Minimize2 size={13} /> Exit
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

            {/* Exit confirm */}
            {showExitConfirm && (
                <div className="absolute inset-0 z-[700] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                        <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
                            <AlertTriangle size={28} className="text-amber-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900">Leave Hackathon?</h3>
                            <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
                                Exiting the secure environment will be logged as a violation. Your code is <strong className="text-slate-600">not</strong> automatically submitted.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowExitConfirm(false)}
                                className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Stay In</button>
                            <button onClick={() => { setShowExitConfirm(false); exitFullscreen(); }}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-black text-sm hover:bg-red-600 transition-all">Exit Anyway</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Split: Problem | Editor */}
            <div className="flex flex-1 overflow-hidden">
                {/* Problem panel */}
                <div className="w-[380px] shrink-0 bg-white border-r border-slate-100 overflow-y-auto p-6 space-y-5">
                    {problem && (
                        <>
                            <div>
                                <h2 className="text-xl font-black text-slate-900">{problem?.title}</h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${difficultyStyle(problem?.difficulty)}`}>{problem?.difficulty}</span>
                                    <span className="px-3 py-1 bg-indigo-50 text-[#4F39F6] rounded-lg text-xs font-black">{problem?.points} pts</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-2">Description</h3>
                                <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm" style={{ userSelect: 'text' }}>{problem?.description}</p>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-3">Constraints</h3>
                                <ul className="space-y-2">
                                    {problem?.constraints?.map((c, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                            <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#4F39F6] flex items-center justify-center text-xs font-black shrink-0 mt-0.5">{i + 1}</span>
                                            <span style={{ userSelect: 'text' }}>{c}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-800 mb-3">Examples</h3>
                                <div className="space-y-3">
                                    {problem?.examples?.map((ex, i) => (
                                        <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Scenario</p>
                                            <p className="text-sm font-bold text-slate-700" style={{ userSelect: 'text' }}>{ex.label}</p>
                                            <p className="text-xs font-black text-slate-400 uppercase tracking-wide mt-2">Expected Result</p>
                                            <p className="text-sm font-bold text-emerald-600" style={{ userSelect: 'text' }}>{ex.result}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Editor panel — flex column so results panel pins to bottom */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Scrollable editor content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                {renderLangDropdown()}
                                <button onClick={handleReset} className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                    <RotateCcw size={13} /> Reset
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                </span>
                                <button onClick={() => setShowExitConfirm(true)}
                                    className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                    <Minimize2 size={13} /> Exit
                                </button>
                            </div>
                        </div>
                        {renderEditorArea(22)}
                        {renderNotesArea()}
                        {renderActionBar()}
                    </div>
                    {/* Results panel — pinned to bottom of editor column */}
                    {renderResultsPanel(true)}
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
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all capitalize ${tab === t ? 'bg-white text-[#4F39F6] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
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
                                <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wide ${difficultyStyle(problem.difficulty)}`}>{problem.difficulty}</span>
                                <span className="px-3 py-1 bg-indigo-50 text-[#4F39F6] rounded-lg text-xs font-black">{problem.points} pts</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={enterFullscreen}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                                <Maximize2 size={14} /> Fullscreen
                            </button>
                            <button onClick={() => setTab('editor')}
                                className="px-5 py-2.5 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all">
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
                            {problem?.constraints?.map((c, i) => (
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
                            {problem?.examples?.map((ex, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide">Scenario</p>
                                    <p className="text-sm font-bold text-slate-700">{ex.label}</p>
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wide mt-2">Expected Result</p>
                                    <p className="text-sm font-bold text-emerald-600">{ex.result}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Sample test case preview */}
                    {(problem?.testCases ?? []).filter(tc => !tc.isHidden).length > 0 && (
                        <div>
                            <h3 className="text-base font-black text-slate-800 mb-3">Sample Test Cases</h3>
                            <div className="space-y-3">
                                {(problem?.testCases ?? []).filter(tc => !tc.isHidden).map((tc, i) => (
                                    <div key={tc.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-500">Case {i + 1}</span>
                                            <span className="text-xs font-medium text-slate-400">{tc.label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-slate-100">
                                            <div className="p-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Input</p>
                                                <pre className="text-xs font-mono text-slate-600 whitespace-pre">{tc.stdin}</pre>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Expected Output</p>
                                                <pre className="text-xs font-mono text-emerald-700 whitespace-pre">{tc.expectedOutput}</pre>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Code Editor */}
            {tab === 'editor' && (
                <>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-3">
                                {renderLangDropdown()}
                                <button onClick={handleReset} className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                    <RotateCcw size={13} /> Reset
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                                </span>
                                <button onClick={enterFullscreen}
                                    className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                    <Maximize2 size={13} /> Fullscreen
                                </button>
                            </div>
                        </div>
                        {renderEditorArea()}
                        {renderNotesArea()}
                        {renderActionBar()}
                    </div>
                    {renderResultsPanel(false)}
                </>
            )}
        </div>
    );
}
