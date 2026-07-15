import React, { useEffect, useState } from 'react';
import {
    Trophy, Cpu, Zap, Database, Settings, Cloud, Link as LinkIcon,
    Loader2, CheckCircle2, Lock, Users, Send
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { Hackathon } from '@/schemas/hackathon.schema';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isHackathonSubmitted } from '@/lib/submissionStore';
import { useCourseCompletionGate } from '@/hooks/useCourseCompletionGate';
import HackathonJoinModal from './HackathonJoinModal';

const iconMap: Record<string, React.ElementType> = {
    trophy: Trophy, cpu: Cpu, zap: Zap, database: Database, settings: Settings, cloud: Cloud, link: LinkIcon
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const canJoinHackathon = (status: string, isRegistered: boolean) => !isRegistered && (status === 'Open' || status === 'Running');

// Joined / Submitted / Result Announced mini-stepper — mirrors the tracker
// on the hackathon detail page, condensed into a labeled table column.
function StatusFlags({ hack, submitted }: { hack: Hackathon; submitted: boolean }) {
    const steps = [
        { label: 'Joined', done: !!hack.isRegistered, icon: Users },
        { label: 'Submitted', done: submitted, icon: Send },
        { label: 'Result', done: !!hack.isPublished, icon: Trophy },
    ];
    return (
        <div className="flex items-center justify-center">
            {steps.map((s, i) => (
                <React.Fragment key={s.label}>
                    <div className="flex flex-col items-center gap-1 w-14" title={s.label}>
                        <span
                            className={`flex items-center justify-center w-7 h-7 rounded-full border-2 transition-colors ${s.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 text-slate-300'
                                }`}
                        >
                            <s.icon size={12} />
                        </span>
                        <span className={`text-[9px] font-extrabold uppercase tracking-wide ${s.done ? 'text-emerald-600' : 'text-slate-300'}`}>
                            {s.label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`w-5 h-0.5 mb-4 shrink-0 ${s.done && steps[i + 1].done ? 'bg-emerald-300' : 'bg-slate-100'}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default function HackathonListing() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { isStudent, allCoursesCompleted, checked } = useCourseCompletionGate();
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [loading, setLoading] = useState(true);
    const [joiningHackathon, setJoiningHackathon] = useState<Hackathon | null>(null);

    useEffect(() => {
        const load = async () => {
            const data = await HackathonService.getHackathons();
            setHackathons(data);
            setLoading(false);
        };
        load();
    }, []);

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Closed': return 'bg-[#ec1703] text-white';
            case 'Running': return 'bg-[#10B981] text-white';
            case 'Open': return 'bg-[#2563EB] text-white';
            case 'UpComing': return 'bg-[#FBBF24] text-white';
            default: return 'bg-slate-100 text-slate-500';
        }
    };

    if (loading) return (
        <div className="h-[60vh] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Hackathon</h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Welcome back, {user?.fullName?.split(' ')[0]}! 👋
                    </p>
                    <p className="text-sm text-slate-400 font-medium">Continue your learning journey and track your progress.</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-slate-100 rounded-[32px] shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Hackathon</th>
                                <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Progress</th>
                                <th className="px-8 py-5 text-[11px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {hackathons.map((hack) => {
                                const Icon = iconMap[hack.iconType ?? ''] || Trophy;
                                const submitted = !!hack.isSubmit || isHackathonSubmitted(hack.id);
                                const otherwiseJoinable = !submitted && canJoinHackathon(hack.status, hack.isRegistered ?? false);
                                const courseLocked = isStudent && checked && !allCoursesCompleted && otherwiseJoinable;
                                const joinable = otherwiseJoinable && !courseLocked;
                                return (
                                    <tr key={hack.id} className={`transition-colors group ${submitted ? 'bg-slate-50/60' : 'hover:bg-slate-50/50'}`}>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl transition-transform group-hover:scale-110 ${submitted ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                                    {submitted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                                                </div>
                                                <span className={`font-bold ${submitted ? 'text-slate-400' : 'text-slate-800'}`}>{hack.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`font-bold text-sm ${submitted ? 'text-slate-400' : 'text-slate-600'}`}>
                                                From {formatDate(hack.startDate)} - To {formatDate(hack.endDate)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            {submitted ? (
                                                <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-600">
                                                    <CheckCircle2 size={11} /> Submitted
                                                </span>
                                            ) : (
                                                <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${getStatusStyle(hack.status)}`}>
                                                    {hack.status}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <StatusFlags hack={hack} submitted={submitted} />
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                {submitted ? (
                                                    <span className="px-5 py-2 rounded-xl font-bold text-xs text-slate-400 border-2 border-dashed border-slate-200 cursor-not-allowed">
                                                        Solution Submitted
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => navigate(`/hackathons/${hack.id}`)}
                                                            className="px-5 py-2 border-2 border-slate-100 rounded-xl font-bold text-xs text-slate-600 hover:bg-white hover:border-slate-300 transition-all"
                                                        >
                                                            View Details
                                                        </button>
                                                        {joinable && (
                                                            <button
                                                                onClick={() => setJoiningHackathon(hack)}
                                                                className="px-6 py-2 bg-[#4F46E5] text-white rounded-xl font-bold text-xs hover:bg-[#4338CA] shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                                            >
                                                                Join
                                                            </button>
                                                        )}
                                                        {courseLocked && (
                                                            <button
                                                                disabled
                                                                title="Complete all your courses to unlock hackathon joining"
                                                                className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-400 rounded-xl font-bold text-xs border-2 border-dashed border-slate-200 cursor-not-allowed"
                                                            >
                                                                <Lock size={12} /> Locked
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {joiningHackathon && (
                <HackathonJoinModal
                    isOpen={!!joiningHackathon}
                    onClose={() => setJoiningHackathon(null)}
                    hackathon={joiningHackathon}
                />
            )}
        </div>
    );
}
