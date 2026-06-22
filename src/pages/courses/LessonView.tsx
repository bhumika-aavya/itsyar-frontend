import React, { useState, useEffect } from 'react';
import {
  PlayCircle, FileText, ChevronDown, ChevronUp, Zap, ChevronLeft,
  Loader2, ExternalLink
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonService } from '@/services/lesson.service';
import { QuizData } from '@/schemas/lesson.schema';
import QuizModal from './QuizModal';

export default function LessonView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [courseData, setCourseData] = useState<any>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      if (courseData) setIsUpdatingVideo(true);
      else setIsInitialLoading(true);

      try {
        const [courseRes, quizRes] = await Promise.all([
          LessonService.getLessonDetails(courseId!),
          LessonService.getModuleQuiz(courseId!, lessonId ?? '')
        ]);

        setCourseData(courseRes);
        setQuizData(quizRes);

        // If no lessonId in URL, redirect to the first lesson
        if (!lessonId) {
          const firstLesson = courseRes.curriculum?.[0]?.lessons?.[0];
          if (firstLesson) {
            navigate(`/courses/${courseId}/lessons/${firstLesson.id}`, { replace: true });
            return;
          }
        }

        // Auto-open the accordion for the current (or first) module
        const currentMod = courseRes.curriculum?.find((m: any) =>
          m.lessons.some((l: any) => l.id === (lessonId ?? courseRes.curriculum?.[0]?.lessons?.[0]?.id))
        );
        if (currentMod) setActiveModule(currentMod.id);
        else if (courseRes.curriculum?.[0]) setActiveModule(courseRes.curriculum[0].id);

      } catch (err) {
        console.error("Failed to load content", err);
      } finally {
        setIsInitialLoading(false);
        setIsUpdatingVideo(false);
      }
    };
    loadContent();
  }, [lessonId, courseId]);

  if (isInitialLoading) return (
    <div className="h-screen flex items-center justify-center bg-[#F9FAFD]">
      <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
    </div>
  );

  // Use the matching lesson, falling back to the first lesson in the course
  const allLessons = courseData?.curriculum?.flatMap((m: any) => m.lessons) ?? [];
  const currentLesson = allLessons.find((l: any) => l.id === lessonId) ?? allLessons[0];

  console.log("Current lesson data:", quizData, currentLesson);
  return (
    <div className="min-h-screen bg-[#F9FAFD] flex flex-col text-left">
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-8 py-5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/courses/${courseId}`)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div className="h-8 w-px bg-slate-100" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {currentLesson?.title ?? "Lesson View"}
            </h2>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10 items-start">

          <div className="lg:col-span-8 space-y-10">
            <div className="relative pt-[56.25%] w-full bg-black rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
              {isUpdatingVideo ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                  <Loader2 className="animate-spin text-white mb-2" size={32} />
                </div>
              ) : (
                <video
                  key={currentLesson?.id}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  controls
                  autoPlay={false}
                  onEnded={() => setIsQuizOpen(true)}
                >
                  <source src={currentLesson?.videoUrl} type="video/mp4" />
                </video>
              )}
            </div>

            <div className="grid md:grid-cols-10 gap-12 pt-4">
              <div className="md:col-span-7 space-y-5">
                <div className="flex items-center gap-3 font-black text-[#4F39F6] uppercase text-sm tracking-widest">
                  <FileText size={20} /> Summary
                </div>
                <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                  {currentLesson?.summary}
                </p>
              </div>

              <div className="md:col-span-3 space-y-5">
                <div className="flex items-center gap-3 font-black text-[#4F39F6] uppercase text-sm tracking-widest">
                  <Zap size={20} /> Materials
                </div>
                <div className="flex flex-col gap-3">
                  {currentLesson?.materials?.map((mat: any) => (
                    <MaterialCard key={mat.id} title={mat.title} type={mat.type} meta={mat.meta} url={mat.url} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-8 sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900 mb-6 text-left">Course Curriculum</h3>
              <div className="space-y-2">
                {courseData?.curriculum?.map((mod: any) => (
                  <ModuleAccordionItem
                    key={mod.id}
                    module={mod}
                    isActive={activeModule === mod.id}
                    onHeaderClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                    currentLessonId={currentLesson?.id}
                    onLessonClick={(id: string) => navigate(`/courses/${courseId}/lessons/${id}`)}
                  />
                ))}
              </div>

              {quizData && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsQuizOpen(true)}
                    className="w-full flex items-center justify-between px-4 py-3.5 bg-[#4F39F6] hover:bg-indigo-700 active:scale-[0.98] text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-indigo-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <Zap size={16} fill="currentColor" />
                      <span>Take Module Quiz</span>
                    </div>
                    <span className="text-indigo-200 text-xs font-semibold">
                      {quizData.questions.length} {quizData.questions.length === 1 ? 'question' : 'questions'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {quizData && <QuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} data={quizData} />}
    </div>
  );
}

const ModuleAccordionItem = ({ module, isActive, onHeaderClick, currentLessonId, onLessonClick }: any) => (
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
            className={`flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-all ${currentLessonId === l.id ? "bg-[#EEF0FF] border-[#4F39F6] text-[#4F39F6]" : "border-transparent text-slate-600 hover:bg-slate-50"}`}
          >
            <PlayCircle size={16} fill={currentLessonId === l.id ? "currentColor" : "none"} />
            <span className="text-[12px] font-bold">{l.title}</span>
          </div>
        ))}
      </div>
    )}
  </div>
);

const MaterialCard = ({ title, meta, type, url }: { title: string; meta: string; type: string; url?: string }) => (
  <div
    onClick={() => url && window.open(url, '_blank', 'noopener,noreferrer')}
    className={`p-4 bg-white rounded-2xl border border-slate-100 flex items-center justify-between group transition-all ${url ? 'cursor-pointer hover:border-[#4F39F6]/30' : 'cursor-default'}`}
  >
    <div className="flex items-center gap-4 text-left font-bold">
      <div className={`p-2.5 rounded-xl ${type === 'pdf' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
        <FileText size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-800 leading-tight">{title}</p>
        <p className="text-[10px] text-slate-400 uppercase">{meta}</p>
      </div>
    </div>
    {url && (
      <ExternalLink size={15} className="shrink-0 text-slate-300 group-hover:text-[#4F39F6] transition-colors" />
    )}
  </div>
);
