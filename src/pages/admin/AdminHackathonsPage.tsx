import React, { useEffect, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, Loader2, Zap, ExternalLink,
} from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { HackathonService } from "@/services/hackathon.service";
import { useNavigate } from "react-router-dom";

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    Open: "bg-emerald-50 text-emerald-600",
    Running: "bg-blue-50 text-blue-600",
    COMPLETED: "bg-slate-50 text-slate-500",
    UpComing: "bg-indigo-50 text-indigo-600",
  };
  return map[status] ?? "bg-slate-50 text-slate-500";
};

const fmt = (d: string) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminHackathonsPage() {
  const navigate = useNavigate();
  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    HackathonService.getHackathons()
      .then(data => setHackathons(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = hackathons.filter(h => {
    const matchSearch = (h.title ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await AdminService.deleteHackathon(id);
    setHackathons(prev => prev.filter(h => h.id !== id));
    setDeletingId(null);
  };

  const statuses = ["all", ...Array.from(new Set(hackathons.map(h => h.status).filter(Boolean)))];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Hackathons</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">{hackathons.length} hackathons on the platform</p>
        </div>
        <button
          onClick={() => navigate("/organizer/hackathons/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F39F6] text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
        >
          <Plus size={16} /> Create Hackathon
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hackathons..."
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] w-56"
          />
        </div>
        <div className="flex gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-black rounded-xl transition-all ${
                statusFilter === s ? "bg-[#4F39F6] text-white" : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Hackathon</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">Start Date</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden md:table-cell">End Date</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider hidden lg:table-cell">Participants</th>
                <th className="text-right px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-wider">Actions</th>
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
                      <div>
                        <p className="font-black text-slate-900">{h.title}</p>
                        {h.mode && <p className="text-xs font-bold text-slate-400">{h.mode}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs font-bold text-slate-500">{h.startDate ? fmt(h.startDate) : "—"}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs font-bold text-slate-500">{h.endDate ? fmt(h.endDate) : "—"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${statusBadge(h.status)}`}>
                      {h.status ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-xs font-bold text-slate-400">
                      {h.registeredCount ?? h.participantCount ?? "—"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/hackathons/${h.id}`)}
                        title="View"
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/organizer/hackathons/${h.id}/edit`)}
                        title="Edit"
                        className="p-1.5 text-[#4F39F6] hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(h.id, h.title)}
                        disabled={deletingId === h.id}
                        title="Delete"
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === h.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Zap size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No hackathons found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
