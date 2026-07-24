import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Save, Send, Loader2,
  CheckCircle2, Code2, Lock, Zap
} from "lucide-react";
import { HackathonService } from "@/services/hackathon.service";
import { MentorSubmission } from "@/schemas/hackathon.schema";
import { SubmissionScores } from "@/services/admin-submission.service";

interface Criterion { key: keyof SubmissionScores; label: string; max: number }

const CRITERIA: Criterion[] = [
  { key: "innovation", label: "Innovation", max: 10 },
  { key: "technicalFeasibility", label: "Technical Feasibility", max: 10 },
  { key: "uiUx", label: "UI/UX", max: 10 },
  { key: "accessibility", label: "Accessibility", max: 10 },
];

const TABS = ["Overview", "Code", "Submission Info"] as const;
type Tab = typeof TABS[number];

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const zeroScores = (): Record<string, number> => ({
  innovation: 0,
  technicalFeasibility: 0,
  uiUx: 0,
  accessibility: 0
});

export default function SubmissionReview() {
  const { submissionId } = useParams<{ submissionId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<MentorSubmission | null>(null);
  const [submissions, setSubmissions] = useState<MentorSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("Overview");

  // Scoring states
  const [scores, setScores] = useState<Record<string, number>>(zeroScores());
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState<"draft" | "submit" | null>(null);

  const loadDetail = useCallback(async () => {
    if (!submissionId) return;
    setLoading(true);
    try {
      const data = await HackathonService.getSubmissionById(submissionId);
      setDetail(data);

      if (data.scores) {
        setScores({
          innovation: data.scores.innovation ?? 0,
          technicalFeasibility: data.scores.technicalFeasibility ?? 0,
          uiUx: data.scores.uiUx ?? 0,
          accessibility: data.scores.accessibility ?? 0,
        });
        setFeedback(data.reviewNotes ?? "");
      } else {
        setScores(zeroScores());
        setFeedback("");
      }

      // Fetch the sibling submissions for focus mode footer
      if (data.hackathonId) {
        const list = await HackathonService.getMentorSubmissions();
        const siblings = list.filter(item => item.hackathonId === data.hackathonId);
        setSubmissions(siblings);
      }
    } catch (err: any) {
      console.error("Failed to load submission detail", err);
      toast.error("Failed to load submission details.");
    } finally {
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const isFinal = detail?.status === "EVALUATED";
  const index = submissions.findIndex(s => s.submissionId === submissionId);
  const weightedScore = (scores.innovation + scores.technicalFeasibility + scores.uiUx + scores.accessibility) / 4;

  const goto = (i: number) => {
    if (i < 0 || i >= submissions.length) return;
    navigate(`/mentor/submissions/${submissions[i].submissionId}`);
  };

  const handleSave = async (final: boolean) => {
    if (!submissionId) return;
    setSaving(final ? "submit" : "draft");
    try {
      const reviewPayload = {
        scores: {
          innovation: scores.innovation,
          technicalFeasibility: scores.technicalFeasibility,
          uiUx: scores.uiUx,
          accessibility: scores.accessibility
        },
        feedback
      };

      if (final) {
        await HackathonService.reviewSubmission(submissionId, reviewPayload);
        toast.success("Review evaluation submitted successfully.");
      } else {
        await HackathonService.saveReviewDraft(submissionId, reviewPayload);
        toast.success("Draft review saved successfully.");
      }
      await loadDetail();
    } catch (err: any) {
      console.error("Save review failed", err);
      toast.error(err.message || "Failed to update review.");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-5xl space-y-5">
        <button onClick={() => navigate("/mentor")} className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors">
          <ArrowLeft size={15} /> Back to Dashboard
        </button>
        <p className="text-sm font-bold text-slate-400">Submission not found.</p>
      </div>
    );
  }

  const reviewedCount = submissions.filter(s => s.status === "EVALUATED").length;

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-4 p-6 md:py-8 animate-in fade-in duration-500">
      <button
        onClick={() => navigate("/mentor")}
        className="flex items-center gap-2 text-sm font-bold text-[#4F46E5] hover:underline"
      >
        <ArrowLeft size={15} /> Back to Judging Dashboard
      </button>

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">{detail.hackathonTitle}</h1>
          <p className="text-sm font-bold text-slate-400 mt-1">
            Participant: {detail.participantName} ({detail.participantEmail}) · Language: {detail.language}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-100">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-extrabold border-b-2 transition-colors ${tab === t ? "border-[#4F46E5] text-[#4F46E5]" : "border-transparent text-slate-400 hover:text-slate-600"
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
              <div className="bg-indigo-50/60 border border-indigo-100 rounded-[20px] p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={15} className="text-[#4F46E5]" />
                  <p className="text-sm font-extrabold text-slate-900">Problem Statement</p>
                </div>
                <p className="text-xs font-medium text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {detail.problemStatement || "No problem statement description attached."}
                </p>
              </div>
              {detail.hackathonDescription && (
                <div className="bg-white border border-slate-100 rounded-[20px] p-5">
                  <p className="text-sm font-extrabold text-slate-900 mb-2">About the Hackathon</p>
                  <p className="text-xs font-medium text-slate-500 leading-relaxed">{detail.hackathonDescription}</p>
                </div>
              )}
            </>
          )}

          {tab === "Code" && (
            <div className="bg-[#1E1E2E] rounded-[20px] p-5 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <Code2 size={14} className="text-white/40" />
                <p className="text-xs font-bold text-white/40">{detail.language}</p>
              </div>
              <pre className="text-[#CDD6F4] text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[480px]">
                {detail.code || "No solution attachment found."}
              </pre>
            </div>
          )}

          {tab === "Submission Info" && (
            <div className="bg-white border border-slate-100 rounded-[20px] p-5 divide-y divide-slate-50">
              {[
                ["Team Name", detail.teamName || "Team Alpha"],
                ["Language", detail.language],
                ["Submitted At", fmt(detail.submittedAt)],
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
        <div className="bg-white border border-slate-100 rounded-[24px] p-6 space-y-5 lg:sticky lg:top-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Judge Panel</p>
              <p className="text-lg font-extrabold text-slate-900">Evaluation</p>
            </div>
            <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 px-3 py-1.5 rounded-xl text-center shrink-0">
              <span className="block text-[9px] tracking-widest">WEIGHTED SCORE</span>
              {weightedScore.toFixed(2)}/10
            </span>
          </div>

          {isFinal && (
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
              <CheckCircle2 size={13} /> Reviewed &amp; locked
            </div>
          )}

          <div className="space-y-4">
            {CRITERIA.map(c => (
              <div key={c.key}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-sm font-bold text-slate-700">{c.label}</p>
                  <span className="text-sm font-extrabold text-[#4F46E5]">{scores[c.key] ?? 0}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={c.max}
                  step={1}
                  value={scores[c.key] ?? 0}
                  disabled={isFinal}
                  onChange={e => setScores(s => ({ ...s, [c.key]: parseInt(e.target.value) || 0 }))}
                  className="w-full h-2 rounded-full appearance-none bg-slate-100 accent-[#4F46E5] disabled:opacity-50"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">
              Evaluation Notes &amp; Feedback
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

          {!isFinal ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleSave(false)}
                disabled={saving !== null}
                className="flex-1 py-2.5 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {saving === "draft" ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Draft
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving !== null}
                className="flex-1 py-2.5 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving === "submit" ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Submit Review
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium text-slate-400 flex items-center gap-1.5 justify-center">
              <Lock size={12} /> Evaluation is finalized.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
