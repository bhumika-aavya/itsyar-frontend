import React, { useEffect, useState } from "react";
import {
  Search, Loader2, CheckCircle2, XCircle, Ban, Trash2,
  UserPlus, X, Users,
} from "lucide-react";
import { AdminService, AdminUser } from "@/services/admin.service";

const ROLES = ["student", "mentor", "organizer", "admin"];

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600",
    inactive: "bg-slate-50 text-slate-500",
    banned: "bg-red-50 text-red-500",
  };
  return map[status] ?? "bg-slate-50 text-slate-500";
};

interface InviteForm {
  fullName: string;
  email: string;
  role: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Invite modal
  const [showModal, setShowModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({ fullName: "", email: "", role: "student" });
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    AdminService.getUsers().then(u => { setUsers(u); setLoading(false); });
  }, []);

  const filtered = users.filter(u => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
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

  const handleInvite = async () => {
    if (!inviteForm.fullName.trim()) { setInviteError("Full name is required"); return; }
    if (!inviteForm.email.trim() || !inviteForm.email.includes("@")) { setInviteError("Valid email is required"); return; }
    setInviteError("");
    setInviting(true);
    const newUser = await AdminService.createUser(inviteForm);
    setUsers(prev => [newUser, ...prev]);
    setInviting(false);
    setShowModal(false);
    setInviteForm({ fullName: "", email: "", role: "student" });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Users</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">{users.length} total members</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F39F6] text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search users..."
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] w-56"
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

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden lg:table-cell">Activity</th>
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
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-3 text-xs font-bold text-slate-400">
                      <span>{u.coursesEnrolled ?? 0} courses</span>
                      <span>{u.hackathonsJoined ?? 0} hackathons</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
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
                          {u.status !== "inactive" && (
                            <button
                              onClick={() => handleStatusChange(u.id, "inactive")}
                              title="Deactivate"
                              className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <XCircle size={15} />
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
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Users size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No users match your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Add User</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">Create a new platform account</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setInviteError(""); }}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input
                  value={inviteForm.fullName}
                  onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
                <input
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  type="email"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#4F39F6] focus:bg-white transition-all cursor-pointer"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>

              {inviteError && (
                <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{inviteError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setInviteError(""); }}
                className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="flex-1 py-3 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                {inviting ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
