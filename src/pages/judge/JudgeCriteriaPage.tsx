import React, { useState } from "react";
import { ListChecks, Save, Loader2, CheckCircle2 } from "lucide-react";

interface Criterion {
  key: string;
  label: string;
  description: string;
  weight: number;
  maxScore: number;
}

const DEFAULT_CRITERIA: Criterion[] = [
  { key: "innovation", label: "Innovation & Creativity", description: "How original and creative is the solution? Does it solve the problem in a novel way?", weight: 25, maxScore: 10 },
  { key: "technical", label: "Technical Implementation", description: "Code quality, architecture, use of appropriate technologies and best practices.", weight: 30, maxScore: 10 },
  { key: "problem", label: "Problem Solving", description: "How effectively does the solution address the hackathon's problem statement?", weight: 20, maxScore: 10 },
  { key: "presentation", label: "Presentation & Documentation", description: "Clarity of demo, README quality, and how well the team presents their work.", weight: 15, maxScore: 10 },
  { key: "feasibility", label: "Feasibility & Impact", description: "Real-world applicability and potential impact if the solution were deployed.", weight: 10, maxScore: 10 },
];

const TOTAL_WEIGHT = DEFAULT_CRITERIA.reduce((s, c) => s + c.weight, 0);

const SCALE = [
  { score: "0–2", label: "Poor", color: "text-red-500", bg: "bg-red-50" },
  { score: "3–4", label: "Below Average", color: "text-orange-500", bg: "bg-orange-50" },
  { score: "5–6", label: "Average", color: "text-amber-600", bg: "bg-amber-50" },
  { score: "7–8", label: "Good", color: "text-emerald-600", bg: "bg-emerald-50" },
  { score: "9–10", label: "Excellent", color: "text-[#4F39F6]", bg: "bg-indigo-50" },
];

export default function JudgeCriteriaPage() {
  const [criteria, setCriteria] = useState<Criterion[]>(DEFAULT_CRITERIA);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const totalWeight = criteria.reduce((s, c) => s + c.weight, 0);
  const isValid = totalWeight === 100;

  const handleWeightChange = (key: string, val: number) => {
    setCriteria(prev => prev.map(c => c.key === key ? { ...c, weight: Math.max(0, Math.min(100, val)) } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
          <ListChecks size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900">Judging Criteria</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Standard rubric used to evaluate hackathon submissions. Weights must total 100%.
          </p>
        </div>
      </div>

      {/* Weight total indicator */}
      <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border text-sm font-bold ${
        isValid ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-600"
      }`}>
        <div className={`w-2 h-2 rounded-full ${isValid ? "bg-emerald-400" : "bg-red-400"}`} />
        Total weight: {totalWeight}%
        {isValid ? " — criteria balanced correctly" : ` — must equal 100% (${totalWeight > 100 ? "reduce" : "increase"} by ${Math.abs(100 - totalWeight)}%)`}
      </div>

      {/* Criteria cards */}
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div key={c.key} className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 bg-indigo-50 rounded-xl flex items-center justify-center text-xs font-black text-[#4F39F6]">
                  {i + 1}
                </div>
                <div>
                  <p className="font-black text-slate-900">{c.label}</p>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">Max score: {c.maxScore}/10</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={c.weight}
                  onChange={e => handleWeightChange(c.key, parseInt(e.target.value) || 0)}
                  className="w-16 h-9 text-center bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-[#4F39F6] outline-none focus:border-[#4F39F6] focus:bg-white transition-all"
                />
                <span className="text-sm font-black text-slate-400">%</span>
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 leading-relaxed">{c.description}</p>
            {/* Weight bar */}
            <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#4F39F6] rounded-full transition-all"
                style={{ width: `${c.weight}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Scoring scale reference */}
      <div className="bg-white border border-slate-100 rounded-[20px] p-6 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Scoring Scale Reference</p>
        <div className="grid grid-cols-5 gap-3">
          {SCALE.map(s => (
            <div key={s.score} className={`${s.bg} rounded-xl p-3 text-center`}>
              <p className={`text-lg font-black ${s.color}`}>{s.score}</p>
              <p className={`text-[10px] font-black uppercase tracking-wide mt-0.5 ${s.color}`}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between pt-2">
        {saved ? (
          <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
            <CheckCircle2 size={16} /> Criteria saved successfully
          </span>
        ) : (
          <span className="text-xs font-bold text-slate-400">
            Changes apply to all upcoming hackathon judgements
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !isValid}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4F39F6] text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save Criteria"}
        </button>
      </div>
    </div>
  );
}
