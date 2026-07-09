import React from "react";
import { Scale, Clock, CheckCircle2, Trophy, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const MOCK_STATS = [
  { label: "Assigned Hackathons", value: 3, icon: Trophy, color: "text-[#4F39F6] bg-indigo-50" },
  { label: "Pending Reviews", value: 7, icon: Clock, color: "text-amber-600 bg-amber-50" },
  { label: "Reviewed", value: 15, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50" },
  { label: "Avg Score Given", value: "7.8", icon: Scale, color: "text-sky-600 bg-sky-50" },
];

const MOCK_HACKATHONS = [
  { id: "1", title: "AI Innovation Challenge", deadline: "2026-07-20", pending: 4, total: 8, status: "In Progress" },
  { id: "2", title: "Web Dev Sprint", deadline: "2026-07-25", pending: 3, total: 5, status: "In Progress" },
  { id: "3", title: "Open Source Hackathon", deadline: "2026-08-01", pending: 0, total: 7, status: "Completed" },
];

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Welcome back, {user?.fullName?.split(" ")[0] ?? "Judge"}
        </h1>
        <p className="text-sm font-medium text-slate-400 mt-0.5">
          Here's an overview of your judging assignments.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {MOCK_STATS.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
              <Icon size={20} />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Assigned hackathons */}
      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
          <p className="text-sm font-black text-slate-900">Assigned Hackathons</p>
          <button
            onClick={() => navigate("/judge/hackathons")}
            className="text-xs font-black text-[#4F39F6] hover:underline"
          >
            View all
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {MOCK_HACKATHONS.map(h => {
            const progress = h.total > 0 ? Math.round(((h.total - h.pending) / h.total) * 100) : 100;
            const isComplete = h.status === "Completed";
            return (
              <div key={h.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isComplete ? "bg-slate-50" : "bg-amber-50"}`}>
                  <Scale size={16} className={isComplete ? "text-slate-400" : "text-amber-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm truncate">{h.title}</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Deadline: {fmt(h.deadline)}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isComplete ? "bg-emerald-400" : "bg-[#4F39F6]"}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-black text-slate-400 shrink-0">
                      {h.total - h.pending}/{h.total} reviewed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg ${
                    isComplete ? "bg-slate-50 text-slate-500" : "bg-amber-50 text-amber-600"
                  }`}>
                    {isComplete ? "Done" : `${h.pending} pending`}
                  </span>
                  {!isComplete && (
                    <button
                      onClick={() => navigate("/judge/hackathons")}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#4F39F6] text-white rounded-xl text-xs font-black hover:bg-[#3f2dd1] transition-all"
                    >
                      Judge <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => navigate("/judge/hackathons")}
          className="bg-white border border-slate-100 rounded-2xl p-5 text-left hover:border-[#4F39F6]/30 hover:shadow-md hover:shadow-indigo-50 transition-all group"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
            <Scale size={20} className="text-[#4F39F6]" />
          </div>
          <p className="font-black text-slate-900 text-sm">Start Judging</p>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Score submissions for your hackathons</p>
        </button>
        <button
          onClick={() => navigate("/judge/criteria")}
          className="bg-white border border-slate-100 rounded-2xl p-5 text-left hover:border-amber-200 hover:shadow-md hover:shadow-amber-50 transition-all group"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <CheckCircle2 size={20} className="text-amber-600" />
          </div>
          <p className="font-black text-slate-900 text-sm">View Criteria</p>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Review judging rubric and scoring weights</p>
        </button>
      </div>
    </div>
  );
}
