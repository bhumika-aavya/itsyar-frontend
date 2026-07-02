import React from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { CheckCircle2, Calendar, Users, Globe, MessageSquare, FileText, UserPlus, Trophy } from 'lucide-react';

interface SuccessState {
  hackathonTitle: string;
  formattedDate: string;
  teamName: string | null;
  mode: string;
}

export default function RegistrationSuccessPage() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as SuccessState | null) ?? {
    hackathonTitle: 'CodeSprint 2024',
    formattedDate: '21 May 2024',
    teamName: 'Neural Ninjas V2',
    mode: 'Online',
  };
  const { id } = params;
  const { hackathonTitle, formattedDate, teamName, mode } = state;
  console.log('Hackathon ID:', id); // Log the hackathon ID to the console
  return (
    <div className="max-w-2xl mx-auto pb-28">
      {/* Success icon */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="relative mb-6 flex items-center justify-center w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-indigo-50" />
          <div className="absolute inset-4 rounded-full bg-indigo-100" />
          <div className="relative w-20 h-20 rounded-full bg-[#4F39F6] flex items-center justify-center shadow-2xl shadow-indigo-300">
            <CheckCircle2 size={40} className="text-white" strokeWidth={2} />
          </div>
          <span className="absolute -top-1 -right-0 text-lg">✨</span>
          <div className="absolute top-3 -left-2 w-2.5 h-2.5 rounded-full bg-indigo-300" />
          <div className="absolute -bottom-1 right-5 w-2 h-2 rounded-full bg-yellow-400" />
        </div>
        <h1 className="text-3xl font-black text-slate-900">You're Registered! 🎉</h1>
        <p className="text-slate-500 font-medium mt-2 max-w-md leading-relaxed">
          Your registration for{' '}
          <span className="font-bold text-slate-700">{hackathonTitle}</span> has been confirmed.
          {teamName && (
            <> Good luck, <span className="font-bold text-slate-700">{teamName}</span>!</>
          )}
        </p>
      </div>

      {/* Info row */}
      <div className="grid grid-cols-4 border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-8 bg-white">
        <InfoBox label="HACKATHON" icon={<Trophy size={14} className="text-indigo-500" />} value={hackathonTitle} />
        <InfoBox label="DATE" icon={<Calendar size={14} className="text-indigo-500" />} value={formattedDate} divider />
        <InfoBox label="TEAM" icon={<Users size={14} className="text-indigo-500" />} value={teamName || 'Solo'} divider />
        <InfoBox label="MODE" icon={<Globe size={14} className="text-indigo-500" />} value={mode} divider />
      </div>

      {/* What's Next? */}
      <h2 className="text-xl font-black text-slate-800 mb-4">What's Next?</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <NextCard
          icon={<MessageSquare size={22} className="text-[#4F39F6]" />}
          title="Join Team Channel"
          desc="Connect with your team on the discussion board"
          action="Open Channel"
        />
        <NextCard
          icon={<FileText size={22} className="text-[#4F39F6]" />}
          title="Review Problem Statement"
          desc="The problem statement will be released on 20 May 2024"
          action="Set Reminder"
        />
        <NextCard
          icon={<UserPlus size={22} className="text-[#4F39F6]" />}
          title="Invite Team Members"
          desc="Make sure all 4 members have joined the hackathon"
          action="Invite Now"
          onAction={() => navigate('/teams')}
        />
      </div>

      {/* CTA buttons */}
      <div className="flex flex-col items-center gap-3">
        <button
          onClick={() => navigate(`/hackathons/${id}`)}
          className="w-full py-4 bg-[#4F39F6] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-[#3f2dd1] transition-all"
        >
          View Hackathon
        </button>
        <button
          onClick={() => navigate('/hackathons')}
          className="text-sm font-bold text-[#4F39F6] hover:underline underline-offset-2"
        >
          Back to Hackathons List
        </button>
      </div>
    </div>
  );
}

function InfoBox({
  label, icon, value, divider,
}: {
  label: string; icon: React.ReactNode; value: string; divider?: boolean;
}) {
  return (
    <div className={`p-4 text-center ${divider ? 'border-l border-slate-100' : ''}`}>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <p className="text-sm font-black text-slate-900 leading-tight truncate">{value}</p>
      </div>
    </div>
  );
}

function NextCard({
  icon, title, desc, action, onAction,
}: {
  icon: React.ReactNode; title: string; desc: string; action: string; onAction?: () => void;
}) {
  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col gap-3 shadow-sm">
      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-black text-slate-800">{title}</p>
        <p className="text-xs font-medium text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <button
        onClick={onAction}
        className="w-full py-2 border border-slate-200 rounded-xl text-xs font-black text-slate-700 hover:border-[#4F39F6] hover:text-[#4F39F6] transition-all"
      >
        {action}
      </button>
    </div>
  );
}
