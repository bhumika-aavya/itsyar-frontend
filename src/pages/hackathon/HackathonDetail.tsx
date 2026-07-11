import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, Users, Globe,
    BarChart2, Loader2, Trophy,
    ChevronDown, Play, Lightbulb, CheckCircle2, AlertTriangle, Clock
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { HackathonDetail as HackathonDetailType } from '@/schemas/hackathon.schema';
import Timeline from './HackathonTimeline';
import HackathonJoinModal from './HackathonJoinModal';
import HackathonTeamsPanel from './HackathonTeamsPanel';
type Tab = 'Overview' | 'Rules' | 'Timeline' | 'Judging' | 'Prices' | 'FAQs' | 'Teams';

const canJoin = (status: string) => status === 'Open' || status === 'Running';

const formatDate = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const isDateBetween = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
};

export default function HackathonDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<HackathonDetailType | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('Overview');
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [sidebarCountdown, setSidebarCountdown] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (id) {
                const res = await HackathonService.getHackathonById(id);
                setData(res);
                setIsRegistered(res.isRegistered ?? false);
            }
        };
        load();
    }, [id]);

    // Sidebar countdown — to start if upcoming, to end if live
    useEffect(() => {
        if (!data) return;
        const now = new Date();
        const start = new Date(data.startDate);
        const end = new Date(data.endDate);
        const live = now >= start && now <= end;
        const target = live ? end : start;
        if (!live && target <= now) return;

        const tick = () => {
            const diff = target.getTime() - Date.now();
            if (diff <= 0) { setSidebarCountdown(null); return; }
            const d = Math.floor(diff / 86_400_000);
            const h = Math.floor((diff % 86_400_000) / 3_600_000);
            const m = Math.floor((diff % 3_600_000) / 60_000);
            setSidebarCountdown(
                d > 0
                    ? `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
                    : `${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m`
            );
        };
        tick();
        const interval = setInterval(tick, 60_000);
        return () => clearInterval(interval);
    }, [data]);

    if (!data) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
        </div>
    );

    const isHackathonLive = isDateBetween(data.startDate, data.endDate);
    const isIdeationLive = !!(data as any).ideationStartDate && isDateBetween((data as any).ideationStartDate, (data as any).ideationEndDate);
    const openSandbox = () => {
        if (!isRegistered) { setIsJoinModalOpen(true); return; }
        navigate(`/hackathons/${id}/sandbox`, {
            state: { hackathonStatus: data.status, hackathonEndDate: data.endDate },
        });
    };

    const handleModalClose = () => {
        setIsJoinModalOpen(false);
    };

    const hackathonRef = {
        id: id!,
        title: data.title,
        startDate: data.startDate,
        endDate: data.endDate,
        status: data.status,
    };

    const tabs: Tab[] = ['Overview', 'Rules', 'Timeline', 'Judging', 'Prices', 'FAQs', 'Teams'];

    return (
        <>
            <div className="max-w-7xl mx-auto p-6 md:px-10 md:py-8 text-left animate-in fade-in duration-500">
                <button
                    onClick={() => navigate('/hackathons')}
                    className="flex items-center gap-2 text-[#4F46E5] font-bold text-sm mb-6 hover:opacity-80 transition-all"
                >
                    <ChevronLeft size={18} /> Back to Hackathons
                </button>

                <div className="grid lg:grid-cols-3 gap-16 items-start">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <div className="flex items-center gap-4">
                                    <h1 className="text-5xl font-extrabold text-slate-900 tracking-tight">{data.title}</h1>
                                    <span className="text-4xl">🏆</span>
                                </div>
                                <p className="text-xl text-slate-500 font-medium leading-relaxed">
                                    Compete, collaborate, and code your way to the top.
                                </p>
                            </div>

                            <section className="space-y-2">
                                <h2 className="text-2xl font-bold text-[#3215B1]">About this Hackathon</h2>
                                <p className="text-lg text-slate-600 leading-relaxed font-medium">{data?.description}</p>
                            </section>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex items-center gap-8 border-b border-slate-100 px-2 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap shrink-0 ${activeTab === tab ? 'text-[#4F46E5]' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab}
                                    {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4F46E5] rounded-t-full" />}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="pt-2">
                            {activeTab === 'Overview' && (
                                <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                                    <section>
                                        <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Overview</h2>
                                        <p className="text-slate-500 font-medium text-lg leading-relaxed">{data?.description}</p>
                                    </section>
                                    <div className="grid grid-cols-1 md:grid-cols-4 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                        <StatBox label="Team Size" value={data?.teamSize} />
                                        <StatBox label="Registration Ends" value={data?.registrationsDeadline} />
                                        <StatBox label="Mode" value={data?.mode} isBlue />
                                        <StatBox label="Participants" value={data?.participantCount} noBorder />
                                    </div>

                                    {/* Ideation Phase CTA */}
                                    {isIdeationLive && (
                                        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100 rounded-3xl p-8 flex items-center justify-between gap-6">
                                            <div>
                                                <p className="text-xs font-extrabold uppercase tracking-widest text-amber-600 mb-1">Ideation Phase Active</p>
                                                <h3 className="text-xl font-extrabold text-slate-900">Now is the time to brainstorm</h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1">Plan your approach and prepare your team before the hackathon begins.</p>
                                            </div>
                                            <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center shrink-0">
                                                <Lightbulb size={28} className="text-amber-600" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Start Hackathon CTA inside Overview when live */}
                                    {isHackathonLive && (
                                        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-8 flex items-center justify-between gap-6">
                                            <div>
                                                <p className="text-xs font-extrabold uppercase tracking-widest text-[#4F46E5] mb-1">Hackathon is Live Now</p>
                                                <h3 className="text-xl font-extrabold text-slate-900">
                                                    {isRegistered ? 'Ready to compete?' : 'Registration required'}
                                                </h3>
                                                <p className="text-sm font-medium text-slate-500 mt-1">
                                                    {isRegistered
                                                        ? 'Open the secure sandbox and start coding your solution.'
                                                        : 'You must register before accessing the code sandbox.'}
                                                </p>
                                            </div>
                                            <button
                                                onClick={openSandbox}
                                                className="flex items-center gap-2 px-7 py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-200 hover:bg-[#4338CA] transition-all active:scale-95 shrink-0"
                                            >
                                                <Play size={16} fill="white" />
                                                {isRegistered ? 'Start Hackathon' : 'Register Now'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'Rules' && (
                                <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                    <h2 className="text-2xl font-extrabold text-slate-800 mb-4">Hackathon Rules</h2>
                                    <ul className="space-y-4">
                                        {(data as any)?.rules?.map((rule: string, i: number) => (
                                            <li key={i} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#4F46E5] flex items-center justify-center text-xs font-extrabold shrink-0">{i + 1}</div>
                                                <p className="text-slate-600 font-bold text-[15px]">{rule}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {activeTab === 'Timeline' && <Timeline timeline={data?.timeline} />}

                            {activeTab === 'Judging' && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Judging Criteria</h2>
                                    <p className="text-sm font-medium text-slate-400 mb-6">Projects are evaluated across the following dimensions. Each criterion carries a specific weight toward the final score.</p>
                                    {(data as any)?.criteria?.map((c: any, i: number) => (
                                        <div key={i} className="flex items-start gap-5 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex flex-col items-center justify-center shrink-0">
                                                <span className="text-lg font-extrabold text-[#4F46E5]">{c.weight}%</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-base font-extrabold text-slate-900">{c.category}</p>
                                                <p className="text-sm font-medium text-slate-500 mt-0.5">{c.description}</p>
                                            </div>
                                            <div className="w-32 shrink-0 pt-1">
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${c.weight}%` }} />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'Prices' && (
                                <div className="grid md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                                    {(data as any)?.prizes?.map((price: any, i: number) => (
                                        <div key={i} className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-lg text-center relative overflow-hidden group">
                                            <div className="absolute top-0 left-0 w-full h-2 bg-[#4F46E5]" />
                                            <Trophy size={48} className={`mx-auto mb-6 ${i === 0 ? 'text-yellow-400' : 'text-slate-300'}`} />
                                            <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{price.rank}</h3>
                                            <p className="text-4xl font-extrabold text-slate-900 mb-4">{price.amount}</p>
                                            <p className="text-sm font-bold text-slate-500">{price.perk}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'FAQs' && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                    {(data as any)?.faqs?.map((faq: any, i: number) => (
                                        <details key={i} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                            <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                                                <span className="font-extrabold text-slate-800">{faq.q}</span>
                                                <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform" />
                                            </summary>
                                            <div className="px-6 pb-6 text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-4">{faq.a}</div>
                                        </details>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'Teams' && (
                                <HackathonTeamsPanel hackathon={hackathonRef} />
                            )}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR */}
                    <div className="lg:col-span-1 space-y-6 sticky top-28">
                        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 space-y-8">
                            <div className="space-y-5">
                                <SidebarItem icon={Calendar} label="Date" value={`${formatDate(data.startDate)} – ${formatDate(data.endDate)}`} />
                                <SidebarItem icon={Users} label="Registered Teams" value={data.participantCount} />
                                <SidebarItem icon={Globe} label="Mode" value={data.mode} />
                                <SidebarItem icon={BarChart2} label="Difficulty" value={(data as any)?.difficulty ?? 'Intermediate'} />
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-50">
                                {/* Registration status badge */}
                                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold ${data?.isRegistered ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                    }`}>
                                    {data?.isRegistered
                                        ? <CheckCircle2 size={13} />
                                        : <AlertTriangle size={13} />}
                                    {data?.isRegistered ? 'You are registered' : 'Not yet registered'}
                                </div>

                                {/* Countdown to start or end */}
                                {sidebarCountdown && (
                                    <div className="flex items-center justify-between px-3 py-2.5 bg-indigo-50 rounded-xl">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F46E5]">
                                            <Clock size={13} />
                                            {isHackathonLive ? 'Time remaining' : 'Starts in'}
                                        </div>
                                        <span className="text-xs font-extrabold text-[#4F46E5] tabular-nums">{sidebarCountdown}</span>
                                    </div>
                                )}

                                {/* Start Hackathon — shown when today is within the event window */}
                                {isHackathonLive && (
                                    <>
                                        {!data?.isRegistered && (
                                            <p className="text-center text-[11px] font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                                                Register first to enter the sandbox
                                            </p>
                                        )}
                                        <button
                                            onClick={openSandbox}
                                            className={`w-full py-4 text-white rounded-2xl font-extrabold text-sm shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${data?.isRegistered
                                                ? 'bg-emerald-500 shadow-emerald-100 hover:bg-emerald-600'
                                                : 'bg-[#4F46E5] shadow-indigo-100 hover:bg-[#4338CA]'
                                                }`}
                                        >
                                            <Play size={15} fill="white" />
                                            {data?.isRegistered ? 'Start Hackathon' : 'Register to Start'}
                                        </button>
                                    </>
                                )}

                                {canJoin(data.status) ? (
                                    <>
                                        <button
                                            onClick={() => setIsJoinModalOpen(true)}
                                            className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-95"
                                        >
                                            Register &amp; Join
                                        </button>
                                        <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                            Spots filling up fast!
                                        </p>
                                    </>
                                ) : (
                                    <div className="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl font-extrabold text-sm text-center">
                                        {data.status === 'COMPLETED' ? 'Hackathon Ended' : 'Registration Not Open'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Quick team navigation */}
                        <button
                            onClick={() => setActiveTab('Teams')}
                            className="w-full flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-[#3AADDD]/30 hover:bg-indigo-50/20 transition-all group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5]">
                                    <Users size={16} />
                                </div>
                                <span className="text-sm font-bold text-slate-700 group-hover:text-[#4F46E5] transition-colors">View All Teams</span>
                            </div>
                            <ChevronDown size={16} className="text-slate-400 -rotate-90" />
                        </button>
                    </div>
                </div>

                <HackathonJoinModal
                    isOpen={isJoinModalOpen}
                    onClose={handleModalClose}
                    hackathon={hackathonRef}
                />
            </div>
        </>
    );
}

const SidebarItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-start gap-3 group">
        <div className="p-2 bg-slate-50 rounded-lg text-slate-400 shrink-0 group-hover:text-[#4F46E5] transition-colors">
            <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-extrabold text-slate-900 leading-snug mt-0.5">{value}</p>
        </div>
    </div>
);

interface StatBoxProps {
    label: string;
    value: string;
    noBorder?: boolean;
    isBlue?: boolean;
}

const StatBox = ({ label, value, noBorder, isBlue }: StatBoxProps) => (
    <div className={`p-8 text-left ${noBorder ? '' : 'border-r border-slate-100'}`}>
        <p className="text-slate-400 font-bold text-sm mb-1 uppercase tracking-tight">{label}</p>
        <p className={`text-xl font-extrabold ${isBlue ? 'text-[#4F46E5]' : 'text-[#1A1C1E]'}`}>{value}</p>
    </div>
);
