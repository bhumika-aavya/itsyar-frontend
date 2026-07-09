import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Scale, Loader2, Code2, ChevronRight } from "lucide-react";
import { AdminService, AdminUser } from "@/services/admin.service";
import { HackathonService } from "@/services/hackathon.service";
import { getMockSubmissionsForUser, MockUserSubmission } from "@/lib/mockUserSubmissions";
import { getReview } from "@/lib/adminReviewStore";

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

type QueueStatus = "In Queue" | "In Progress" | "Reviewed";

const statusBadge: Record<QueueStatus, string> = {
  "In Queue": "bg-indigo-50 text-[#4F39F6]",
  "In Progress": "bg-amber-50 text-amber-600",
  "Reviewed": "bg-emerald-50 text-emerald-600",
};

export default function AdminUserSubmissionsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [submissions, setSubmissions] = useState<MockUserSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    Promise.all([AdminService.getUsers(), HackathonService.getHackathons()])
      .then(([users, hackathons]) => {
        setUser(users.find(u => String(u.id) === String(userId)) ?? null);
        const list = Array.isArray(hackathons) ? hackathons : [];
        setSubmissions(getMockSubmissionsForUser(userId, list));
      })
      .finally(() => setLoading(false));
  }, [userId]);

  const statusFor = (hackathonId: string): QueueStatus => {
    const review = userId ? getReview(userId, hackathonId) : null;
    if (review?.isFinal) return "Reviewed";
    if (review) return "In Progress";
    return "In Queue";
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
      </div>
    );
  }

  const reviewedCount = submissions.filter(s => statusFor(s.hackathonId) === "Reviewed").length;

  return (
    <div className="space-y-5 max-w-4xl">
      <button
        onClick={() => navigate("/admin/submissions")}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4F39F6] transition-colors"
      >
        <ArrowLeft size={15} /> Back to Submissions
      </button>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#4F39F6] font-black shrink-0">
            {(user?.fullName ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{user?.fullName ?? "Unknown user"}</h1>
            <p className="text-sm font-medium text-slate-400 mt-0.5">{user?.email}</p>
          </div>
        </div>
        <span className="text-xs font-black text-slate-400 shrink-0">
          {reviewedCount}/{submissions.length} reviewed
        </span>
      </div>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm divide-y divide-slate-50">
        {submissions.map(sub => {
          const status = statusFor(sub.hackathonId);
          return (
            <button
              key={sub.hackathonId}
              onClick={() => navigate(`/admin/submissions/${userId}/${sub.hackathonId}`)}
              className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-[#1E1E2E] rounded-xl flex items-center justify-center shrink-0">
                <Code2 size={16} className="text-[#CDD6F4]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-sm">{sub.team}</p>
                <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-0.5">
                  <span>{sub.hackathonTitle}</span>
                  <span className="text-slate-200">|</span>
                  <span>{sub.language}</span>
                  <span className="text-slate-200">|</span>
                  <span>Submitted {fmt(sub.submittedAt)}</span>
                </div>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-1.5 rounded-lg shrink-0 ${statusBadge[status]}`}>
                {status}
              </span>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </button>
          );
        })}
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
