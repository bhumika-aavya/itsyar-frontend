import React, { useEffect, useState, useCallback } from "react";
import {
  Users, BookOpen, Zap, BarChart3, Shield, CheckCircle2, XCircle,
  TrendingUp, UserCog, Loader2, Trophy, Download, Award, Search,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { AdminService, AdminOverview, CourseCompletionRate, ScoreDistributionPoint, LeaderboardUser } from "@/services/admin.service";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AdminService.getOverview()
      .then(data => {
        setOverview(data);
      })
      .catch(err => {
        console.error("Failed to load overview", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-2">
        <Loader2 className="animate-spin text-[#4F46E5]" size={36} />
        <p className="text-sm font-bold text-slate-400">Loading admin panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-6 md:py-8">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-[#4F46E5] rounded-xl flex items-center justify-center">
          <Shield className="text-white" size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Admin Overview</h1>
          <p className="text-sm font-medium text-slate-400">
            Signed in as <span className="text-[#4F46E5] font-bold">{overview?.admin?.name || user?.fullName}</span>
          </p>
        </div>
      </div>

      <StatsGrid stats={overview?.stats} />
      
      {/* Health check status pills */}
      <HealthCheck health={overview?.platformHealth} />

      <QuickActions navigate={navigate} />
      
      <PlatformLeaderboard />
    </div>
  );
}

function StatsGrid({ stats }: { stats?: AdminOverview["stats"] }) {
  if (!stats) return null;

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

function HealthCheck({ health }: { health?: AdminOverview["platformHealth"] }) {
  if (!health) return null;

  const items = [
    { name: "API Gateways", status: health.apiStatus },
    { name: "Database", status: health.database },
    { name: "Authentication", status: health.authService },
    { name: "Email Pipeline", status: health.emailService },
  ];

  return (
    <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4">Platform Health Monitor</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {items.map(item => {
          const isOk = item.status.toLowerCase() === "operational";
          return (
            <div key={item.name} className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              {isOk ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> : <XCircle size={16} className="text-rose-500 shrink-0" />}
              <div>
                <p className="text-xs font-bold text-slate-900">{item.name}</p>
                <p className={`text-[10px] font-extrabold ${isOk ? "text-emerald-600" : "text-rose-600"}`}>{item.status}</p>
              </div>
            </div>
          );
        })}
      </div>
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
  ACTIVE: "bg-emerald-50 text-emerald-600",
  ACTIVE_CAP: "bg-emerald-50 text-emerald-600",
  Active: "bg-emerald-50 text-emerald-600",
  INACTIVE: "bg-slate-100 text-slate-500",
  Inactive: "bg-slate-100 text-slate-500",
};

function PlatformLeaderboard() {
  const [courseCompletion, setCourseCompletion] = useState<CourseCompletionRate[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistributionPoint[]>([]);
  
  // Leaderboard lists & pagination
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loadingCharts, setLoadingCharts] = useState(true);
  const [loadingTable, setLoadingTable] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filter states
  const [track, setTrack] = useState("all");
  const [cohort, setCohort] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Load Charts
  useEffect(() => {
    setLoadingCharts(true);
    AdminService.getCharts()
      .then(res => {
        setCourseCompletion(res.courseCompletionRates);
        setScoreDistribution(res.scoreDistribution);
      })
      .catch(err => console.error("Failed to load charts", err))
      .finally(() => setLoadingCharts(false));
  }, []);

  // Fetch paginated table rows
  const fetchLeaderboard = useCallback(() => {
    setLoadingTable(true);
    AdminService.getLeaderboard({
      track,
      cohort,
      search: search.length >= 2 ? search : undefined,
      page,
      limit: 10
    })
      .then(res => {
        setLeaderboard(res.leaderboard);
        setTotalPages(res.pagination.totalPages);
        setTotalRecords(res.pagination.totalRecords);
      })
      .catch(err => console.error("Failed to load leaderboard", err))
      .finally(() => setLoadingTable(false));
  }, [track, cohort, search, page]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Export CSV Action
  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await AdminService.exportLeaderboard(track, cohort);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `platform_leaderboard_${track}_${cohort}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("CSV leaderboard exported successfully!");
    } catch (err) {
      console.error("Export failed", err);
      toast.error("Failed to download leaderboard file.");
    } finally {
      setExporting(false);
    }
  };

  const maxScoreBucket = Math.max(1, ...scoreDistribution.map(b => b.count));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
            <Trophy className="text-amber-500" size={18} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Leaderboard &amp; Analytics</h3>
        </div>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50 text-[#4F46E5] rounded-xl font-extrabold text-xs hover:bg-indigo-100 disabled:opacity-60 transition-all"
        >
          {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
          Export CSV
        </button>
      </div>

      {/* Mini charts */}
      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
          <p className="text-sm font-extrabold text-slate-800">Completion Rate by Course</p>
          {loadingCharts ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : courseCompletion.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 text-center py-12">No completion metrics available.</p>
          ) : (
            <div className="space-y-3">
              {courseCompletion.map(c => (
                <div key={c.courseId}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-500 truncate max-w-[280px]">{c.courseTitle}</span>
                    <span className="text-xs font-extrabold text-slate-700">{c.completionPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${c.completionPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm space-y-4">
          <p className="text-sm font-extrabold text-slate-800">Score Distribution</p>
          {loadingCharts ? (
            <div className="h-40 flex items-center justify-center">
              <Loader2 className="animate-spin text-slate-300" size={24} />
            </div>
          ) : scoreDistribution.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 text-center py-12">No score distribution metrics loaded.</p>
          ) : (
            <div className="flex items-end justify-between gap-2 h-[148px]">
              {scoreDistribution.map(b => (
                <div key={b.range} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <span className="text-[10px] font-extrabold text-slate-500">{b.count}</span>
                  <div className="w-full max-w-9 bg-indigo-100 rounded-t-lg relative flex items-end justify-center" style={{ height: `${(b.count / maxScoreBucket) * 80}%` }}>
                    <div className="w-full h-full bg-[#4F46E5] rounded-t-lg opacity-90" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">{b.range}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Leaderboard table */}
      <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-4">
          <p className="text-sm font-extrabold text-slate-800">Platform Leaderboard</p>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search user..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-[#4F46E5] w-36 transition-all"
              />
              <Search className="absolute left-2.5 top-2 text-slate-400" size={12} />
            </div>

            {/* Track Selector */}
            <select
              value={track}
              onChange={e => { setTrack(e.target.value); setPage(1); }}
              className="text-xs font-bold text-slate-500 border border-slate-100 rounded-lg px-2.5 py-1.5 bg-slate-50 outline-none cursor-pointer hover:bg-white transition-all"
            >
              <option value="all">All tracks</option>
              <option value="Training">Training</option>
              <option value="Hackathon">Hackathon</option>
            </select>

            {/* Cohort Selector */}
            <select
              value={cohort}
              onChange={e => { setCohort(e.target.value); setPage(1); }}
              className="text-xs font-bold text-slate-500 border border-slate-100 rounded-lg px-2.5 py-1.5 bg-slate-50 outline-none cursor-pointer hover:bg-white transition-all"
            >
              <option value="all">All cohorts</option>
              <option value="Q1-2026">Q1-2026</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[200px] relative">
          {loadingTable && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-[#4F46E5]" size={24} />
            </div>
          )}
          
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                {["#", "Participant", "Track", "Score", "Progress", "Certs", "Subm.", "Status"].map(h => (
                  <th key={h} className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide pb-2.5 pr-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-xs font-bold text-slate-400">
                    No leaderboard profiles matching filters.
                  </td>
                </tr>
              ) : (
                leaderboard.map(row => {
                  const statusKey = row.status || "ACTIVE";
                  const styleClass = STATUS_STYLE[statusKey] || STATUS_STYLE["Active"];
                  return (
                    <tr key={row.userId} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className={`py-3 pr-3 font-extrabold ${RANK_STYLE[row.rank] ?? "text-slate-400"}`}>
                        {row.rank <= 3 ? <Award size={15} className="inline" /> : row.rank}
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-50 text-[#4F46E5] rounded-full flex items-center justify-center text-xs font-extrabold shrink-0">
                            {row.participant.initials}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 whitespace-nowrap block">{row.participant.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{row.participant.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-2 py-0.5">{row.track}</span>
                      </td>
                      <td className="py-3 pr-3 font-extrabold text-slate-800">{row.score.toFixed(2)}</td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="text-xs font-bold text-slate-400">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-3 font-bold text-slate-600">{row.certs}</td>
                      <td className="py-3 pr-3 font-bold text-slate-600">{row.subm}</td>
                      <td className="py-3 pr-3">
                        <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-lg ${styleClass}`}>{statusKey}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50 flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-400">
            Showing {leaderboard.length} of {totalRecords} participants
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#4F46E5] disabled:opacity-40 transition-all"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="text-xs font-extrabold text-slate-500 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-100 bg-slate-50 hover:bg-white hover:border-[#4F46E5] disabled:opacity-40 transition-all"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
