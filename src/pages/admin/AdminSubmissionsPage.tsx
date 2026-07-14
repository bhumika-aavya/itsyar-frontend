import React, { useEffect, useState } from "react";
import { Search, Loader2, Users, ChevronRight, Scale } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminSubmissionService, Submitter } from "@/services/admin-submission.service";

export default function AdminSubmissionsPage() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Submitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    AdminSubmissionService.getSubmitters()
      .then(setRows)
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(({ name, email }) =>
    name.toLowerCase().includes(search.toLowerCase()) ||
    email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Scale size={22} className="text-[#4F46E5]" /> Hackathon Submissions
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-0.5">
          {rows.length} users have submitted to a hackathon — pick one to review and judge
        </p>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search users..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD]"
        />
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm divide-y divide-slate-50">
        {filtered.map(({ userId, name, email, submissionCount }) => (
          <button
            key={userId}
            onClick={() => navigate(`/admin/submissions/${userId}`)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
          >
            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5] font-extrabold text-sm shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-900 text-sm">{name}</p>
              <p className="text-xs font-bold text-slate-400">{email}</p>
            </div>
            <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-lg hidden sm:block">
              {submissionCount} submission{submissionCount > 1 ? "s" : ""}
            </span>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Users size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">No users match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
