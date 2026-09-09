import React from "react";
import { Check, CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { QuizQuestion, QuestionType } from "@/types/quiz";

interface QuestionRendererProps {
  question: QuizQuestion;
  answer?: string;
  selectedAnswers?: string[];
  onAnswerChange: (payload: { answer?: string; selectedAnswers?: string[] }) => void;
  disabled?: boolean;
}

export default function QuestionRenderer({
  question,
  answer = "",
  selectedAnswers = [],
  onAnswerChange,
  disabled = false,
}: QuestionRendererProps) {
  // Normalize question type to standard uppercase
  const rawType = (question.type || "SINGLE_CHOICE").toUpperCase();
  const normalizedType: QuestionType =
    rawType === "QUESTION_ANSWER" || rawType === "QA"
      ? "QA"
      : rawType === "TRUE_FALSE" || rawType === "BOOLEAN"
      ? "TRUE_FALSE"
      : rawType === "MULTIPLE_CHOICE" || rawType === "MULTI_CHOICE" || rawType === "CHECKBOX"
      ? "MULTIPLE_CHOICE"
      : "SINGLE_CHOICE";

  const options = question.options || [];

  // ================= 1. OPEN ENDED Q&A =================
  if (normalizedType === "QA") {
    const wordCount = answer.trim() ? answer.trim().split(/\s+/).length : 0;
    const charCount = answer.length;

    return (
      <div className="space-y-3 animate-in fade-in duration-200">
        <div className="relative">
          <textarea
            rows={6}
            disabled={disabled}
            value={answer}
            onChange={(e) => onAnswerChange({ answer: e.target.value, selectedAnswers: [] })}
            placeholder="Type your detailed technical explanation here..."
            className="w-full p-4.5 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-900 dark:text-slate-100 text-sm font-medium leading-relaxed outline-none focus:border-indigo-600 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:focus:ring-indigo-500/10 transition-all resize-y disabled:opacity-50"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <HelpCircle size={14} className="text-indigo-500 shrink-0" />
            <span>Be specific and cover key architectural trade-offs, schemas, or principles.</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span>{wordCount} words</span>
            <span>•</span>
            <span>{charCount} chars</span>
          </div>
        </div>
      </div>
    );
  }

  // ================= 2. TRUE / FALSE =================
  if (normalizedType === "TRUE_FALSE") {
    const tfOptions = [
      { label: "True", icon: CheckCircle2 },
      { label: "False", icon: XCircle },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg animate-in fade-in duration-200">
        {tfOptions.map((tf) => {
          const isSelected =
            String(answer).trim().toLowerCase() === tf.label.toLowerCase() ||
            (selectedAnswers.length > 0 && String(selectedAnswers[0]).trim().toLowerCase() === tf.label.toLowerCase());

          const Icon = tf.icon;

          return (
            <button
              key={tf.label}
              type="button"
              disabled={disabled}
              onClick={() =>
                onAnswerChange({
                  answer: tf.label,
                  selectedAnswers: [tf.label],
                })
              }
              className={`p-6 rounded-2xl border-2 flex items-center justify-between gap-4 text-left transition-all cursor-pointer select-none disabled:opacity-50 ${
                isSelected
                  ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-md"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icon size={20} />
                </div>
                <span
                  className={`text-base font-extrabold ${
                    isSelected
                      ? "text-indigo-950 dark:text-white"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {tf.label}
                </span>
              </div>

              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-600"
                    : "border-slate-300 dark:border-slate-700"
                }`}
              >
                {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  // ================= 3. MULTIPLE CHOICE (CHECKBOXES) =================
  if (normalizedType === "MULTIPLE_CHOICE") {
    const handleToggleCheckbox = (opt: string) => {
      let updated: string[];
      if (selectedAnswers.includes(opt)) {
        updated = selectedAnswers.filter((item) => item !== opt);
      } else {
        updated = [...selectedAnswers, opt];
      }
      onAnswerChange({
        answer: updated.join(", "),
        selectedAnswers: updated,
      });
    };

    return (
      <div className="space-y-3.5 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50">
            Select all that apply
          </span>
          <span className="text-xs text-slate-400 font-medium">
            ({selectedAnswers.length} selected)
          </span>
        </div>

        <div className="space-y-2.5">
          {options.map((opt, idx) => {
            const isSelected = selectedAnswers.includes(opt);
            const letter = String.fromCharCode(65 + idx);

            return (
              <button
                key={idx}
                type="button"
                disabled={disabled}
                onClick={() => handleToggleCheckbox(opt)}
                className={`w-full flex items-center justify-between p-4 sm:p-4.5 rounded-2xl border-2 text-left transition-all cursor-pointer select-none disabled:opacity-50 ${
                  isSelected
                    ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs transition-colors ${
                      isSelected
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {letter}
                  </div>
                  <span
                    className={`text-sm font-bold leading-relaxed break-words ${
                      isSelected
                        ? "text-indigo-950 dark:text-white"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt}
                  </span>
                </div>

                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600 text-white"
                      : "border-slate-300 dark:border-slate-700 text-transparent"
                  }`}
                >
                  <Check size={13} strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ================= 4. SINGLE CHOICE (RADIO GROUP) =================
  return (
    <div className="space-y-2.5 animate-in fade-in duration-200">
      {options.map((opt, idx) => {
        const isSelected =
          answer === opt ||
          (selectedAnswers.length > 0 && selectedAnswers[0] === opt) ||
          String(answer) === String(idx);
        const letter = String.fromCharCode(65 + idx);

        return (
          <button
            key={idx}
            type="button"
            disabled={disabled}
            onClick={() =>
              onAnswerChange({
                answer: opt,
                selectedAnswers: [opt],
              })
            }
            className={`w-full flex items-center justify-between p-4 sm:p-4.5 rounded-2xl border-2 text-left transition-all cursor-pointer select-none disabled:opacity-50 ${
              isSelected
                ? "border-indigo-600 dark:border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20 shadow-xs"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
            }`}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-3">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-black text-xs transition-colors ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
                }`}
              >
                {letter}
              </div>
              <span
                className={`text-sm font-bold leading-relaxed break-words ${
                  isSelected
                    ? "text-indigo-950 dark:text-white"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {opt}
              </span>
            </div>

            <div
              className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                isSelected
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
          </button>
        );
      })}
    </div>
  );
}
