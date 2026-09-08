import React from "react";
import {
  X, BrainCircuit, Clock, ListChecks, Type, ToggleLeft,
  Code, ArrowUp, ArrowDown, Trash2, ChevronUp, ChevronDown,
  Plus, Check, Save, HelpCircle
} from "lucide-react";
import { QuizBuilderModalProps, QuizQuestionType } from "./types";

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
}: QuizBuilderModalProps) {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16171d] rounded-[28px] border border-slate-100 dark:border-[#2e303a] shadow-2xl w-full max-w-4xl p-6 sm:p-8 space-y-6 my-6 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 dark:border-[#2e303a] pb-4">
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
              Configure topic-specific assessment questions across multiple formats: MCQ, Question &amp; Answer, True/False, and Code Challenges.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Quiz General Settings Card */}
        <div className="bg-slate-50 dark:bg-[#1c1d24] border border-slate-200/80 dark:border-[#2e303a] rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6 space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={quizTitle}
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="e.g. React State & Hooks Knowledge Check"
                className="w-full h-11 px-3.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
              />
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Time Limit (Mins)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={quizTimeLimit}
                  onChange={(e) => setQuizTimeLimit(Number(e.target.value))}
                  className="w-full h-11 pl-3.5 pr-8 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5]"
                />
                <Clock size={15} className="absolute right-3 top-3 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Passing Score (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={quizPassingScore}
                  onChange={(e) => setQuizPassingScore(Number(e.target.value))}
                  className="w-full h-11 pl-3.5 pr-8 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5]"
                />
                <span className="absolute right-3 top-3 text-xs font-black text-slate-400 pointer-events-none">%</span>
              </div>
            </div>

            <div className="sm:col-span-12 space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Instructions / Summary (Optional)
              </label>
              <input
                type="text"
                value={quizDescription}
                onChange={(e) => setQuizDescription(e.target.value)}
                placeholder="e.g. Complete all questions before proceeding to the next topic."
                className="w-full h-10 px-3.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
              />
            </div>
          </div>
        </div>

        {/* Questions Toolbar: Add Questions by Category */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                Quiz Questions ({quizQuestions.length})
              </h4>
              <p className="text-[11px] font-medium text-slate-400">
                Choose a category below to add a new question type to this topic quiz.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Total Points:</span>
              <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-xs font-black">
                {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} pts
              </span>
            </div>
          </div>

          {/* 4 Category Add Buttons */}
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
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
          {quizQuestions.length === 0 ? (
            <div className="py-12 text-center border-2 border-dashed border-slate-200 dark:border-[#2e303a] rounded-2xl p-6 space-y-3">
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <BrainCircuit size={24} />
              </div>
              <h5 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                No questions added to this quiz yet
              </h5>
              <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                Click any of the category buttons above to add Multiple Choice (MCQ), Descriptive Q&amp;A, True/False, or Code Challenge questions.
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
                  {/* Question Item Header */}
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
                      {/* Points pill */}
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        <span>Pts:</span>
                        <input
                          type="number"
                          min={1}
                          max={20}
                          value={q.points || 1}
                          onChange={(e) =>
                            onUpdateQuestion(q.id, { points: Number(e.target.value) || 1 })
                          }
                          className="w-10 h-7 text-center rounded-md border border-slate-200 dark:border-[#2e303a] bg-white dark:bg-[#16171d] text-xs font-black text-slate-800 dark:text-slate-200 outline-none"
                        />
                      </div>

                      {/* Move up / down */}
                      <div className="flex items-center border border-slate-200 dark:border-[#2e303a] rounded-lg overflow-hidden bg-white dark:bg-[#16171d]">
                        <button
                          type="button"
                          disabled={qIdx === 0}
                          onClick={() => onMoveQuestion(qIdx, "up")}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={qIdx === quizQuestions.length - 1}
                          onClick={() => onMoveQuestion(qIdx, "down")}
                          className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-30 cursor-pointer border-l border-slate-200 dark:border-[#2e303a]"
                          title="Move down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      {/* Delete question */}
                      <button
                        type="button"
                        onClick={() => onDeleteQuestion(q.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Delete question"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Expand chevron */}
                      <button
                        type="button"
                        onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Question Body (Expanded) */}
                  {isExpanded && (
                    <div className="p-5 space-y-4 animate-in fade-in-50 duration-100">
                      {/* Question Statement */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Question Statement <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          value={q.question}
                          onChange={(e) => onUpdateQuestion(q.id, { question: e.target.value })}
                          placeholder="Enter the question prompt..."
                          className="w-full p-3 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] resize-none"
                        />
                      </div>

                      {/* 1. MCQ Options UI */}
                      {q.type === "mcq" && (
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Options (Select the correct radio choice)
                            </label>
                            <button
                              type="button"
                              onClick={() => onAddMcqOption(q.id)}
                              className="text-xs font-extrabold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} /> Add Option
                            </button>
                          </div>

                          <div className="space-y-2">
                            {(q.options || []).map((opt, optIdx) => {
                              const isCorrect = (q.correctOptionIndex ?? 0) === optIdx;
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                                    isCorrect
                                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-500/50"
                                      : "bg-slate-50 dark:bg-[#1c1d24] border-slate-200 dark:border-[#2e303a]"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`correct_${q.id}`}
                                    checked={isCorrect}
                                    onChange={() =>
                                      onUpdateQuestion(q.id, { correctOptionIndex: optIdx })
                                    }
                                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer ml-1"
                                    title="Mark as correct answer"
                                  />
                                  <span className="text-xs font-black text-slate-400 w-5">
                                    {String.fromCharCode(65 + optIdx)}.
                                  </span>
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => onUpdateMcqOption(q.id, optIdx, e.target.value)}
                                    placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                                    className="flex-1 h-9 px-3 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500"
                                  />
                                  {isCorrect && (
                                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 px-2 py-0.5 bg-emerald-100/70 dark:bg-emerald-950/60 rounded-md">
                                      Correct
                                    </span>
                                  )}
                                  {(q.options?.length || 0) > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => onRemoveMcqOption(q.id, optIdx)}
                                      className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                                      title="Remove option"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Question Answer UI */}
                      {q.type === "question_answer" && (
                        <div className="space-y-1.5 pt-1">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Model Answer / Key Evaluation Criteria
                          </label>
                          <textarea
                            rows={3}
                            value={q.correctAnswerText || ""}
                            onChange={(e) =>
                              onUpdateQuestion(q.id, { correctAnswerText: e.target.value })
                            }
                            placeholder="Enter the expected / model answer and key concepts that should be present in learner responses..."
                            className="w-full p-3 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-emerald-500 resize-none"
                          />
                        </div>
                      )}

                      {/* 3. True / False UI */}
                      {q.type === "true_false" && (
                        <div className="space-y-2 pt-1">
                          <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            Correct Statement Answer
                          </label>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => onUpdateQuestion(q.id, { correctBoolean: true })}
                              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                q.correctBoolean === true
                                  ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                                  : "bg-slate-50 dark:bg-[#1c1d24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2e303a]"
                              }`}
                            >
                              <Check size={14} />
                              <span>TRUE</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateQuestion(q.id, { correctBoolean: false })}
                              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                q.correctBoolean === false
                                  ? "bg-rose-500 text-white border-rose-600 shadow-xs"
                                  : "bg-slate-50 dark:bg-[#1c1d24] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#2e303a]"
                              }`}
                            >
                              <X size={14} />
                              <span>FALSE</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 4. Code Challenge UI */}
                      {q.type === "code_challenge" && (
                        <div className="space-y-3 pt-1">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Programming Language
                            </label>
                            <select
                              value={q.codeLanguage || "python"}
                              onChange={(e) => onUpdateQuestion(q.id, { codeLanguage: e.target.value })}
                              className="h-8 px-2.5 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
                            >
                              <option value="python">Python</option>
                              <option value="javascript">JavaScript</option>
                              <option value="typescript">TypeScript</option>
                              <option value="sql">SQL</option>
                              <option value="json">JSON / Structure</option>
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Starter Code Template
                            </label>
                            <textarea
                              rows={3}
                              value={q.codeStarter || ""}
                              onChange={(e) => onUpdateQuestion(q.id, { codeStarter: e.target.value })}
                              placeholder="// Starter code provided to student..."
                              className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-400 rounded-xl outline-none focus:ring-1 focus:ring-[#4F46E5] resize-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              Expected Solution Code / Output
                            </label>
                            <textarea
                              rows={3}
                              value={q.codeSolution || ""}
                              onChange={(e) => onUpdateQuestion(q.id, { codeSolution: e.target.value })}
                              placeholder="// Reference solution..."
                              className="w-full p-3 font-mono text-xs bg-slate-900 text-amber-300 rounded-xl outline-none focus:ring-1 focus:ring-amber-400 resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {/* Explanation field for any question */}
                      <div className="space-y-1.5 pt-1 border-t border-slate-200/60 dark:border-[#2e303a]/60">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Solution Explanation / Hints (Optional)
                        </label>
                        <input
                          type="text"
                          value={q.explanation || ""}
                          onChange={(e) => onUpdateQuestion(q.id, { explanation: e.target.value })}
                          placeholder="Explanation shown to learners after answering..."
                          className="w-full h-9 px-3 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {quizError && <p className="text-xs font-bold text-red-500">{quizError}</p>}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2e303a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-amber-20 dark:shadow-none0 dark:shadow-none transition-all cursor-pointer"
          >
            <Save size={14} />
            <span>Save Quiz to Topic</span>
          </button>
        </div>
      </div>
    </div>
  );
}
