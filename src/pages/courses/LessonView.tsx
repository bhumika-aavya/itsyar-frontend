import React, { useState, useEffect } from 'react';
import {
  PlayCircle, FileText, ChevronDown, ChevronUp, Zap, ChevronLeft,
  Loader2, Download, CheckCircle2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { LessonService } from '@/services/lesson.service';
import { CourseService } from '@/services/course.service';

export default function LessonView() {
  const navigate = useNavigate();
  const { courseId, lessonId } = useParams();

  const [activeModule, setActiveModule] = useState<number | null>(null);
  const [courseData, setCourseData] = useState<any>(null);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(0);
  const [videoEnded, setVideoEnded] = useState(false);
  const hasRefreshedRef = React.useRef(false);

  useEffect(() => {
    const loadContent = async () => {
      if (courseData) setIsUpdatingVideo(true);
      else setIsInitialLoading(true);

      setVideoEnded(false);
      hasRefreshedRef.current = false;

      try {
        const courseRes = await LessonService.getLessonDetails(courseId!);
        setCourseData(courseRes);

        if (!lessonId) {
          const firstLesson = courseRes?.curriculum?.[0]?.lessons?.[0];
          if (firstLesson) {
            navigate(`/courses/${courseId}/lessons/${firstLesson.id}`, { replace: true });
            return;
          }
        }

        const currentMod = courseRes?.curriculum?.find((m: any) =>
          m?.lessons?.some((l: any) => l?.id === (lessonId ?? courseRes?.curriculum?.[0]?.lessons?.[0]?.id))
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
      <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
    </div>
  );

  // Filter out any undefined entries that come from modules with no lessons
  const allLessons = courseData?.curriculum?.flatMap((m: any) => m.lessons ?? []).filter(Boolean) ?? [];
  const currentLesson = allLessons.find((l: any) => l?.id === lessonId) ?? allLessons[0];
  const currentModule = courseData?.curriculum?.find((m: any) =>
    m?.lessons?.some((l: any) => l?.id === currentLesson?.id)
  );
  const currentLessonIndex = allLessons.findIndex((l: any) => l?.id === currentLesson?.id);
  const nextLesson = allLessons[currentLessonIndex + 1] ?? null;

  const handleVideoEnded = () => {
    setVideoEnded(true);
    if (nextLesson) {
      setTimeout(() => {
        navigate(`/courses/${courseId}/lessons/${nextLesson.id}`);
      }, 2000);
    }
  };

  const handleTimeUpdate = async (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const currentTime = video.currentTime;
    const duration = video.duration;
    if (!duration || isNaN(duration)) return;

    if (Math.abs(currentTime - lastSavedTime) > 10 || currentTime === duration) {
      setLastSavedTime(currentTime);
      const isCompleted = (currentTime / duration) > 0.9;

      try {
        await CourseService.updateProgress(courseId!, lessonId!, {
          playedSeconds: currentTime,
          totalSeconds: duration,
          isCompleted,
        });

        // Refresh sidebar progress exactly once per lesson, using the correct API
        if (isCompleted && !hasRefreshedRef.current) {
          hasRefreshedRef.current = true;
          const updatedCourse = await LessonService.getLessonDetails(courseId!);
          setCourseData(updatedCourse);
        }
      } catch (err) {
        console.error("Failed to sync progress");
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFD] flex flex-col text-left font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100 px-8 py-5">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/courses/${courseId}`)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
              <ChevronLeft size={24} />
            </button>
            <div className="h-8 w-px bg-slate-100 hidden md:block" />
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {currentLesson?.title}
            </h2>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto p-6 md:p-10">
        <div className="grid lg:grid-cols-12 gap-10 items-start">

          {/* Left Column */}
          <div className="lg:col-span-8 space-y-10">
            {/* Content Container */}
            {currentLesson?.type === 'topic-documentation' || currentLesson?.type === 'interview-questions' ? (
              <div className="w-full bg-white rounded-[40px] p-10 shadow-xl border border-slate-100 min-h-[400px]">
                <h3 className="text-2xl font-extrabold text-slate-900 mb-6">{currentLesson?.title}</h3>
                <div className="prose max-w-none text-slate-600">
                  <p className="text-lg font-medium leading-relaxed mb-6">
                    {currentLesson?.summary || "Documentation content goes here..."}
                  </p>
                  
                  {currentLesson?.type === 'interview-questions' ? (
                     <div className="space-y-6">
                       <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                         <h4 className="font-bold text-slate-800 mb-2">Q1. What is the SDLC?</h4>
                         <p className="text-sm">The Software Development Lifecycle is a process used by the software industry to design, develop and test high quality software.</p>
                       </div>
                       <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                         <h4 className="font-bold text-slate-800 mb-2">Q2. Why is documentation important?</h4>
                         <p className="text-sm">It provides a clear roadmap for engineers, aligns expectations with stakeholders, and ensures continuity in development.</p>
                       </div>
                     </div>
                  ) : (
                    <div className="space-y-4">
                      <p>In modern software engineering, thorough documentation is critical to the success of complex projects.</p>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Establishes clear requirements (PRD/FRD/TRD)</li>
                        <li>Facilitates seamless onboarding for new team members</li>
                        <li>Serves as a source of truth for technical architecture</li>
                      </ul>
                    </div>
                  )}

                  {nextLesson && (
                    <div className="mt-12 flex justify-end">
                      <button
                        onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                        className="flex items-center gap-3 px-8 py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all"
                      >
                         Next Resource <PlayCircle size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="relative pt-[56.25%] w-full bg-black rounded-[40px] overflow-hidden shadow-2xl border-3 border-white">
                {isUpdatingVideo ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Loader2 className="animate-spin text-white mb-2" size={36} />
                  </div>
                ) : (
                  <>
                    <video
                      key={currentLesson?.id}
                      className="absolute top-0 left-0 w-full h-full object-cover"
                      controls
                      autoPlay={false}
                      onEnded={handleVideoEnded}
                      onTimeUpdate={handleTimeUpdate}
                    >
                      <source src={`${import.meta.env.VITE_IMAGE_URL}${currentLesson?.videoUrl || "/mock-video.mp4"}`} type="video/mp4" />
                    </video>

                    {/* Video-ended overlay */}
                    {videoEnded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm">
                        <div className="text-center space-y-6 px-8">
                          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="text-white" size={32} />
                          </div>
                          <div>
                            <p className="text-white font-extrabold text-xl mb-1">Lesson Complete!</p>
                            <p className="text-white/60 text-sm font-medium">
                              {nextLesson
                                  ? "Loading next lesson…"
                                  : "You've finished this course!"}
                            </p>
                          </div>
                          {nextLesson ? (
                            <button
                              onClick={() => navigate(`/courses/${courseId}/lessons/${nextLesson.id}`)}
                              className="flex items-center justify-center mx-auto gap-3 px-10 py-4 bg-white text-slate-900 rounded-2xl font-extrabold text-sm hover:bg-slate-100 transition-all"
                            >
                              <PlayCircle size={18} /> Next Lesson
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid md:grid-cols-10 gap-12 pt-4">
              <div className="md:col-span-6 space-y-5">
                <div className="flex items-center gap-3 font-extrabold text-[#4F46E5] uppercase text-sm tracking-widest">
                  <FileText size={20} /> Summary
                </div>
                <p className="text-[15px] font-medium text-slate-500 leading-relaxed">
                  {currentLesson?.summary}
                </p>
              </div>

              <div className="md:col-span-4 space-y-5">
                <div className="flex items-center gap-3 font-extrabold text-[#4F46E5] uppercase text-sm tracking-widest">
                  <Zap size={20} /> Course Materials
                </div>
                <div className="flex flex-col gap-3">
                  {/* Actual materials if any */}
                  {currentLesson?.materials?.map((mat: any) => (
                    <MaterialCard
                      key={mat.id}
                      title={mat.title}
                      type={mat.type}
                      meta={mat.meta}
                      url={`${import.meta.env.VITE_IMAGE_URL}${mat.url}`}
                    />
                  ))}
                  
                  {/* Module Resources (Docs & Questions) */}
                  {currentModule?.lessons?.filter((l:any) => l.type === 'topic-documentation' || l.type === 'interview-questions').map((res: any) => (
                    <MaterialCard
                      key={res.id}
                      title={res.title}
                      type="pdf"
                      meta="Module Resource"
                      onClick={() => navigate(`/courses/${courseId}/lessons/${res.id}`)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column — Curriculum Sidebar */}
          <div className="lg:col-span-4 space-y-8 sticky top-32">
            <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-xl shadow-slate-200/40">
              <h3 className="text-lg font-bold text-slate-900 mb-4 px-2">Course Curriculum</h3>

              <div className="px-2 mb-8">
                <div className="w-full h-1.5 bg-slate-100 rounded-full mb-2 overflow-hidden">
                  <div
                    className="h-full bg-[#4F46E5] transition-all duration-1000"
                    style={{ width: `${courseData?.courseCompletionPercentage || 0}%` }}
                  />
                </div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {courseData?.courseCompletionPercentage || 0}% Complete
                </p>
              </div>

              <div className="space-y-2">
                {courseData?.curriculum?.flatMap((mod: any) => mod.items).map((topic: any) => (
                  <ModuleAccordionItem
                    key={topic.id}
                    module={topic}
                    isActive={activeModule === topic.id}
                    onHeaderClick={() => setActiveModule(activeModule === topic.id ? null : topic.id)}
                    currentLessonId={currentLesson?.id}
                    onLessonClick={(id: string) => navigate(`/courses/${courseId}/lessons/${id}`)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Sidebar Sub-component
const ModuleAccordionItem = ({ module, isActive, onHeaderClick, currentLessonId, onLessonClick }: any) => (
  <div className={`rounded-xl overflow-hidden border transition-all duration-300 ${isActive ? "border-[#4F46E5]" : "border-slate-100"}`}>
    <button
      onClick={onHeaderClick}
      className={`w-full p-4 flex items-center justify-between transition-colors ${isActive ? "bg-[#4F46E5] text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
    >
      <div className="text-left">
        <p className={`text-[9px] font-extrabold uppercase tracking-widest mb-0.5 ${isActive ? "text-indigo-100" : "text-slate-400"}`}>
          Topic
        </p>
        <p className="text-xs font-bold leading-tight">{module.title}</p>
      </div>
      {isActive ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
    </button>

    {isActive && (
      <div className="bg-white">
        {(module.subItems ?? []).filter((l: any) => l.type.includes('video') || l.type.includes('doc') || l.type.includes('interview')).map((lesson: any) => {
          const isCurrent = currentLessonId === lesson.id;
          return (
            <div
              key={lesson.id}
              onClick={() => onLessonClick(lesson.id)}
              className={`relative flex items-center gap-4 p-4 cursor-pointer transition-all border-l-4 ${isCurrent
                ? "bg-[#EEF0FF] border-[#4F46E5] text-[#4F46E5]"
                : "border-transparent text-slate-600 hover:bg-slate-50"
                }`}
            >
              {lesson.type === 'topic-documentation' || lesson.type === 'interview-questions' ? (
                 <FileText size={16} className={isCurrent ? "opacity-100" : "text-slate-400"} />
              ) : (
                 <PlayCircle size={16} className={isCurrent ? "opacity-100" : "text-slate-400"} />
              )}
              <span className={`text-[12px] ${isCurrent ? "font-extrabold" : "font-bold"}`}>{lesson.title}</span>
            </div>
          );
        })}
      </div>
    )}
  </div>
);

// Material Card Sub-component
const MaterialCard = ({ title, meta, type, url, onClick }: any) => (
  <div
    onClick={onClick ? onClick : () => url && window.open(url, '_blank')}
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
