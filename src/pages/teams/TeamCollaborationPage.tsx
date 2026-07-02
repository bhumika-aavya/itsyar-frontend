import React, { useEffect, useState } from 'react';
import {
  Users, UserPlus, Loader2, Settings, Code2, Target,
  Share2, Sparkles, Database, GitFork,
} from 'lucide-react';
import { TeamService, TeamCardData, HACKATHON_COLOR_MAP } from '@/services/team.service';
import CreateTeamModal from './CreateTeamModal';

const ICON_MAP: Record<string, React.ReactNode> = {
  settings: <Settings size={20} className="text-white" />,
  code:     <Code2 size={20} className="text-white" />,
  target:   <Target size={20} className="text-white" />,
  network:  <GitFork size={20} className="text-white" />,
  sparkle:  <Sparkles size={20} className="text-white" />,
  database: <Database size={20} className="text-white" />,
};

function getHackathonColor(name: string): string {
  return HACKATHON_COLOR_MAP[name] ?? '#4F39F6';
}

interface TeamCardProps {
  team: TeamCardData;
  onRequestJoin: (teamId: string) => void;
  requestingId: string | null;
  joinedIds: Set<string>;
}

function TeamCard({ team, onRequestJoin, requestingId, joinedIds }: TeamCardProps) {
  const isFull = team.memberCount >= team.maxMembers;
  const isRequesting = requestingId === team.id;
  const hasJoined = joinedIds.has(team.id);
  const fillPercent = Math.min((team.memberCount / team.maxMembers) * 100, 100);
  const hackColor = getHackathonColor(team.hackathonName);

  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: team.iconBg }}
        >
          {ICON_MAP[team.iconType] ?? <Users size={20} className="text-white" />}
        </div>
        <div className="min-w-0">
          <p className="text-base font-black text-slate-900 leading-tight truncate">{team.name}</p>
          <p
            className="text-xs font-bold mt-0.5 truncate"
            style={{ color: hackColor }}
          >
            {team.hackathonName}
          </p>
        </div>
      </div>

      {/* Member Count + Progress Bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Current Member Count
          </span>
          <span className="text-sm font-black text-slate-700">
            {team.memberCount} / {team.maxMembers}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isFull ? 'bg-emerald-400' : 'bg-[#4F39F6]'
            }`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
          Team Description
        </p>
        <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
          {team.description}
        </p>
      </div>

      {/* Action Button */}
      {hasJoined ? (
        <div className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-black text-sm text-center">
          Request Sent ✓
        </div>
      ) : (
        <button
          onClick={() => !isFull && !isRequesting && onRequestJoin(team.id)}
          disabled={isFull || isRequesting}
          className="w-full py-3 bg-[#4F39F6] text-white rounded-xl font-black text-sm
            hover:bg-[#3f2dd1] disabled:opacity-50 disabled:cursor-not-allowed
            transition-all flex items-center justify-center gap-2"
        >
          {isRequesting ? (
            <><Loader2 size={15} className="animate-spin" /> Requesting...</>
          ) : isFull ? (
            'Team Full'
          ) : (
            <>
              <UserPlus size={15} />
              Request to Join
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function TeamCollaborationPage() {
  const [teams, setTeams] = useState<TeamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await TeamService.getAllTeams();
      setTeams(data);
      setLoading(false);
    };
    load();
  }, []);

  const handleRequestJoin = async (teamId: string) => {
    setRequestingId(teamId);
    try {
      await TeamService.requestToJoin(teamId);
      setJoinedIds((prev) => new Set([...prev, teamId]));
    } catch (err) {
      console.error('Failed to request join:', err);
    } finally {
      setRequestingId(null);
    }
  };

  const handleTeamCreated = (newTeam: TeamCardData) => {
    setTeams((prev) => [newTeam, ...prev]);
    setCreateModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-black text-slate-900">Team Collaboration Hub</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 border-2 border-slate-200 text-slate-700
              rounded-xl font-black text-sm hover:border-[#4F39F6] hover:text-[#4F39F6] transition-all"
          >
            <Users size={16} />
            Create Team
          </button>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#4F39F6] text-white rounded-xl
              font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
          >
            <UserPlus size={16} />
            Join Team
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
        </div>
      ) : teams.length === 0 ? (
        <div className="text-center py-24 bg-white border border-slate-100 rounded-3xl">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={28} className="text-slate-300" />
          </div>
          <h3 className="text-lg font-black text-slate-700">No teams available</h3>
          <p className="text-sm font-medium text-slate-400 mt-1 mb-6">
            Be the first to create a team for a hackathon.
          </p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-6 py-2.5 bg-[#4F39F6] text-white rounded-xl font-black text-sm
              shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
          >
            Create First Team
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onRequestJoin={handleRequestJoin}
              requestingId={requestingId}
              joinedIds={joinedIds}
            />
          ))}
        </div>
      )}

      {createModalOpen && (
        <CreateTeamModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}
    </div>
  );
}
