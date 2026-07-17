import React, { useEffect, useState } from "react";
import {
  Users, BookOpen, Zap, BarChart3, Shield, CheckCircle2, XCircle,
  TrendingUp, UserCog, Loader2, Trophy, Download, Award,
} from "lucide-react";
import { AdminService, AdminOverview } from "@/services/admin.service";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center">
          <Shield className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Overview</h1>
          <p className="text-sm font-medium text-slate-400">
            Signed in as <span className="text-[#4F46E5] font-bold">{user?.fullName}</span>
          </p>
        </div>
      </div>

      <StatsGrid onLoaded={setOverview} />
      <QuickActions navigate={navigate} />
      <PlatformLeaderboard overview={overview} />
    </div>
  );
}

function StatsGrid({ onLoaded }: { onLoaded: (o: AdminOverview) => void }) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);

  useEffect(() => {
    AdminService.getOverview().then(o => { setOverview(o); onLoaded(o); });
  }, [onLoaded]);

  if (!overview) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  const { stats } = overview;
  const cards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "bg-indigo-50 text-[#4F46E5]", trend: "Registered accounts" },
    { label: "Total Courses", value: stats.totalCourses.toString(), icon: BookOpen, color: "bg-emerald-50 text-emerald-600", trend: "Active courses" },
    { label: "Active Hackathons", value: stats.activeHackathons.toString(), icon: Zap, color: "bg-amber-50 text-amber-600", trend: "Currently running" },
    { label: "Total Submissions", value: stats.totalSubmissions.toLocaleString(), icon: BarChart3, color: "bg-rose-50 text-rose-600", trend: "All time" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map(({ label, value, icon: Icon, color, trend }) => (
        <div key={label} className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-3xl font-extrabold text-slate-900">{value}</p>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wide">{label}</p>
          </div>
          <p className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <TrendingUp size={11} /> {trend}
          </p>
        </div>
      ))}
    </div>
  );
}

function QuickActions({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const actions = [
    { label: "Manage Users", icon: UserCog, desc: "View and control user accounts", path: "/admin/users" },
    { label: "Manage Courses", icon: BookOpen, desc: "Edit or add new courses", path: "/admin/courses" },
    { label: "Hackathon Control", icon: Zap, desc: "Create and manage hackathons", path: "/admin/hackathons" },
    { label: "Manage Teams", icon: Users, desc: "View and moderate all teams", path: "/admin/teams" },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
      <h3 className="text-base font-extrabold text-slate-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon, desc, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-start gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all text-left"
          >
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#4F46E5] shadow-sm">
              <Icon size={16} />
            </div>
            <p className="text-sm font-extrabold text-slate-800">{label}</p>
            <p className="text-[11px] font-bold text-slate-400 leading-tight">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

const RANK_STYLE: Record<number, string> = { 1: "text-amber-500", 2: "text-slate-400", 3: "text-orange-700" };
const STATUS_STYLE: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Review: "bg-amber-50 text-amber-600",
  Inactive: "bg-slate-100 text-slate-500",
};

function PlatformLeaderboard({ overview }: { overview: AdminOverview | null }) {
  if (!overview) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  const leaderboard = overview.leaderboard ?? [];
  const courseCompletion = overview.courseCompletion ?? [];
  const scoreDistribution = overview.scoreDistribution ?? [];
  const maxScoreBucket = Math.max(1, ...scoreDistribution.map(b => b.value));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Trophy className="text-amber-500" size={18} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Leaderboard &amp; Analytics</h3>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-[#4F46E5] rounded-xl font-extrabold text-xs hover:bg-indigo-100 transition-all">
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Mini charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
          <p className="text-sm font-extrabold text-slate-800">Completion Rate by Course</p>
          <div className="space-y-3">
            {courseCompletion.map(c => (
              <div key={c.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-500">{c.label}</span>
                  <span className="text-xs font-extrabold text-slate-700">{c.value}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${c.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
          <p className="text-sm font-extrabold text-slate-800">Score Distribution</p>
          <div className="flex items-end justify-between gap-2 h-[148px]">
            {scoreDistribution.map(b => (
              <div key={b.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full max-w-9 bg-indigo-100 rounded-t-lg relative flex items-end justify-center" style={{ height: `${(b.value / maxScoreBucket) * 100}%` }}>
                  <div className="w-full h-full bg-[#4F46E5] rounded-t-lg opacity-90" />
                </div>
                <span className="text-[10px] font-bold text-slate-400">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <p className="text-sm font-extrabold text-slate-800">Platform Leaderboard</p>
          <div className="flex items-center gap-2">
            <select className="text-xs font-bold text-slate-500 border border-slate-100 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer">
              <option>All tracks</option>
              <option>Training</option>
              <option>Hackathon</option>
            </select>
            <select className="text-xs font-bold text-slate-500 border border-slate-100 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer">
              <option>All cohorts</option>
              <option>Cohort A</option>
              <option>Cohort B</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["#", "Participant", "Track", "Score", "Progress", "Certs", "Subm.", "Status"].map(h => (
                  <th key={h} className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide pb-2.5 pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.map(row => (
                <tr key={row.rank} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className={`py-3 pr-3 font-extrabold ${RANK_STYLE[row.rank] ?? "text-slate-400"}`}>
                    {row.rank <= 3 ? <Award size={15} className="inline" /> : row.rank}
                  </td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center text-xs font-extrabold shrink-0">
                        {row.initials}
                      </div>
                      <span className="font-extrabold text-slate-800 whitespace-nowrap">{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3">
                    <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">{row.track}</span>
                  </td>
                  <td className="py-3 pr-3 font-extrabold text-slate-800">{row.score.toLocaleString()}</td>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${row.progress}%` }} />
                      </div>
                      <span className="text-xs font-bold text-slate-400">{row.progress}%</span>
                    </div>
                  </td>
                  <td className="py-3 pr-3 font-bold text-slate-600">{row.certs}</td>
                  <td className="py-3 pr-3 font-bold text-slate-600">{row.submissions}</td>
                  <td className="py-3 pr-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg ${STATUS_STYLE[row.status]}`}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
          <span className="text-xs font-bold text-slate-400">Showing {leaderboard.length} of total participants</span>
        </div>
      </div>
    </div>
  );
}
