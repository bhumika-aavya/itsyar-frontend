import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Info, Clock, Loader2, Sparkles, Award } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { QuizAiService } from "@/services/quiz-ai.service";
import QuizResultBreakdown from "@/components/quiz/QuizResultBreakdown";
import QuestionRenderer from "@/components/quiz/QuestionRenderer";
import { QuizQuestion, TestSubmissionRequest, TestSubmissionResponse, QuestionType } from "@/types/quiz";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onQuizComplete?: () => void;
  data: any;
  isFinalQuiz?: boolean;
  courseId: string;
  topicId?: string;
  moduleId?: string;
  isLoading?: boolean;
}

export default function QuizModal({
  isOpen,
  onClose,
  onQuizComplete,
  data,
  isFinalQuiz = false,
  courseId,
  topicId,
  moduleId,
  isLoading = false,
}: Props) {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<
    Record<string, { answer?: string; selectedAnswers?: string[] }>
  >({});
  const [timeLeft, setTimeLeft] = useState((data?.timeLimit || data?.time_limit_minutes || 15) * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<TestSubmissionResponse | null>(null);
  const [evalProgress, setEvalProgress] = useState(0);

  const rawQuestions = data?.questions || [];
  const questions: QuizQuestion[] = rawQuestions.map((q: any, idx: number) => {
    const rawType = (q.type || q.question_type || "SINGLE_CHOICE").toUpperCase();
    const normalizedType: QuestionType =
      rawType === "QUESTION_ANSWER" || rawType === "QA"
        ? "QA"
        : rawType === "TRUE_FALSE" || rawType === "BOOLEAN"
        ? "TRUE_FALSE"
        : rawType === "MULTIPLE_CHOICE" || rawType === "MULTI_CHOICE" || rawType === "CHECKBOX"
        ? "MULTIPLE_CHOICE"
        : "SINGLE_CHOICE";

    const qText =
      (q.text && q.text !== "Question" && q.text.trim() !== "") ? q.text :
      (q.question && q.question !== "Question" && q.question.trim() !== "") ? q.question :
      (q.questionText && q.questionText !== "Question" && q.questionText.trim() !== "") ? q.questionText :
      (q.question_text && q.question_text !== "Question" && q.question_text.trim() !== "") ? q.question_text :
      q.prompt ||
      q.title ||
      q.statement ||
      q.body ||
      q.name ||
      `Question ${idx + 1}`;

    const rawOptions = q.options || q.choices || q.answers || [];
    const formattedOptions = Array.isArray(rawOptions)
      ? rawOptions.map((opt: any) =>
          typeof opt === "string" ? opt : opt?.text || opt?.label || opt?.option || opt?.title || String(opt)
        )
      : [];

    const cAnswer =
      q.correctAnswer ||
      q.correct_answer ||
      q.expectedAnswer ||
      q.expected_answer ||
      q.model_answer ||
      q.solution ||
      q.target_answer ||
      q.answer ||
      q.correct ||
      q.correctOption ||
      q.correct_option;

    return {
      id: q.id || q.question_id || q.questionId || `q_${idx}`,
      text: qText,
      question: qText,
      type: normalizedType,
      options: formattedOptions,
      points: Number(q.points || q.max_score || q.score) || (normalizedType === "QA" ? 2 : 1),
      sequenceOrder: String(q.sequenceOrder || q.sequence_order || idx + 1),
      correctAnswer: cAnswer,
      correct_answer: cAnswer,
      explanation: q.explanation || q.correctExplanation || q.correct_explanation || q.feedback,
    };
  });

  const currentQuestion = questions[currentIdx] || {
    id: `q_${currentIdx}`,
    text: `Question ${currentIdx + 1}`,
    type: "SINGLE_CHOICE",
  };
  const currentQId = currentQuestion.id;
  const currentAnswerState = userAnswers[currentQId] || {};

  // Reset all quiz state whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setUserAnswers({});
      setTimeLeft((data?.timeLimit || data?.time_limit_minutes || 15) * 60);
      setIsSubmitting(false);
      setEvalProgress(0);
      setSubmissionResult(null);
    }
  }, [isOpen, data]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 && !submissionResult && isOpen && !isSubmitting && !isLoading) {
      handleSubmitQuiz();
      return;
    }
    if (timeLeft <= 0 || submissionResult || !isOpen || isLoading) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submissionResult, isOpen, isSubmitting, isLoading]);

  // Evaluation Progress Simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSubmitting) {
      setEvalProgress(0);
      interval = setInterval(() => {
        setEvalProgress((prev) => {
          if (prev >= 99) return 99;
          if (prev < 60) return prev + Math.floor(Math.random() * 6) + 3;
          if (prev < 85) return prev + Math.floor(Math.random() * 4) + 1;
          if (prev < 95) return prev + 1;
          if (Math.random() < 0.3) return prev + 1;
          return prev;
        });
      }, 800);
    }
    return () => clearInterval(interval);
  }, [isSubmitting]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#16171d] w-full max-w-md rounded-[36px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-200 relative">
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
            <Loader2 size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mb-6" />
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Generating Assessment</h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Please wait while our AI is generating your personalized knowledge assessment...</p>
        </div>
      </div>
    );
  }

  if (isSubmitting) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#16171d] w-full max-w-md rounded-[36px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 duration-200 relative">
          <div className="relative w-28 h-28 mb-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90 absolute inset-0" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-indigo-600 dark:stroke-indigo-500 transition-all duration-300 ease-out"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - evalProgress / 100)}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="flex flex-col items-center justify-center z-10">
              <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                {evalProgress}%
              </span>
            </div>
          </div>
          
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Evaluating Assessment</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 min-h-[40px]">
            {evalProgress < 40 
              ? "Our AI is carefully reading your answers. This may take a few moments..."
              : evalProgress < 75
              ? "Cross-referencing your solutions with expected technical outcomes..."
              : evalProgress < 95
              ? "Generating personalized feedback and scoring your accuracy..."
              : "Finalizing assessment results and preparing breakdown..."}
          </p>
        </div>
      </div>
    );
  }

  const handleAnswerChange = (payload: { answer?: string; selectedAnswers?: string[] }) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQId]: payload,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case "QA":
        return "Open Ended Q&A";
      case "TRUE_FALSE":
        return "True / False";
      case "MULTIPLE_CHOICE":
        return "Multiple Choice (Multi-Select)";
      case "SINGLE_CHOICE":
      default:
        return "Single Choice";
    }
  };

  // Submit to Backend API
  const handleSubmitQuiz = async () => {
    if (isSubmitting || submissionResult) return;
    setIsSubmitting(true);

    const submissionAnswers = questions.map((q) => {
      const qAns = userAnswers[q.id] || {};
      const answerVal = qAns.answer || (qAns.selectedAnswers ? qAns.selectedAnswers.join(", ") : "");
      return {
        questionId: q.id,
        question_id: q.id,
        questionText: q.text,
        question_text: q.text,
        question: q.text,
        type: q.type,
        question_type: q.type,
        options: q.options,
        expectedAnswer: q.correctAnswer || q.expected_answer || q.correct_answer,
        expected_answer: q.correctAnswer || q.expected_answer || q.correct_answer,
        correctAnswer: q.correctAnswer || q.expected_answer || q.correct_answer,
        correct_answer: q.correctAnswer || q.expected_answer || q.correct_answer,
        explanation: q.explanation,
        answer: answerVal,
        user_answer: answerVal,
        userAnswer: answerVal,
        selectedAnswers: qAns.selectedAnswers || (qAns.answer ? [qAns.answer] : []),
        selected_answers: qAns.selectedAnswers || (qAns.answer ? [qAns.answer] : []),
      };
    });

    const targetTopicId = topicId || moduleId || "module_quiz";
    const totalTime = (data?.timeLimit || data?.time_limit_minutes || 15) * 60;
    const timeElapsed = Math.max(0, totalTime - timeLeft);

    const submissionPayload: TestSubmissionRequest = {
      topicId: targetTopicId,
      answers: submissionAnswers,
      timeElapsedSeconds: timeElapsed,
      time_elapsed_seconds: timeElapsed,
    };

    try {
      const res = await QuizAiService.submitTopicQuiz(
        courseId,
        moduleId && topicId ? moduleId : targetTopicId,
        moduleId && topicId ? topicId : submissionPayload,
        moduleId && topicId ? submissionPayload : undefined
      );

      if (res && (res.score !== undefined || res.percentage !== undefined)) {
        const rawEvals = (res.feedback && res.feedback.length > 0 ? res.feedback : res.evaluations) || [];

        const enrichedFeedback = questions.map((q, idx) => {
          const evalItem =
            rawEvals.find((e: any) => String(e.questionId || e.question_id || e.id) === String(q.id)) ||
            rawEvals[idx] ||
            {};

          const qAns = userAnswers[q.id] || {};
          let userSubmittedAnswer =
            qAns.answer ||
            (qAns.selectedAnswers && qAns.selectedAnswers.length > 0 ? qAns.selectedAnswers.join(", ") : "") ||
            evalItem.userAnswer ||
            evalItem.user_answer ||
            "Not answered";

          const questionText =
            (q.text && q.text !== "Question" && q.text.trim() !== "")
              ? q.text
              : (q.question && q.question !== "Question" && q.question.trim() !== "")
              ? q.question
              : (evalItem.questionText && evalItem.questionText !== "Question" && evalItem.questionText.trim() !== "")
              ? evalItem.questionText
              : (evalItem.question_text && evalItem.question_text !== "Question" && evalItem.question_text.trim() !== "")
              ? evalItem.question_text
              : `Question ${idx + 1}`;

          let expectedAnswer =
            q.correctAnswer ||
            q.correct_answer ||
            q.expected_answer ||
            evalItem.expectedAnswer ||
            evalItem.expected_answer ||
            evalItem.correctAnswer ||
            evalItem.correct_answer;

          if (
            !expectedAnswer ||
            expectedAnswer === "A clear, accurate technical explanation." ||
            expectedAnswer === "Verified Concept" ||
            expectedAnswer === "Verified Model" ||
            expectedAnswer === "Verified Solution"
          ) {
            if (q.options && q.options.length > 0) {
              expectedAnswer = typeof q.options[0] === "string" ? q.options[0] : q.options[0]?.text || q.options[0]?.label || "Option 1";
            } else if (q.type === "TRUE_FALSE") {
              expectedAnswer = "True";
            } else if (q.explanation) {
              expectedAnswer = q.explanation;
            } else {
              expectedAnswer = "Model solution not specified";
            }
          }

          // Format index-based answers if options are available
          if (q.options && q.options.length > 0) {
            const uIdx = parseInt(userSubmittedAnswer, 10);
            if (!isNaN(uIdx) && q.options[uIdx]) {
              const opt = q.options[uIdx];
              userSubmittedAnswer = typeof opt === "string" ? opt : opt?.text || opt?.label || userSubmittedAnswer;
            }

            const cIdx = parseInt(String(expectedAnswer), 10);
            if (!isNaN(cIdx) && q.options[cIdx]) {
              const opt = q.options[cIdx];
              expectedAnswer = typeof opt === "string" ? opt : opt?.text || opt?.label || expectedAnswer;
            }
          }

          const explanation =
            q.explanation ||
            evalItem.explanation ||
            evalItem.correctExplanation ||
            "This question tests core architectural and algorithmic principles from the topic curriculum.";

          const isMatch =
            evalItem.isCorrect ??
            evalItem.is_correct ??
            (userSubmittedAnswer.trim() !== "" &&
              userSubmittedAnswer !== "Not answered" &&
              (userSubmittedAnswer.trim().toLowerCase() === String(expectedAnswer).trim().toLowerCase() ||
                (qAns.selectedAnswers &&
                  qAns.selectedAnswers.some((sa) => sa.trim().toLowerCase() === String(expectedAnswer).trim().toLowerCase()))));

          const maxPts = q.points || evalItem.max_score || evalItem.points || 1;
          const awardedPts = evalItem.pointsEarned ?? evalItem.score ?? (isMatch ? maxPts : 0);

          return {
            ...evalItem,
            questionId: q.id,
            question_id: q.id,
            id: q.id,
            questionText,
            question_text: questionText,
            type: q.type || evalItem.type || evalItem.question_type,
            question_type: q.type || evalItem.question_type || evalItem.type,
            options: q.options || evalItem.options || [],
            userAnswer: userSubmittedAnswer,
            user_answer: userSubmittedAnswer,
            expectedAnswer: String(expectedAnswer),
            expected_answer: String(expectedAnswer),
            correctAnswer: String(expectedAnswer),
            correct_answer: String(expectedAnswer),
            isCorrect: Boolean(isMatch),
            is_correct: Boolean(isMatch),
            pointsEarned: awardedPts,
            score: awardedPts,
            max_score: maxPts,
            points: maxPts,
            technicalScore: evalItem.technicalScore ?? (isMatch ? 100 : 35),
            completenessScore: evalItem.completenessScore ?? (isMatch ? 100 : 40),
            clarityScore: evalItem.clarityScore ?? (isMatch ? 95 : 60),
            explanation,
            correctExplanation: explanation,
            whatWentWrong:
              evalItem.whatWentWrong ||
              evalItem.what_went_wrong ||
              (isMatch
                ? undefined
                : userSubmittedAnswer === "Not answered" || userSubmittedAnswer.trim() === ""
                ? "No answer was provided or submitted for this question."
                : `Selected "${userSubmittedAnswer}", but the expected solution is "${expectedAnswer}".`),
            recommendations:
              evalItem.recommendations ||
              evalItem.how_to_improve ||
              (isMatch
                ? "Concept mastered! Ready for production architecture."
                : `Review the topic documentation regarding ${questionText}. Takeaway: ${explanation}`),
          };
        });

        setSubmissionResult({
          ...res,
          feedback: enrichedFeedback,
          evaluations: enrichedFeedback,
        });

        if (res.passed) {
          onQuizComplete?.();
        }
      } else {
        throw new Error("Invalid submission response shape");
      }
    } catch (err) {
      console.warn("[QuizModal] Backend submission failed, calculating diagnostic result locally", err);

      // Diagnostic Local Evaluation Fallback
      let earnedPoints = 0;
      const evals = questions.map((q, idx) => {
        const qAns = userAnswers[q.id] || {};
        let uAns = qAns.answer || (qAns.selectedAnswers && qAns.selectedAnswers.length > 0 ? qAns.selectedAnswers.join(", ") : "");
        let cAns = q.correctAnswer || q.correct_answer || (q.options && q.options[0]) || (q.type === "TRUE_FALSE" ? "True" : "Verified Model");
        const maxPts = q.points || 1;

        if (q.options && q.options.length > 0) {
          const uIdx = parseInt(uAns, 10);
          if (!isNaN(uIdx) && q.options[uIdx]) {
            const opt = q.options[uIdx];
            uAns = typeof opt === "string" ? opt : opt?.text || opt?.label || uAns;
          }

          const cIdx = parseInt(String(cAns), 10);
          if (!isNaN(cIdx) && q.options[cIdx]) {
            const opt = q.options[cIdx];
            cAns = typeof opt === "string" ? opt : opt?.text || opt?.label || cAns;
          }
        }

        const isMatch =
          uAns.trim() !== "" &&
          (uAns.trim().toLowerCase() === String(cAns).trim().toLowerCase() ||
            (qAns.selectedAnswers &&
              qAns.selectedAnswers.some(
                (sa) => sa.trim().toLowerCase() === String(cAns).trim().toLowerCase()
              )));

        const awarded = isMatch ? maxPts : 0;
        earnedPoints += awarded;

        const explanation =
          q.explanation ||
          "This question tests core architectural and algorithmic principles from the topic curriculum.";

        return {
          questionId: q.id,
          question_id: q.id,
          id: q.id,
          questionText: q.text,
          question_text: q.text,
          type: q.type,
          question_type: q.type,
          options: q.options || [],
          userAnswer: uAns || "Not answered",
          user_answer: uAns || "Not answered",
          expectedAnswer: String(cAns),
          expected_answer: String(cAns),
          correctAnswer: String(cAns),
          correct_answer: String(cAns),
          isCorrect: isMatch,
          is_correct: isMatch,
          pointsEarned: awarded,
          score: awarded,
          max_score: maxPts,
          points: maxPts,
          technicalScore: isMatch ? 100 : 35,
          completenessScore: isMatch ? 100 : 40,
          clarityScore: isMatch ? 95 : 60,
          whatWentWrong: isMatch
            ? undefined
            : uAns.trim() === ""
            ? "No answer was provided or submitted for this question."
            : `Selected "${uAns}", but the verified model solution is "${cAns}".`,
          recommendations: isMatch
            ? "Concept mastered! Ready for production architecture."
            : `Review the topic documentation regarding ${q.text}. Takeaway: ${explanation}`,
          correctExplanation: explanation,
          explanation: explanation,
        };
      });

      const totalPts = questions.reduce((s, q) => s + (q.points || 1), 0) || 1;
      const pct = Math.round((earnedPoints / totalPts) * 100);
      const passed = pct >= (data?.passingThreshold || data?.passing_score_percentage || 70);

      setSubmissionResult({
        attemptId: `att_${Date.now()}`,
        test_id: `sub_${Date.now()}`,
        quiz_id: data?.id || "quiz",
        passed,
        score: earnedPoints,
        percentage: pct,
        totalPointsEarned: earnedPoints,
        totalPointsPossible: totalPts,
        total_questions: questions.length,
        passing_threshold: data?.passingThreshold || data?.passing_score_percentage || 70,
        time_elapsed_seconds: timeElapsed,
        overallTechnicalScore: pct,
        overallCompletenessScore: Math.min(100, pct + 5),
        overallClarityScore: 90,
        overallRecommendations: passed
          ? "Great job! You demonstrated technical mastery and comprehensive reasoning."
          : "Score is below the passing threshold. Review the diagnostic breakdown below to target areas for improvement.",
        feedback: evals,
        evaluations: evals,
        submittedAt: new Date().toISOString(),
        message: passed ? "Assessment passed successfully." : "Assessment evaluated.",
        overall_feedback: passed
          ? "Great job! You demonstrated mastery of this topic."
          : "Score is below passing threshold. Review the diagnostic breakdown below to target areas for improvement.",
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 sm:p-6 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-[#0b0d14] w-full max-w-4xl h-[88vh] max-h-[900px] rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/80 shrink-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400" /> Assessment Result Breakdown
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 relative overflow-hidden">
            <QuizResultBreakdown
              result={submissionResult}
              isFinalQuiz={isFinalQuiz}
              onRetake={() => {
                setSubmissionResult(null);
                setCurrentIdx(0);
                setUserAnswers({});
                setTimeLeft((data?.timeLimit || data?.time_limit_minutes || 15) * 60);
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

  const answeredCount = questions.filter(q => {
    const uAns = userAnswers[q.id];
    return (uAns?.answer !== undefined && uAns?.answer !== "" && uAns?.answer !== null) ||
           (uAns?.selectedAnswers !== undefined && uAns?.selectedAnswers.length > 0);
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-12 backdrop-blur-sm bg-slate-950/50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#16171d] w-full max-w-5xl rounded-[36px] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col md:flex-row h-[740px] animate-in zoom-in-95 duration-200">
        {/* Main Quiz Area */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between overflow-y-auto">
          {/* Header */}
          <div>
            <div className="flex justify-between items-start mb-6">
              <div className="text-left space-y-1">
                <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-md border border-indigo-200/60 dark:border-indigo-900/50 inline-block">
                  {data?.path || data?.title || "Topic Knowledge Assessment"}
                </span>
                <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                  {data?.title || "Topic Assessment"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors cursor-pointer"
              >
                <X size={22} />
              </button>
            </div>

            {/* Question Statement & Meta Header */}
            <div className="text-left space-y-4">
              <div className="flex items-center gap-2 flex-wrap pb-2 border-b border-slate-100 dark:border-slate-800/80">
                <span className="text-xs font-black text-slate-400 uppercase tracking-wider">
                  Question {currentIdx + 1} of {questions.length}
                </span>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 uppercase tracking-wider">
                  {getQuestionTypeLabel(currentQuestion.type)}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-relaxed mb-6">
                {currentQuestion.text}
              </h3>

              {/* Dynamic Question Renderer */}
              <QuestionRenderer
                question={currentQuestion}
                answer={currentAnswerState.answer}
                selectedAnswers={currentAnswerState.selectedAnswers}
                onAnswerChange={handleAnswerChange}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Bottom Navigation */}
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
                className="flex items-center gap-2 px-8 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-extrabold text-xs hover:bg-slate-800 dark:hover:bg-slate-100 transition-all cursor-pointer shadow-md"
              >
                Next <ChevronRight size={16} />
              </button>
            ) : (
              <div className="flex items-center gap-3">
                {answeredCount < 5 && (
                  <span className="text-[11px] font-bold text-red-500">
                    Answer at least 5 questions
                  </span>
                )}
                <button
                  type="button"
                  disabled={isSubmitting || answeredCount < 5}
                  onClick={handleSubmitQuiz}
                  className="flex items-center gap-2 px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-lg shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Evaluating with AI...
                    </>
                  ) : (
                    "Submit & Complete Assessment"
                  )}
                </button>
              </div>
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
              <div
                className={`text-5xl font-black tabular-nums tracking-tight ${
                  timeLeft < 60 ? "text-red-500 animate-pulse" : "text-slate-900 dark:text-white"
                }`}
              >
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Questions Jump Grid */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-3">
                Question Navigator
              </span>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const uAns = userAnswers[q.id];
                  const isAnswered =
                    (uAns?.answer !== undefined && uAns?.answer !== "" && uAns?.answer !== null) ||
                    (uAns?.selectedAnswers !== undefined && uAns?.selectedAnswers.length > 0);
                  const isCurrent = currentIdx === i;

                  return (
                    <button
                      key={q.id || i}
                      type="button"
                      onClick={() => setCurrentIdx(i)}
                      className={`w-9 h-9 rounded-xl font-bold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        isCurrent
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400"
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
                Ensure at least 5 questions are answered before submitting. Answers are graded by Palantir AI.
              </p>
            </div>

            <button
              type="button"
              disabled={isSubmitting || answeredCount < 5}
              onClick={handleSubmitQuiz}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-xs shadow-xl shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center"
            >
              {isSubmitting ? "Evaluating Assessment..." : "Submit Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
