import React, { useEffect, useState } from 'react';
import {
  Pencil, Check, X, UserPlus, RefreshCw, Loader2, Mail, FileText,
} from 'lucide-react';
import {
  TeamService, MyTeamData, MyTeamMember, OutgoingRequest,
} from '@/services/team.service';

interface Props {
  myTeam: MyTeamData;
}

function getInitials(name: string | null, username: string | null): string {
  if (name) return name.charAt(0).toUpperCase();
  if (username) return username.replace('@', '').charAt(0).toUpperCase();
  return '?';
}

function StatusBadge({ status, type }: { status: OutgoingRequest['status']; type: OutgoingRequest['type'] }) {
  if (status === 'REJECTED') {
    return (
      <span className="px-2.5 py-1 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
        REJECTED
      </span>
    );
  }
  if (status === 'APPROVED' && type === 'OPEN_REQUEST') {
    return (
      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
        APPROVED
      </span>
    );
  }
  if (status === 'APPROVED') {
    return (
      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-lg">
        APPROVED
      </span>
    );
  }
  return (
    <span className="px-2.5 py-1 bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg">
      PENDING
    </span>
  );
}

export default function MyTeamSection({ myTeam: initialTeam }: Props) {
  const [team, setTeam] = useState<MyTeamData>(initialTeam);
  const [isEditingName, setIsEditingName] = useState(false);
  const [draftName, setDraftName] = useState(initialTeam.name);
  const [savingName, setSavingName] = useState(false);

  const [isOpenRequest, setIsOpenRequest] = useState(initialTeam.isOpenRequest);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);

  const [requests, setRequests] = useState<OutgoingRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  useEffect(() => {
    TeamService.getMyRequests()
      .then(setRequests)
      .finally(() => setLoadingRequests(false));
  }, []);

  const saveName = async () => {
    if (!draftName.trim() || draftName.trim().length < 2) return;
    setSavingName(true);
    await TeamService.updateTeamName(team.id, draftName.trim());
    setTeam((t) => ({ ...t, name: draftName.trim() }));
    setIsEditingName(false);
    setSavingName(false);
  };

  const handleOpenRequestToggle = async (checked: boolean) => {
    setIsOpenRequest(checked);
    await TeamService.toggleOpenRequest(team.id, checked);
  };

  const handleInvite = async () => {
    const email = inviteEmail.trim();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setInviteError('Enter a valid email address');
      return;
    }
    if (team.members.length >= team.maxMembers) {
      setInviteError('Team is already full');
      return;
    }
    setInviting(true);
    setInviteError('');
    const newMember = await TeamService.inviteMember(team.id, email);
    setTeam((t) => ({ ...t, members: [...t.members, newMember] }));
    setInviteEmail('');
    setShowInviteInput(false);
    setInviting(false);
  };

  const handleResend = async (member: MyTeamMember) => {
    setResendingId(member.id);
    await TeamService.resendInvite(team.id, member.id);
    setResendingId(null);
  };

  const handleWithdraw = async (requestId: string) => {
    setWithdrawingId(requestId);
    await TeamService.withdrawRequest(requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setWithdrawingId(null);
  };

  const refreshRequests = () => {
    setLoadingRequests(true);
    TeamService.getMyRequests()
      .then(setRequests)
      .finally(() => setLoadingRequests(false));
  };

  const filledCount = team.members.length;
  const isEmpty = filledCount < team.maxMembers;

  return (
    <div className="space-y-5">
      {/* ── Your Team Card ── */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-5">
        <h2 className="text-base font-black text-slate-700">
          Your Team:{' '}
          <span className="text-[#4F39F6]">{team.hackathonName}</span>
        </h2>

        {/* Team Name */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">
            Team Name
          </label>
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <>
                <input
                  autoFocus
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setIsEditingName(false); }}
                  className="flex-1 h-11 bg-slate-50 border border-[#4F39F6] rounded-xl px-4 text-sm font-bold text-slate-900 outline-none"
                />
                <button
                  onClick={saveName}
                  disabled={savingName}
                  className="w-9 h-9 bg-[#4F39F6] rounded-xl flex items-center justify-center text-white hover:bg-[#3f2dd1] transition-all"
                >
                  {savingName ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setDraftName(team.name); }}
                  className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 h-11 bg-slate-50 border border-slate-100 rounded-xl px-4 flex items-center">
                  <span className="text-sm font-bold text-slate-800">{team.name}</span>
                </div>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="w-9 h-9 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#4F39F6] hover:border-[#4F39F6] transition-all"
                >
                  <Pencil size={14} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Members */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-black text-slate-700">
              Current Members (max{team.maxMembers})
            </span>
            <span className="text-xs font-bold text-slate-400">
              Team limit: {team.maxMembers} (including user)
            </span>
          </div>

          <div className="space-y-2">
            {team.members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                onResend={() => handleResend(member)}
                resending={resendingId === member.id}
              />
            ))}

            {/* One empty slot */}
            {isEmpty && (
              <div className="flex items-center gap-3 px-4 py-3 border border-dashed border-slate-200 rounded-2xl">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0">
                  <UserPlus size={15} className="text-slate-400" />
                </div>
                <span className="flex-1 text-sm font-bold text-slate-400">Empty</span>
                <button
                  onClick={() => setShowInviteInput(true)}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:border-[#4F39F6] hover:text-[#4F39F6] transition-all"
                >
                  Invite Member
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Inline invite input */}
        {showInviteInput && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                autoFocus
                type="email"
                value={inviteEmail}
                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="Enter email address to invite"
                className={`flex-1 h-11 bg-slate-50 border rounded-xl px-4 text-sm font-medium outline-none transition-all ${inviteError ? 'border-red-400' : 'border-slate-200 focus:border-[#4F39F6]'}`}
              />
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="px-4 h-11 bg-[#4F39F6] text-white rounded-xl font-black text-sm hover:bg-[#3f2dd1] disabled:opacity-60 transition-all flex items-center gap-1.5"
              >
                {inviting ? <Loader2 size={14} className="animate-spin" /> : 'Send'}
              </button>
              <button
                onClick={() => { setShowInviteInput(false); setInviteEmail(''); setInviteError(''); }}
                className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all"
              >
                <X size={15} />
              </button>
            </div>
            {inviteError && <p className="text-xs font-bold text-red-500">{inviteError}</p>}
          </div>
        )}

        {/* Invite CTA */}
        <button
          onClick={() => setShowInviteInput(true)}
          disabled={filledCount >= team.maxMembers}
          className="w-70 py-3 bg-[#4F39F6] text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <UserPlus size={16} />
          Invite Member (Send Request)
        </button>

        {/* Open Request toggle */}
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isOpenRequest}
              onChange={(e) => handleOpenRequestToggle(e.target.checked)}
            />
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isOpenRequest ? 'bg-[#4F39F6] border-[#4F39F6]' : 'border-slate-300 bg-white'}`}>
              {isOpenRequest && <Check size={11} className="text-white" strokeWidth={3} />}
            </div>
          </div>
          <span className="text-sm font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
            Put "Open Request" for users to join
          </span>
        </label>
      </div>

      {/* ── Outgoing Requests Card ── */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-black text-slate-700">Your Outgoing Requests &amp; Status</h2>
          <button
            onClick={refreshRequests}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-[#4F39F6] hover:bg-indigo-50 rounded-xl transition-all"
          >
            <RefreshCw size={15} className={loadingRequests ? 'animate-spin' : ''} />
          </button>
        </div>

        {loadingRequests ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-[#4F39F6]" size={24} />
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm font-medium text-slate-400 text-center py-8">No outgoing requests</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  {['TYPE', 'HACKATHON EVENT', 'REQUEST STATUS', 'ACTION'].map((h) => (
                    <th key={h} className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left pb-3 pr-4">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          {req.type === 'INVITE'
                            ? <Mail size={13} className="text-slate-500" />
                            : <FileText size={13} className="text-slate-500" />
                          }
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-800">
                            {req.type === 'INVITE' ? 'Invite to join' : 'Open Request application'}
                          </p>
                          <p className="text-[11px] font-bold text-slate-400">{req.targetName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="text-xs font-bold text-slate-700">{req.hackathonEvent}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge status={req.status} type={req.type} />
                    </td>
                    <td className="py-3">
                      {req.type === 'INVITE' && req.status === 'APPROVED' ? (
                        <button
                          onClick={() => handleWithdraw(req.id)}
                          disabled={withdrawingId === req.id}
                          className="text-xs font-black text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          {withdrawingId === req.id ? 'Withdrawing...' : 'Withdraw'}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function MemberRow({
  member, onResend, resending,
}: {
  member: MyTeamMember; onResend: () => void; resending: boolean;
}) {
  const initials = getInitials(member.name, member.username);
  const displayName = member.isSelf
    ? `${member.name} (Me)`
    : member.username ?? member.name ?? member.email;
  const statusLabel = member.isSelf
    ? 'Status: Approved'
    : 'Status: Pending, invite sent';

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/50 rounded-2xl">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
        style={{ backgroundColor: member.isSelf ? '#1e293b' : '#64748b' }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black text-slate-800 truncate">{displayName}</p>
        <p className="text-xs font-bold text-slate-400">{statusLabel}</p>
      </div>
      {member.isSelf ? (
        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg shrink-0">
          FILLED
        </span>
      ) : (
        <button
          onClick={onResend}
          disabled={resending}
          className="text-xs font-black text-[#4F39F6] hover:underline underline-offset-2 disabled:opacity-50 shrink-0 transition-opacity"
        >
          {resending ? 'Sending...' : 'Resend Invite'}
        </button>
      )}
    </div>
  );
}
