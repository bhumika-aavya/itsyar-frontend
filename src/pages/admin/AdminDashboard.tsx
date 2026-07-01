import React, { useEffect, useState } from "react";
import {
  Users, BookOpen, Zap, BarChart3, Search, Shield, Trash2,
  ChevronDown, Loader2, CheckCircle2, XCircle, Clock, Crown,
  TrendingUp, UserCog, Eye, Ban, RefreshCw, AlertTriangle,
} from "lucide-react";
import { AdminService, AdminUser, AdminStats, AdminSubmission } from "@/services/admin.service";
import { HackathonService } from "@/services/hackathon.service";
import { CourseService } from "@/services/course.service";
import { useAuth } from "@/context/AuthContext";

type Tab = "overview" | "users" | "courses" | "hackathons" | "submissions";

const ROLES = ["student", "mentor", "organizer", "admin"];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600",
    inactive: "bg-slate-50 text-slate-500",
    banned: "bg-red-50 text-red-500",
    PENDING: "bg-amber-50 text-amber-600",
    ACCEPTED: "bg-emerald-50 text-emerald-600",
    REJECTED: "bg-red-50 text-red-500",
    Open: "bg-emerald-50 text-emerald-600",
    Running: "bg-blue-50 text-blue-600",
    COMPLETED: "bg-slate-50 text-slate-500",
    UpComing: "bg-indigo-50 text-indigo-600",
  };
  return map[status] ?? "bg-slate-50 text-slate-500";
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "users", label: "Users", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "hackathons", label: "Hackathons", icon: Zap },
    { id: "submissions", label: "Submissions", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-8 text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4F39F6] rounded-xl flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Admin Dashboard</h1>
            <p className="text-sm font-medium text-slate-400">Signed in as <span className="text-[#4F39F6] font-bold">{user?.fullName}</span></p>
          </div>
        </div>
        <span className="px-3 py-1 bg-[#4F39F6]/10 text-[#4F39F6] rounded-lg text-xs font-black uppercase tracking-widest">
          {user?.role}
        </span>
      </div>

      {/* Tab Nav */}
      <div className="flex items-center gap-1 bg-slate-50 rounded-2xl p-1.5 mb-8 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === id
                ? "bg-white text-[#4F39F6] shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && <OverviewSection />}
      {activeTab === "users" && <UsersSection />}
      {activeTab === "courses" && <CoursesSection />}
      {activeTab === "hackathons" && <HackathonsSection />}
      {activeTab === "submissions" && <SubmissionsSection />}
    </div>
  );
}

// ─── Overview ───────────────────────────────────────────────────────────────

function OverviewSection() {
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    AdminService.getStats().then(setStats);
  }, []);

  if (!stats) return <SectionLoader />;

  const cards = [
    { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: Users, color: "bg-indigo-50 text-[#4F39F6]", trend: `+${stats.newUsersThisMonth} this month` },
    { label: "Total Courses", value: stats.totalCourses.toString(), icon: BookOpen, color: "bg-emerald-50 text-emerald-600", trend: "Active courses" },
    { label: "Active Hackathons", value: stats.activeHackathons.toString(), icon: Zap, color: "bg-amber-50 text-amber-600", trend: "Currently running" },
    { label: "Total Submissions", value: stats.totalSubmissions.toLocaleString(), icon: BarChart3, color: "bg-rose-50 text-rose-600", trend: "All time" },
  ];

  return (
    <div className="space-y-8">
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

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Manage Users", icon: UserCog, desc: "View and control user accounts" },
              { label: "Review Submissions", icon: CheckCircle2, desc: "Pending hackathon reviews" },
              { label: "Manage Courses", icon: BookOpen, desc: "Edit or add new courses" },
              { label: "Hackathon Control", icon: Zap, desc: "Create and manage hackathons" },
            ].map(({ label, icon: Icon, desc }) => (
              <button key={label} className="flex flex-col items-start gap-2 p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50/50 hover:border-indigo-100 border border-transparent transition-all text-left">
                <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-[#4F39F6] shadow-sm">
                  <Icon size={16} />
                </div>
                <p className="text-sm font-black text-slate-800">{label}</p>
                <p className="text-[11px] font-bold text-slate-400 leading-tight">{desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-sm">
          <h3 className="text-base font-black text-slate-800 mb-4">Platform Health</h3>
          <div className="space-y-4">
            {[
              { label: "API Status", status: "Operational", ok: true },
              { label: "Database", status: "Operational", ok: true },
              { label: "Auth Service", status: "Operational", ok: true },
              { label: "Email Service", status: "Operational", ok: true },
            ].map(({ label, status, ok }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-600">{label}</span>
                <span className={`flex items-center gap-1.5 text-xs font-black px-2.5 py-1 rounded-lg ${ok ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                  {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Users ───────────────────────────────────────────────────────────────────

function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    AdminService.getUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const matchStatus = statusFilter === "all" || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const handleStatusChange = async (userId: string, status: "active" | "inactive" | "banned") => {
    setUpdatingId(userId);
    await AdminService.updateUserStatus(userId, status);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    setUpdatingId(null);
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setUpdatingId(userId);
    await AdminService.updateUserRole(userId, role);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    setUpdatingId(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user?")) return;
    await AdminService.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">User Management <span className="text-slate-400 font-bold text-base ml-1">({users.length})</span></h2>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] w-52"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#4F39F6] cursor-pointer"
          >
            <option value="all">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#4F39F6] cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
              <th className="text-right px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F39F6] font-black text-sm shrink-0">
                      {u.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-slate-900">{u.fullName}</p>
                      <p className="text-xs font-bold text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <select
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    disabled={updatingId === u.id}
                    className="text-xs font-black px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg outline-none focus:border-[#4F39F6] cursor-pointer disabled:opacity-50"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg capitalize ${statusBadge(u.status)}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-xs font-bold text-slate-400">
                    {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    {updatingId === u.id ? (
                      <Loader2 size={15} className="animate-spin text-slate-400" />
                    ) : (
                      <>
                        {u.status !== "active" && (
                          <button
                            onClick={() => handleStatusChange(u.id, "active")}
                            title="Activate"
                            className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <CheckCircle2 size={15} />
                          </button>
                        )}
                        {u.status !== "banned" && (
                          <button
                            onClick={() => handleStatusChange(u.id, "banned")}
                            title="Ban user"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.id)}
                          title="Delete user"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-slate-400">No users match your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Courses ─────────────────────────────────────────────────────────────────

function CoursesSection() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    CourseService.getAllCourses()
      .then(data => {
        setCourses(Array.isArray(data) ? data : data?.courses ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    (c.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Courses <span className="text-slate-400 font-bold text-base ml-1">({courses.length})</span></h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] w-52"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={BookOpen} message="No courses found." />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course: any) => (
            <div key={course.id} className="bg-white border border-slate-100 rounded-[20px] p-5 shadow-sm hover:shadow-md transition-all space-y-3">
              {course.thumbnail && (
                <img src={course.thumbnail} alt={course.title} className="w-full h-36 object-cover rounded-xl" />
              )}
              <div>
                <p className="font-black text-slate-900 leading-snug">{course.title}</p>
                <p className="text-xs font-bold text-slate-400 mt-1">{course.instructor ?? course.author ?? "—"}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#4F39F6] bg-indigo-50 px-2.5 py-1 rounded-lg">
                  {course.level ?? course.difficulty ?? "All levels"}
                </span>
                <span className="text-xs font-bold text-slate-400">{course.enrolledCount ?? 0} enrolled</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Hackathons ───────────────────────────────────────────────────────────────

function HackathonsSection() {
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    HackathonService.getHackathons()
      .then(data => { setHackathons(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = hackathons.filter(h =>
    (h.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const fmt = (d: string) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  };

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Hackathons <span className="text-slate-400 font-bold text-base ml-1">({hackathons.length})</span></h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hackathons..."
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] w-52"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Title</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Start</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">End</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((h: any) => (
              <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
                      <Zap size={16} />
                    </div>
                    <span className="font-black text-slate-900">{h.title}</span>
                  </div>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-xs font-bold text-slate-500">{fmt(h.startDate)}</span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-xs font-bold text-slate-500">{fmt(h.endDate)}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg capitalize ${statusBadge(h.status)}`}>
                    {h.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-slate-400">No hackathons found</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Submissions ──────────────────────────────────────────────────────────────

function SubmissionsSection() {
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    AdminService.getSubmissions().then(s => { setSubmissions(s); setLoading(false); });
  }, []);

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  const statusIcon = (s: string) => {
    if (s === "ACCEPTED") return <CheckCircle2 size={13} className="text-emerald-500" />;
    if (s === "REJECTED") return <XCircle size={13} className="text-red-400" />;
    return <Clock size={13} className="text-amber-500" />;
  };

  if (loading) return <SectionLoader />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-800">Submissions <span className="text-slate-400 font-bold text-base ml-1">({submissions.length})</span></h2>
        <div className="flex gap-2">
          {["all", "PENDING", "ACCEPTED", "REJECTED"].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                filter === f ? "bg-[#4F39F6] text-white" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50 bg-slate-50/50">
              <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Participant</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Hackathon</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Language</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Submitted</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(s => (
              <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-black text-slate-900">{s.participantName}</p>
                  <p className="text-xs font-bold text-slate-400">{s.participantEmail}</p>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-xs font-bold text-slate-600">{s.hackathonTitle}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-xs font-black px-2 py-1 bg-slate-50 text-slate-600 rounded-lg">{s.language}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`flex items-center gap-1.5 text-[11px] font-black px-2.5 py-1 rounded-lg w-fit ${statusBadge(s.status)}`}>
                    {statusIcon(s.status)}
                    {s.status.charAt(0) + s.status.slice(1).toLowerCase()}
                  </span>
                </td>
                <td className="px-4 py-4 hidden md:table-cell">
                  <span className="text-xs font-bold text-slate-400">{fmt(s.submittedAt)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm font-bold text-slate-400">No submissions match this filter</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function SectionLoader() {
  return (
    <div className="flex justify-center items-center py-24">
      <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
    </div>
  );
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[24px]">
      <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
        <Icon size={28} />
      </div>
      <p className="text-sm font-bold text-slate-400">{message}</p>
    </div>
  );
}
