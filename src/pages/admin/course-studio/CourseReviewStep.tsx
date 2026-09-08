import React from "react";
import { BookOpen, Clock, AlertCircle, Save, BrainCircuit, Loader2, FileEdit, CheckCircle2 } from "lucide-react";
import { CourseReviewStepProps } from "./types";

export default function CourseReviewStep({
  title,
  description,
  instructor,
  category,
  level,
  duration,
  thumbnail,
  modules,
  totalTopicsCount,
  isEditing,
  saving,
  status = "published",
  setStatus,
  isActive = true,
  setIsActive,
  onBack,
  onPublish,
  onSaveDraft,
}: CourseReviewStepProps) {
  const isDraft = status === "draft";

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[28px] p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2e303a] pb-6">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Review Curriculum</h2>
            <p className="text-sm font-medium text-slate-400 mt-1">
              Verify course details, status, and curriculum structure before finalizing.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-wide flex items-center gap-1.5 ${
                isDraft
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {isDraft ? <Clock size={13} /> : <CheckCircle2 size={13} />}
              <span>{isDraft ? "Draft" : "Published"}</span>
            </span>
          </div>
        </div>

        {/* Course Summary Banner */}
        <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-[#1c1d24] p-5 rounded-2xl border border-slate-200/60 dark:border-[#2e303a]">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full sm:w-44 h-28 object-cover rounded-xl border border-slate-200 dark:border-[#2e303a]"
            />
          ) : (
            <div className="w-full sm:w-44 h-28 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-[#4F46E5]">
              <BookOpen size={36} />
            </div>
          )}

          <div className="space-y-2 w-full">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-[#4F46E5] text-white text-[11px] font-extrabold">
                {category}
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                {level}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                  isDraft
                    ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400"
                }`}
              >
                {isDraft ? "Draft" : "Published"}
              </span>
              {duration && (
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={12} /> {duration}
                </span>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
            <p className="text-xs font-bold text-slate-400">By {instructor}</p>
            {description && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Curriculum Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Modules Breakdown ({modules.length} Modules &bull; {totalTopicsCount} Topics)
          </h4>

          {modules.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60">
              <AlertCircle size={18} className="mx-auto mb-1" />
              No modules added. Learners will see an empty syllabus. You can still save and add modules later.
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((m, mIdx) => (
                <div
                  key={m.id}
                  className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 space-y-2 bg-white dark:bg-[#16171d]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                      Module {mIdx + 1}: {m.title}
                    </span>
                    <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                      {m.topics?.length || 0} topics
                    </span>
                  </div>
                  {m.topics && m.topics.length > 0 && (
                    <div className="pl-4 border-l-2 border-slate-200 dark:border-[#2e303a] space-y-1.5 pt-1">
                      {m.topics.map((t, tIdx) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400"
                        >
                          <span>
                            {tIdx + 1}. {t.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] font-bold">
                            <span className="text-slate-400">{t.assets?.length || 0} assets</span>
                            {t.quiz && t.quiz.questions?.length > 0 ? (
                              <span className="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <BrainCircuit size={11} /> {t.quiz.questions.length} Quiz Qs
                              </span>
                            ) : (
                              <span className="text-slate-400">No quiz</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-[#2e303a] flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-full sm:w-auto px-6 py-3 bg-slate-100 dark:bg-[#1c1d24] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-slate-200 transition-all cursor-pointer"
          >
            Back to Curriculum
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={saving}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs font-extrabold hover:bg-amber-100 transition-all disabled:opacity-60 cursor-pointer"
              >
                <FileEdit size={14} />
                <span>Save as Draft</span>
              </button>
            )}

            <button
              type="button"
              onClick={onPublish}
              disabled={saving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-10 dark:shadow-none0 dark:shadow-none hover:bg-[#4338CA] transition-all disabled:opacity-60 cursor-pointer"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              <span>
                {saving
                  ? "Saving..."
                  : isEditing
                  ? "Save & Update Course"
                  : status === "draft"
                  ? "Save Course (Draft)"
                  : "Publish Course"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
