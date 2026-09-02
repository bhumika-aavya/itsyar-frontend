import React, { useState } from "react";
import {
  X, BrainCircuit, Clock, ListChecks, Type, ToggleLeft,
  Code, ArrowUp, ArrowDown, Trash2, ChevronUp, ChevronDown,
  Plus, Check, Save, HelpCircle, Sparkles, Loader2,
  CheckCircle2, AlertTriangle, RefreshCw, BookOpen, Layers
} from "lucide-react";
import { QuizBuilderModalProps, QuizQuestionType } from "./types";
import { TopicQuizQuestion } from "@/services/admin.service";
import { QuizAiService, QuizGenerationConfig } from "@/services/quiz-ai.service";

export default function QuizBuilderModal({
  isOpen,
  topicTitle,
  moduleTitle,
  quizTitle,
  setQuizTitle,
  quizDescription,
  setQuizDescription,
  quizTimeLimit,
  setQuizTimeLimit,
  quizPassingScore,
  setQuizPassingScore,
  quizQuestions,
  expandedQuestionId,
  setExpandedQuestionId,
  quizError,
  onAddQuestion,
  onUpdateQuestion,
  onUpdateMcqOption,
  onAddMcqOption,
  onRemoveMcqOption,
  onMoveQuestion,
  onDeleteQuestion,
  onClose,
  onSave,
  courseId,
  topicId,
  topicSummary,
  onAddGeneratedQuestions,
}: QuizBuilderModalProps) {
  if (!isOpen) return null;

  // AI Quiz Generation State
  const [aiQuestionCount, setAiQuestionCount] = useState<number>(5);
  const [aiSelectedTypes, setAiSelectedTypes] = useState<QuizQuestionType[]>([
    "mcq",
    "true_false",
    "question_answer"
  ]);
  const [aiDifficulty, setAiDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
  const [aiPhase, setAiPhase] = useState<"idle" | "generating" | "validating" | "repairing" | "completed" | "failed">("idle");
  const [aiStatusMessage, setAiStatusMessage] = useState<string>("");
  const [aiValidationSummary, setAiValidationSummary] = useState<any>(null);
  const [aiError, setAiError] = useState<string>("");
  const [isAiStudioExpanded, setIsAiStudioExpanded] = useState<boolean>(true);

  const toggleAiType = (t: QuizQuestionType) => {
    setAiSelectedTypes(prev => {
      if (prev.includes(t)) {
        if (prev.length <= 1) return prev; // keep at least 1
        return prev.filter(item => item !== t);
      }
      return [...prev, t];
    });
  };

  const handleGenerateWithAi = async () => {
    if (isGeneratingAi) return;
    setIsGeneratingAi(true);
    setAiPhase("generating");
    setAiStatusMessage("Extracting topic content chunks & batch-generating questions...");
    setAiError("");
    setAiValidationSummary(null);

    const config: QuizGenerationConfig = {
      num_questions: aiQuestionCount,
      question_types: aiSelectedTypes,
      difficulty: aiDifficulty
    };

    try {
      const res = await QuizAiService.generateQuiz(
        courseId || "admin_course",
        topicId || "admin_topic",
        {
          topic_id: topicId,
          topic_title: topicTitle || "Topic Assessment",
          topic_summary: topicSummary || "",
          course_id: courseId,
          config
        }
      );

      setAiPhase("validating");
      setAiStatusMessage("Running Python structural validation & AI semantic validation...");

      if (res && res.success && res.questions) {
        if (res.validation_summary && res.validation_summary.repaired > 0) {
          setAiPhase("repairing");
          setAiStatusMessage(`Repaired ${res.validation_summary.repaired} question(s) to guarantee source grounding.`);
        }

        setAiPhase("completed");
        setAiValidationSummary(res.validation_summary);
        setAiStatusMessage(`Generated & validated ${res.questions.length} grounded questions.`);

        // Convert and merge questions
        const mappedQuestions: TopicQuizQuestion[] = res.questions.map((q: any, idx: number) => {
          let correctOptIdx = 0;
          if (q.type === "mcq" && q.options && q.correct_answer) {
            const found = q.options.findIndex(
              (o: string) => o.toLowerCase().trim() === q.correct_answer.toLowerCase().trim()
            );
            if (found !== -1) correctOptIdx = found;
          }

          return {
            id: q.id || `q_ai_${Date.now()}_${idx}`,
            type: q.type,
            question: q.question,
            options: q.options || ["Option A", "Option B", "Option C", "Option D"],
            correctOptionIndex: correctOptIdx,
            correctAnswerText: q.expected_answer || q.correct_answer || "",
            correctBoolean: String(q.correct_answer).toLowerCase() === "true",
            explanation: q.explanation || "",
            points: q.points || (q.type === "question_answer" ? 2 : 1),
            source_chunk_ids: q.source_chunk_ids,
            source_pages: q.source_pages,
            validation_status: q.validation_status || "semantically_valid",
            validation_notes: q.validation_notes
          };
        });

        if (onAddGeneratedQuestions) {
          onAddGeneratedQuestions(mappedQuestions);
        }

        if (!quizTitle.trim()) {
          setQuizTitle(res.quiz_title || `${topicTitle} Assessment`);
        }
      } else {
        throw new Error(res?.error_message || "Quiz generation returned no questions.");
      }
    } catch (err: any) {
      console.error("[QuizBuilderModal] AI generation error:", err);
      setAiPhase("failed");
      setAiError(err?.message || "Failed to generate questions. Check connection and retry.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const getQuestionTypeBadge = (type: QuizQuestionType) => {
    switch (type) {
      case "mcq":
        return {
          label: "MCQ",
          bg: "bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/40",
          icon: ListChecks,
        };
      case "question_answer":
        return {
          label: "Q&A (Descriptive)",
          bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40",
          icon: Type,
        };
      case "true_false":
        return {
          label: "True / False",
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border-purple-200 dark:border-purple-800/40",
          icon: ToggleLeft,
        };
      case "code_challenge":
        return {
          label: "Code Challenge",
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300 border-amber-200 dark:border-amber-800/40",
          icon: Code,
        };
      default:
        return {
          label: "Question",
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          icon: HelpCircle,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16171d] rounded-[32px] border border-slate-100 dark:border-[#2e303a] shadow-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 my-6 animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2e303a] pb-4 shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BrainCircuit size={18} />
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Topic Assessment &amp; Quiz Builder
              </h3>
              <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-0.5 rounded-md">
                {topicTitle || "Topic"}
              </span>
              {moduleTitle && (
                <span className="text-[11px] font-bold text-slate-400">
                  in {moduleTitle}
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-400">
              Generate grounded mixed-format questions with AI, or build topic questions manually.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#1c1d24] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Error Banner */}
          {quizError && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{quizError}</span>
            </div>
          )}

          {/* ================= AI QUIZ GENERATION PANEL ================= */}
          <div className="border border-indigo-200/80 dark:border-indigo-900/60 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/40 dark:from-[#1a1b26] dark:via-[#16171d] dark:to-[#1a1b24] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    AI Quiz Generator &amp; Grounded Validator
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
                      1 Batch Call
                    </span>
                  </h4>
                  <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Extracts content chunks once, runs Python structural checks, validates semantics, and repairs issues automatically.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAiStudioExpanded(!isAiStudioExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isAiStudioExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {isAiStudioExpanded && (
              <div className="space-y-4 pt-2 border-t border-indigo-100 dark:border-slate-800">
                {/* Generation Controls: Count, Types, Difficulty */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Question Count */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Question Count
                    </label>
                    <div className="flex gap-1.5">
                      {[3, 5, 8, 10].map(count => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setAiQuestionCount(count)}
                          className={`flex-1 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                            aiQuestionCount === count
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          {count}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Types */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Question Types
                    </label>
                    <div className="flex gap-1.5">
                      {(["mcq", "true_false", "question_answer"] as QuizQuestionType[]).map(t => {
                        const active = aiSelectedTypes.includes(t);
                        const label = t === "mcq" ? "MCQ" : t === "true_false" ? "T/F" : "Q&A";
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleAiType(t)}
                            className={`flex-1 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                              active
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                                : "bg-white dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                      Difficulty
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e: any) => setAiDifficulty(e.target.value)}
                      className="w-full h-8 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Progress / Status Indicators */}
                {aiPhase !== "idle" && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
                    aiPhase === "completed"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300"
                      : aiPhase === "failed"
                      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300"
                      : "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/40 text-indigo-900 dark:text-indigo-200"
                  }`}>
                    <div className="flex items-center gap-2">
                      {isGeneratingAi ? (
                        <Loader2 size={16} className="animate-spin text-indigo-600 dark:text-indigo-400 shrink-0" />
                      ) : aiPhase === "completed" ? (
                        <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle size={16} className="text-red-600 dark:text-red-400 shrink-0" />
                      )}
                      <span className="font-semibold">{aiStatusMessage || aiError}</span>
                    </div>

                    {aiValidationSummary && (
                      <div className="flex items-center gap-2 shrink-0 font-bold text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-emerald-600">
                          ✓ {aiValidationSummary.final_valid_count} Valid
                        </span>
                        {aiValidationSummary.repaired > 0 && (
                          <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                            ⚙ {aiValidationSummary.repaired} Repaired
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-medium text-slate-400">
                    Questions generated will be appended directly below for review and manual editing.
                  </span>

                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={handleGenerateWithAi}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        <span>Generating &amp; Validating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Generate with AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Configuration Fields: Title, Duration, Passing Score */}
          <div className="p-5 rounded-2xl bg-slate-50/60 dark:bg-[#1c1d24]/60 border border-slate-100 dark:border-[#2e303a] space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Assessment Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-6 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Assessment Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Foundry Architecture Knowledge Check"
                  className="w-full h-11 px-3.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock size={13} /> Time Limit
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={quizTimeLimit}
                    onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                    className="w-full h-11 pl-3.5 pr-12 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5]"
                  />
                  <span className="absolute right-3 top-3 text-xs font-black text-slate-400 pointer-events-none">mins</span>
                </div>
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                  Passing Score
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={quizPassingScore}
                    onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                    className="w-full h-11 pl-3.5 pr-8 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5]"
                  />
                  <span className="absolute right-3 top-3 text-xs font-black text-slate-400 pointer-events-none">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Questions Toolbar: Add Questions Manually */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Assessment Questions ({quizQuestions.length})
                </h4>
                <p className="text-[11px] font-medium text-slate-400">
                  Edit generated questions above, or click below to add additional questions manually.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Total Points:</span>
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-xs font-black">
                  {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} pts
                </span>
              </div>
            </div>

            {/* 4 Category Manual Add Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => onAddQuestion("mcq")}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100 text-[#4F46E5] dark:text-indigo-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <ListChecks size={15} />
                <span>+ Add MCQ</span>
              </button>

              <button
                type="button"
                onClick={() => onAddQuestion("question_answer")}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/70 dark:bg-emerald-950/30 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <Type size={15} />
                <span>+ Add Q&amp;A</span>
              </button>

              <button
                type="button"
                onClick={() => onAddQuestion("true_false")}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <ToggleLeft size={15} />
                <span>+ Add True/False</span>
              </button>

              <button
                type="button"
                onClick={() => onAddQuestion("code_challenge")}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-extrabold text-xs transition-all cursor-pointer shadow-2xs"
              >
                <Code size={15} />
                <span>+ Add Code Challenge</span>
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-4">
            {quizQuestions.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 dark:border-[#2e303a] rounded-2xl p-6 space-y-3">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                  <BrainCircuit size={24} />
                </div>
                <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  No questions added to this assessment yet
                </h5>
                <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                  Use the "Generate with AI" button above to batch create grounded questions, or click any manual category button.
                </p>
              </div>
            ) : (
              quizQuestions.map((q, qIdx) => {
                const typeBadge = getQuestionTypeBadge(q.type);
                const TypeIcon = typeBadge.icon;
                const isExpanded = expandedQuestionId === q.id;

                return (
                  <div
                    key={q.id}
                    className="border border-slate-200 dark:border-[#2e303a] rounded-2xl overflow-hidden bg-white dark:bg-[#16171d] shadow-xs transition-all"
                  >
                    {/* Question Header */}
                    <div
                      onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                      className="flex items-center justify-between p-4 bg-slate-50/80 dark:bg-[#1c1d24]/80 cursor-pointer hover:bg-slate-100/70 dark:hover:bg-[#252630] transition-colors border-b border-slate-200/60 dark:border-[#2e303a]"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-3">
                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] flex items-center justify-center text-[11px] font-black text-slate-700 dark:text-slate-200 shrink-0">
                          {qIdx + 1}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-[11px] font-extrabold ${typeBadge.bg} shrink-0`}
                        >
                          <TypeIcon size={12} />
                          {typeBadge.label}
                        </span>

                        {/* Validation & Grounding Badges */}
                        {q.validation_status === "repaired" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 shrink-0">
                            ⚙ Repaired
                          </span>
                        )}
                        {(q.validation_status === "semantically_valid" || q.validation_status === "structurally_valid") && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 shrink-0">
                            ✓ Verified
                          </span>
                        )}
                        {q.source_pages && q.source_pages.length > 0 && (
                          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            Page {q.source_pages.join(', ')}
                          </span>
                        )}

                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                          {q.question.trim() || (
                            <span className="italic text-slate-400">Empty question statement...</span>
                          )}
                        </span>
                      </div>

                      <div
                        className="flex items-center gap-2 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg p-0.5">
                          <button
                            type="button"
                            disabled={qIdx === 0}
                            onClick={() => onMoveQuestion(qIdx, "up")}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowUp size={13} />
                          </button>
                          <button
                            type="button"
                            disabled={qIdx === quizQuestions.length - 1}
                            onClick={() => onMoveQuestion(qIdx, "down")}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowDown size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onDeleteQuestion(q.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>

                        <div className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Question Card Body */}
                    {isExpanded && (
                      <div className="p-5 space-y-5 bg-white dark:bg-[#16171d]">
                        {/* Statement & Points */}
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                          <div className="sm:col-span-10 space-y-1">
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                              Question Statement <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              rows={2}
                              value={q.question}
                              onChange={(e) => onUpdateQuestion(q.id, { question: e.target.value })}
                              placeholder="e.g. Which Palantir Foundry capability supports distributed batch transformations?"
                              className="w-full p-3 bg-slate-50/60 dark:bg-[#1c1d24]/60 border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] resize-none"
                            />
                          </div>

                          <div className="sm:col-span-2 space-y-1">
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                              Points
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={q.points ?? 1}
                              onChange={(e) => onUpdateQuestion(q.id, { points: Number(e.target.value) })}
                              className="w-full h-10 px-3 bg-slate-50/60 dark:bg-[#1c1d24]/60 border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5]"
                            />
                          </div>
                        </div>

                        {/* 1. MCQ OPTIONS */}
                        {q.type === "mcq" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                                Answer Options (Select the correct radio button)
                              </label>
                              <span className="text-[11px] font-bold text-slate-400">
                                {q.options?.length ?? 0} / 6 options
                              </span>
                            </div>

                            <div className="space-y-2">
                              {(q.options || []).map((opt, optIdx) => {
                                const isCorrect = q.correctOptionIndex === optIdx;
                                return (
                                  <div key={optIdx} className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => onUpdateQuestion(q.id, { correctOptionIndex: optIdx })}
                                      className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-all ${
                                        isCorrect
                                          ? "bg-emerald-500 border-emerald-500 text-white shadow-xs"
                                          : "border-slate-300 dark:border-slate-700 text-slate-400 hover:border-emerald-500"
                                      }`}
                                    >
                                      {isCorrect ? <Check size={14} /> : <span className="text-[10px] font-bold">{String.fromCharCode(65 + optIdx)}</span>}
                                    </button>

                                    <input
                                      type="text"
                                      value={opt}
                                      onChange={(e) => onUpdateMcqOption(q.id, optIdx, e.target.value)}
                                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                      className={`flex-1 h-9 px-3 rounded-xl border text-xs font-medium outline-none ${
                                        isCorrect
                                          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/20 text-slate-900 dark:text-slate-100"
                                          : "border-slate-200 dark:border-[#2e303a] bg-slate-50/50 dark:bg-[#1c1d24]/50 text-slate-800 dark:text-slate-200"
                                      }`}
                                    />

                                    <button
                                      type="button"
                                      onClick={() => onRemoveMcqOption(q.id, optIdx)}
                                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40"
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>

                            <button
                              type="button"
                              onClick={() => onAddMcqOption(q.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#2e303a] bg-slate-50 dark:bg-[#1c1d24] text-slate-700 dark:text-slate-300 hover:text-[#4F46E5] font-extrabold text-[11px] transition-colors"
                            >
                              <Plus size={13} /> Add Another Option
                            </button>
                          </div>
                        )}

                        {/* 2. TRUE/FALSE */}
                        {q.type === "true_false" && (
                          <div className="space-y-2">
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                              Correct Statement Value
                            </label>
                            <div className="grid grid-cols-2 gap-3 max-w-xs">
                              <button
                                type="button"
                                onClick={() => onUpdateQuestion(q.id, { correctBoolean: true })}
                                className={`py-2 px-4 rounded-xl border font-black text-xs transition-all cursor-pointer text-center ${
                                  q.correctBoolean === true
                                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                }`}>
                                True
                              </button>
                              <button
                                type="button"
                                onClick={() => onUpdateQuestion(q.id, { correctBoolean: false })}
                                className={`py-2 px-4 rounded-xl border font-black text-xs transition-all cursor-pointer text-center ${
                                  q.correctBoolean === false
                                    ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                                }`}>
                                False
                              </button>
                            </div>
                          </div>
                        )}

                        {/* 3. Q&A (DESCRIPTIVE) */}
                        {q.type === "question_answer" && (
                          <div className="space-y-1.5">
                            <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                              Expected / Reference Answer
                            </label>
                            <textarea
                              rows={3}
                              value={q.correctAnswerText || ""}
                              onChange={(e) => onUpdateQuestion(q.id, { correctAnswerText: e.target.value })}
                              placeholder="Provide the ideal answer key / reference grading rubric..."
                              className="w-full p-3 bg-slate-50/60 dark:bg-[#1c1d24]/60 border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] resize-none"
                            />
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="space-y-1 pt-1">
                          <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                            Explanation &amp; Learning Takeaway (Optional)
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ""}
                            onChange={(e) => onUpdateQuestion(q.id, { explanation: e.target.value })}
                            placeholder="Explain why this answer is correct..."
                            className="w-full h-9 px-3 bg-slate-50/60 dark:bg-[#1c1d24]/60 border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2e303a] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-[#2e303a] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-extrabold text-xs transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Save size={15} /> Save Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
