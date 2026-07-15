import React, { useEffect, useState } from 'react';
import { Users, Crown, Plus, UserPlus, Loader2, Mail } from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { Team } from '@/schemas/hackathon.schema';
import HackathonJoinModal from './HackathonJoinModal';

interface Props {
    hackathon: { id: string; title: string; startDate: string; endDate: string; status: string };
}

const AVATAR_COLORS = ['bg-indigo-100 text-indigo-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-rose-100 text-rose-600'];

export default function HackathonTeamsPanel({ hackathon }: Props) {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [joinModalOpen, setJoinModalOpen] = useState(false);
    const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);
    const [joinedTeamIds, setJoinedTeamIds] = useState<Set<string>>(new Set(['t1']));

    const canJoin = hackathon.status === 'Open' || hackathon.status === 'Running';

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await HackathonService.getTeams(hackathon.id);
            setTeams(data);
            setLoading(false);
        };
        load();
    }, [hackathon.id]);

    const handleJoinTeam = async (teamId: string) => {
        setJoiningTeamId(teamId);
        try {
            await HackathonService.joinTeamById(teamId);
            setJoinedTeamIds(prev => new Set([...prev, teamId]));
        } catch {
            // global axios interceptor already surfaces the error toast
        } finally {
            setJoiningTeamId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800">Participating Teams</h2>
                    <p className="text-sm font-medium text-slate-400 mt-0.5">{teams.length} teams registered for this hackathon</p>
                </div>
                {canJoin && (
                    <button
                        onClick={() => setJoinModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-95"
                    >
                        <Plus size={16} /> Create Team
                    </button>
                )}
            </div>

            {teams.length === 0 ? (
                <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Users size={28} className="text-slate-300" />
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-700">No teams yet</h3>
                    <p className="text-sm font-medium text-slate-400 mt-1 mb-6">Be the first to create a team for this hackathon.</p>
                    {canJoin && (
                        <button
                            onClick={() => setJoinModalOpen(true)}
                            className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
                        >
                            Create First Team
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {teams?.map(team => {
                        const isLead = team.leadId === 'current-user';
                        const isMember = joinedTeamIds.has(team.id);
                        const isJoining = joiningTeamId === team.id;
                        const isFull = team?.members?.length >= 4;

                        return (
                            <div key={team.id} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all space-y-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] shrink-0">
                                            <Users size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-extrabold text-slate-900">{team?.name}</h3>
                                                {isLead && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wide">
                                                        <Crown size={10} /> Lead
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs font-bold text-slate-400">{team?.members?.length || 0}/4 Members</p>
                                        </div>
                                    </div>

                                    {isMember || isLead ? (
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                                            Joined
                                        </span>
                                    ) : canJoin && !isFull ? (
                                        <button
                                            onClick={() => handleJoinTeam(team.id)}
                                            disabled={isJoining}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-xs hover:bg-[#4338CA] disabled:opacity-60 transition-all shrink-0"
                                        >
                                            {isJoining ? <Loader2 size={12} className="animate-spin" /> : <UserPlus size={12} />}
                                            {isJoining ? 'Joining...' : 'Join'}
                                        </button>
                                    ) : isFull ? (
                                        <span className="px-3 py-1 bg-slate-50 text-slate-400 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shrink-0">Full</span>
                                    ) : null}
                                </div>

                                <p className="text-sm font-medium text-slate-500 leading-relaxed line-clamp-2">{team?.description}</p>

                                <div className="space-y-1.5">
                                    {team?.members?.slice(0, 3)?.map((member, idx) => (
                                        <div key={member.id} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-extrabold ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}>
                                                    {member?.name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <span className="text-xs font-bold text-slate-700">{member?.name}</span>
                                                {member?.role === 'LEAD' && <Crown size={11} className="text-amber-400" />}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {member?.status === 'INVITED' && (
                                                    <span className="flex items-center gap-1 text-[10px] font-bold text-orange-500">
                                                        <Mail size={10} /> Invited
                                                    </span>
                                                )}
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${member?.role === 'LEAD' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                                                    {member?.role}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {team?.members?.length > 3 && (
                                        <p className="text-xs font-bold text-slate-400 pl-9">+{team?.members?.length - 3} more</p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <HackathonJoinModal
                isOpen={joinModalOpen}
                onClose={() => setJoinModalOpen(false)}
                hackathon={hackathon}
            />
        </div>
    );
}
