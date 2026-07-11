import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
    Code2, ChevronDown, Upload, Send, Loader2,
    FileCode, RotateCcw, Lock, Maximize2, Minimize2, AlertTriangle, X, Clock,
    Play, Terminal, AlignLeft, MessageSquare, Users, Share2,
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { HackathonProblem } from '@/schemas/hackathon.schema';
import { markHackathonSubmitted } from '@/lib/submissionStore';

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

// ── Code formatter ────────────────────────────────────────────────────────
// Reformats single-line collapsed starter code into properly indented output.
function formatCStyleCode(raw: string): string {
    const INDENT = '    ';
    let out = '';
    let depth = 0;
    let parenDepth = 0;
    let inStr = false, strCh = '', inBlockComment = false;

    // Collapse consecutive whitespace (but preserve existing newlines as spaces)
    const code = raw.replace(/[\r\n\t ]+/g, ' ').trim();
    const len = code.length;
    let i = 0;

    const ind = () => INDENT.repeat(depth);
    const skipSpaces = () => { while (i < len && code[i] === ' ') i++; };

    while (i < len) {
        const c = code[i];
        const n = code[i + 1] ?? '';

        // block comment: /* … */
        if (!inStr && !inBlockComment && c === '/' && n === '*') {
            inBlockComment = true; out += c + n; i += 2; continue;
        }
        if (inBlockComment) {
            if (c === '*' && n === '/') {
                out += '*/'; i += 2; inBlockComment = false; skipSpaces(); out += '\n' + ind();
            } else { out += c; i++; }
            continue;
        }

        // string literals
        if (!inStr && (c === '"' || c === "'" || c === '`')) {
            inStr = true; strCh = c; out += c; i++; continue;
        }
        if (inStr) {
            if (c === '\\' && i + 1 < len) { out += c + n; i += 2; continue; }
            if (c === strCh) inStr = false;
            out += c; i++; continue;
        }

        // parens depth (to skip semicolons inside for-loop headers)
        if (c === '(') { parenDepth++; out += c; i++; continue; }
        if (c === ')') { parenDepth = Math.max(0, parenDepth - 1); out += c; i++; continue; }

        // opening brace
        if (c === '{') {
            out = out.trimEnd(); out += ' {'; depth++;
            i++; skipSpaces(); out += '\n' + ind(); continue;
        }

        // closing brace
        if (c === '}') {
            out = out.trimEnd(); depth = Math.max(0, depth - 1);
            out += '\n' + ind() + '}'; i++; skipSpaces();
            if (/^(else|catch|finally)\b/.test(code.slice(i))) {
                out += ' ';
            } else {
                out += '\n' + ind(); skipSpaces();
            }
            continue;
        }

        // semicolon outside parens → line break
        if (c === ';' && parenDepth === 0) {
            out += ';'; i++; skipSpaces();
            if (i < len && code[i] !== '}') { out += '\n' + ind(); skipSpaces(); }
            continue;
        }

        out += c; i++;
    }

    return out
        .split('\n')
        .map(l => l.trimEnd())
        .filter((l, idx, arr) => !(l === '' && (arr[idx - 1] ?? '') === ''))
        .join('\n')
        .trim();
}

const HTML_ENTITIES: Record<string, string> = {
    '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'", '&apos;': "'", '&nbsp;': ' ',
};

// Some backends return starter code wrapped in a full HTML document (e.g. a
// syntax-highlighted <pre><code>…</code></pre> preview) instead of raw source.
// Unwrap that back down to plain code before it hits the editor.
function extractCodeFromHtml(raw: string): string {
    if (!/<\s*(!doctype html|html|pre|code)[\s>]/i.test(raw)) return raw;
    const codeMatch = raw.match(/<code[^>]*>([\s\S]*?)<\/code>/i);
    const preMatch = raw.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
    let inner = codeMatch?.[1] ?? preMatch?.[1] ?? raw;
    inner = inner.replace(/<[^>]+>/g, '');
    inner = inner.replace(/&lt;|&gt;|&amp;|&quot;|&#39;|&apos;|&nbsp;/g, (m) => HTML_ENTITIES[m]);
    return inner.trim();
}

function autoFormatCode(raw: string, language: string): string {
    const unwrapped = extractCodeFromHtml(raw);
    // Unescape literal \n / \t that some backends embed in JSON strings
    const code = unwrapped.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
    // If the code already has real newlines, trust it's formatted
    if (code.includes('\n')) return code;
    const lang = language.toLowerCase();
    const cStyle = ['javascript', 'typescript', 'java', 'c++', 'c', 'go', 'rust', 'kotlin', 'swift'].includes(lang);
    return cStyle ? formatCStyleCode(code) : code;
}

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

interface ChatMessage {
    id: string;
    sender: string;
    text: string;
    timestamp: number;
    type: 'message' | 'code-share' | 'system';
    code?: string;
    language?: string;
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
    const navigate = useNavigate();

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
    const [tab, setTab] = useState<'problem' | 'editor'>('problem');
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [warningMsg, setWarningMsg] = useState('');
    const [showWarning, setShowWarning] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const [timeLeft, setTimeLeft] = useState<{ h: number; m: number; s: number } | null>(null);
    const [fsView, setFsView] = useState<'problem' | 'split'>('problem');
    const [showScoreZeroModal, setShowScoreZeroModal] = useState(false);
    const [showTabBlockOverlay, setShowTabBlockOverlay] = useState(false);

    // ── Execution state ──
    const [caseResults, setCaseResults] = useState<CaseResult[]>([]);
    const [selectedCase, setSelectedCase] = useState(0);
    const [isRunning, setIsRunning] = useState(false);
    const [resultsOpen, setResultsOpen] = useState(false);
    const [customStdin, setCustomStdin] = useState('');
    const [customResult, setCustomResult] = useState<{
        stdout: string | null; stderr: string | null; compileError: string | null; durationMs: number;
    } | null>(null);
    const [isRunningCustom, setIsRunningCustom] = useState(false);

    // ── Team panel state ──
    const [showTeamPanel, setShowTeamPanel] = useState(false);
    const [teamChatTab, setTeamChatTab] = useState<'chat' | 'members'>('chat');
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; role: string; online: boolean }>>([]);

    const chatEndRef = useRef<HTMLDivElement | null>(null);
    const chatPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const lastMsgTsRef = useRef<number>(0);

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
                setCode(autoFormatCode(p.starterCode?.[defaultLang] ?? '', defaultLang));
            } catch {
                setLoadError(true);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [hackathonId, retryKey]);

    // ── Team chat: initial load + 5-second polling ──
    useEffect(() => {
        let active = true;

        const loadInitial = async () => {
            const msgs = await HackathonService.getChatMessages(hackathonId);
            if (!active || !msgs.length) return;
            setChatMessages(msgs.map(m => ({ ...m, type: m.type as ChatMessage['type'] })));
            lastMsgTsRef.current = msgs[msgs.length - 1].timestamp;
        };
        loadInitial();

        chatPollRef.current = setInterval(async () => {
            const msgs = await HackathonService.getChatMessages(hackathonId, lastMsgTsRef.current || undefined);
            if (!active || !msgs.length) return;
            setChatMessages(prev => {
                const existingIds = new Set(prev.map(m => m.id));
                const fresh = msgs.filter(m => !existingIds.has(m.id))
                    .map(m => ({ ...m, type: m.type as ChatMessage['type'] }));
                if (!fresh.length) return prev;
                return [...prev, ...fresh];
            });
            lastMsgTsRef.current = msgs[msgs.length - 1].timestamp;
        }, 5000);

        return () => {
            active = false;
            if (chatPollRef.current) clearInterval(chatPollRef.current);
        };
    }, [hackathonId]);

    // ── Load team members dynamically ──
    useEffect(() => {
        HackathonService.getUserTeams(hackathonId).then(teams => {
            const myTeam = teams[0];
            if (myTeam) {
                setTeamMembers(myTeam.members.map(m => ({
                    id: m.id, name: m.name, role: m.role, online: m.status === 'JOINED',
                })));
            }
        }).catch(() => { });
    }, [hackathonId]);

    // ── Auto-scroll chat to latest message ──
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

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
                if (next >= MAX_VIOLATIONS) {
                    setShowScoreZeroModal(true);
                    setWarningMsg(`Violation ${next}: ${msg}`);
                } else {
                    setWarningMsg(next === MAX_VIOLATIONS - 1
                        ? `${msg} — Warning: next violation will set your score to 0.`
                        : msg);
                }
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
        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerViolation('Tab switch detected! Stay on this page during the hackathon.');
                // setShowTabBlockOverlay(true);
            }
        };
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
        setFsView('problem');
        setViolations(0);
        setShowWarning(false);
        // setShowTabBlockOverlay(false);
        setShowScoreZeroModal(false);
    };

    const exitFullscreen = () => {
        if (document.fullscreenElement) document.exitFullscreen?.().catch(() => { });
        setIsFullscreen(false);
        onClose?.();
    };

    const handleLangChange = useCallback((lang: string) => {
        setLanguage(lang);
        setCode(autoFormatCode(problem?.starterCode?.[lang] ?? `// ${lang} starter code\n// Write your solution here\n`, lang));
        setLangOpen(false);
        setCaseResults([]);
        setCustomResult(null);
    }, [problem]);

    const handleReset = useCallback(() => {
        setCode(autoFormatCode(problem?.starterCode?.[language] ?? '', language));
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
            markHackathonSubmitted(hackathonId);
            toast.success('Solution submitted successfully!', {
                description: result?.submissionId ? `Submission ID: ${result.submissionId}` : undefined,
            });
            if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
            navigate('/hackathons', { replace: true });
        } catch {
            // submission error — global toast already shown by the axios interceptor; keep form open
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

    const handleSendChat = useCallback(async () => {
        if (!chatInput.trim()) return;
        const tempId = `temp-${Date.now()}`;
        const tempMsg: ChatMessage = {
            id: tempId,
            sender: 'You',
            text: chatInput.trim(),
            timestamp: Date.now(),
            type: 'message',
        };
        setChatMessages(prev => [...prev, tempMsg]);
        setChatInput('');
        const sent = await HackathonService.sendChatMessage(hackathonId, { text: tempMsg.text, type: 'message' });
        if (sent) {
            const real: ChatMessage = { ...sent, type: sent.type as ChatMessage['type'] };
            setChatMessages(prev => prev.map(m => m.id === tempId ? real : m));
            lastMsgTsRef.current = Math.max(lastMsgTsRef.current, real.timestamp);
        }
    }, [chatInput, hackathonId]);

    const handleShareCode = useCallback(async () => {
        const tempId = `temp-${Date.now()}`;
        const tempMsg: ChatMessage = {
            id: tempId,
            sender: 'You',
            text: `Shared a ${language} code snapshot`,
            timestamp: Date.now(),
            type: 'code-share',
            code,
            language,
        };
        setChatMessages(prev => [...prev, tempMsg]);
        setShowTeamPanel(true);
        setTeamChatTab('chat');
        const sent = await HackathonService.sendChatMessage(hackathonId, {
            text: tempMsg.text, type: 'code-share', code, language,
        });
        if (sent) {
            const real: ChatMessage = { ...sent, type: sent.type as ChatMessage['type'] };
            setChatMessages(prev => prev.map(m => m.id === tempId ? real : m));
            lastMsgTsRef.current = Math.max(lastMsgTsRef.current, real.timestamp);
        }
    }, [code, language, hackathonId]);

    const languages = problem?.supportedLanguages ?? [];
    const fileExt = (lang: string) => FILE_EXT_MAP[lang.toLowerCase()] ?? lang.toLowerCase();

    // ── Sub-renders ──
    const renderLangDropdown = () => (
        <div className="relative">
            <button
                onClick={() => setLangOpen(p => !p)}
                className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-700 hover:bg-slate-50 transition-all"
            >
                <Code2 size={15} className="text-[#4F46E5]" />
                {language}
                <ChevronDown size={14} className={`text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
                <div className="absolute top-12 left-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 w-44 animate-in fade-in zoom-in-95 duration-150">
                    {languages.map(lang => (
                        <button key={lang} onClick={() => handleLangChange(lang)}
                            className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${lang === language ? 'text-[#4F46E5] bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}>
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
            <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wide block mb-1.5">
                Submission Notes <span className="font-bold text-slate-400 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                placeholder="Explain your approach, assumptions, or anything the mentor should know..."
                className="w-full bg-white border border-slate-100 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#3AADDD] transition-all resize-none"
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
                    onClick={handleSubmit}
                    disabled={submitting || !code.trim()}
                    className="flex items-center gap-2 px-8 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
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
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                            <Terminal size={13} className="text-slate-400" /> Test Results
                        </span>
                        {caseResults.length > 0 && !anyRunning && (
                            <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${allPassed ? 'bg-emerald-50 text-emerald-600' : anyError ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                {allPassed ? `✓ ${caseResults.length}/${caseResults.length} Passed` :
                                    anyError ? '⚠ Error' :
                                        `✗ ${failCount} Failed`}
                            </span>
                        )}
                        {anyRunning && (
                            <span className="flex items-center gap-1.5 text-xs font-extrabold text-blue-600 px-2.5 py-1 rounded-full bg-blue-50">
                                <Loader2 size={11} className="animate-spin" /> Running…
                            </span>
                        )}
                    </div>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${resultsOpen ? 'rotate-180' : ''}`} />
                </div>

                {resultsOpen && (
                    <div className={`border-t border-slate-100 overflow-y-auto ${inFullscreen ? 'h-[256px]' : 'max-h-[320px]'}`}>

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
                                        Click <span className="font-extrabold text-slate-600">Run Code</span> to test against sample cases.
                                    </p>
                                )}
                            </div>

                            {/* Selected case detail */}
                            {selCase && (
                                <div className="space-y-3">
                                    {/* Status bar */}
                                    {sel && sel.status !== 'idle' && (
                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-extrabold ${STATUS_CFG[sel.status].bar}`}>
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
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Compilation Error</p>
                                            <pre className="bg-[#180000] text-red-300 text-xs p-3 rounded-xl font-mono overflow-x-auto max-h-28 whitespace-pre-wrap leading-relaxed">{sel.compileError}</pre>
                                        </div>
                                    )}

                                    {/* I/O grid */}
                                    {!sel?.compileError && (
                                        <div className="grid grid-cols-3 gap-2">
                                            <div>
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Input</p>
                                                <pre className="bg-slate-50 border border-slate-100 text-slate-600 text-xs p-3 rounded-xl font-mono overflow-auto max-h-28 whitespace-pre">{selCase.stdin}</pre>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Expected Output</p>
                                                <pre className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs p-3 rounded-xl font-mono overflow-auto max-h-28 whitespace-pre">{selCase.expectedOutput}</pre>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Your Output</p>
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
                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Standard Error</p>
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
                    </div>
                )}
            </div>
        );
    };

    // ── Team panel ──
    const renderTeamPanel = (inline = false) => (
        <div className={inline
            ? 'flex-1 flex flex-col overflow-hidden'
            : 'w-[300px] shrink-0 bg-white border-l border-slate-100 flex flex-col overflow-hidden'}>
            {/* Tab bar */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
                    {(['chat', 'members'] as const).map(t => (
                        <button key={t} onClick={() => setTeamChatTab(t)}
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all ${teamChatTab === t ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            {t === 'chat' ? <><MessageSquare size={11} /> Chat</> : <><Users size={11} /> Members</>}
                        </button>
                    ))}
                </div>
                {!inline && (
                    <button onClick={() => setShowTeamPanel(false)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
                        <X size={14} className="text-slate-400" />
                    </button>
                )}
            </div>

            {/* Chat tab */}
            {teamChatTab === 'chat' && (
                <>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                        {chatMessages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-center">
                                <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                                    <MessageSquare size={20} className="text-slate-300" />
                                </div>
                                <p className="text-xs font-medium text-slate-400 leading-relaxed">No messages yet.<br />Start the conversation!</p>
                            </div>
                        )}
                        {chatMessages.map(msg => (
                            <div key={msg.id} className={`flex flex-col gap-0.5 ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}>
                                <span className="text-[10px] font-bold text-slate-400 px-1">{msg.sender}</span>
                                {msg.type === 'code-share' ? (
                                    <div className="max-w-[230px] bg-[#1E1E2E] rounded-xl p-3 space-y-1.5">
                                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-wide">{msg.language} · code snapshot</p>
                                        <pre className="text-[11px] text-[#CDD6F4] font-mono whitespace-pre-wrap overflow-hidden" style={{ maxHeight: '80px' }}>
                                            {(msg.code ?? '').slice(0, 250)}{(msg.code ?? '').length > 250 ? '\n…' : ''}
                                        </pre>
                                    </div>
                                ) : (
                                    <div className={`max-w-[230px] px-3 py-2 rounded-2xl text-xs font-medium leading-relaxed ${msg.sender === 'You' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-700'}`}>
                                        {msg.text}
                                    </div>
                                )}
                                <span className="text-[9px] text-slate-300 px-1">
                                    {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                </span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                    <div className="p-3 border-t border-slate-100 space-y-2 shrink-0">
                        <button onClick={handleShareCode}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all">
                            <Share2 size={12} className="text-slate-400" /> Share Current Code
                        </button>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                                placeholder="Message team…"
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-[#3AADDD] transition-all"
                                style={{ userSelect: 'text' }}
                            />
                            <button onClick={handleSendChat} disabled={!chatInput.trim()}
                                className="w-9 h-9 bg-[#4F46E5] text-white rounded-xl flex items-center justify-center hover:bg-[#4338CA] disabled:opacity-40 transition-all shrink-0">
                                <Send size={13} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* Members tab */}
            {teamChatTab === 'members' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {teamMembers.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-12 gap-2.5 text-center">
                            <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                                <Users size={20} className="text-slate-300" />
                            </div>
                            <p className="text-xs font-medium text-slate-400 leading-relaxed">No team found.<br />You may be participating solo.</p>
                        </div>
                    )}
                    {teamMembers.map(m => (
                        <div key={m.id} className="flex items-center gap-2.5 px-3 py-2.5 bg-slate-50 rounded-xl">
                            <div className="relative shrink-0">
                                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <span className="text-xs font-extrabold text-[#4F46E5]">{m.name.charAt(0).toUpperCase()}</span>
                                </div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${m.online ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-700 truncate">{m.name}</p>
                                <p className="text-[10px] font-medium text-slate-400">{m.role === 'LEAD' ? 'Team Lead' : 'Member'}</p>
                            </div>
                            {m.online && <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">Online</span>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    // ── Loading ──
    if (loading) return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
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
                <h3 className="text-xl font-extrabold text-slate-900">Could not load problem</h3>
                <p className="text-sm font-medium text-slate-400 mt-2 max-w-xs leading-relaxed">
                    Failed to fetch the hackathon problem. Please check your connection and try again.
                </p>
            </div>
            <button
                onClick={() => setRetryKey(k => k + 1)}
                className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
            >
                Try Again
            </button>
        </div>
    );

    // ── Fullscreen overlay ──
    if (isFullscreen) {
        const fsHeader = (
            <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100 shadow-sm shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <Code2 size={16} className="text-[#4F46E5]" />
                    </div>
                    <div>
                        <p className="text-sm font-extrabold text-slate-900">Secure Code Sandbox</p>
                        <p className="text-xs font-bold text-slate-400">All activity is monitored</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {timeLeft && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold tabular-nums ${timeLeft.h === 0 && timeLeft.m < 30 ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                            <Clock size={13} />
                            {formatTimeLeft(timeLeft)}
                        </div>
                    )}
                    {violations > 0 && (
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold ${violations >= MAX_VIOLATIONS ? 'bg-red-600 text-white' : violations >= MAX_VIOLATIONS - 2 ? 'bg-red-100 text-red-700' : 'bg-red-50 text-red-500'}`}>
                            <AlertTriangle size={13} />
                            {violations}/{MAX_VIOLATIONS} Violation{violations !== 1 ? 's' : ''}
                        </div>
                    )}
                    <button onClick={() => setShowTeamPanel(p => !p)}
                        className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${showTeamPanel ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        <MessageSquare size={13} /> Team
                        {chatMessages.length > 0 && !showTeamPanel && (
                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                    </button>
                    <button onClick={() => setShowExitConfirm(true)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                        <Minimize2 size={13} /> Exit
                    </button>
                </div>
            </div>
        );

        const fsOverlays = (
            <>
                {/* Violation toast */}
                {showWarning && (
                    <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[600] bg-red-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200 w-[360px]">
                        <AlertTriangle size={18} className="shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-extrabold">Violation Detected!</p>
                            <p className="text-xs font-medium opacity-90 mt-0.5">{warningMsg}</p>
                        </div>
                        <button onClick={() => setShowWarning(false)} className="p-1 hover:bg-red-700 rounded-lg transition-colors shrink-0">
                            <X size={15} />
                        </button>
                    </div>
                )}

                {/* Tab-switch blocking overlay — shown when user returns after switching tabs */}
                {/* {showTabBlockOverlay && (
                    <div className="absolute inset-0 z-[750] flex flex-col items-center justify-center gap-6 p-8 text-center" style={{ background: 'rgba(40,5,5,0.97)' }}>
                        <div className="w-20 h-20 bg-red-500/20 rounded-3xl flex items-center justify-center">
                            <AlertTriangle size={40} className="text-red-300" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-white">Tab Switch Detected!</h2>
                            <p className="text-sm font-medium text-red-200 mt-2 max-w-sm leading-relaxed">
                                You switched away from the hackathon sandbox. This has been recorded as a violation. Stay on this page for the entire duration of the hackathon.
                            </p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-sm font-extrabold ${violations >= MAX_VIOLATIONS ? 'bg-red-500/30 text-red-200' : 'bg-white/10 text-white/80'}`}>
                            {violations}/{MAX_VIOLATIONS} Violations
                            {violations >= MAX_VIOLATIONS && <span className="ml-2 text-red-300">— Score will be set to 0</span>}
                        </div>
                        <button
                            onClick={() => setShowTabBlockOverlay(false)}
                            className="px-8 py-3 bg-white text-red-900 rounded-2xl font-extrabold text-sm hover:bg-red-50 transition-all shadow-lg"
                        >
                            I Understand — Return to Hackathon
                        </button>
                    </div>
                )} */}

                {/* Score-zero warning modal — shown after MAX_VIOLATIONS reached */}
                {showScoreZeroModal && (
                    <div className="absolute inset-0 z-[800] bg-black/70 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
                            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">Final Warning</h3>
                                <p className="text-sm font-medium text-slate-500 mt-2 leading-relaxed">
                                    You have reached <strong className="text-red-600">{violations} violation{violations !== 1 ? 's' : ''}</strong>. Your hackathon score will be set to <strong className="text-red-600">0</strong> if any further violations occur.
                                </p>
                                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                                    Do not switch tabs, minimize the window, or paste external code. All activity is being monitored.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowScoreZeroModal(false)}
                                className="w-full py-3 bg-red-500 text-white rounded-xl font-extrabold text-sm hover:bg-red-600 transition-all"
                            >
                                I Understand — Stay on This Page
                            </button>
                        </div>
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
                                <h3 className="text-xl font-extrabold text-slate-900">Leave Hackathon?</h3>
                                <p className="text-sm font-medium text-slate-400 mt-2 leading-relaxed">
                                    Exiting the secure environment will be logged as a violation. Your code is <strong className="text-slate-600">not</strong> automatically submitted.
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowExitConfirm(false)}
                                    className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all">Stay In</button>
                                <button onClick={() => { setShowExitConfirm(false); exitFullscreen(); }}
                                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-extrabold text-sm hover:bg-red-600 transition-all">Exit Anyway</button>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );

        // ── Problem-only fullscreen view (shown first) ──
        if (fsView === 'problem') return (
            <div className="fixed inset-0 z-[500] bg-[#F8F9FC] flex flex-col">
                {fsHeader}
                {fsOverlays}
                <div className="flex-1 overflow-y-auto">
                    <div className="max-w-3xl mx-auto p-8 space-y-6">
                        {problem && (
                            <>
                                <div>
                                    <h2 className="text-2xl font-extrabold text-slate-900">{problem.title}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide ${difficultyStyle(problem.difficulty)}`}>{problem.difficulty}</span>
                                        <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] rounded-lg text-xs font-extrabold">{problem.points} pts</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-800 mb-2">Description</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm" style={{ userSelect: 'text' }}>{problem.description}</p>
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3">Constraints</h3>
                                    <ul className="space-y-2">
                                        {problem.constraints?.map((c, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                                <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">{i + 1}</span>
                                                <span style={{ userSelect: 'text' }}>{c}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-slate-800 mb-3">Examples</h3>
                                    <div className="space-y-3">
                                        {problem.examples?.map((ex, i) => (
                                            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 space-y-1">
                                                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Scenario</p>
                                                <p className="text-sm font-bold text-slate-700" style={{ userSelect: 'text' }}>{ex.label}</p>
                                                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mt-2">Expected Result</p>
                                                <p className="text-sm font-bold text-emerald-600" style={{ userSelect: 'text' }}>{ex.result}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {(problem.testCases ?? []).filter(tc => !tc.isHidden).length > 0 && (
                                    <div>
                                        <h3 className="text-base font-extrabold text-slate-800 mb-3">Sample Test Cases</h3>
                                        <div className="space-y-3">
                                            {(problem.testCases ?? []).filter(tc => !tc.isHidden).map((tc, i) => (
                                                <div key={tc.id} className="border border-slate-100 rounded-2xl overflow-hidden bg-white">
                                                    <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                                        <span className="text-xs font-extrabold text-slate-500">Case {i + 1}</span>
                                                        <span className="text-xs font-medium text-slate-400">{tc.label}</span>
                                                    </div>
                                                    <div className="grid grid-cols-2 divide-x divide-slate-100">
                                                        <div className="p-3">
                                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Input</p>
                                                            <pre className="text-xs font-mono text-slate-600 whitespace-pre">{tc.stdin}</pre>
                                                        </div>
                                                        <div className="p-3">
                                                            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Expected Output</p>
                                                            <pre className="text-xs font-mono text-emerald-700 whitespace-pre">{tc.expectedOutput}</pre>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <div className="shrink-0 bg-white border-t border-slate-100 px-8 py-5 flex items-center justify-center">
                    <button
                        onClick={() => setFsView('split')}
                        className="flex items-center gap-3 px-10 py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-base shadow-lg shadow-indigo-200 hover:bg-[#4338CA] transition-all active:scale-[0.98]"
                    >
                        <Code2 size={18} /> Start Coding
                    </button>
                </div>
            </div>
        );

        // ── Split view (problem + editor side by side) ──
        return (
            <div className="fixed inset-0 z-[500] bg-[#F8F9FC] flex flex-col">
                {fsHeader}
                {fsOverlays}

                {/* Split: Problem | Editor */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Problem panel */}
                    <div className="w-[380px] shrink-0 bg-white border-r border-slate-100 overflow-y-auto p-6 space-y-5">
                        {problem && (
                            <>
                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">{problem?.title}</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide ${difficultyStyle(problem?.difficulty)}`}>{problem?.difficulty}</span>
                                        <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] rounded-lg text-xs font-extrabold">{problem?.points} pts</span>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800 mb-2">Description</h3>
                                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm" style={{ userSelect: 'text' }}>{problem?.description}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800 mb-3">Constraints</h3>
                                    <ul className="space-y-2">
                                        {problem?.constraints?.map((c, i) => (
                                            <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                                <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">{i + 1}</span>
                                                <span style={{ userSelect: 'text' }}>{c}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-sm font-extrabold text-slate-800 mb-3">Examples</h3>
                                    <div className="space-y-3">
                                        {problem?.examples?.map((ex, i) => (
                                            <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Scenario</p>
                                                <p className="text-sm font-bold text-slate-700" style={{ userSelect: 'text' }}>{ex.label}</p>
                                                <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mt-2">Expected Result</p>
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
                                    <button onClick={() => setCode(c => autoFormatCode(c, language))} className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                        <AlignLeft size={13} /> Format
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-extrabold">
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
                    {/* Team panel — right column, toggled from header */}
                    {showTeamPanel && renderTeamPanel()}
                </div>
            </div>
        );
    }

    // ── Normal (tabbed) view ──
    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Tab switcher */}
            <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1 w-fit">
                {(['problem', 'editor'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl font-bold text-sm transition-all capitalize ${tab === t ? 'bg-white text-[#4F46E5] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                        {t === 'problem' ? 'Problem Statement' : 'Code Editor'}
                    </button>
                ))}
            </div>

            {/* Problem Statement */}
            {tab === 'problem' && problem && (
                <div className="bg-white border border-slate-100 rounded-3xl p-8 space-y-6">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-extrabold text-slate-900">{problem.title}</h2>
                            <div className="flex items-center gap-3 mt-2">
                                <span className={`px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wide ${difficultyStyle(problem.difficulty)}`}>{problem.difficulty}</span>
                                <span className="px-3 py-1 bg-indigo-50 text-[#4F46E5] rounded-lg text-xs font-extrabold">{problem.points} pts</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={enterFullscreen}
                                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-100 transition-all">
                                <Maximize2 size={14} /> Fullscreen
                            </button>
                            <button onClick={() => setTab('editor')}
                                className="px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all">
                                Open Editor
                            </button>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-800 mb-2">Description</h3>
                        <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line text-sm">{problem.description}</p>
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-800 mb-3">Constraints</h3>
                        <ul className="space-y-2">
                            {problem?.constraints?.map((c, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                    <span className="w-5 h-5 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs font-extrabold shrink-0 mt-0.5">{i + 1}</span>
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div>
                        <h3 className="text-base font-extrabold text-slate-800 mb-3">Examples</h3>
                        <div className="space-y-3">
                            {problem?.examples?.map((ex, i) => (
                                <div key={i} className="bg-slate-50 rounded-2xl p-4 space-y-1">
                                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide">Scenario</p>
                                    <p className="text-sm font-bold text-slate-700">{ex.label}</p>
                                    <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wide mt-2">Expected Result</p>
                                    <p className="text-sm font-bold text-emerald-600">{ex.result}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Sample test case preview */}
                    {(problem?.testCases ?? []).filter(tc => !tc.isHidden).length > 0 && (
                        <div>
                            <h3 className="text-base font-extrabold text-slate-800 mb-3">Sample Test Cases</h3>
                            <div className="space-y-3">
                                {(problem?.testCases ?? []).filter(tc => !tc.isHidden).map((tc, i) => (
                                    <div key={tc.id} className="border border-slate-100 rounded-2xl overflow-hidden">
                                        <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                            <span className="text-xs font-extrabold text-slate-500">Case {i + 1}</span>
                                            <span className="text-xs font-medium text-slate-400">{tc.label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 divide-x divide-slate-100">
                                            <div className="p-3">
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Input</p>
                                                <pre className="text-xs font-mono text-slate-600 whitespace-pre">{tc.stdin}</pre>
                                            </div>
                                            <div className="p-3">
                                                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Expected Output</p>
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
                                <button onClick={() => setCode(c => autoFormatCode(c, language))} className="flex items-center gap-1.5 h-10 px-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-50 transition-all">
                                    <AlignLeft size={13} /> Format
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-extrabold">
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
                    {/* Team Chat card */}
                    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <div
                            className="flex items-center justify-between px-4 py-2.5 cursor-pointer select-none hover:bg-slate-50/60 transition-colors"
                            onClick={() => setShowTeamPanel(p => !p)}
                        >
                            <div className="flex items-center gap-2">
                                <MessageSquare size={13} className="text-[#4F46E5]" />
                                <span className="text-xs font-extrabold text-slate-700">Team Chat</span>
                                {teamMembers.filter(m => m.online).length > 0 && (
                                    <span className="text-xs font-medium text-slate-400">· {teamMembers.filter(m => m.online).length} online</span>
                                )}
                                {chatMessages.length > 0 && !showTeamPanel && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                                )}
                            </div>
                            <ChevronDown size={14} className={`text-slate-400 transition-transform ${showTeamPanel ? 'rotate-180' : ''}`} />
                        </div>
                        {showTeamPanel && (
                            <div className="border-t border-slate-100 flex" style={{ height: '380px' }}>
                                {renderTeamPanel(true)}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
