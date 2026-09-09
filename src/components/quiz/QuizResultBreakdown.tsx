import React, { useState } from "react";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  BookOpen,
  Clock,
  ArrowRight,
  RotateCcw,
  Award,
  Check,
  Lightbulb,
  Compass,
  Layers,
  ChevronRight,
  ChevronDown,
  Cpu,
  Target,
  MessageSquare,
  ShieldCheck,
  BarChart3,
} from "lucide-react";
import { TestSubmissionResponse, QuestionFeedback } from "@/types/quiz";

interface Props {
  result: TestSubmissionResponse;
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
  isFinalQuiz = false,
}: Props) {
  const [expandedQuestionIds, setExpandedQuestionIds] = useState<Record<string, boolean>>({});

  const {
    percentage: rawPercentage,
    score: rawScore,
    passed: rawPassed,
    totalPointsEarned,
    totalPointsPossible,
    total_questions: rawTotalQuestions,
    passing_threshold = 70,
    time_elapsed_seconds = 0,
    overallTechnicalScore = 0,
    overallCompletenessScore = 0,
    overallClarityScore = 0,
    overallRecommendations: rawOverallRecommendations,
    feedback = [],
    evaluations = [],
    overall_feedback,
  } = result || {};

  const questionList: QuestionFeedback[] =
    feedback && feedback.length > 0 ? feedback : evaluations && evaluations.length > 0 ? evaluations : [];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  // Helper to accurately determine if an evaluation item is correct
  const isItemCorrect = (item: QuestionFeedback): boolean => {
    if (item.isCorrect === true || item.is_correct === true) return true;
    if (String(item.isCorrect).toLowerCase() === "true" || String(item.is_correct).toLowerCase() === "true") return true;
    if (item.pointsEarned !== undefined && item.pointsEarned > 0) return true;
    if (item.score !== undefined && item.max_score !== undefined && item.score > 0 && item.score >= item.max_score) return true;
    const u = String(item.userAnswer ?? item.user_answer ?? "").trim().toLowerCase();
    const c = String(item.expectedAnswer ?? item.expected_answer ?? item.correctAnswer ?? item.correct_answer ?? "").trim().toLowerCase();
    return Boolean(u && c && u === c && u !== "not answered" && u !== "no answer provided");
  };

  const processedEvaluations = questionList.map((item, idx) => {
    const correct = isItemCorrect(item);
    const maxPts = Number(item.points ?? item.max_score ?? 1);
    const awardedPts = item.pointsEarned !== undefined ? Number(item.pointsEarned) : correct ? (Number(item.score) || maxPts) : 0;
    const rawType = String(item.type || item.question_type || "SINGLE_CHOICE");
    const formattedType = rawType.replace(/_/g, " ").toUpperCase();
    const qText =
      (item.questionText && item.questionText !== "Question" && item.questionText.trim() !== "")
        ? item.questionText
        : (item.question_text && item.question_text !== "Question" && item.question_text.trim() !== "")
        ? item.question_text
        : ((item as any).text && (item as any).text !== "Question" && (item as any).text.trim() !== "")
        ? (item as any).text
        : ((item as any).question && (item as any).question !== "Question" && (item as any).question.trim() !== "")
        ? (item as any).question
        : (item.title && item.title !== "Question" && item.title.trim() !== "")
        ? item.title
        : `Question ${idx + 1}`;

    let uAnswer = item.userAnswer ?? item.user_answer;
    if (uAnswer === undefined || uAnswer === null || uAnswer === "" || uAnswer === "undefined") {
      uAnswer = "No answer provided";
    }

    let cAnswer =
      item.expectedAnswer ??
      item.expected_answer ??
      item.correctAnswer ??
      item.correct_answer ??
      item.model_answer ??
      item.solution;

    if (
      !cAnswer ||
      cAnswer === "Verified Concept" ||
      cAnswer === "Verified Model" ||
      cAnswer === "A clear, accurate technical explanation." ||
      cAnswer === "Verified Solution"
    ) {
      if (item.options && Array.isArray(item.options) && item.options.length > 0) {
        const firstOpt = item.options[0];
        cAnswer = typeof firstOpt === "string" ? firstOpt : firstOpt?.text || firstOpt?.label || "Option 1";
      } else if (rawType === "TRUE_FALSE") {
        cAnswer = "True";
      } else if (item.explanation || item.correctExplanation) {
        cAnswer = item.explanation || item.correctExplanation;
      } else {
        cAnswer = "Verified Concept";
      }
    }

    // Format index-based answers if options are available
    if (item.options && Array.isArray(item.options) && item.options.length > 0) {
      const uIdx = parseInt(String(uAnswer), 10);
      if (!isNaN(uIdx) && item.options[uIdx]) {
        const opt = item.options[uIdx];
        uAnswer = typeof opt === "string" ? opt : opt?.text || opt?.label || uAnswer;
      }
      const cIdx = parseInt(String(cAnswer), 10);
      if (!isNaN(cIdx) && item.options[cIdx]) {
        const opt = item.options[cIdx];
        cAnswer = typeof opt === "string" ? opt : opt?.text || opt?.label || cAnswer;
      }
    }

    const exp = item.correctExplanation || item.explanation || "Core technical concept tested in this curriculum.";
    const qId = item.questionId || item.question_id || item.id || `q_${idx}`;

    const whatWentWrong =
      item.whatWentWrong ??
      item.what_went_wrong ??
      (!correct
        ? uAnswer === "No answer provided" || uAnswer === "Not answered"
          ? `Question ${idx + 1}: Unanswered or skipped.`
          : `Selected "${uAnswer}" instead of the expected solution.`
        : undefined);

    const recommendations =
      item.recommendations ??
      item.how_to_improve ??
      (!correct
        ? `Review the curriculum regarding ${qText}. Key takeaway: ${exp}`
        : undefined);

    return {
      ...item,
      id: qId,
      is_correct: correct,
      score: awardedPts,
      max_score: maxPts,
      formattedType,
      questionText: qText,
      userAnswer: uAnswer,
      correctAnswer: cAnswer,
      whatWentWrong,
      recommendations,
      conceptExplanation: exp,
      technicalScore: item.technicalScore,
      completenessScore: item.completenessScore,
      clarityScore: item.clarityScore,
    };
  });

  const correctCount = processedEvaluations.filter((e) => e.is_correct).length;
  const totalQuestions = rawTotalQuestions || processedEvaluations.length || 1;
  const calculatedScore =
    totalPointsEarned !== undefined
      ? totalPointsEarned
      : rawScore !== undefined
        ? rawScore
        : processedEvaluations.reduce((acc, e) => acc + (e.score || 0), 0);
  const maxPossibleScore =
    totalPointsPossible !== undefined
      ? totalPointsPossible
      : processedEvaluations.reduce((acc, e) => acc + (e.max_score || 1), 0) || 1;

  const percentage =
    rawPercentage !== undefined && rawPercentage !== null
      ? rawPercentage
      : Math.round((calculatedScore / maxPossibleScore) * 100);

  const passed = rawPassed !== undefined ? rawPassed : percentage >= passing_threshold;

  // Tri-Metrics: compute overall or average if present in questions
  const hasSubMetrics =
    overallTechnicalScore > 0 ||
    overallCompletenessScore > 0 ||
    overallClarityScore > 0 ||
    processedEvaluations.some((e) => e.technicalScore !== undefined || e.completenessScore !== undefined);

  const avgTechScore =
    overallTechnicalScore > 0
      ? overallTechnicalScore
      : Math.round(
        processedEvaluations.reduce((acc, e) => acc + (e.technicalScore || percentage), 0) /
        (processedEvaluations.length || 1)
      );

  const avgCompScore =
    overallCompletenessScore > 0
      ? overallCompletenessScore
      : Math.round(
        processedEvaluations.reduce((acc, e) => acc + (e.completenessScore || percentage), 0) /
        (processedEvaluations.length || 1)
      );

  const avgClarityScore =
    overallClarityScore > 0
      ? overallClarityScore
      : Math.round(
        processedEvaluations.reduce((acc, e) => acc + (e.clarityScore || percentage), 0) /
        (processedEvaluations.length || 1)
      );

  // Overall Synthesis
  const incorrectItems = processedEvaluations.filter((e) => !e.is_correct);

  const overallWhatWentWrong =
    incorrectItems.length === 0
      ? "No critical flaws identified! You answered all questions with accuracy and depth."
      : `You missed ${incorrectItems.length} question(s) regarding ${Array.from(
        new Set(incorrectItems.map((i) => i.formattedType))
      ).join(", ")} concepts.`;

  const parsedRecommendations: string[] = rawOverallRecommendations
    ? [rawOverallRecommendations]
    : incorrectItems.length === 0
      ? [
        "Continue to the next advanced module or hands-on practical project.",
        "Solidify mastery by applying these architectural patterns in production codebase repositories.",
      ]
      : [
        `Target your review on questions: ${incorrectItems
          .map((_, i) => `#${processedEvaluations.indexOf(incorrectItems[i]) + 1}`)
          .join(", ")}.`,
        "Review module lesson notes, video walkthroughs, and code examples for the missed concepts before re-attempting.",
        "Take note of key architectural distinctions and syntax rules highlighted in the conceptual explanations below.",
      ];

  const toggleQuestionExpand = (id: string) => {
    setExpandedQuestionIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-[#0b0d14] text-slate-900 dark:text-slate-100 p-6 sm:p-8 space-y-8 select-text">
      {/* ================= TOP HERO BANNER ================= */}
      <div
        className={`relative w-full rounded-3xl p-6 sm:p-8 border shadow-xl transition-all ${passed
          ? "bg-gradient-to-br from-emerald-50 via-emerald-100/50 to-teal-50 dark:from-emerald-950/70 dark:via-[#111625] dark:to-indigo-950/60 border-emerald-200 dark:border-emerald-500/40 shadow-emerald-500/10 dark:shadow-emerald-950/20"
          : "bg-gradient-to-br from-red-50 via-red-100/50 to-orange-50 dark:from-red-950/70 dark:via-[#161220] dark:to-amber-950/60 border-red-200 dark:border-red-500/40 shadow-red-500/10 dark:shadow-red-950/20"
          }`}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Left Info Column */}
          <div className="flex items-center gap-5 w-full lg:w-auto">
            <div
              className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 border shadow-md ${passed
                ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-200 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                : "bg-red-100 dark:bg-red-500/20 border-red-200 dark:border-red-500/40 text-red-600 dark:text-red-400"
                }`}
            >
              {passed ? (
                <Trophy size={36} className="text-emerald-500 dark:text-emerald-400 animate-pulse" />
              ) : (
                <AlertTriangle size={36} className="text-red-500 dark:text-red-400" />
              )}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${passed
                    ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/40"
                    : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/40"
                    }`}
                >
                  {passed ? "Assessment Passed" : "Needs Retake"}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-400 flex items-center gap-1 bg-white dark:bg-slate-900/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                  <Clock size={12} className="text-slate-500 dark:text-slate-400" /> {formatTime(time_elapsed_seconds || 0)}
                </span>
                <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/30">
                  <ShieldCheck size={12} className="text-indigo-600 dark:text-indigo-400" /> Palantir AI Evaluated
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {passed ? "Assessment Completed!" : "Keep Practicing!"}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xl whitespace-pre-wrap">
                {overall_feedback ||
                  (passed
                    ? "You have demonstrated strong proficiency in this topic's architecture and concepts."
                    : "Review the evaluation breakdown below to target areas for improvement before reattempting.")}
              </p>
            </div>
          </div>

          {/* Right Metrics Box */}
          <div className="flex items-center gap-4 shrink-0 w-full lg:w-auto justify-between lg:justify-end">
            <div className="bg-white dark:bg-slate-950/90 border border-slate-200 dark:border-slate-800/90 px-6 py-4 rounded-2xl text-center shadow-lg min-w-[150px]">
              <div
                className={`text-4xl sm:text-5xl font-black tracking-tight ${passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                  }`}
              >
                {percentage}%
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col gap-2">
              {!passed && onRetake && (
                <button
                  type="button"
                  onClick={onRetake}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-300 dark:border-slate-700 transition-all cursor-pointer shadow-sm"
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

      {/* ================= TRI-METRIC BREAKDOWN BARS ================= */}
      {hasSubMetrics && (
        <div className="bg-white dark:bg-[#10121c] border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={17} className="text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Evaluation Metric Dimensions
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-slate-400">
              Scored on 0–100 Scale
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Metric 1: Technical Accuracy */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-4.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Cpu size={14} className="text-indigo-600 dark:text-indigo-400" /> Technical Accuracy
                </span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-300">{avgTechScore}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, avgTechScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Correctness of core concepts, architecture, and syntax precision.
              </p>
            </div>

            {/* Metric 2: Completeness */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-4.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Target size={14} className="text-emerald-600 dark:text-emerald-400" /> Completeness
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-300">{avgCompScore}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, avgCompScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Coverage of necessary components, trade-offs, and edge cases.
              </p>
            </div>

            {/* Metric 3: Clarity & Articulation */}
            <div className="bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 p-4.5 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <MessageSquare size={14} className="text-cyan-600 dark:text-cyan-400" /> Clarity &amp; Articulation
                </span>
                <span className="text-sm font-black text-cyan-600 dark:text-cyan-300">{avgClarityScore}%</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, avgClarityScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                Structure, conciseness, and precision of technical communication.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= OVERALL SYNTHESIS (3 CRITICAL PILLARS) ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20">
              <Sparkles size={16} />
            </div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Comprehensive Diagnostic Summary</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              <CheckCircle2 size={13} /> {correctCount} of {totalQuestions} Correct
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. What Went Wrong */}
          <div
            className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${incorrectItems.length > 0
              ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-500/30 text-amber-900 dark:text-amber-200"
              : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200"
              }`}
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {incorrectItems.length > 0 ? (
                  <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-300">
                  1. What Went Wrong
                </h4>
              </div>
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {overallWhatWentWrong}
              </p>
              {incorrectItems.length > 0 && (
                <ul className="space-y-1.5 pt-1 text-[11px] text-amber-900/90 dark:text-amber-200/90 list-disc list-inside">
                  {incorrectItems.slice(0, 4).map((item, idx) => (
                    <li key={idx} className="leading-snug whitespace-pre-wrap">
                      <span className="font-bold text-slate-900 dark:text-white">Q{processedEvaluations.indexOf(item) + 1}:</span>{" "}
                      {item.whatWentWrong}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-800/60">
              {incorrectItems.length} Misconception(s) identified
            </div>
          </div>

          {/* 2. Core Takeaways & Model Answers */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 flex flex-col justify-between space-y-3 shadow-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb size={18} className="text-amber-500 dark:text-amber-400 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-200">
                  2. Core Takeaways &amp; Explanations
                </h4>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                Essential architectural principles and verified models from this assessment:
              </p>
              <div className="space-y-2 pt-1">
                {processedEvaluations.slice(0, 3).map((item, idx) => (
                  <div
                    key={idx}
                    className="text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 space-y-0.5"
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                      <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">Concept #{idx + 1}</span>
                      <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 min-w-0">
                        <Check size={10} className="shrink-0" />
                        <span className="truncate">{String(item.correctAnswer).replace(/\n/g, ' ')}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight font-medium line-clamp-2 whitespace-pre-wrap">
                      {item.conceptExplanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-800/60">
              {processedEvaluations.length} Key Concepts
            </div>
          </div>

          {/* 3. Recommendations & Next Steps */}
          <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/30 text-indigo-900 dark:text-indigo-200 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Compass size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  3. Recommendations &amp; Next Steps
                </h4>
              </div>
              <ul className="space-y-2 pt-1 text-xs text-slate-700 dark:text-slate-200">
                {parsedRecommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 leading-relaxed text-[11px]">
                    <ChevronRight size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider border-t border-indigo-200 dark:border-slate-800/60">
              Personalized Learning Path
            </div>
          </div>
        </div>
      </div>

      {/* ================= INDIVIDUAL QUESTION BREAKDOWN ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Layers size={16} className="text-slate-500 dark:text-slate-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-300">
              Individual Question Breakdown
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            {processedEvaluations.length} Questions Graded
          </span>
        </div>

        <div className="space-y-3">
          {processedEvaluations.map((item, idx) => {
            const isCorrect = item.is_correct;
            const isExpanded = expandedQuestionIds[item.id] ?? true;

            return (
              <div
                key={item.id || idx}
                className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${isCorrect
                  ? "bg-emerald-50/50 dark:bg-[#11131f]/70 border-emerald-200 dark:border-emerald-500/25 hover:border-emerald-300 dark:hover:border-emerald-500/40"
                  : "bg-red-50/50 dark:bg-[#14121a]/70 border-red-200 dark:border-red-500/25 hover:border-red-300 dark:hover:border-red-500/40"
                  } space-y-3`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${isCorrect
                        ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/40"
                        : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-500/40"
                        }`}
                    >
                      {isCorrect ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                          Question {idx + 1}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase border border-slate-300 dark:border-slate-700/60">
                          {item.formattedType}
                        </span>
                        {item.technicalScore !== undefined && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                            Tech: {item.technicalScore}%
                          </span>
                        )}
                      </div>
                      <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-relaxed">
                        {item.questionText}
                      </h5>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleQuestionExpand(item.id)}
                      className="p-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                    >
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""
                          }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Collapsible Content */}
                {isExpanded && (
                  <div className="space-y-3 pt-2">
                    {/* Answers Comparison */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div
                        className={`p-3.5 rounded-xl border ${isCorrect
                          ? "bg-emerald-100 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-200"
                          : "bg-red-100 dark:bg-red-950/20 border-red-300 dark:border-red-500/20 text-red-900 dark:text-red-200"
                          }`}
                      >
                        <span className="block text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                          {isCorrect ? <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-400" /> : <XCircle size={12} className="text-red-600 dark:text-red-400" />} Your Answer
                        </span>
                        <p className="font-semibold text-xs sm:text-[13px] break-words leading-relaxed whitespace-pre-wrap">
                          {String(item.userAnswer)}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 shadow-sm">
                        <span className="block text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1.5">
                          <Check size={12} className="text-emerald-600 dark:text-emerald-400" /> Expected Solution / Model
                        </span>
                        <p className="font-semibold text-xs sm:text-[13px] text-emerald-700 dark:text-emerald-300 break-words leading-relaxed whitespace-pre-wrap">
                          {String(item.correctAnswer)}
                        </p>
                      </div>
                    </div>

                    {/* Feedback Badges */}
                    {item.whatWentWrong && !isCorrect && (
                      <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                        <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-amber-700 dark:text-amber-300">What went wrong: </strong>
                          <span className="whitespace-pre-wrap">{item.whatWentWrong}</span>
                        </div>
                      </div>
                    )}

                    {item.conceptExplanation && (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 text-xs flex items-start gap-2">
                        <Lightbulb size={14} className="text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-slate-900 dark:text-slate-200">Explanation &amp; Principle: </strong>
                          <span className="whitespace-pre-wrap">{item.conceptExplanation}</span>
                        </div>
                      </div>
                    )}

                    {item.recommendations && (
                      <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-500/20 text-indigo-900 dark:text-indigo-200 text-xs flex items-start gap-2">
                        <Compass size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-indigo-700 dark:text-indigo-300">Recommendation: </strong>
                          <span className="whitespace-pre-wrap">{item.recommendations}</span>
                        </div>
                      </div>
                    )}
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
