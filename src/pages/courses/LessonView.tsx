import React, { useState, useEffect } from 'react';
import {
  PlayCircle, FileText, ChevronDown, ChevronUp, Zap, ChevronLeft,
  Loader2, ExternalLink, Lock, Download,
  Notebook,
  NotebookText
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonService } from '@/services/lesson.service';
import { QuizData } from '@/schemas/lesson.schema';
import QuizModal from './QuizModal';
import { CourseService } from '@/services/course.service';

export default function LessonView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [courseData, setCourseData] = useState<any>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(0);

  useEffect(() => {
    const loadContent = async () => {
      if (courseData) setIsUpdatingVideo(true);
      else setIsInitialLoading(true);

      try {
        const [courseRes, quizRes] = await Promise.all([
          LessonService.getLessonDetails(courseId!), LessonService.getModuleQuiz(courseId!, lessonId ?? '')
        ]);

        setCourseData(courseRes);
        setQuizData(quizRes);

        if (!lessonId) {
          const firstLesson = courseRes.curriculum?.[0]?.lessons?.[0];
          if (firstLesson) {
            navigate(`/courses/${courseId}/lessons/${firstLesson.id}`, { replace: true });
            return;
          }
        }

        const currentMod = courseRes.curriculum?.find((m: any) =>
          m.lessons.some((l: any) => l.id === (lessonId ?? courseRes.curriculum?.[0]?.lessons?.[0]?.id))
        );
        if (currentMod) setActiveModule(currentMod.id);
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

  const allLessons = courseData?.curriculum?.flatMap((m: any) => m.lessons) ?? [];
  const currentLesson = allLessons.find((l: any) => l.id === lessonId) ?? allLessons[0];
  const isLastModule = courseData?.curriculum?.length > 0 &&
    activeModule === courseData.curriculum[courseData.curriculum.length - 1].id;

  const handleTimeUpdate = async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration;

    // 1. Only sync with API every 10 seconds or when finished to save server resources
    if (Math.abs(currentTime - lastSavedTime) > 10 || currentTime === duration) {
      setLastSavedTime(currentTime);

      const isFinished = (currentTime / duration) > 0.9; // 90% threshold

      try {
        await CourseService.updateProgress(courseId!, lessonId!, {
          playedSeconds: currentTime,
          totalSeconds: duration,
          isCompleted: isFinished
        });

        // 2. If finished, we might want to refresh the courseData 
        // to update the sidebar checkmarks and the progress bar
        if (isFinished && !currentLesson.isCompleted) {
          const updatedCourse = await CourseService.getCourseById(courseId!);
          setCourseData(updatedCourse);
        }
      } catch (err) {
        console.error("Failed to sync progress");
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFD] flex flex-col text-left font-sans">
      {/* 1. Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-100 px-8 py-5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/courses/${courseId}`)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div className="h-8 w-px bg-slate-100 hidden md:block" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {currentLesson?.title}
            </h2>
          </div>
        </div>
      </header>

      {/* 2. Main Layout */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* Left Column (Video/Summary) */}
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
                  onTimeUpdate={handleTimeUpdate}
                >
                  <source src={`${import.meta.env.VITE_IMAGE_URL}${currentLesson?.videoUrl}`} type="video/mp4" />
                </video>
              )}
            </div>

            {/* Info Grid (70% Summary / 30% Materials) */}
            <div className="grid md:grid-cols-10 gap-12 pt-4">
              <div className="md:col-span-6 space-y-5">
                <div className="flex items-center gap-3 font-black text-[#4F39F6] uppercase text-sm tracking-widest">
                  <FileText size={20} /> Summary
                </div>
                <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                  {currentLesson?.summary}
                </p>
              </div>

              <div className="md:col-span-4 space-y-5">
                <div className="flex items-center gap-3 font-black text-[#4F39F6] uppercase text-sm tracking-widest">
                  <Zap size={20} /> Course Materials
                </div>
                <div className="flex flex-col gap-3">
                  {currentLesson?.materials?.map((mat: any) => (
                    <MaterialCard
                      key={mat.id}
                      title={mat.title}
                      type={mat.type}
                      meta={mat.meta}
                      url={`${import.meta.env.VITE_IMAGE_URL}${mat.url}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (Curriculum Sidebar) */}
          <div className="lg:col-span-4 space-y-8 sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Course Curriculum</h3>

              {/* Progress Section */}
              <div className="px-2 mb-8">
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-[#4F39F6] transition-all duration-1000"
                    style={{ width: `${courseData?.course_completion_percentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {courseData?.course_completion_percentage || 0}% Complete
                </p>
              </div>

              {/* Accordion List */}
              <div className="space-y-2">
                {courseData?.curriculum?.map((mod: any) => (
                  <ModuleAccordionItem
                    key={mod.id}
                    module={mod}
                    isActive={activeModule === mod.id}
                    onHeaderClick={() => setActiveModule(activeModule === mod.id ? null : mod.id)}
                    currentLessonId={currentLesson?.id}
                    onLessonClick={(id: string) => navigate(`/courses/${courseId}/lessons/${id}`)}
                    onQuizClick={() => setIsQuizOpen(true)}
                  />
                ))}
              </div>

              {/* Footer Sidebar Button (Disabled look from Figma) */}
              {/* <div className="mt-8 px-2">
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-4 bg-[#DDE1E7] text-slate-400 rounded-2xl font-black text-sm cursor-not-allowed"
                >
                  <Lock size={18} />
                  <span>Take Quiz</span>
                </button>
              </div> */}
            </div>
          </div>
        </div>
      </main>

      {quizData &&
        <QuizModal
          isOpen={isQuizOpen}
          isFinalQuiz={isLastModule}
          onClose={() => setIsQuizOpen(false)}
          data={quizData} />}
    </div>
  );
}

// Sidebar Sub-component
const ModuleAccordionItem = ({ module, isActive, onHeaderClick, currentLessonId, onLessonClick, onQuizClick }: any) => (
  <div className={`rounded-xl overflow-hidden border transition-all duration-300 ${isActive ? "border-[#4F39F6]" : "border-slate-100"}`}>
    <button
      onClick={onHeaderClick}
      className={`w-full p-4 flex items-center justify-between transition-colors ${isActive ? "bg-[#4F39F6] text-white" : "bg-white text-slate-600 hover:bg-slate-50"
        }`}
    >
      <div className="text-left">
        <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
          Module {module.id}
        </p>
        <p className="text-xs font-bold leading-tight">{module.title}</p>
      </div>
      {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>

    {isActive && (
      <div className="bg-white">
        {module.lessons.map((lesson) => {
          const isCurrent = currentLessonId === lesson.id;
          console.log("Rendering lesson:", lesson, module.hasQuiz);
          return (
            <span key={lesson.id}>
              <div
                onClick={() => onLessonClick(lesson.id)}
                className={`relative flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4 ${isCurrent
                  ? "bg-[#EEF0FF] border-[#4F39F6] text-[#4F39F6]"
                  : "border-transparent text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <PlayCircle size={16} className={isCurrent ? "opacity-100" : "text-slate-400"} />
                <span className={`text-[12px] ${isCurrent ? "font-black" : "font-bold"}`}>{lesson.title}</span>
              </div>
              {lesson.hasQuiz && (
                <div
                  onClick={onQuizClick}
                  className={`relative flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4 ${isCurrent
                    ? "bg-[#EEF0FF] border-[#4F39F6] text-[#4F39F6]"
                    : "border-transparent text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  <FileText size={16} className="group-hover:text-[#4F39F6]" />
                  <span className="text-[12px] font-bold group-hover:text-slate-900">Module {module.id} Quiz</span>
                </div>
              )}
            </span>
          );
        })}
        {module.hasQuiz && (
          <div
            onClick={onQuizClick}
            className="flex items-center gap-4 p-4 text-slate-400 border-t border-slate-50 hover:bg-slate-50 cursor-pointer group"
          >
            <FileText size={16} className="group-hover:text-[#4F39F6]" />
            <span className="text-[12px] font-bold group-hover:text-slate-900">Module {module.id} Quiz</span>
          </div>
        )}
      </div>
    )}
  </div>
);
// Material Card Sub-component
const MaterialCard = ({ title, meta, type, url }: any) => (
  <div
    onClick={() => url && window.open(url, '_blank')}
    className="p-4 bg-[#F5F6FA] rounded-2xl border border-transparent flex items-center justify-between group cursor-pointer hover:bg-white hover:border-slate-200 transition-all"
  >
    <div className="flex items-center gap-4 text-left font-bold">
      <div className={`p-2.5 rounded-xl ${type === 'pdf' ? 'bg-red-50 text-red-400' : 'bg-blue-50 text-blue-400'}`}>
        <FileText size={20} />
      </div>
      <div>
        <p className="text-sm text-slate-800 leading-tight">{title}</p>
        <p className="text-[10px] text-slate-400 uppercase tracking-tighter">{meta}</p>
      </div>
    </div>
    <Download size={18} className="text-slate-300 group-hover:text-slate-600" />
  </div>
);