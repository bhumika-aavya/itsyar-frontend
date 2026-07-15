import React, { useEffect, useState } from "react";
import {
  Search, Loader2, CheckCircle2, XCircle, Ban, Trash2,
  UserPlus, X, Users, Edit2, Save,
} from "lucide-react";
import { AdminService, AdminUser } from "@/services/admin.service";

const ROLES = ["student", "participant", "organizer", "mentor/judge", "admin"];

const roleLabel = (r: string) => r.split("/").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("/");

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-600",
    inactive: "bg-slate-50 text-red-500",
    banned: "bg-red-50 text-red-500",
  };
  return map[status] ?? "bg-slate-50 text-slate-500";
};

interface InviteForm {
  fullName: string;
  email: string;
  role: string;
  password: string;
}

const PAGE_SIZE = 10;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Invite modal
  const [showModal, setShowModal] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({ fullName: "", email: "", role: "student", password: "" });
  const [inviteError, setInviteError] = useState("");
  const [inviting, setInviting] = useState(false);

  // Edit-user modal
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editRole, setEditRole] = useState("student");
  const [editStatus, setEditStatus] = useState<"active" | "inactive" | "banned">("active");
  const [savingEdit, setSavingEdit] = useState(false);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // Server-side search/role/status filtering — re-fetches from the API, not a local .filter().
  useEffect(() => {
    setLoading(true);
    setPage(1);
    AdminService.getUsers({
      search: debouncedSearch || undefined,
      role: roleFilter === "all" ? undefined : roleFilter,
      status: statusFilter === "all" ? undefined : statusFilter,
    }).then(u => { setUsers(u); setLoading(false); setInitialLoading(false); });
  }, [debouncedSearch, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleReset = () => {
    setSearch("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  const handleStatusChange = async (userId: string, status: "active" | "inactive" | "banned") => {
    setUpdatingId(userId);
    await AdminService.updateUserStatus(userId, status);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    setUpdatingId(null);
  };

  const openEditUser = (u: AdminUser) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditStatus(u.status);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    if (editRole !== editingUser.role) await AdminService.updateUserRole(editingUser.id, editRole);
    if (editStatus !== editingUser.status) await AdminService.updateUserStatus(editingUser.id, editStatus);
    setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, role: editRole, status: editStatus } : u));
    setSavingEdit(false);
    setEditingUser(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Permanently delete this user?")) return;
    await AdminService.deleteUser(userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const handleInvite = async () => {
    if (!inviteForm.fullName.trim()) { setInviteError("Full name is required"); return; }
    if (!inviteForm.email.trim() || !inviteForm.email.includes("@")) { setInviteError("Valid email is required"); return; }
    if (inviteForm.password.length < 8) { setInviteError("Password must be at least 8 characters"); return; }
    setInviteError("");
    setInviting(true);
    const newUser = await AdminService.createUser(inviteForm);
    setUsers(prev => [newUser, ...prev]);
    setInviting(false);
    setShowModal(false);
    setInviteForm({ fullName: "", email: "", role: "student", password: "" });
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header row */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Users</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5 flex items-center gap-1.5">
            {users.length} total members
            {loading && <Loader2 size={12} className="animate-spin text-slate-300" />}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
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
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] w-56"
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#3AADDD] cursor-pointer"
        >
          <option value="all">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#3AADDD] cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="banned">Banned</option>
        </select>
        {(search || roleFilter !== "all" || statusFilter !== "all") && (
          <button
            onClick={handleReset}
            className="h-10 px-4 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:table-cell">Created</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Activity</th>
                <th className="text-right px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginated.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] font-extrabold text-sm shrink-0">
                        {u.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-extrabold text-slate-900">{u.fullName}</p>
                        <p className="text-xs font-bold text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-lg bg-indigo-50 text-[#4F46E5]">
                      {roleLabel(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg capitalize ${statusBadge(u.status)}`}>
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
                          <button
                            onClick={() => openEditUser(u)}
                            title="Edit user"
                            className="p-1.5 text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={15} />
                          </button>
                          {u.status !== "active" && (
                            <button
                              onClick={() => handleStatusChange(u.id, "active")}
                              title="Activate"
                              className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <CheckCircle2 size={15} />
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
          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Users size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No users match your filters</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {users.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50">
            <p className="text-xs font-bold text-slate-400">
              Page {page} of {totalPages} &middot; {users.length} users
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 text-xs font-extrabold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Add User</h2>
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
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input
                  value={inviteForm.fullName}
                  onChange={e => setInviteForm(f => ({ ...f, fullName: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
                <input
                  value={inviteForm.email}
                  onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jane@example.com"
                  type="email"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#3AADDD] focus:bg-white transition-all cursor-pointer"
                >
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Temporary Password</label>
                <input
                  value={inviteForm.password}
                  onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  type="password"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all"
                />
              </div>

              {inviteError && (
                <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{inviteError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setInviteError(""); }}
                className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {inviting ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                {inviting ? "Creating…" : "Create User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Edit User</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">{editingUser.fullName} · {editingUser.email}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Role</label>
                <select
                  value={editRole}
                  onChange={e => setEditRole(e.target.value)}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#3AADDD] focus:bg-white transition-all cursor-pointer"
                >
                  {ROLES.map(r => <option key={r} value={r}>{roleLabel(r)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value as "active" | "inactive" | "banned")}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:border-[#3AADDD] focus:bg-white transition-all cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="banned">Banned</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {savingEdit ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {savingEdit ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
