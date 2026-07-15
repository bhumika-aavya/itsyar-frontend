import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Mail, Loader2, Check, X, Users } from 'lucide-react';
import { TeamService, TeamInvite } from '@/services/team.service';

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export default function TeamInvitesPage() {
  const navigate = useNavigate();
  const [invites, setInvites] = useState<TeamInvite[] | undefined>(undefined);
  const [actingId, setActingId] = useState<string | null>(null);

  useEffect(() => {
    TeamService.getMyInvites().then(setInvites);
  }, []);

  const handleAccept = async (invite: TeamInvite) => {
    console.log("Accepting invite:", invite);
    setActingId(invite.teamId);
    try {
      await TeamService.acceptInvite(invite.teamId);
      setInvites(prev => (prev ?? []).filter(i => i.id !== invite.teamId));
      toast.success(`You've joined ${invite.teamName}`, {
        description: `Head over to ${invite.hackathonName} to start collaborating.`,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not accept invite');
    } finally {
      setActingId(null);
    }
  };

  const handleDecline = async (invite: TeamInvite) => {
    setActingId(invite.teamId);
    try {
      await TeamService.declineInvite(invite.teamId);
      setInvites(prev => (prev ?? []).filter(i => i.id !== invite.teamId));
      toast.success('Invite declined');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not decline invite');
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
          Team Invites
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-1">
          Invitations from teams asking you to join their hackathon squad.
        </p>
      </div>

      {invites === undefined ? (
        <div className="flex justify-center py-24">
          <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
        </div>
      ) : invites.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Mail size={24} className="text-slate-300" />
          </div>
          <h3 className="text-base font-extrabold text-slate-700">No pending invites</h3>
          <p className="text-sm font-medium text-slate-400 mt-1 mb-5">
            When a team invites you to join their hackathon, it'll show up here.
          </p>
          <button
            onClick={() => navigate('/teams')}
            className="px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
          >
            Browse Teams
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {invites.map(invite => {
            const isActing = actingId === invite.id;
            return (
              <div
                key={invite.id}
                className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Users size={22} className="text-[#4F46E5]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-extrabold text-slate-900 truncate">{invite.teamName}</p>
                  <p className="text-xs font-bold text-indigo-400 mt-0.5 truncate">{invite.hackathonName}</p>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    Invited by <span className="font-bold text-slate-500">{invite.invitedByName}</span> · {fmt(invite.invitedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleDecline(invite)}
                    disabled={isActing}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 text-slate-600 rounded-xl font-extrabold text-sm hover:bg-slate-100 disabled:opacity-50 transition-all"
                  >
                    <X size={15} /> Decline
                  </button>
                  <button
                    onClick={() => handleAccept(invite)}
                    disabled={isActing}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all"
                  >
                    {isActing ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                    Accept
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
