import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, CheckCircle2, XCircle, Clock,
    Loader2, Code2, ChevronRight, Filter, Search
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { MentorSubmission } from '@/schemas/hackathon.schema';

const STATUS_CONFIG = {
    PENDING:  { label: 'Pending Review', color: 'bg-amber-50 text-amber-600',  icon: Clock,         dot: 'bg-amber-400' },
    ACCEPTED: { label: 'Accepted',       color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2, dot: 'bg-emerald-400' },
    REJECTED: { label: 'Rejected',       color: 'bg-red-50 text-red-500',       icon: XCircle,      dot: 'bg-red-400' },
};

const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
};

export default function MentorDashboard() {
    const navigate = useNavigate();
    const [submissions, setSubmissions] = useState<MentorSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'>('ALL');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await HackathonService.getMentorSubmissions();
            setSubmissions(data);
            setLoading(false);
        };
        load();
    }, []);

    const filtered = submissions.filter(s => {
        const matchFilter = filter === 'ALL' || s.status === filter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            s.participantName.toLowerCase().includes(q) ||
            s.hackathonTitle.toLowerCase().includes(q) ||
            s.language.toLowerCase().includes(q);
        return matchFilter && matchSearch;
    });

    const counts = {
        ALL: submissions.length,
        PENDING: submissions.filter(s => s.status === 'PENDING').length,
        ACCEPTED: submissions.filter(s => s.status === 'ACCEPTED').length,
        REJECTED: submissions.filter(s => s.status === 'REJECTED').length,
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:px-10 md:py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#4F46E5] mb-1">Mentor Portal</p>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Submission Reviews</h1>
                    <p className="text-slate-500 font-medium mt-1">Review and evaluate hackathon submissions from participants.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-extrabold">
                        {counts.PENDING} Pending
                    </div>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {(Object.entries(counts) as [typeof filter, number][]).map(([key, count]) => {
                    const cfg = key === 'ALL'
                        ? { label: 'Total', color: 'text-slate-700', bg: 'bg-slate-50', Icon: ClipboardList }
                        : { label: STATUS_CONFIG[key].label, color: key === 'PENDING' ? 'text-amber-600' : key === 'ACCEPTED' ? 'text-emerald-600' : 'text-red-500', bg: STATUS_CONFIG[key].color.split(' ')[0], Icon: STATUS_CONFIG[key].icon };
                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`p-5 rounded-2xl text-left border transition-all ${filter === key ? 'border-[#4F46E5] shadow-md shadow-indigo-50' : 'border-slate-100 hover:border-slate-200'} bg-white`}
                        >
                            <div className={`w-9 h-9 ${cfg.bg} rounded-xl flex items-center justify-center mb-3`}>
                                <cfg.Icon size={18} className={cfg.color} />
                            </div>
                            <p className="text-2xl font-extrabold text-slate-900">{count}</p>
                            <p className="text-xs font-bold text-slate-400 mt-0.5">{cfg.label}</p>
                        </button>
                    );
                })}
            </div>

            {/* Filters + Search */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, hackathon, language..."
                        className="w-full h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-[#3AADDD] transition-all"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={14} className="text-slate-400" />
                    {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${filter === f ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                        >
                            {f === 'ALL' ? 'All' : STATUS_CONFIG[f].label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Submissions list */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                        <ClipboardList size={28} className="text-slate-300" />
                    </div>
                    <p className="font-extrabold text-slate-700">No submissions found</p>
                    <p className="text-sm text-slate-400 font-medium mt-1">Try adjusting your filters.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(sub => {
                        const cfg = STATUS_CONFIG[sub.status];
                        return (
                            <button
                                key={sub.submissionId}
                                onClick={() => navigate(`/mentor/submissions/${sub.submissionId}`)}
                                className="w-full bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-5 hover:border-[#3AADDD]/30 hover:shadow-md hover:shadow-indigo-50/50 transition-all text-left group"
                            >
                                {/* Language badge */}
                                <div className="w-12 h-12 bg-[#1E1E2E] rounded-xl flex items-center justify-center shrink-0">
                                    <Code2 size={20} className="text-[#CDD6F4]" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="font-extrabold text-slate-900 truncate">{sub.participantName}</p>
                                        <span className="text-slate-300 font-bold">·</span>
                                        <p className="text-sm font-bold text-slate-500 truncate">{sub.hackathonTitle}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs font-bold text-slate-400">{sub.language}</span>
                                        <span className="text-slate-200 font-bold">|</span>
                                        <span className="text-xs font-bold text-slate-400">{sub.participantEmail}</span>
                                    </div>
                                </div>

                                {/* Status + time */}
                                <div className="flex items-center gap-4 shrink-0">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-xs font-bold text-slate-400">Submitted</p>
                                        <p className="text-xs font-extrabold text-slate-600">{timeAgo(sub.submittedAt)}</p>
                                    </div>
                                    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold ${cfg.color}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                        {cfg.label}
                                    </span>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-[#4F46E5] transition-colors" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
