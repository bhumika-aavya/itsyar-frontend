import React, { useState, useEffect } from 'react';
import ReactPlayer from 'react-player'; // Optimized lazy loading
import {
  PlayCircle, FileText, ChevronDown, ChevronUp, Zap, ChevronLeft,
  Loader2
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonService } from '@/services/lesson.service';
import { QuizData } from '@/schemas/lesson.schema';
import QuizModal from './QuizModal';

export default function LessonView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [activeModule, setActiveModule] = useState<number | null>(3);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [lesson, setLesson] = useState<any>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      if (lesson) setIsUpdatingVideo(true);
      else setIsInitialLoading(true);

      try {
        const [lessonRes, quizRes] = await Promise.all([
          LessonService.getLessonDetails(lessonId || "intro"),
          LessonService.getModuleQuiz(lessonId || "intro")
        ]);
        setLesson(lessonRes);
        setQuizData(quizRes);
      } catch (err) {
        console.error("Failed to load content", err);
      } finally {
        setIsInitialLoading(false);
        setIsUpdatingVideo(false);
      }
    };
    loadContent();
  }, [lessonId]);

  const modules = [
    { id: 1, title: "Foundational Deep Learning", lessons: [{ id: "1-1", title: "1.1: Intro to AI" }] },
    { id: 2, title: "Convolutional Neural Networks", lessons: [{ id: "2-1", title: "2.1: Intro to CNNs" }] },
    { id: 3, title: "Recurrent Neural Networks", lessons: [{ id: "3-1", title: "3.1: Introduction to RNNs" }, { id: "3-2", title: "3.2: LSTMs and GRUs" }], hasQuiz: true },
  ];

  if (isInitialLoading) return (
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
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{lesson?.title}</h2>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8 space-y-10">
            {/* FIXED VIDEO CONTAINER */}
            <div className="relative pt-[56.25%] w-full bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
              {isUpdatingVideo || !lesson?.videoUrl ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-white mb-2" size={32} />
                  <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Buffering Stream...</p>
                </div>
              ) : (<>
                {/* <ReactPlayer
                  key={lesson?.id} // Forces fresh mount when switching lessons
                  className="absolute top-0 left-0"
                  url='https://aavya.palantirfoundry.com/workspace/preview-app/ri.blobster.main.video.7fd1176e-db42-47ad-b611-f5e65a3a9afb'
                  width="100%"
                  height="100%"
                  controls={true}
                  // Shows thumbnail automatically for YouTube/Vimeo
                  light={true}
                  playIcon={<PlayCircle size={60} className="text-[#4F39F6] bg-white rounded-full shadow-2xl" />}
                  playing={false}
                  onEnded={() => setIsQuizOpen(true)}
                /> */}
                  <iframe width="100%" height="100%" src={'https://aavya.palantirfoundry.com/workspace/preview-app/ri.blobster.main.video.7fd1176e-db42-47ad-b611-f5e65a3a9afb'} title="Video" frameBorder="0" allowFullScreen></iframe></>
              
              )              }
             
            </div>

            {/* Summary and Materials */}
            <div className="grid md:grid-cols-2 gap-12 pt-4">
              <div className="space-y-5">
                <div className="flex items-center gap-3 font-black text-[#4F39F6] uppercase text-sm tracking-widest">
                  <FileText size={20} /> Summary
                </div>
                <p className="text-[15px] font-medium text-slate-500 leading-relaxed">{lesson?.summary}</p>
              </div>
              <div className="space-y-5">
                <div className="flex items-center gap-3 font-black text-[#4F39F6] uppercase text-sm tracking-widest">
                  <Zap size={20} /> Course Materials
                </div>
                <div className="space-y-3">
                  {lesson?.materials?.map((mat: any) => (
                    <MaterialCard key={mat.id} {...mat} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Course Curriculum</h3>
              <div className="space-y-2">
                {modules.map((mod) => (
                  <ModuleAccordionItem
                    key={mod.id}
                    module={mod}
                    isActive={activeModule === mod.id}
                    onHeaderClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                    currentLessonId={lessonId || "intro"}
                    onLessonClick={(id: string) => navigate(`/courses/${courseId}/lessons/${id}`)}
                    onQuizClick={() => setIsQuizOpen(true)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {quizData && <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} data={quizData} />}
    </div>
  );
}

// Sub-components (MaterialCard & ModuleAccordionItem) remain the same...
const MaterialCard = ({ title, meta, type }: any) => (
  <div className="p-4 bg-[#F1F3FF] rounded-2xl border border-indigo-50 flex items-center justify-between group cursor-pointer hover:bg-white hover:shadow-md transition-all">
    <div className="flex items-center gap-4">
      <div className={`p-2.5 rounded-xl ${type === 'pdf' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
        <FileText size={20} />
      </div>
      <div className="text-left font-bold">
        <p className="text-sm text-slate-800">{title}</p>
        <p className="text-[10px] text-slate-400 uppercase">{meta}</p>
      </div>
    </div>
  </div>
);

const ModuleAccordionItem = ({ module, isActive, onHeaderClick, currentLessonId, onLessonClick, onQuizClick }: any) => (
  <div className={`rounded-xl overflow-hidden border transition-all ${isActive ? "border-[#4F39F6]" : "border-slate-100"}`}>
    <button onClick={onHeaderClick} className={`w-full p-4 flex items-center justify-between transition-colors ${isActive ? "bg-[#4F39F6] text-white" : "bg-white text-slate-600"}`}>
      <div className="text-left">
        <p className={`text-[9px] font-black uppercase mb-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>Module {module.id}</p>
        <p className="text-xs font-bold">{module.title}</p>
      </div>
      {isActive ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
    {isActive && (
      <div className="bg-white">
        {module.lessons.map((l: any) => (
          <div
            key={l.id}
            onClick={() => onLessonClick(l.id)}
            className={`flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-all ${currentLessonId === l.id ? "bg-[#EEF0FF] border-[#4F39F6] text-[#4F39F6]" : "border-transparent text-slate-600 hover:bg-slate-50"
              }`}
          >
            <PlayCircle size={16} fill={currentLessonId === l.id ? "currentColor" : "none"} />
            <span className="text-[12px] font-bold">{l.title}</span>
          </div>
        ))}
        {module.hasQuiz && (
          <div onClick={onQuizClick} className="flex items-center gap-3 p-4 text-[#4F39F6] border-t border-slate-50 hover:bg-indigo-50 cursor-pointer">
            <FileText size={16} />
            <span className="text-[12px] font-bold">Module {module.id} Quiz</span>
          </div>
        )}
      </div>
    )}
  </div>
);