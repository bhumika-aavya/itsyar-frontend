import React, { useEffect, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, Loader2, Zap, ExternalLink, ShieldAlert,
} from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const statusBadge = (status: string) => {
  const norm = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    open: "bg-emerald-50 text-emerald-600",
    running: "bg-blue-50 text-blue-600",
    completed: "bg-slate-50 text-slate-500",
    upcoming: "bg-indigo-50 text-indigo-600",
    draft: "bg-amber-50 text-amber-600",
    approved: "bg-indigo-50 text-indigo-600",
    paid: "bg-emerald-50 text-emerald-600",
  };
  return map[norm] ?? "bg-slate-50 text-slate-500";
};

const formatStatusLabel = (status: string) => {
  if (!status) return "—";
  const s = status.trim();
  if (s.toLowerCase() === "all") return "All";
  if (s.toLowerCase() === "upcoming") return "Upcoming";
  if (s.toLowerCase() === "completed") return "Completed";
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

const capitalizeWords = (str: string) => {
  if (!str || str === "—") return "—";
  return str
    .split(" ")
    .map(w => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

const fmt = (d: string) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminHackathonsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const [hackathons, setHackathons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Review flow states
  const [reviewingHackathon, setReviewingHackathon] = useState<any | null>(null);
  const [priceInput, setPriceInput] = useState("49.99");

  useEffect(() => {
    AdminService.getHackathons()
      .then(apiData => {
        setHackathons(apiData);
      })
      .catch(() => {
        setHackathons([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = (status: string) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (status === "all") {
        next.delete("status");
      } else {
        next.set("status", status);
      }
      return next;
    });
  };

  const filtered = hackathons.filter(h => {
    const matchSearch =
      (h.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (h.organizerName ?? h.createdBy ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      (h.status ?? "").toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await AdminService.deleteHackathon(id);
    setHackathons(prev => prev.filter(h => h.id !== id));
    setDeletingId(null);
  };

  const uniqueStatusesMap = new Map<string, string>();
  hackathons.forEach(h => {
    if (h.status) {
      const key = h.status.trim().toLowerCase();
      if (!uniqueStatusesMap.has(key)) {
        uniqueStatusesMap.set(key, h.status.trim());
      }
    }
  });
  const statuses = ["all", ...Array.from(uniqueStatusesMap.values())];

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Hackathons</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">{hackathons.length} hackathons on the platform</p>
        </div>
        <button
          onClick={() => navigate("/admin/hackathons/create")}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
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
            placeholder="Search hackathons or organizer..."
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] w-64"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map(s => {
            const isActive = statusFilter.toLowerCase() === s.toLowerCase();
            return (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all ${isActive
                    ? "bg-[#4F46E5] text-white"
                    : "bg-white border border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
              >
                {formatStatusLabel(s)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Hackathon</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Organizer</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:table-cell">Start Date</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:table-cell">End Date</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Participants</th>
                <th className="text-right px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Actions</th>
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
                        <p className="font-extrabold text-slate-900">{h.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 hidden sm:table-cell">
                    <span className="text-xs font-extrabold text-slate-700">
                      {capitalizeWords(h.organizerName ?? h.createdBy ?? h.organizer ?? h.creator ?? "—")}
                    </span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs font-bold text-slate-500">{h.startDate ? fmt(h.startDate) : "—"}</span>
                  </td>
                  <td className="px-4 py-4 hidden md:table-cell">
                    <span className="text-xs font-bold text-slate-500">{h.endDate ? fmt(h.endDate) : "—"}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${statusBadge(h.status)}`}>
                      {formatStatusLabel(h.status)}
                    </span>
                    {h.pricing && h.pricing !== "0" && (
                      <span className="text-[10px] font-bold text-slate-400 block mt-1">
                        Price: ${h.pricing}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <span className="text-xs font-bold text-slate-400">
                      {h.participantCount ?? "0"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {(h.status?.toLowerCase() === "draft") && (
                        <button
                          onClick={() => {
                            setReviewingHackathon(h);
                            setPriceInput(h.pricing || "49.99");
                          }}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-extrabold transition-colors mr-1.5"
                        >
                          Review
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/hackathons/${h.id}`)}
                        title="View"
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <ExternalLink size={15} />
                      </button>
                      <button
                        onClick={() => navigate(`/admin/hackathons/${h.id}/edit`)}
                        title="Edit"
                        className="p-1.5 text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-colors"
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

      {/* Review Modal */}
      {reviewingHackathon && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-6 text-left">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-50">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500">
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Review Hackathon</h3>
                <p className="text-xs font-bold text-slate-400">Review submitted request and set listing price</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-extrabold text-slate-700">Event Title</p>
              <p className="text-sm font-semibold text-slate-800 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">{reviewingHackathon.title}</p>

              <p className="text-sm font-extrabold text-slate-700">Description</p>
              <p className="text-xs font-medium text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 max-h-32 overflow-y-auto leading-relaxed">{reviewingHackathon.description}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600 block">Set Listing Price (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                placeholder="e.g. 49.99"
                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 outline-none focus:border-[#4F46E5] font-extrabold text-sm"
              />
              <p className="text-[10px] font-bold text-slate-400">The amount the organizer must pay to publish this hackathon.</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewingHackathon(null)}
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-extrabold text-xs rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await AdminService.rejectHackathon(reviewingHackathon.id);
                  setHackathons(prev => prev.map(h => h.id === reviewingHackathon.id ? { ...h, status: "Draft" } : h));
                  toast.success("Hackathon rejected and moved back to Draft.");
                  setReviewingHackathon(null);
                }}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl transition-all"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={async () => {
                  await AdminService.approveHackathon(reviewingHackathon.id, priceInput);
                  setHackathons(prev => prev.map(h => h.id === reviewingHackathon.id ? { ...h, status: "Approved", pricing: priceInput } : h));
                  toast.success(`Hackathon approved! Price set to $${priceInput}`);
                  setReviewingHackathon(null);
                }}
                className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-indigo-100"
              >
                Approve & Set Price
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
