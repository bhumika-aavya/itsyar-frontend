import React from "react";
import {
  Trophy, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  BookOpen, Clock, ArrowRight, RotateCcw, Award, Check
} from "lucide-react";
import { DetailedQuizSubmissionResponse } from "@/services/quiz-ai.service";

interface Props {
  result: DetailedQuizSubmissionResponse;
  onRetake?: () => void;
  onContinue?: () => void;
  onViewCertificate?: () => void;
  isFinalQuiz?: boolean;
}

export default function QuizResultBreakdown({
  result,
  onRetake,
  onContinue,
  onViewCertificate,
  isFinalQuiz = false
}: Props) {
  const {
    percentage,
    passed,
    score,
    total_questions,
    passing_threshold,
    time_elapsed_seconds,
    evaluations = [],
    overall_feedback
  } = result;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-slate-900 text-slate-100 p-6 sm:p-10 space-y-8 animate-in fade-in duration-200 select-text">
      {/* Top Header Card */}
      <div className={`relative overflow-hidden rounded-3xl p-8 border ${
        passed
          ? "bg-gradient-to-br from-emerald-950/60 via-slate-900 to-indigo-950/60 border-emerald-500/30"
          : "bg-gradient-to-br from-red-950/60 via-slate-900 to-amber-950/60 border-red-500/30"
      } shadow-2xl`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          <div className="flex items-center gap-5">
            <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 ${
              passed
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-xl shadow-emerald-500/10"
                : "bg-red-500/10 border border-red-500/30 text-red-400 shadow-xl shadow-red-500/10"
            }`}>
              {passed ? <Trophy size={40} /> : <AlertTriangle size={40} />}
            </div>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  passed
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-red-500/20 text-red-300 border border-red-500/30"
                }`}>
                  {passed ? "Assessment Passed" : "Needs Review"}
                </span>
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Clock size={13} /> {formatTime(time_elapsed_seconds || 0)}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {passed ? "Congratulations!" : "Keep Practicing!"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1 max-w-xl">
                {overall_feedback || (
                  passed
                    ? "You have demonstrated solid understanding of this topic's concepts."
                    : "Review the diagnostic feedback below to target areas for improvement before reattempting."
                )}
              </p>
            </div>
          </div>

          {/* Big Percentage Metric */}
          <div className="text-center sm:text-right bg-slate-950/60 border border-slate-800/80 px-6 py-4 rounded-2xl shrink-0">
            <div className={`text-4xl sm:text-5xl font-black tracking-tight ${
              passed ? "text-emerald-400" : "text-red-400"
            }`}>
              {percentage}%
            </div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mt-1">
              Score: {score} / {total_questions} ({passing_threshold}% to pass)
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 mt-6 pt-6 border-t border-slate-800/60">
          {!passed && onRetake && (
            <button
              type="button"
              onClick={onRetake}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              <RotateCcw size={15} /> Retake Assessment
            </button>
          )}

          {passed && isFinalQuiz && onViewCertificate && (
            <button
              type="button"
              onClick={onViewCertificate}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <Award size={16} /> View Certificate
            </button>
          )}

          {onContinue && (
            <button
              type="button"
              onClick={onContinue}
              className="flex items-center gap-2 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>{passed ? "Continue Learning" : "Review & Close"}</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Detailed Diagnostic Questions Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-indigo-400" />
            <h3 className="text-base font-extrabold text-white">
              AI Diagnostic Evaluation Breakdown
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {evaluations.filter(e => e.is_correct).length} of {evaluations.length} Correct
          </span>
        </div>

        <div className="space-y-4">
          {evaluations.map((item, idx) => {
            const isCorrect = item.is_correct;

            return (
              <div
                key={item.question_id || idx}
                className={`p-6 rounded-2xl border transition-all ${
                  isCorrect
                    ? "bg-slate-950/60 border-emerald-500/20 hover:border-emerald-500/40"
                    : "bg-slate-950/70 border-red-500/20 hover:border-red-500/40"
                } space-y-4`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      isCorrect ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                    }`}>
                      {isCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 mr-2">
                        Question {idx + 1}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {item.question_type.replace('_', ' ')}
                      </span>
                      <h4 className="text-sm font-bold text-slate-100 mt-1 leading-relaxed">
                        {item.question_text}
                      </h4>
                    </div>
                  </div>

                  <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                    isCorrect
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}>
                    {item.score} / {item.max_score} pts
                  </span>
                </div>

                {/* Answers Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
                  {/* Student Answer */}
                  <div className={`p-3.5 rounded-xl border ${
                    isCorrect
                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-200"
                      : "bg-red-950/20 border-red-500/20 text-red-200"
                  }`}>
                    <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">
                      Your Answer
                    </span>
                    <p className="font-semibold leading-relaxed">
                      {String(item.user_answer ?? "No answer provided")}
                    </p>
                  </div>

                  {/* Correct Answer */}
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                    <span className="block text-[10px] font-black uppercase tracking-wider text-indigo-400 mb-1 flex items-center gap-1">
                      <Check size={12} /> Verified Correct Answer
                    </span>
                    <p className="font-semibold leading-relaxed text-emerald-300">
                      {String(item.correct_answer)}
                    </p>
                  </div>
                </div>

                {/* Diagnostic: What Went Wrong (if incorrect) */}
                {!isCorrect && item.what_went_wrong && (
                  <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
                    <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black block uppercase tracking-wider text-[10px] text-amber-400 mb-0.5">
                        What Went Wrong
                      </span>
                      <p className="font-medium leading-relaxed">{item.what_went_wrong}</p>
                    </div>
                  </div>
                )}

                {/* Diagnostic: How To Improve */}
                {item.how_to_improve && (
                  <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-indigo-200 text-xs flex items-start gap-3">
                    <BookOpen size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black block uppercase tracking-wider text-[10px] text-indigo-400 mb-0.5">
                        How To Improve
                      </span>
                      <p className="font-medium leading-relaxed">{item.how_to_improve}</p>
                      {item.source_pages && item.source_pages.length > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-300 font-bold text-[10px]">
                          Cited Reference: Page {item.source_pages.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Concept Explanation */}
                {item.explanation && (
                  <div className="text-[11px] font-medium text-slate-400 pl-2 border-l-2 border-slate-700">
                    <strong className="text-slate-300">Concept: </strong>
                    {item.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
