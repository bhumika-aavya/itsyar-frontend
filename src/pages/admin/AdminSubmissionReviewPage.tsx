import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Save, Send, Loader2,
  PlayCircle, FileText, Info, Zap, CheckCircle2, Share2, Flag,
} from "lucide-react";
import { AdminService, AdminUser } from "@/services/admin.service";
import { HackathonService } from "@/services/hackathon.service";
import { getMockSubmissionsForUser, MockUserSubmission } from "@/lib/mockUserSubmissions";
import { getReview, saveReview } from "@/lib/adminReviewStore";

interface Criterion { key: string; label: string; weight: number; max: number }

const CRITERIA: Criterion[] = [
  { key: "innovation", label: "Innovation", weight: 25, max: 10 },
  { key: "technical", label: "Technical Feasibility", weight: 40, max: 10 },
  { key: "uiux", label: "UI/UX", weight: 25, max: 10 },
  { key: "accessibility", label: "Accessibility", weight: 10, max: 10 },
];

const TABS = ["Overview", "Files & Links", "Submission Info"] as const;
type Tab = typeof TABS[number];

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const zeroScores = () => Object.fromEntries(CRITERIA.map(c => [c.key, 0]));

export default function AdminSubmissionReviewPage() {
  const { userId, hackathonId } = useParams<{ userId: string; hackathonId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [submissions, setSubmissions] = useState<MockUserSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Overview");

  const [scores, setScores] = useState<Record<string, number>>(zeroScores());
  const [feedback, setFeedback] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

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

  useEffect(() => {
    if (!userId || !hackathonId) return;
    const existing = getReview(userId, hackathonId);
    setScores(existing?.scores ?? zeroScores());
    setFeedback(existing?.feedback ?? "");
    setIsFinal(existing?.isFinal ?? false);
    setTab("Overview");
  }, [userId, hackathonId]);

  const index = submissions.findIndex(s => s.hackathonId === hackathonId);
  const current = submissions[index];
  const totalScore = CRITERIA.reduce((sum, c) => sum + ((scores[c.key] ?? 0) * c.weight / 100), 0);
  const reviewedCount = submissions.filter(s => getReview(userId ?? "", s.hackathonId)?.isFinal).length;

  const goto = (i: number) => {
    if (i < 0 || i >= submissions.length) return;
    navigate(`/admin/submissions/${userId}/${submissions[i].hackathonId}`);
  };

  const handleSave = async (final: boolean) => {
    if (!userId || !hackathonId) return;
    setSaving(final ? "submit" : "draft");
    await new Promise(r => setTimeout(r, 500));
    saveReview(userId, hackathonId, { scores, feedback, totalScore, reviewedAt: new Date().toISOString(), isFinal: final });
    setIsFinal(final);
    setSaving(null);
    toast.success(final ? "Review submitted" : "Draft saved");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="max-w-5xl space-y-5">
        <button onClick={() => navigate(`/admin/submissions/${userId}`)} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors">
          <ArrowLeft size={15} /> Back to Queue
        </button>
        <p className="text-sm font-bold text-slate-400">Submission not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5 pb-4">
      <button
        onClick={() => navigate(`/admin/submissions/${userId}`)}
        className="flex items-center gap-2 text-sm font-bold text-[#4F46E5] hover:underline"
      >
        <ArrowLeft size={15} /> Back to Judging Queue
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{current.team}</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">
            {user?.fullName}, {current.teammate} · {current.hackathonTitle}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-1">
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
            <Share2 size={16} />
          </button>
          <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
            <Flag size={16} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-colors ${
              tab === t ? "border-[#4F46E5] text-[#4F46E5]" : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5 items-start">
        {/* Left content */}
        <div className="space-y-4">
          {tab === "Overview" && (
            <>
              <div className="bg-[#0F0F1A] rounded-[24px] aspect-video flex items-center justify-center relative overflow-hidden">
                <PlayCircle size={56} className="text-white/80" />
                <span className="absolute bottom-4 left-4 text-xs font-bold text-white/70">Project Demo Walkthrough</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-100 rounded-[20px] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info size={15} className="text-[#4F46E5]" />
                    <p className="text-sm font-extrabold text-slate-900">About Project</p>
                  </div>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{current.aboutProject}</p>
                </div>
                <div className="bg-indigo-50/60 border border-indigo-100 rounded-[20px] p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={15} className="text-[#4F46E5]" />
                    <p className="text-sm font-extrabold text-slate-900">Problem Statement</p>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-relaxed">{current.problemStatement}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-100 rounded-[20px] p-5">
                <p className="text-sm font-extrabold text-slate-900 mb-3">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {current.techStack.map(t => (
                    <span key={t} className="text-xs font-bold text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "Files & Links" && (
            <div className="bg-white border border-slate-100 rounded-[20px] p-5 space-y-3">
              <p className="text-sm font-extrabold text-slate-900 mb-1">Submission Files</p>
              {current.files.map(f => (
                <div key={f.name} className="flex items-center gap-3 px-4 py-3 bg-slate-50 rounded-xl">
                  <FileText size={16} className="text-slate-400 shrink-0" />
                  <span className="flex-1 text-sm font-bold text-slate-700 truncate">{f.name}</span>
                  <span className="text-xs font-bold text-slate-400">{f.size}</span>
                </div>
              ))}
            </div>
          )}

          {tab === "Submission Info" && (
            <div className="bg-white border border-slate-100 rounded-[20px] p-5 divide-y divide-slate-50">
              {[
                ["Team", current.team],
                ["Contributors", `${user?.fullName}, ${current.teammate}`],
                ["Hackathon", current.hackathonTitle],
                ["Language", current.language],
                ["Submitted", fmt(current.submittedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between py-3">
                  <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">{label}</span>
                  <span className="text-sm font-bold text-slate-700">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Judge panel */}
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 space-y-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Judge Panel</p>
              <p className="text-lg font-extrabold text-slate-900">Evaluation</p>
            </div>
            <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 px-3 py-1.5 rounded-xl text-center">
              <span className="block text-[9px] tracking-widest">WEIGHTED SCORE</span>
              {totalScore.toFixed(1)}/10
            </span>
          </div>

          {isFinal && (
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle2 size={13} /> Reviewed & confirmed
            </div>
          )}

          <div className="space-y-4">
            {CRITERIA.map(c => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-slate-700">{c.label}</p>
                  <span className="text-sm font-extrabold text-[#4F46E5]">{(scores[c.key] ?? 0).toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={c.max}
                  step={0.5}
                  value={scores[c.key] ?? 0}
                  disabled={isFinal}
                  onChange={e => setScores(s => ({ ...s, [c.key]: parseFloat(e.target.value) }))}
                  className="w-full h-2 rounded-full appearance-none bg-slate-100 accent-[#4F46E5] disabled:opacity-50"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">
              Evaluation Notes & Feedback
            </label>
            <textarea
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              disabled={isFinal}
              placeholder="Provide constructive feedback for the team..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all resize-none disabled:opacity-60"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={isFinal || saving !== null}
              className="flex-1 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isFinal || saving !== null}
              className="flex-1 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
            >
              {saving === "submit" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Submit Review
            </button>
          </div>
          <p className="text-[11px] font-bold text-slate-400 text-center">
            * Final submission cannot be edited once confirmed.
          </p>
        </div>
      </div>

      {/* Focus mode footer */}
      <div className="sticky bottom-0 bg-white border border-slate-100 rounded-[20px] px-6 py-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">
            Submission Review · Focus Mode: {user?.fullName}'s Queue
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-extrabold text-slate-500">Reviewed {reviewedCount}/{submissions.length}</span>
            <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F46E5] rounded-full"
                style={{ width: `${submissions.length ? (reviewedCount / submissions.length) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goto(index - 1)}
            disabled={index <= 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-extrabold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={14} /> Previous
          </button>
          <button
            onClick={() => goto(index + 1)}
            disabled={index >= submissions.length - 1}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold hover:bg-[#4338CA] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight size={14} />
          </button>
          <button
            onClick={() => goto(index + 1)}
            disabled={index >= submissions.length - 1}
            className="px-3 py-2 text-xs font-extrabold text-slate-400 hover:text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
