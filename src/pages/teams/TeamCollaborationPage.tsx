import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users, UserPlus, Loader2, Settings, Code2, Target,
  Sparkles, Database, GitFork, ArrowLeft, ChevronRight,
} from 'lucide-react';
import { TeamService, TeamCardData, MyTeamData, HACKATHON_COLOR_MAP } from '@/services/team.service';
import CreateTeamModal from './CreateTeamModal';
import MyTeamSection from './MyTeamSection';

const ICON_MAP: Record<string, React.ReactNode> = {
  settings: <Settings size={20} className="text-white" />,
  code:     <Code2 size={20} className="text-white" />,
  target:   <Target size={20} className="text-white" />,
  network:  <GitFork size={20} className="text-white" />,
  sparkle:  <Sparkles size={20} className="text-white" />,
  database: <Database size={20} className="text-white" />,
};

function getHackathonColor(name: string): string {
  return HACKATHON_COLOR_MAP[name] ?? '#4F46E5';
}

// ── My Team Banner Card (shown in list view) ─────────────────────────────────

function MyTeamBannerCard({ team, onManage }: { team: MyTeamData; onManage: () => void }) {
  const filledCount = team.members.length;
  const fillPercent = Math.min((filledCount / team.maxMembers) * 100, 100);

  return (
    <div
      onClick={onManage}
      className="group bg-white border-2 border-[#4F46E5]/20 rounded-[24px] p-6 shadow-sm shadow-indigo-50 hover:border-[#3AADDD]/50 hover:shadow-md hover:shadow-indigo-100 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center gap-5"
    >
      {/* Icon + team info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-[#4F46E5] flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200">
          <Users size={22} className="text-white" />
        </div>
        <div className="min-w-0">
          <span className="inline-block text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest mb-0.5">
            My Team
          </span>
          <p className="text-lg font-extrabold text-slate-900 truncate leading-tight">{team.name}</p>
          <p className="text-xs font-bold text-indigo-400 mt-0.5 truncate">{team.hackathonName}</p>
        </div>
      </div>

      {/* Member progress */}
      <div className="w-full sm:w-44 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Members</span>
          <span className="text-sm font-extrabold text-slate-700">{filledCount} / {team.maxMembers}</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-[#4F46E5] transition-all duration-500"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={(e) => { e.stopPropagation(); onManage(); }}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all shrink-0 self-start sm:self-auto"
      >
        <Settings size={15} />
        Manage Team
        <ChevronRight size={14} className="opacity-60 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </div>
  );
}

// ── Public Team Card (join grid) ──────────────────────────────────────────────

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
      <div className="flex items-center gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: team.iconBg }}
        >
          {ICON_MAP[team.iconType] ?? <Users size={20} className="text-white" />}
        </div>
        <div className="min-w-0">
          <p className="text-base font-extrabold text-slate-900 leading-tight truncate">{team.name}</p>
          <p className="text-xs font-bold mt-0.5 truncate" style={{ color: hackColor }}>
            {team.hackathonName}
          </p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Current Member Count
          </span>
          <span className="text-sm font-extrabold text-slate-700">
            {team.memberCount} / {team.maxMembers}
          </span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-emerald-400' : 'bg-[#4F46E5]'}`}
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">
          Team Description
        </p>
        <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2">
          {team.description}
        </p>
      </div>

      {hasJoined ? (
        <div className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-xl font-extrabold text-sm text-center">
          Request Sent ✓
        </div>
      ) : (
        <button
          onClick={() => !isFull && !isRequesting && onRequestJoin(team.id)}
          disabled={isFull || isRequesting}
          className="w-full py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm hover:bg-[#4338CA] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isRequesting ? (
            <><Loader2 size={15} className="animate-spin" /> Requesting...</>
          ) : isFull ? (
            'Team Full'
          ) : (
            <><UserPlus size={15} /> Request to Join</>
          )}
        </button>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeamCollaborationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [myTeams, setMyTeams] = useState<MyTeamData[] | undefined>(undefined);
  const [teams, setTeams] = useState<TeamCardData[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const view = searchParams.get('view');
  const teamIdParam = searchParams.get('id');
  const isDetailView = view === 'my-team' && !!teamIdParam;

  const openMyTeam = (teamId: string) =>
    setSearchParams({ view: 'my-team', id: teamId }, { replace: true });
  const backToList = () => setSearchParams({}, { replace: true });

  useEffect(() => {
    TeamService.getMyTeams().then(setMyTeams);
    TeamService.getAllTeams().then((data) => {
      setTeams(data);
      setLoadingTeams(false);
    });
  }, []);

  const handleRequestJoin = async (teamId: string) => {
    setRequestingId(teamId);
    try {
      await TeamService.requestToJoin(teamId);
      setJoinedIds((prev) => new Set([...prev, teamId]));
    } catch {
      // global axios interceptor already surfaces the error toast
    } finally {
      setRequestingId(null);
    }
  };

  const handleTeamCreated = () => {
    setCreateModalOpen(false);
    TeamService.getAllTeams().then(setTeams);
    TeamService.getMyTeams().then(setMyTeams);
  };

  // ── My Team detail view ──────────────────────────────────────────────────
  if (isDetailView) {
    const activeTeam = myTeams?.find((t) => t.id === teamIdParam);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={backToList}
            className="flex items-center gap-2 text-sm font-extrabold text-slate-500 hover:text-[#4F46E5] transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Teams
          </button>
          <span className="text-slate-200 select-none">/</span>
          <span className="text-sm font-extrabold text-slate-900">
            {activeTeam ? activeTeam.name : 'Manage My Team'}
          </span>
        </div>

        {myTeams === undefined ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
          </div>
        ) : activeTeam ? (
          <MyTeamSection myTeam={activeTeam} />
        ) : (
          <div className="text-center py-24 bg-white border border-slate-100 rounded-3xl">
            <p className="text-sm font-medium text-slate-400">Team not found.</p>
            <button
              onClick={backToList}
              className="mt-4 px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm hover:bg-[#4338CA] transition-all"
            >
              Browse Teams
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────
  const myTeamIds = new Set((myTeams ?? []).map((t) => t.id));
  const otherTeams = teams.filter((t) => !myTeamIds.has(t.id));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-extrabold text-slate-900">Team Collaboration Hub</h1>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
        >
          <Users size={16} />
          Create Team
        </button>
      </div>

      {myTeams === undefined ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
        </div>
      ) : (
        <div className="space-y-8">
          {/* My Teams section */}
          {myTeams.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                  My Teams
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  {myTeams.length} team{myTeams.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
                {myTeams.map((team) => (
                  <MyTeamBannerCard
                    key={team.id}
                    team={team}
                    onManage={() => openMyTeam(team.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* All Teams grid */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
                All Teams
              </h2>
              {!loadingTeams && (
                <span className="text-xs font-bold text-slate-400">
                  {otherTeams.length} team{otherTeams.length !== 1 ? 's' : ''} available
                </span>
              )}
            </div>

            {loadingTeams ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-[#4F46E5]" size={28} />
              </div>
            ) : otherTeams.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
                <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Users size={24} className="text-slate-300" />
                </div>
                <h3 className="text-base font-extrabold text-slate-700">No teams available</h3>
                <p className="text-sm font-medium text-slate-400 mt-1 mb-5">
                  Be the first to create a team for a hackathon.
                </p>
                <button
                  onClick={() => setCreateModalOpen(true)}
                  className="px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
                >
                  Create First Team
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {otherTeams.map((team) => (
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
          </section>
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
