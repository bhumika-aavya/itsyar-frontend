import React, { useEffect, useState } from 'react';
import {
    Trophy, Cpu, Zap, Database, Settings, Cloud, Link as LinkIcon,
    Loader2
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { Hackathon } from '@/schemas/hackathon.schema';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import HackathonJoinModal from './HackathonJoinModal';

const iconMap: Record<string, React.ElementType> = {
    trophy: Trophy, cpu: Cpu, zap: Zap, database: Database, settings: Settings, cloud: Cloud, link: LinkIcon
};

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const canJoinHackathon = (status: string) => status === 'Open' || status === 'Running';

export default function HackathonListing() {
    const navigate = useNavigate();
    const { user } = useAuth();
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
            <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hackathon</h1>
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
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hackathon</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest">Date</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-8 py-5 text-[11px] font-black text-slate-400 uppercase tracking-widest text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {hackathons.map((hack) => {
                                const Icon = iconMap[hack.iconType ?? ''] || Trophy;
                                const joinable = canJoinHackathon(hack.status);
                                return (
                                    <tr key={hack.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl bg-indigo-50 text-indigo-500 transition-transform group-hover:scale-110`}>
                                                    <Icon size={20} />
                                                </div>
                                                <span className="font-bold text-slate-800">{hack.title}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="font-bold text-slate-600 text-sm">
                                                From {formatDate(hack.startDate)} - To {formatDate(hack.endDate)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-block px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${getStatusStyle(hack.status)}`}>
                                                {hack.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-center gap-3">
                                                <button
                                                    onClick={() => navigate(`/hackathons/${hack.id}`)}
                                                    className="px-5 py-2 border-2 border-slate-100 rounded-xl font-bold text-xs text-slate-600 hover:bg-white hover:border-slate-300 transition-all"
                                                >
                                                    View Details
                                                </button>
                                                {joinable && (
                                                    <button
                                                        onClick={() => setJoiningHackathon(hack)}
                                                        className="px-6 py-2 bg-[#4F39F6] text-white rounded-xl font-bold text-xs hover:bg-[#3f2dd1] shadow-lg shadow-indigo-100 transition-all active:scale-95"
                                                    >
                                                        Join
                                                    </button>
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
