import React, { useState, useEffect } from 'react';
import { 
  PlayCircle, FileText, Download, ExternalLink, 
  ChevronDown, ChevronUp, Lock, Zap, ChevronLeft,
  Clock, Loader2, CheckCircle2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonService } from '@/services/lesson.service';
import { LessonData, QuizData } from '@/schemas/lesson.schema';
import QuizModal from './QuizModal';

export default function LessonView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();
  
  const [activeModule, setActiveModule] = useState<number | null>(3);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      const [lessonRes, quizRes] = await Promise.all([
        LessonService.getLessonDetails(lessonId || "default"),
        LessonService.getModuleQuiz(lessonId || "default")
      ]);
      setLesson(lessonRes);
      setQuizData(quizRes);
      setLoading(false);
    };
    loadContent();
  }, [lessonId]);

  const modules = [
    { id: 1, title: "Foundational Deep Learning", lessons: ["Introduction to CNNs", "Pooling & Strides"], hasQuiz: true },
    { id: 2, title: "Convolutional Neural Networks", lessons: ["Introduction to CNNs", "Pooling & Strides"], hasQuiz: false },
    { id: 3, title: "Recurrent Neural Networks", lessons: ["3.1: Introduction to RNNs", "3.2: LSTMs and GRUs"], hasQuiz: true },
    { id: 4, title: "Advanced Architectures", lessons: [], hasQuiz: false },
  ];

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#F9FAFD]">
      <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFD] flex flex-col text-left">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-8 py-5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/courses/${courseId}`)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{lesson?.title}</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          
          <div className="lg:col-span-8 space-y-10">
            <div className="aspect-video bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
              <iframe width="100%" height="100%" src={`${lesson?.videoUrl}?modestbranding=1`} title="Video" frameBorder="0" allowFullScreen></iframe>
            </div>

            <div className="grid md:grid-cols-2 gap-12 pt-4">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-[#4F39F6]"><FileText size={20} /></div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Summary</h3>
                </div>
                <p className="text-[15px] font-medium text-slate-500 leading-relaxed">{lesson?.summary}</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg text-[#4F39F6]"><Zap size={20} /></div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Course Materials</h3>
                </div>
                <div className="space-y-3">
                  {lesson?.materials.map((mat: any) => (
                    <MaterialCard key={mat.id} {...mat} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Curriculum Sidebar */}
          <div className="lg:col-span-4 sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Course Curriculum</h3>
              <div className="px-2">
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <div className="h-full bg-[#4F39F6]" style={{ width: `${lesson?.course_completion_percentage}%` }} />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">{lesson?.course_completion_percentage}% Complete</p>
              </div>

              <div className="space-y-2">
                {modules.map((mod) => (
                  <ModuleAccordionItem 
                    key={mod.id}
                    module={mod}
                    isActive={activeModule === mod.id}
                    onClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                    currentLessonTitle={lesson?.title}
                  />
                ))}
              </div>

              <div className="mt-8 p-2">
                <button 
                  disabled
                  className="w-full py-4 bg-[#DDE1E7] text-slate-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-3"
                >
                  <Lock size={18} /> Take Quiz
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {quizData && <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} data={quizData} />}
    </div>
  );
}

// --- Internal Page Sub-Components ---

const MaterialCard = ({ title, meta, icon, type }: any) => (
  <div className="p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:border-[#4F39F6]/30 transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-2 rounded-xl ${type === 'pdf' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
        <FileText size={20} />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold text-slate-800 leading-tight">{title}</p>
        <p className="text-[10px] font-bold text-slate-400 mt-1">{meta}</p>
      </div>
    </div>
    {type === 'pdf' ? <Download size={18} className="text-slate-300 group-hover:text-[#4F39F6]" /> : <ExternalLink size={18} className="text-slate-300 group-hover:text-[#4F39F6]" />}
  </div>
);

const ModuleAccordionItem = ({ module, isActive, onClick, currentLessonTitle }: any) => (
  <div className={`rounded-xl overflow-hidden border transition-all ${isActive ? "border-[#4F39F6]" : "border-slate-100"}`}>
    <button 
      onClick={onClick} 
      className={`w-full p-4 flex items-center justify-between transition-colors ${isActive ? "bg-[#4F39F6] text-white" : "bg-white text-slate-600"}`}
    >
      <div className="text-left">
        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>Module {module.id}</p>
        <p className="text-xs font-bold">{module.title}</p>
      </div>
      {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>

    {isActive && (
      <div className="bg-white">
        {module.lessons.map((lesson: string, idx: number) => {
          const isCurrent = currentLessonTitle.includes(lesson.split(":")[0]);
          return (
            <div 
              key={idx} 
              className={`flex items-center gap-3 p-4 transition-all cursor-pointer border-l-4 ${
                isCurrent ? "bg-[#EEF0FF] border-[#4F39F6] text-[#4F39F6]" : "border-transparent text-slate-600 hover:bg-slate-50"
              }`}
            >
              <PlayCircle size={16} fill={isCurrent ? "currentColor" : "none"} className={isCurrent ? "opacity-100" : "text-slate-400"} />
              <span className="text-[12px] font-bold">{lesson}</span>
            </div>
          );
        })}
        {module.hasQuiz && (
          <div className="flex items-center gap-3 p-4 text-slate-400 border-t border-slate-50">
            <FileText size={16} />
            <span className="text-[12px] font-bold">Module {module.id} Quiz</span>
          </div>
        )}
      </div>
    )}
  </div>
);