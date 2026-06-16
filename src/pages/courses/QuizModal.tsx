import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Info, Clock } from 'lucide-react';
import { QuizData } from '@/schemas/lesson.schema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: QuizData;
}

export default function QuizModal({ isOpen, onClose, data }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(data.timeLimit * 60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const currentQuestion = data.questions[currentIdx];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-5xl rounded-[32px] shadow-2xl overflow-hidden flex h-[600px]">
        {/* Main Quiz Area */}
        <div className="flex-1 p-10 flex flex-col">
          <div className="flex justify-between items-start mb-8">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-slate-900">{data.title}</h2>
              <p className="text-xs font-bold text-[#4F39F6] uppercase tracking-wider mt-1">{data.path}</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={24} /></button>
          </div>

          <div className="flex-1 text-left">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
              Question {currentIdx + 1} of {data.questions.length}
            </p>
            <h3 className="text-lg font-bold text-slate-800 leading-relaxed mb-8">
              {currentQuestion.text}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((opt, i) => (
                <label key={i} className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  selectedAnswers[currentIdx] === i ? "border-[#4F39F6] bg-indigo-50/50" : "border-slate-100 hover:border-slate-200"
                }`}>
                  <input 
                    type="radio" 
                    className="hidden" 
                    name="q" 
                    onChange={() => setSelectedAnswers({...selectedAnswers, [currentIdx]: i})}
                  />
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[currentIdx] === i ? "border-[#4F39F6]" : "border-slate-300"
                  }`}>
                    {selectedAnswers[currentIdx] === i && <div className="w-2.5 h-2.5 rounded-full bg-[#4F39F6]" />}
                  </div>
                  <span className={`text-sm font-semibold ${selectedAnswers[currentIdx] === i ? "text-[#4F39F6]" : "text-slate-600"}`}>
                    {opt}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
            <button 
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
              className="flex items-center gap-2 text-sm font-bold text-slate-400 disabled:opacity-30"
            >
              <ChevronLeft size={20} /> Previous
            </button>
            <button 
              onClick={() => currentIdx < data.questions.length - 1 ? setCurrentIdx(prev => prev + 1) : null}
              className="flex items-center gap-2 px-10 py-3 bg-slate-800 text-white rounded-xl font-bold text-sm"
            >
              Next <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-72 bg-[#F4F2FF] p-8 flex flex-col">
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-indigo-100/50">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Time Remaining</p>
            <div className="text-5xl font-black text-slate-900 tabular-nums">
              {formatTime(timeLeft)}
            </div>
          </div>

          <div className="mt-auto space-y-4">
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl flex gap-3">
              <Info size={20} className="text-orange-400 shrink-0" />
              <p className="text-[11px] font-bold text-orange-700 leading-tight">
                Ensure you have answered all questions before submitting.
              </p>
            </div>
            <button className="w-full py-4 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200">
              Submit Test
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}