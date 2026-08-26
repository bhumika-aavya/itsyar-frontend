import React, { useEffect, useState } from 'react';
import {
    ChevronLeft, Loader2, PlayCircle, Code, BookOpen
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { CourseDetail, CourseModule } from '@/services/course-detail.schema';

// --- Sub-component: Module Grid Card ---
const ModuleGridCard = ({ module, index }: { module: CourseModule, index: number }) => {
    const displayNum = module.order ?? index + 1;
    const items = module.items ?? [];
    const navigate = useNavigate();
    const { courseId } = useParams();

    return (
        <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[24px] p-7 flex flex-col hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-200 transition-all duration-300 group cursor-pointer hover:-translate-y-1"
            onClick={() => navigate(`/courses/${courseId}/modules/${module.id}`)}
        >
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100/50 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                    {index % 2 === 0 ? <BookOpen size={24} className="opacity-80" /> : <Code size={24} className="opacity-80" />}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-extrabold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">
                            Module {displayNum}: {module.title}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Summary */}
            <p className="text-slate-500 text-sm leading-relaxed mb-8 flex-1 font-medium">
                {module.summary}
            </p>

            {/* Topics List Box */}
            <div className="bg-slate-50 rounded-xl p-5 mb-6 flex-1 border border-slate-100">
                <h4 className="font-bold text-slate-900 text-sm mb-3">Topics</h4>
                <ul className="space-y-2">
                    {(module.topics || []).slice(0, 4).map((topic: string, i: number) => (
                        <li key={i} className="text-sm font-medium text-slate-600 truncate">
                            {topic}
                        </li>
                    ))}
                    {(module.topics || []).length > 6 && (
                        <li className="text-sm font-medium text-slate-400 mt-2">
                            + {(module.topics || []).length - 6} more topics
                        </li>
                    )}
                </ul>
            </div>

            {/* Progress Bar (if active/completed) */}
            <div className="mt-4 pt-2 border-t border-slate-100">
                <div className="flex justify-between items-end mb-3">
                    <div>
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">Progress</span>
                    </div>
                    <span className="text-sm font-extrabold text-indigo-600">{module.progress || 0}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100/80 rounded-full overflow-hidden mb-3 shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 relative"
                        style={{ width: `${module.progress || 0}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                    </div>
                </div>
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                    <span>{Math.round((items.length * (module.progress || 0)) / 100)} Topics</span>
                    <span>{items.length} Topics</span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={() => navigate(`/courses/${courseId}/modules/${module.id}`)}
                className="w-full py-3.5 border-2 border-indigo-50 text-indigo-600 bg-white/50 font-extrabold text-sm rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all duration-300 active:scale-[0.98] shadow-sm"
            >
                View Module
            </button>
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
        <div className="bg-slate-50/50 min-h-screen pb-20 relative overflow-hidden font-sans">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-50/90 via-purple-50/40 to-transparent -z-10" />
            <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-300/10 blur-[100px] pointer-events-none -z-10" />
            <div className="absolute top-[10%] right-[-5%] w-[50%] h-[50%] rounded-full bg-purple-300/10 blur-[100px] pointer-events-none -z-10" />

            {/* Header Section */}
            <div className="bg-[#F9FAFD] border-b border-slate-200 pt-10 px-6 md:px-10">
                <div className="max-w-7xl mx-auto">
                    <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 font-bold text-xs transition-colors mb-6 uppercase tracking-widest">
                        <ChevronLeft size={16} /> Back to Courses
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
                        <div className="relative max-w-2xl">
                            <h1 className="text-4xl md:text-[56px] font-extrabold text-slate-900 tracking-tight leading-[1.1]">
                                Curriculum Overview
                            </h1>
                            <p className="text-slate-500 font-medium text-[19px] mt-4 leading-relaxed">
                                Explore all {course?.modulesCount} modules, progress, and upcoming topics in a beautifully structured learning path.
                            </p>
                        </div>

                        {/* Global Action Button */}
                        <button
                            onClick={() => navigate(`/courses/${courseId}/lessons/${course?.curriculum?.[0]?.items?.[0]?.id || 1}`)}
                            className="shrink-0 flex items-center gap-3 px-8 py-4.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-extrabold text-[15px] shadow-xl shadow-indigo-200/50 hover:shadow-2xl hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300 active:scale-[0.98]"
                        >
                            <PlayCircle size={22} className="opacity-90" /> Continue Learning
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-7xl mx-auto px-6 md:px-5 pt-5">
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
