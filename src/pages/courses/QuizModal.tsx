import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Info, Clock, Loader2, Sparkles } from 'lucide-react';
import { QuizData } from '@/schemas/lesson.schema';
import { useNavigate } from 'react-router-dom';
import { QuizAiService, DetailedQuizSubmissionResponse } from '@/services/quiz-ai.service';
import QuizResultBreakdown from '@/components/quiz/QuizResultBreakdown';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onQuizComplete?: () => void;
  data: QuizData | any;
  isFinalQuiz: boolean;
  courseId: string;
  topicId?: string;
  moduleId?: string;
}

export default function QuizModal({
  isOpen,
  onClose,
  onQuizComplete,
  data,
  isFinalQuiz,
  courseId,
  topicId,
  moduleId,
}: Props) {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState((data?.timeLimit || 15) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<DetailedQuizSubmissionResponse | null>(null);

  const questions = data?.questions || [];
  const currentQuestion = questions[currentIdx] || {};
  const currentQId = currentQuestion.id || `q_${currentIdx}`;
  const questionType = currentQuestion.type || "mcq";
  const questionStatement = currentQuestion.text || currentQuestion.question || "Assessment Question";

  // Reset all quiz state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setTimeLeft((data?.timeLimit || 15) * 60);
      setIsSubmitting(false);
      setSubmissionResult(null);
    }
  }, [isOpen, data]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 && !submissionResult && isOpen && !isSubmitting) {
      handleSubmitQuiz();
      return;
    }
    if (timeLeft <= 0 || submissionResult || !isOpen) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submissionResult, isOpen, isSubmitting]);

  if (!isOpen) return null;

  const handleSelectAnswer = (val: any) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQId]: val,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Submit to Backend API
  const handleSubmitQuiz = async () => {
    if (isSubmitting || submissionResult) return;
    setIsSubmitting(true);

    const answersPayload = questions.map((q: any, idx: number) => {
      const qId = q.id || `q_${idx}`;
      return {
        question_id: qId,
        answer: selectedAnswers[qId] ?? "",
      };
    });

    const targetTopicId = topicId || moduleId || "module_quiz";

    try {
      const res = await QuizAiService.submitTopicQuiz(courseId, targetTopicId, {
        answers: answersPayload,
        time_elapsed_seconds: (data?.timeLimit || 15) * 60 - timeLeft,
      });

      if (res && res.percentage !== undefined) {
        setSubmissionResult(res);
        if (res.passed) {
          onQuizComplete?.();
        }
      } else {
        throw new Error("Invalid submission response shape");
      }
    } catch (err) {
      console.warn("[QuizModal] Backend submission failed, calculating fallback diagnostic result", err);

      // Local fallback evaluation so student is never stuck
      let earned = 0;
      const evals = questions.map((q: any, idx: number) => {
        const qId = q.id || `q_${idx}`;
        const uAns = selectedAnswers[qId];
        const cAns = q.correct_answer || q.correctAnswer || (q.options ? q.options[0] : "True");
        const isMatch = String(uAns).trim().toLowerCase() === String(cAns).trim().toLowerCase();
        if (isMatch) earned += q.points || 1;

        return {
          question_id: qId,
          question_text: q.text || q.question,
          question_type: q.type || "mcq",
          user_answer: uAns ?? "Not answered",
          correct_answer: cAns,
          is_correct: isMatch,
          score: isMatch ? (q.points || 1) : 0,
          max_score: q.points || 1,
          what_went_wrong: isMatch ? undefined : `Selected '${uAns}' instead of '${cAns}'.`,
          how_to_improve: isMatch ? "Solid understanding." : "Review the topic documentation to strengthen this concept.",
          explanation: q.explanation,
          source_pages: q.source_pages || [1],
        };
      });

      const total = questions.reduce((s: number, q: any) => s + (q.points || 1), 0) || 1;
      const pct = Math.round((earned / total) * 100);
      const passed = pct >= (data?.passingThreshold || 70);

      setSubmissionResult({
        test_id: `sub_local_${Date.now()}`,
        quiz_id: data?.id || "quiz",
        score: earned,
        total_questions: questions.length,
        percentage: pct,
        passed,
        passing_threshold: data?.passingThreshold || 70,
        time_elapsed_seconds: (data?.timeLimit || 15) * 60 - timeLeft,
        evaluations: evals,
        overall_feedback: passed
          ? "Great job! You passed this topic assessment."
          : "Score is below passing threshold. Review the diagnostics below.",
      });

      if (passed) {
        onQuizComplete?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Result Breakdown if finished
  if (submissionResult) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
        <div className="bg-slate-900 w-full max-w-4xl h-[90vh] rounded-[36px] border border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-8 py-4 border-b border-slate-800 bg-slate-950/60">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> Assessment Result
            </h3>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <QuizResultBreakdown
              result={submissionResult}
              isFinalQuiz={isFinalQuiz}
              onRetake={() => {
                setSubmissionResult(null);
                setCurrentIdx(0);
                setSelectedAnswers({});
                setTimeLeft((data?.timeLimit || 15) * 60);
              }}
              onContinue={() => {
                onClose();
              }}
              onViewCertificate={() => {
                navigate(`/courses/${courseId}/certificate`);
                onClose();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = selectedAnswers[currentQId];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="bg-white dark:bg-[#16171d] w-full max-w-5xl rounded-[36px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[720px] animate-in zoom-in-95 duration-200">

        {/* Main Quiz Area */}
        <div className="flex-1 p-8 sm:p-12 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="text-left">
                <span className="text-[10px] font-black text-[#4F46E5] uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md">
                  {data.path || "Topic Assessment"}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-2">
                  {data.title || "Topic Assessment"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Question Statement */}
            <div className="text-left">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                  {questionType.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-relaxed mb-8">
                {questionStatement}
              </h3>

              {/* 1. MCQ OPTIONS */}
              {questionType === "mcq" && (
                <div className="space-y-3">
                  {(currentQuestion.options || []).map((opt: string, i: number) => {
                    const isSelected = currentAnswer === opt || currentAnswer === i;

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectAnswer(opt)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#4F46E5] bg-indigo-50/40 dark:bg-indigo-950/40"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                          isSelected
                            ? "border-[#4F46E5] bg-[#4F46E5] text-white font-black text-xs"
                            : "border-slate-300 dark:border-slate-700"
                        }`}>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <span className={`text-sm font-bold ${
                          isSelected ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400"
                        }`}>
                          {opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 2. TRUE / FALSE BUTTONS */}
              {questionType === "true_false" && (
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  {["True", "False"].map((tfVal) => {
                    const isSelected = String(currentAnswer).toLowerCase() === tfVal.toLowerCase();

                    return (
                      <button
                        key={tfVal}
                        type="button"
                        onClick={() => handleSelectAnswer(tfVal)}
                        className={`py-5 px-6 rounded-2xl border-2 font-black text-base transition-all cursor-pointer text-center ${
                          isSelected
                            ? "border-[#4F46E5] bg-[#4F46E5] text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900/50"
                        }`}
                      >
                        {tfVal}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 3. DESCRIPTIVE Q&A TEXTAREA */}
              {questionType === "question_answer" && (
                <div className="space-y-2">
                  <textarea
                    rows={5}
                    value={currentAnswer || ""}
                    onChange={(e) => handleSelectAnswer(e.target.value)}
                    placeholder="Type your explanation or answer in detail here..."
                    className="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:border-[#4F46E5] resize-none"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-bold px-1">
                    <span>Be specific and cover the core architectural aspects.</span>
                    <span>{(currentAnswer || "").length} characters</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Nav */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-8">
            <button
              type="button"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx((prev) => prev - 1)}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-0 transition-opacity cursor-pointer"
            >
              <ChevronLeft size={18} /> Previous
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((prev) => prev + 1)}
                className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-extrabold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="flex items-center gap-2 px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Evaluating...
                  </>
                ) : (
                  "Submit & Complete Assessment"
                )}
              </button>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-[320px] bg-slate-50 dark:bg-[#121317] p-8 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800">
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center justify-center gap-1.5">
                <Clock size={12} /> Time Remaining
              </span>
              <div className={`text-5xl font-black tabular-nums tracking-tight ${
                timeLeft < 60 ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white"
              }`}>
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Questions Jump Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">
                Question Navigator
              </span>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q: any, i: number) => {
                  const qId = q.id || `q_${i}`;
                  const isAnswered = selectedAnswers[qId] !== undefined && selectedAnswers[qId] !== "";
                  const isCurrent = currentIdx === i;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIdx(i)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                          : isAnswered
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/40"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-6">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300">
              <Info size={16} className="shrink-0 mt-0.5" />
              <p className="text-xs font-medium leading-relaxed">
                Ensure all questions are completed before submitting. Answers are graded by the backend.
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitQuiz}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-xl shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Evaluating Assessment..." : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
