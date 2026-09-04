import React from "react";
import {
  Trophy, CheckCircle2, XCircle, AlertTriangle, Sparkles,
  BookOpen, Clock, ArrowRight, RotateCcw, Award, Check, Lightbulb, Compass,
  Layers, ChevronRight, HelpCircle
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
    percentage: rawPercentage,
    passed: rawPassed,
    score: rawScore,
    total_questions: rawTotalQuestions,
    passing_threshold = 70,
    time_elapsed_seconds = 0,
    evaluations: rawEvaluations = [],
    overall_feedback
  } = result || {};

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Helper to accurately determine if an evaluation item is correct
  const isItemCorrect = (item: any): boolean => {
    if (item.is_correct === true || String(item.is_correct).toLowerCase() === "true") return true;
    if (item.score !== undefined && item.max_score !== undefined && item.score > 0 && item.score >= item.max_score) return true;
    const u = String(item.user_answer ?? item.userAnswer ?? "").trim().toLowerCase();
    const c = String(item.correct_answer ?? item.correctAnswer ?? item.expected_answer ?? "").trim().toLowerCase();
    return Boolean(u && c && u === c && u !== "not answered" && u !== "no answer provided");
  };

  const processedEvaluations = rawEvaluations.map((item, idx) => {
    const correct = isItemCorrect(item);
    const maxPts = Number(item.max_score ?? item.points ?? 1);
    const awardedPts = correct ? (Number(item.score) || maxPts) : 0;
    const rawType = String(item.question_type || (item as any).type || "mcq");
    const formattedType = rawType.replace(/_/g, " ");
    const questionText = item.question_text || (item as any).text || (item as any).question || `Question ${idx + 1}`;
    const userAnswer = item.user_answer ?? (item as any).userAnswer ?? "No answer provided";
    const correctAnswer = item.correct_answer ?? (item as any).correctAnswer ?? (item as any).expected_answer ?? "Verified Concept";
    const conceptExplanation = item.explanation || (item as any).concept || "Core technical concept tested in this curriculum.";
    
    const whatWentWrong = item.what_went_wrong || (!correct ? (
      userAnswer === "No answer provided" || userAnswer === "Not answered"
        ? `Question ${idx + 1}: Unanswered or skipped.`
        : `Question ${idx + 1}: Selected "${userAnswer}" instead of "${correctAnswer}".`
    ) : undefined);

    const howToImprove = item.how_to_improve || (!correct
      ? `Review the documentation for ${questionText}. Note: ${conceptExplanation}`
      : undefined);

    return {
      ...item,
      is_correct: correct,
      score: awardedPts,
      max_score: maxPts,
      formattedType,
      questionText,
      userAnswer,
      correctAnswer,
      whatWentWrong,
      howToImprove,
      conceptExplanation
    };
  });

  const correctCount = processedEvaluations.filter(e => e.is_correct).length;
  const incorrectCount = processedEvaluations.length - correctCount;
  const totalQuestions = rawTotalQuestions || processedEvaluations.length || 1;
  const calculatedScore = processedEvaluations.reduce((acc, e) => acc + (e.score || 0), 0);
  const maxPossibleScore = processedEvaluations.reduce((acc, e) => acc + (e.max_score || 1), 0) || 1;
  
  const percentage = rawPercentage !== undefined && rawPercentage !== null
    ? rawPercentage
    : Math.round((calculatedScore / maxPossibleScore) * 100);

  const passed = rawPassed !== undefined ? rawPassed : percentage >= passing_threshold;

  // --- OVERALL SYNTHESIS FOR THE 3 PARAMETERS ---
  const incorrectItems = processedEvaluations.filter(e => !e.is_correct);

  // 1. Overall: What Went Wrong
  const overallWhatWentWrong = incorrectItems.length === 0
    ? "No critical errors found! You demonstrated thorough understanding of all concepts covered in this assessment."
    : `You missed ${incorrectItems.length} question(s) regarding ${incorrectItems.map(i => i.formattedType.toUpperCase()).join(', ')} concepts.`;

  // 2. Overall: Key Concepts & Correct Explanations
  const overallKeyConcepts = processedEvaluations.map(e => ({
    title: e.questionText,
    correctAnswer: e.correctAnswer,
    explanation: e.conceptExplanation,
    isCorrect: e.is_correct
  }));

  // 3. Overall: Areas for Improvement and Recommendations
  const overallRecommendations = incorrectItems.length === 0
    ? [
        "Continue to the next advanced module or hands-on practical assignment.",
        "Solidify your understanding by exploring related architecture guides and implementation repositories."
      ]
    : [
        `Focus revision on the topics covered in questions: ${incorrectItems.map((_, i) => `#${processedEvaluations.indexOf(incorrectItems[i]) + 1}`).join(', ')}.`,
        "Review module lesson notes, video walkthroughs, and code examples for the missed concepts before re-attempting.",
        "Take note of key architectural distinctions and syntax rules highlighted in the conceptual explanations below."
      ];

  const citedPages = Array.from(
    new Set(processedEvaluations.flatMap(e => e.source_pages || []))
  );

  return (
    <div className="w-full h-full overflow-y-auto bg-[#0b0d14] text-slate-100 p-6 sm:p-8 space-y-8 select-text">
      {/* Top Banner Card */}
      <div className={`relative w-full rounded-3xl p-6 sm:p-8 border shadow-2xl transition-all ${
        passed
          ? "bg-gradient-to-br from-emerald-950/70 via-[#111625] to-indigo-950/60 border-emerald-500/40 shadow-emerald-950/20"
          : "bg-gradient-to-br from-red-950/70 via-[#161220] to-amber-950/60 border-red-500/40 shadow-red-950/20"
      }`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Info Column */}
          <div className="flex items-center gap-5 w-full lg:w-auto">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 border shadow-xl ${
              passed
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20"
                : "bg-red-500/20 border-red-500/40 text-red-400 shadow-red-500/20"
            }`}>
              {passed ? <Trophy size={36} className="text-emerald-400 animate-pulse" /> : <AlertTriangle size={36} className="text-red-400" />}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-xs ${
                  passed
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                    : "bg-red-500/20 text-red-300 border-red-500/40"
                }`}>
                  {passed ? "Assessment Passed" : "Needs Review"}
                </span>
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-800">
                  <Clock size={12} className="text-slate-400" /> {formatTime(time_elapsed_seconds || 0)}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {passed ? "Congratulations!" : "Keep Practicing!"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-xl">
                {overall_feedback || (
                  passed
                    ? "You have demonstrated strong proficiency in this topic's concepts."
                    : "Review the overall diagnostic breakdown below to target areas for improvement before reattempting."
                )}
              </p>
            </div>
          </div>

          {/* Right Metrics Box */}
          <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
            <div className="bg-slate-950/90 border border-slate-800/90 px-6 py-4 rounded-2xl text-center shadow-lg min-w-[140px]">
              <div className={`text-4xl sm:text-5xl font-black tracking-tight ${
                passed ? "text-emerald-400" : "text-red-400"
              }`}>
                {percentage}%
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Score: {calculatedScore} / {maxPossibleScore} pts
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2">
              {!passed && onRetake && (
                <button
                  type="button"
                  onClick={onRetake}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer shadow-md"
                >
                  <RotateCcw size={14} /> Retake
                </button>
              )}

              {passed && isFinalQuiz && onViewCertificate && (
                <button
                  type="button"
                  onClick={onViewCertificate}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <Award size={14} /> Certificate
                </button>
              )}

              {onContinue && (
                <button
                  type="button"
                  onClick={onContinue}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>{passed ? "Continue" : "Done"}</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* OVERALL RESULT FOR THE 3 PARAMETERS (DEDICATED SECTION) */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles size={16} />
            </div>
            <h3 className="text-base font-extrabold text-white">
              Overall Quiz Assessment Summary
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-400 flex items-center gap-1 bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle2 size={13} /> {correctCount} of {totalQuestions} Correct
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* PARAMETER 1: Overall What Went Wrong */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
            incorrectItems.length > 0
              ? "bg-amber-950/20 border-amber-500/30 text-amber-200"
              : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
          }`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {incorrectItems.length > 0 ? (
                  <AlertTriangle size={18} className="text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                )}
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                  1. What Went Wrong
                </h4>
              </div>
              <p className="text-xs font-medium text-slate-200 leading-relaxed">
                {overallWhatWentWrong}
              </p>
              {incorrectItems.length > 0 && (
                <ul className="space-y-1.5 pt-1 text-[11px] text-amber-200/90 list-disc list-inside">
                  {incorrectItems.map((item, idx) => (
                    <li key={idx} className="leading-snug">
                      <span className="font-bold text-white">Q{processedEvaluations.indexOf(item) + 1}:</span> {item.whatWentWrong}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-800/60">
              {incorrectItems.length} Misconception(s) identified
            </div>
          </div>

          {/* PARAMETER 2: Overall Correct Answers & Key Concepts */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-400 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  2. Core Takeaways &amp; Concepts
                </h4>
              </div>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                Essential architectural and implementation principles tested in this assessment:
              </p>
              <div className="space-y-2 pt-1">
                {overallKeyConcepts.map((item, idx) => (
                  <div key={idx} className="text-[11px] p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-0.5">
                    <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                      <span className="text-slate-400">Concept #{idx + 1}</span>
                      <span className="text-emerald-400 flex items-center gap-0.5">
                        <Check size={10} /> {String(item.correctAnswer).slice(0, 30)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-tight font-medium">
                      {item.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-800/60">
              {overallKeyConcepts.length} Concepts covered
            </div>
          </div>

          {/* PARAMETER 3: Overall Areas for Improvement & Recommendations */}
          <div className="p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 text-indigo-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-indigo-400 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                  3. Areas for Improvement &amp; Next Steps
                </h4>
              </div>
              <ul className="space-y-2 pt-1 text-xs text-slate-200">
                {overallRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed text-[11px]">
                    <ChevronRight size={13} className="text-indigo-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
              {citedPages.length > 0 && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-900/60 text-indigo-300 font-bold text-[10px] border border-indigo-500/40">
                    <BookOpen size={11} /> Cited Documentation: Page {citedPages.join(', ')}
                  </span>
                </div>
              )}
            </div>
            <div className="pt-2 text-[10px] font-bold text-indigo-400 uppercase tracking-wider border-t border-slate-800/60">
              Personalized Learning Plan
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* INDIVIDUAL QUESTIONS REVIEW (CLEAN & COMPACT) */}
      {/* ========================================================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
              Individual Question Breakdown
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {processedEvaluations.length} Questions
          </span>
        </div>

        <div className="space-y-3">
          {processedEvaluations.map((item, idx) => {
            const isCorrect = item.is_correct;

            return (
              <div
                key={item.question_id || idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isCorrect
                    ? "bg-[#11131f]/70 border-emerald-500/25 hover:border-emerald-500/40"
                    : "bg-[#14121a]/70 border-red-500/25 hover:border-red-500/40"
                } space-y-3`}
              >
                {/* Header & Score */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      isCorrect
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-red-500/20 text-red-400 border border-red-500/40"
                    }`}>
                      {isCorrect ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          Question {idx + 1}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 uppercase border border-slate-700/60">
                          {item.formattedType}
                        </span>
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                        {item.questionText}
                      </h5>
                    </div>
                  </div>

                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-md shrink-0 border ${
                    isCorrect
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                      : "bg-red-500/20 text-red-300 border-red-500/40"
                  }`}>
                    {item.score} / {item.max_score} pts
                  </span>
                </div>

                {/* Compact Answer Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border ${
                    isCorrect
                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-200"
                      : "bg-red-950/20 border-red-500/20 text-red-200"
                  }`}>
                    <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">
                      Your Answer
                    </span>
                    <p className="font-semibold text-[11px] break-words">
                      {String(item.userAnswer)}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200">
                    <span className="block text-[9px] font-black uppercase tracking-wider text-indigo-400 mb-0.5 flex items-center gap-1">
                      <Check size={10} className="text-emerald-400" /> Correct Answer
                    </span>
                    <p className="font-semibold text-[11px] text-emerald-300 break-words">
                      {String(item.correctAnswer)}
                    </p>
                  </div>
                </div>

                {/* Brief Concept Footnote */}
                {item.conceptExplanation && (
                  <div className="text-[11px] text-slate-400 pt-1 flex items-start gap-1.5">
                    <Lightbulb size={12} className="text-amber-400 shrink-0 mt-0.5" />
                    <span><strong className="text-slate-300">Explanation: </strong>{item.conceptExplanation}</span>
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
