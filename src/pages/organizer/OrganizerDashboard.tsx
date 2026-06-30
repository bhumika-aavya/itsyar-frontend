import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Eye, Trash2, Loader2, Calendar, Users,
    Globe, ChevronRight, Trophy, Clock, CheckCircle2, Zap
} from 'lucide-react';
import { OrganizerService, OrganizerHackathon } from '@/services/organizer.service';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    Open:      { label: 'Open',      color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
    Running:   { label: 'Running',   color: 'bg-blue-50 text-blue-600',       dot: 'bg-blue-400' },
    UpComing:  { label: 'Upcoming',  color: 'bg-amber-50 text-amber-600',     dot: 'bg-amber-400' },
    COMPLETED: { label: 'Completed', color: 'bg-slate-100 text-slate-500',    dot: 'bg-slate-400' },
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export default function OrganizerDashboard() {
    const navigate = useNavigate();
    const [hackathons, setHackathons] = useState<OrganizerHackathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await OrganizerService.getMyHackathons();
        setHackathons(data);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        setDeletingId(id);
        await OrganizerService.deleteHackathon(id);
        setHackathons(prev => prev.filter(h => h.id !== id));
        setDeletingId(null);
    };

    const counts = {
        total: hackathons.length,
        active: hackathons.filter(h => h.status === 'Running' || h.status === 'Open').length,
        upcoming: hackathons.filter(h => h.status === 'UpComing').length,
        completed: hackathons.filter(h => h.status === 'COMPLETED').length,
    };

    const stats = [
        { label: 'Total',     value: counts.total,     Icon: Trophy,        bg: 'bg-indigo-50',  color: 'text-[#4F39F6]' },
        { label: 'Active',    value: counts.active,    Icon: Zap,           bg: 'bg-emerald-50', color: 'text-emerald-600' },
        { label: 'Upcoming',  value: counts.upcoming,  Icon: Clock,         bg: 'bg-amber-50',   color: 'text-amber-600' },
        { label: 'Completed', value: counts.completed, Icon: CheckCircle2,  bg: 'bg-slate-50',   color: 'text-slate-500' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 md:px-10 md:py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-[#4F39F6] mb-1">Organizer Portal</p>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Manage Hackathons</h1>
                    <p className="text-slate-500 font-medium mt-1">Create, edit, and oversee all your hackathon events.</p>
                </div>
                <button
                    onClick={() => navigate('/organizer/hackathons/create')}
                    className="flex items-center gap-2 px-6 py-3 bg-[#4F39F6] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-[#3f2dd1] transition-all active:scale-95"
                >
                    <Plus size={16} /> Create Hackathon
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ label, value, Icon, bg, color }) => (
                    <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5">
                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                            <Icon size={18} className={color} />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{value}</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
                </div>
            ) : hackathons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-3xl">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <Trophy size={28} className="text-[#4F39F6]" />
                    </div>
                    <p className="font-black text-slate-700 text-lg">No hackathons yet</p>
                    <p className="text-sm text-slate-400 font-medium mt-1 mb-6">Create your first hackathon to get started.</p>
                    <button
                        onClick={() => navigate('/organizer/hackathons/create')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#4F39F6] text-white rounded-2xl font-black text-sm hover:bg-[#3f2dd1] transition-all"
                    >
                        <Plus size={15} /> Create Hackathon
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {hackathons.map(h => {
                        const cfg = STATUS_CONFIG[h.status] ?? STATUS_CONFIG['Open'];
                        const isDeleting = deletingId === h.id;
                        return (
                            <div
                                key={h.id}
                                className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5 hover:border-slate-200 transition-all"
                            >
                                {/* Icon */}
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Trophy size={22} className="text-[#4F39F6]" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-black text-slate-900 text-lg truncate">{h.title}</h3>
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-black shrink-0 ${cfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 line-clamp-1 mb-3">{h.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={13} /> {formatDate(h.startDate)} – {formatDate(h.endDate)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users size={13} /> {h.participantCount} participants
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Globe size={13} /> {h.mode}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-md font-black ${h.problemCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                            {h.problemCount > 0 ? `${h.problemCount} Problem` : 'No Problem Set'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => navigate(`/hackathons/${h.id}`)}
                                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        <Eye size={13} /> View
                                    </button>
                                    <button
                                        onClick={() => navigate(`/organizer/hackathons/${h.id}/edit`)}
                                        className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-xs text-[#4F39F6] hover:bg-indigo-100 transition-all"
                                    >
                                        <Edit2 size={13} /> Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(h.id, h.title)}
                                        disabled={isDeleting}
                                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl font-bold text-xs text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                                    >
                                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        Delete
                                    </button>
                                    <ChevronRight size={16} className="text-slate-300 ml-1" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
