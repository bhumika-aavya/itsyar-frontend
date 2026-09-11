import React, { useEffect, useState } from 'react';
import {
    ChevronLeft, Loader2, PlayCircle, Code, BookOpen
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { CourseDetail, CourseModule } from '@/services/course-detail.schema';
import { capitalizeTitle } from '@/lib/utils';

// --- Sub-component: Module Grid Card ---
const ModuleGridCard = ({ module, index }: { module: CourseModule, index: number }) => {
    const displayNum = module.order ?? index + 1;
    const items = module.items ?? [];
    const navigate = useNavigate();
    const { courseId } = useParams();

    return (
        <div className="bg-white/80 dark:bg-[#16171d]/80 backdrop-blur-xl border border-slate-200/60 dark:border-[#2e303a]/60 rounded-[24px] p-6 flex flex-col justify-between hover:shadow-md hover:shadow-indigo-500/10 dark:hover:shadow-md dark:hover:shadow-indigo-500/10 hover:border-indigo-200 dark:hover:border-indigo-900/60 transition-all duration-300 group cursor-pointer hover:-translate-y-0.5 relative hover:z-30"
            onClick={() => navigate(`/courses/${courseId}/modules/${module.id}`)}
        >
            <div>
                {/* Header */}
                <div className="flex items-center gap-3.5 mb-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/50 dark:border-indigo-900/30 group-hover:scale-105 transition-transform duration-300 shadow-inner">
                        {index % 2 === 0 ? <BookOpen size={22} className="opacity-80" /> : <Code size={22} className="opacity-80" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base md:text-[17px] leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                            Module {displayNum}: {capitalizeTitle(module.title)}
                        </h3>
                    </div>
                </div>

                {/* Summary with tooltip on hover */}
                {module.summary?.trim() && (
                    <div className="relative group/summary mb-4">
                        <p className="text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed font-medium line-clamp-2 cursor-default">
                            {module.summary.length > 80 ? module.summary.slice(0, 80) + "..." : module.summary}
                        </p>
                        {module.summary.length > 80 && (
                            <div className="absolute top-full left-0 mt-2 z-50 hidden group-hover/summary:block w-72 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
                                <div className="relative bg-white dark:bg-[#1c1d24] text-slate-700 dark:text-slate-200 text-xs font-medium rounded-2xl p-3.5 shadow-2xl shadow-slate-900/15 dark:shadow-black/60 leading-relaxed border border-slate-200/80 dark:border-[#2e303a]">
                                    <div className="absolute bottom-full left-4 -mb-px border-4 border-transparent border-b-white dark:border-b-[#1c1d24]" />
                                    {module.summary}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Topics List Box */}
                <div className="bg-slate-50 dark:bg-[#1C1D24] rounded-2xl p-3.5 mb-4 border border-slate-100 dark:border-white/5 min-h-[148px] flex flex-col justify-between">
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-2.5">Topics</h4>
                        <ul className="space-y-2 pl-3">
                            {(module.topics || []).slice(0, 4).map((topic: string, i: number) => (
                                <li key={i} className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate">
                                    {i + 1}. {capitalizeTitle(topic)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    {(module.topics || []).length > 4 && (
                        <p className="text-[11px] font-semibold text-slate-400 mt-2 pl-3">
                            + {(module.topics || []).length - 4} more topics
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom: Progress Bar & Button */}
            <div>
                {/* Progress Bar (if active/completed) */}
                <div className="border-t border-slate-100 dark:border-[#2e303a] pt-3.5 mb-3.5">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Progress</span>
                        <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">{module.progress || 0}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#252630] rounded-full overflow-hidden mb-2 shadow-inner">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 relative"
                            style={{ width: `${module.progress || 0}%` }}
                        >
                            <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                        </div>
                    </div>
                    {/* <div className="flex justify-between items-center text-[11px] font-bold text-slate-400 dark:text-slate-500">
                        <span>{Math.round((items.length * (module.progress || 0)) / 100)} Topics</span>
                        <span>{items.length} Topics</span>
                    </div> */}
                </div>

                {/* Action Button */}
                <button
                    onClick={() => navigate(`/courses/${courseId}/modules/${module.id}`)}
                    className="w-full py-3 border-2 border-indigo-50 dark:border-indigo-950 text-indigo-600 dark:text-indigo-400 bg-white/50 dark:bg-[#1c1d24]/50 font-extrabold text-sm rounded-xl hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 active:scale-[0.98] shadow-sm"
                >
                    View Module
                </button>
            </div>
        </div>
    );
};

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                if (courseId) {
                    const data = await CourseService.getCourseById(courseId);
                    setCourse(data);
                }
            } catch (error) {
                console.error("Error loading course", error);
                navigate('/courses');
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, navigate]);

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Module Details...</p>
            </div>
        );
    }

    return (
        <div className="bg-slate-50/50 min-h-screen pb-20 relative overflow-hidden font-sans text-left">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[450px] bg-gradient-to-b from-indigo-50/40 via-purple-50/15 to-transparent dark:from-indigo-950/20 dark:via-transparent -z-10" />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-300/5 dark:bg-indigo-950/10 blur-[120px] pointer-events-none -z-10" />
            <div className="absolute top-[10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-300/5 dark:bg-purple-950/10 blur-[120px] pointer-events-none -z-10" />

            {/* Header Section */}
            <div className="relative">
                <div className="max-w-7xl">
                    <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs transition-colors mb-3 uppercase tracking-widest cursor-pointer">
                        <ChevronLeft size={16} /> Back to Courses
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
                        <div className="relative max-w-2xl">
                            <h2 className="md:text-[50px] font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                                Curriculum Overview
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-[17px] mt-2 leading-relaxed">
                                Explore all {course?.modulesCount} modules, progress, and upcoming topics in a beautifully structured learning path.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl pt-4 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {(course?.curriculum ?? []).map((module, idx) => (
                        <ModuleGridCard
                            key={module.id}
                            module={module}
                            index={idx}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
