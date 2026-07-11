import React, { useEffect, useState } from "react";
import { Search, Trash2, Loader2, Users2, Users } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { TeamService, TeamCardData } from "@/services/team.service";

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [hackathonFilter, setHackathonFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    TeamService.getAllTeams()
      .then(setTeams)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const hackathonOptions = ["all", ...Array.from(new Set(teams.map(t => t.hackathonName).filter(Boolean)))];

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.hackathonName.toLowerCase().includes(search.toLowerCase());
    const matchHackathon = hackathonFilter === "all" || t.hackathonName === hackathonFilter;
    return matchSearch && matchHackathon;
  });

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete team "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await AdminService.deleteTeam(id);
    setTeams(prev => prev.filter(t => t.id !== id));
    setDeletingId(null);
  };

  const fullTeams = filtered.filter(t => t.memberCount >= t.maxMembers).length;
  const openTeams = filtered.filter(t => t.memberCount < t.maxMembers).length;

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
          <h1 className="text-2xl font-extrabold text-slate-900">Teams</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            {teams.length} teams &mdash; {openTeams} open slots, {fullTeams} full
          </p>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Teams", value: teams.length, color: "text-[#4F46E5] bg-indigo-50" },
          { label: "Open for Join", value: openTeams, color: "text-emerald-600 bg-emerald-50" },
          { label: "Full Teams", value: fullTeams, color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Users2 size={20} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-900">{value}</p>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams..."
            className="h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] w-56"
          />
        </div>
        <select
          value={hackathonFilter}
          onChange={e => setHackathonFilter(e.target.value)}
          className="h-10 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:border-[#3AADDD] cursor-pointer max-w-xs"
        >
          <option value="all">All Hackathons</option>
          {hackathonOptions.filter(h => h !== "all").map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50 bg-slate-50/50">
                <th className="text-left px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Team</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden md:table-cell">Hackathon</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Members</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Looking for</th>
                <th className="text-left px-4 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(t => {
                const isFull = t.memberCount >= t.maxMembers;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: t.iconBg }}
                        >
                          <Users size={16} className="text-white" />
                        </div>
                        <p className="font-extrabold text-slate-900">{t.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden md:table-cell">
                      <span className="text-xs font-bold text-slate-500">{t.hackathonName}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: t.maxMembers }).map((_, i) => (
                            <div
                              key={i}
                              className={`w-2 h-2 rounded-full ${i < t.memberCount ? "bg-[#4F46E5]" : "bg-slate-200"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-slate-500">{t.memberCount}/{t.maxMembers}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden lg:table-cell">
                      <span className="text-xs font-medium text-slate-400 truncate max-w-[180px] block">{t.description}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg ${
                        isFull ? "bg-slate-50 text-slate-500" : "bg-emerald-50 text-emerald-600"
                      }`}>
                        {isFull ? "Full" : "Open"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => handleDelete(t.id, t.name)}
                          disabled={deletingId === t.id}
                          title="Delete team"
                          className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {deletingId === t.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
                <Users2 size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400">No teams found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
