import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ChevronLeft, Calendar, Users, Globe,
    BarChart2, Loader2, Trophy,
    ChevronDown
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { HackathonDetail as HackathonDetailType } from '@/schemas/hackathon.schema';
import Timeline from './HackathonTimeline';

export default function HackathonDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState<HackathonDetailType | null>(null);
    const [activeTab, setActiveTab] = useState('Overview');

    useEffect(() => {
        const load = async () => {
            if (id) {
                const res = await HackathonService.getHackathonById(id);
                setData(res);
            }
        };
        load();
    }, [id]);

    if (!data) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 md:px-10 md:py-8 text-left animate-in fade-in duration-500">

            {/* 1. Top Navigation */}
            <button
                onClick={() => navigate('/hackathons')}
                className="flex items-center gap-2 text-[#4F39F6] font-bold text-sm mb-6 hover:opacity-80 transition-all"
            >
                <ChevronLeft size={18} /> Back to Hackathons
            </button>

            <div className="grid lg:grid-cols-3 gap-16 items-start">

                {/* LEFT COLUMN (70%) */}
                {/* Changed space-y-12 to space-y-8 to tighten general layout */}
                <div className="lg:col-span-2 space-y-8">

                    {/* Header & About Group - Wrapped together to control specific gaps */}
                    <div className="space-y-6">
                        <div className="space-y-1"> {/* Reduced from space-y-4 */}
                            <div className="flex items-center gap-4">
                                <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                                    {data.title}
                                </h1>
                                <span className="text-4xl">🏆</span>
                            </div>
                            <p className="text-xl text-slate-500 font-medium leading-relaxed">
                                Compete, collaborate, and code your way to the top.
                            </p>
                        </div>

                        <section className="space-y-2"> {/* Controlled gap for "About" */}
                            <h2 className="text-2xl font-bold text-[#3215B1]">About this Hackathon</h2>
                            <p className="text-lg text-slate-600 leading-relaxed font-medium">
                                {data?.description}
                            </p>
                        </section>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-10 border-b border-slate-100 px-2">
                        {['Overview', 'Rules', 'Timeline', 'Prices', 'FAQs'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`pb-4 text-base font-bold transition-all relative ${activeTab === tab ? "text-[#4F39F6]" : "text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                {tab}
                                {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#4F39F6] rounded-t-full" />}
                            </button>
                        ))}
                    </div>

                    {/* Dynamic Tab Content */}
                    <div className="pt-2">
                        {activeTab === 'Overview' && (
                            <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
                                <section>
                                    <h2 className="text-2xl font-black text-slate-800 mb-4">Overview</h2>
                                    <p className="text-slate-500 font-medium text-lg leading-relaxed">{data?.description}</p>
                                </section>
                                <div className="grid grid-cols-1 md:grid-cols-4 border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
                                    <StatBox label="Team Size" value={data?.teamSize} />
                                    <StatBox label="Registration Ends" value={data?.registrationDeadline} />
                                    <StatBox label="Mode" value={data?.mode} isBlue />
                                    <StatBox label="Participants" value={data?.participantCount} noBorder />
                                </div>
                            </div>
                        )}
                        {activeTab === 'Rules' && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                                <h2 className="text-2xl font-black text-slate-800 mb-4">Hackathon Rules</h2>
                                <ul className="space-y-4">
                                    {data?.rules.map((rule: string, i: number) => (
                                        <li key={i} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                            <div className="w-6 h-6 rounded-full bg-indigo-50 text-[#4F39F6] flex items-center justify-center text-xs font-black shrink-0">{i + 1}</div>
                                            <p className="text-slate-600 font-bold text-[15px]">{rule}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {activeTab === 'Timeline' && (
                            <Timeline timeline={data?.timeline} />
                        )}
                        {activeTab === 'Prices' && (
                            <div className="grid md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-300">
                                {data?.prices.map((price: any, i: number) => (
                                    <div key={i} className="p-8 bg-white border border-slate-100 rounded-[32px] shadow-lg text-center relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-[#4F39F6]" />
                                        <Trophy size={48} className={`mx-auto mb-6 ${i === 0 ? "text-yellow-400" : "text-slate-300"}`} />
                                        <h3 className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">{price.rank}</h3>
                                        <p className="text-4xl font-black text-slate-900 mb-4">{price.amount}</p>
                                        <p className="text-sm font-bold text-slate-500">{price.perk}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {activeTab === 'FAQs' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                                {data?.faqs.map((faq: any, i: number) => (
                                    <details key={i} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                        <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                                            <span className="font-black text-slate-800">{faq.q}</span>
                                            <ChevronDown className="text-slate-400 group-open:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="px-6 pb-6 text-slate-500 font-medium leading-relaxed border-t border-slate-50 pt-4">
                                            {faq.a}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT SIDEBAR (30%) */}
                <div className="lg:col-span-1 space-y-6 sticky top-28">
                    <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 space-y-8">
                        <div className="space-y-5">
                            <SidebarItem icon={Calendar} label="Date" value={data.startDate} />
                            <SidebarItem icon={Users} label="Registered Teams" value={data.participantCount} />
                            <SidebarItem icon={Globe} label="Mode" value={data.mode} />
                            <SidebarItem icon={BarChart2} label="Difficulty" value="Intermediate" />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <button className="w-full py-4 bg-[#4F39F6] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-[#3f2dd1] transition-all active:scale-95">
                                Register & Join
                            </button>
                            <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                Spots filling up fast!
                            </p>
                            <button className="w-full py-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-black text-sm hover:bg-slate-50 transition-all">
                                Learn More
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const SidebarItem = ({ icon: Icon, label, value }: any) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-[#4F39F6] transition-colors">
                <Icon size={18} />
            </div>
            <span className="text-sm font-bold text-slate-400">{label}</span>
        </div>
        <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
);

interface StatBoxProps {
    label: string;
    value: string;
    noBorder?: boolean;
    isBlue?: boolean;
}

const StatBox = ({ label, value, noBorder, isBlue }: StatBoxProps) => (
    <div className={`p-8 text-left ${noBorder ? "" : "border-r border-slate-100"}`}>
        <p className="text-slate-400 font-bold text-sm mb-1 uppercase tracking-tight">
            {label}
        </p>
        <p className={`text-xl font-black ${isBlue ? "text-[#4F39F6]" : "text-[#1A1C1E]"}`}>
            {value}
        </p>
    </div>
);