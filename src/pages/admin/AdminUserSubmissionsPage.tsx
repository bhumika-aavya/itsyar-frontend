import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Scale, Loader2, Code2, ChevronRight } from "lucide-react";
import { AdminSubmissionService, UserSubmissionsResult, SubmissionStatus } from "@/services/admin-submission.service";

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const statusLabel: Record<SubmissionStatus, string> = {
  SUBMITTED: "In Queue",
  UNDER_REVIEW: "In Progress",
  EVALUATED: "Reviewed",
};

const statusBadge: Record<SubmissionStatus, string> = {
  SUBMITTED: "bg-indigo-50 text-[#4F46E5]",
  UNDER_REVIEW: "bg-amber-50 text-amber-600",
  EVALUATED: "bg-emerald-50 text-emerald-600",
};

export default function AdminUserSubmissionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<UserSubmissionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    AdminSubmissionService.getUserSubmissions(userId)
      .then(setData)
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  const submissions = data?.submissions ?? [];

  return (
    <div className="space-y-5 max-w-4xl">
      <button
        onClick={() => navigate("/admin/submissions")}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors"
      >
        <ArrowLeft size={15} /> Back to Submissions
      </button>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4F46E5] font-extrabold shrink-0">
            {(data?.user.name ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{data?.user.name ?? "Unknown user"}</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">{data?.user.email}</p>
          </div>
        </div>
        <span className="text-xs font-extrabold text-slate-400 shrink-0">
          {data?.reviewed ?? 0}/{data?.total ?? 0} reviewed
        </span>
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm divide-y divide-slate-50">
        {submissions.map(sub => (
          <button
            key={sub.id}
            onClick={() => navigate(`/admin/submissions/${userId}/${sub.id}`)}
            className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-[#1E1E2E] rounded-xl flex items-center justify-center shrink-0">
              <Code2 size={16} className="text-[#CDD6F4]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-extrabold text-slate-900 text-sm">{sub.teamName}</p>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-0.5">
                <span>{sub.hackathonTitle}</span>
                <span className="text-slate-200">|</span>
                <span>{sub.language}</span>
                <span className="text-slate-200">|</span>
                <span>Submitted {fmt(sub.submittedAt)}</span>
              </div>
            </div>
            <span className={`text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg shrink-0 ${statusBadge[sub.status]}`}>
              {statusLabel[sub.status]}
            </span>
            <ChevronRight size={16} className="text-slate-300 shrink-0" />
          </button>
        ))}
        {submissions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center">
              <Scale size={22} className="text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400">This user has no hackathon submissions</p>
          </div>
        )}
      </div>
    </div>
  );
}
