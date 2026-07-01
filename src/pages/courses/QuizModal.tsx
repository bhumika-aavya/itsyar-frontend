import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Info, CheckCircle2, XCircle, Trophy, Award } from 'lucide-react';
import { QuizData } from '@/schemas/lesson.schema';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: QuizData;
  isFinalQuiz: boolean;
  courseId: string;
}

export default function QuizModal({ isOpen, onClose, data, isFinalQuiz, courseId }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(data.timeLimit * 60);
  const [isFinished, setIsFinished] = useState(false);
  const navigate = useNavigate();

  // Reset all quiz state whenever the modal opens (prevents stale "finished" state from a previous quiz)
  useEffect(() => {
    if (isOpen) {
      setCurrentIdx(0);
      setSelectedAnswers({});
      setTimeLeft(data.timeLimit * 60);
      setIsFinished(false);
    }
  }, [isOpen]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || isFinished || !isOpen) return;
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isFinished, isOpen]);

  if (!isOpen) return null;

  const currentQuestion = data.questions[currentIdx];

  const getCorrectIndex = (answer: any) => {
    if (typeof answer === 'number') return answer;
    return String(answer).toLowerCase().charCodeAt(0) - 97;
  };

  const handleSelect = (optionIdx: number) => {
    if (selectedAnswers[currentIdx] !== undefined) return;
    setSelectedAnswers({ ...selectedAnswers, [currentIdx]: optionIdx });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateScore = () => {
    let score = 0;
    data.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === getCorrectIndex(q.correctAnswer)) score++;
    });
    return score;
  };

  if (isFinished) {
    const score = calculateScore();
    const percentage = Math.round((score / data.questions.length) * 100);
    const isPassed = percentage >= 70;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white w-full max-w-lg rounded-[40px] p-12 text-center shadow-2xl animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="text-[#4F39F6]" size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Quiz Completed!</h2>
          <p className="text-slate-500 font-medium mb-2">Great job! You've finished the module assessment.</p>
          <p className={`text-2xl font-black mb-8 ${isPassed ? 'text-emerald-500' : 'text-red-500'}`}>
            {percentage}%
          </p>

          <div className="space-y-3 mt-4">
            {isFinalQuiz && (
              <button
                onClick={() => navigate(`/courses/${courseId}/certificate`)}
                className="w-full py-4 bg-[#10B981] text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all"
              >
                <Award size={20} /> View &amp; Download Certificate
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full py-4 bg-[#4F39F6] text-white rounded-2xl font-black text-sm shadow-xl hover:bg-[#3f2dd1] transition-all"
            >
              {isFinalQuiz ? 'Close' : 'Back to Lesson'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-6xl rounded-[40px] shadow-2xl overflow-hidden flex h-[700px] animate-in zoom-in-95 duration-300">

        {/* Main Quiz Area */}
        <div className="flex-1 p-12 flex flex-col bg-white">
          <div className="flex justify-between items-start mb-10">
            <div className="text-left">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{data.title}</h2>
              <p className="text-[11px] font-bold text-[#4F39F6] uppercase tracking-[0.15em] mt-1">{data.path}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={24} /></button>
          </div>

          <div className="flex-1 text-left">
            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">
              Question {currentIdx + 1} of {data.questions.length}
            </p>
            <h3 className="text-xl font-bold text-slate-800 leading-relaxed mb-10">
              {currentQuestion.text}
            </h3>

            <div className="space-y-4">
              {currentQuestion.options.map((opt, i) => {
                const isSelected = selectedAnswers[currentIdx] === i;
                const correctIdx = getCorrectIndex(currentQuestion.correctAnswer);
                const isRevealed = selectedAnswers[currentIdx] !== undefined;

                let containerStyle = "border-slate-100 hover:border-slate-200";
                let icon = <div className="w-6 h-6 rounded-full border-2 border-slate-200" />;

                if (isRevealed) {
                  if (i === correctIdx) {
                    containerStyle = "border-emerald-500 bg-emerald-50/50";
                    icon = <CheckCircle2 className="text-emerald-500" size={24} />;
                  } else if (isSelected && i !== correctIdx) {
                    containerStyle = "border-red-500 bg-red-50/50";
                    icon = <XCircle className="text-red-500" size={24} />;
                  }
                } else if (isSelected) {
                  containerStyle = "border-[#4F39F6] bg-indigo-50/30";
                }

                return (
                  <button
                    key={i}
                    disabled={isRevealed}
                    onClick={() => handleSelect(i)}
                    className={`w-full flex items-center gap-4 p-5 rounded-3xl border-2 text-left transition-all group ${containerStyle}`}
                  >
                    <div className="shrink-0">{icon}</div>
                    <span className={`text-[15px] font-bold ${isSelected || (isRevealed && i === correctIdx) ? "text-slate-900" : "text-slate-500"}`}>
                      {opt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between mt-10 pt-8 border-t border-slate-50">
            <button
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="flex items-center gap-2 text-sm font-bold text-slate-300 disabled:opacity-0 transition-opacity"
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <button
              disabled={selectedAnswers[currentIdx] === undefined}
              onClick={() => currentIdx < data.questions.length - 1 ? setCurrentIdx(prev => prev + 1) : setIsFinished(true)}
              className="flex items-center gap-2 px-12 py-4 bg-[#1E293B] text-white rounded-2xl font-black text-sm hover:bg-slate-800 disabled:opacity-50 transition-all"
            >
              {currentIdx === data.questions.length - 1 ? "Finish" : "Next"} <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-[340px] bg-[#F8F9FD] p-10 flex flex-col border-l border-slate-50">
          <div className="bg-white rounded-[32px] p-10 text-center shadow-xl shadow-indigo-500/5 border border-indigo-50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Time Remaining</p>
            <div className={`text-6xl font-black tabular-nums tracking-tighter ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="mt-auto space-y-6">
            <div className="bg-[#FFF4E5] border border-orange-100 p-5 rounded-2xl flex gap-4">
              <Info size={24} className="text-orange-400 shrink-0 mt-0.5" />
              <p className="text-[12px] font-bold text-orange-800 leading-relaxed">
                Ensure you have answered all questions before submitting.
              </p>
            </div>
            <button
              onClick={() => setIsFinished(true)}
              className="w-full py-5 bg-[#4F39F6] text-white rounded-2xl font-black text-[15px] shadow-2xl shadow-indigo-200 hover:bg-[#3f2dd1] transition-all active:scale-95"
            >
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
