import React, { useEffect, useState } from "react";
import {
  Users, BookOpen, Zap, BarChart3, Shield, CheckCircle2, XCircle,
  TrendingUp, UserCog, Loader2,
} from "lucide-react";
import { AdminService, AdminStats } from "@/services/admin.service";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4F39F6] rounded-xl flex items-center justify-center">
          <Shield className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Admin Overview</h1>
          <p className="text-sm font-medium text-slate-400">
            Signed in as <span className="text-[#4F39F6] font-bold">{user?.fullName}</span>
          </p>
        </div>
      </div>

      <StatsGrid />
      <QuickActions navigate={navigate} />
      <PlatformHealth />
    </div>
  );
}

function StatsGrid() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    AdminService.getStats().then(setStats);
  }, []);

  if (!stats) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
      </div>
    );
  }

  const cards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "bg-indigo-50 text-[#4F39F6]", trend: `+${stats.newUsersThisMonth} this month` },
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
            <p className="text-3xl font-black text-slate-900">{value}</p>
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
      <h3 className="text-base font-black text-slate-800 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map(({ label, icon: Icon, desc, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex flex-col items-start gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 border border-transparent hover:border-indigo-100 transition-all text-left"
          >
            <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#4F39F6] shadow-sm">
              <Icon size={16} />
            </div>
            <p className="text-sm font-black text-slate-800">{label}</p>
            <p className="text-[11px] font-bold text-slate-400 leading-tight">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function PlatformHealth() {
  const services = [
    { label: "API Status", status: "Operational", ok: true },
    { label: "Database", status: "Operational", ok: true },
    { label: "Auth Service", status: "Operational", ok: true },
    { label: "Email Service", status: "Operational", ok: true },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
      <h3 className="text-base font-black text-slate-800 mb-4">Platform Health</h3>
      <div className="grid sm:grid-cols-2 gap-3">
        {services.map(({ label, status, ok }) => (
          <div key={label} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
            <span className="text-sm font-bold text-slate-600">{label}</span>
            <span className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
              {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
