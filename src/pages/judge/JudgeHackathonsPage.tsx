import React, { useState } from "react";
import { Scale, X, Save, Loader2, ChevronDown, ChevronRight, Code2, CheckCircle2 } from "lucide-react";

interface Criterion { key: string; label: string; weight: number; max: number }
interface Submission { id: string; name: string; team: string; language: string; submittedAt: string; scored: boolean }
interface Hackathon { id: string; title: string; mode: string; deadline: string; submissions: Submission[]; status: string }

const CRITERIA: Criterion[] = [
  { key: "innovation", label: "Innovation & Creativity", weight: 25, max: 10 },
  { key: "technical", label: "Technical Implementation", weight: 30, max: 10 },
  { key: "problem", label: "Problem Solving", weight: 20, max: 10 },
  { key: "presentation", label: "Presentation & Docs", weight: 15, max: 10 },
  { key: "feasibility", label: "Feasibility & Impact", weight: 10, max: 10 },
];

const MOCK_HACKATHONS: Hackathon[] = [
  {
    id: "1", title: "AI Innovation Challenge", mode: "Online", deadline: "2026-07-20", status: "In Progress",
    submissions: [
      { id: "s1", name: "Riya Sharma", team: "Team Alpha", language: "Python", submittedAt: "2026-07-05T10:30:00Z", scored: true },
      { id: "s2", name: "Arjun Mehta", team: "Beta Coders", language: "JavaScript", submittedAt: "2026-07-05T12:00:00Z", scored: false },
      { id: "s3", name: "Priya Nair", team: "Dev Squad", language: "Python", submittedAt: "2026-07-06T09:00:00Z", scored: false },
    ],
  },
  {
    id: "2", title: "Web Dev Sprint", mode: "Hybrid", deadline: "2026-07-25", status: "In Progress",
    submissions: [
      { id: "s4", name: "Karan Patel", team: "Web Warriors", language: "React", submittedAt: "2026-07-04T14:00:00Z", scored: false },
      { id: "s5", name: "Anika Roy", team: "Full Stack", language: "Vue.js", submittedAt: "2026-07-04T16:30:00Z", scored: false },
    ],
  },
  {
    id: "3", title: "Open Source Hackathon", mode: "Online", deadline: "2026-07-31", status: "Completed",
    submissions: [
      { id: "s6", name: "Dev Joshi", team: "OSS Heroes", language: "Go", submittedAt: "2026-06-28T11:00:00Z", scored: true },
    ],
  },
];

const fmt = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

type Scores = Record<string, number>;

export default function JudgeHackathonsPage() {
  const [hackathons, setHackathons] = useState<Hackathon[]>(MOCK_HACKATHONS);
  const [expanded, setExpanded] = useState<string | null>("1");
  const [scoringId, setScoringId] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores>({});
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  const openScoring = (subId: string) => {
    setScoringId(subId);
    setScores(Object.fromEntries(CRITERIA.map(c => [c.key, 0])));
    setFeedback("");
  };

  const handleSubmitScore = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setHackathons(prev => prev.map(h => ({
      ...h,
      submissions: h.submissions.map(s => s.id === scoringId ? { ...s, scored: true } : s),
    })));
    setSaving(false);
    setScoringId(null);
  };

  const scoringSubmission = hackathons.flatMap(h => h.submissions).find(s => s.id === scoringId);
  const totalScore = CRITERIA.reduce((sum, c) => sum + ((scores[c.key] ?? 0) * c.weight / 100), 0);

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Judge Hackathons</h1>
        <p className="text-sm font-medium text-slate-400 mt-0.5">Score submissions for your assigned hackathons</p>
      </div>

      <div className="space-y-3">
        {hackathons.map(h => {
          const isOpen = expanded === h.id;
          const total = h.submissions.length;
          const reviewed = h.submissions.filter(s => s.scored).length;
          const isDone = h.status === "Completed" || reviewed === total;

          return (
            <div key={h.id} className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
              {/* Hackathon header */}
              <button
                onClick={() => setExpanded(isOpen ? null : h.id)}
                className="w-full flex items-center gap-4 px-6 py-5 hover:bg-slate-50/50 transition-colors text-left"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-slate-50" : "bg-amber-50"}`}>
                  <Scale size={18} className={isDone ? "text-slate-400" : "text-amber-600"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <p className="font-black text-slate-900">{h.title}</p>
                    <span className={`text-[11px] font-black px-2.5 py-1 rounded-lg shrink-0 ${
                      isDone ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    }`}>
                      {isDone ? "Completed" : `${total - reviewed} pending`}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{h.mode} · Deadline: {fmt(h.deadline)}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-[11px] font-black text-slate-400">{reviewed}/{total} reviewed</p>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isDone ? "bg-emerald-400" : "bg-[#4F39F6]"}`}
                        style={{ width: `${total > 0 ? (reviewed / total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                </div>
              </button>

              {/* Submissions list */}
              {isOpen && (
                <div className="border-t border-slate-50">
                  {h.submissions.map(sub => (
                    <div key={sub.id} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="w-10 h-10 bg-[#1E1E2E] rounded-xl flex items-center justify-center shrink-0">
                        <Code2 size={16} className="text-[#CDD6F4]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 text-sm">{sub.name}</p>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-400 mt-0.5">
                          <span>{sub.team}</span>
                          <span className="text-slate-200">|</span>
                          <span>{sub.language}</span>
                          <span className="text-slate-200">|</span>
                          <span>{timeAgo(sub.submittedAt)}</span>
                        </div>
                      </div>
                      {sub.scored ? (
                        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1.5 rounded-xl shrink-0">
                          <CheckCircle2 size={13} /> Scored
                        </span>
                      ) : (
                        <button
                          onClick={() => openScoring(sub.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#4F39F6] text-white rounded-xl text-xs font-black hover:bg-[#3f2dd1] transition-all shrink-0"
                        >
                          Score <ChevronRight size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Scoring modal */}
      {scoringId && scoringSubmission && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900">Score Submission</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">
                  {scoringSubmission.name} — {scoringSubmission.team}
                </p>
              </div>
              <button onClick={() => setScoringId(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              {CRITERIA.map(c => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-black text-slate-800">{c.label}</p>
                      <p className="text-[11px] font-bold text-slate-400">Weight: {c.weight}%</p>
                    </div>
                    <span className="text-lg font-black text-[#4F39F6] w-12 text-right">
                      {scores[c.key] ?? 0}<span className="text-sm text-slate-400">/{c.max}</span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={c.max}
                    step={0.5}
                    value={scores[c.key] ?? 0}
                    onChange={e => setScores(s => ({ ...s, [c.key]: parseFloat(e.target.value) }))}
                    className="w-full h-2 rounded-full appearance-none bg-slate-100 accent-[#4F39F6]"
                  />
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mt-0.5">
                    <span>0</span><span>5</span><span>10</span>
                  </div>
                </div>
              ))}

              {/* Weighted total */}
              <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between">
                <p className="text-sm font-black text-[#4F39F6]">Weighted Total Score</p>
                <p className="text-2xl font-black text-[#4F39F6]">{totalScore.toFixed(1)}<span className="text-sm">/10</span></p>
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Feedback (optional)</label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Add comments for the participant..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6] focus:bg-white transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setScoringId(null)} className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-black text-sm hover:bg-slate-100 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSubmitScore}
                disabled={saving}
                className="flex-1 py-3 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Submitting…" : "Submit Score"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
