import React, { useEffect, useState } from 'react';
import {
    ChevronLeft, BarChart2, BookOpen, Clock, CheckCircle2,
    PlayCircle, FileText, HelpCircle, ChevronDown, ChevronUp,
    Loader2,
    Zap
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { CourseDetail, CourseModule } from '@/services/course-detail.schema';

// --- Sub-component: Curriculum Accordion (Remains same) ---
const ModuleAccordion = ({ module, isOpen, onToggle }: { module: CourseModule, isOpen: boolean, onToggle: () => void }) => (
    <div className="border border-slate-100 rounded-2xl overflow-hidden mb-4 bg-white shadow-sm">
        <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-black text-slate-400">
                    {module.order < 10 ? `0${module.order}` : module.order}
                </span>
                <h4 className="font-bold text-slate-800">{module.title}</h4>
            </div>
            {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
        </button>
        {isOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-slate-50 pt-5">
                {module.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                        <div className="flex items-center gap-3">
                            {item.type === 'video' && <PlayCircle size={18} className="text-slate-300 group-hover:text-[#4F39F6]" />}
                            {item.type === 'reading' && <FileText size={18} className="text-slate-300 group-hover:text-[#4F39F6]" />}
                            {item.type === 'assessment' && <HelpCircle size={18} className="text-slate-300 group-hover:text-[#4F39F6]" />}
                            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{item.title}</span>
                        </div>
                        <span className="text-[11px] font-bold text-slate-400">{item.duration || `${item.questions} Qs`}</span>
                    </div>
                ))}
            </div>
        )}
    </div>
);

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [openModule, setOpenModule] = useState<string | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                if (courseId) {
                    const data = await CourseService.getCourseById(courseId);
                    console.log("Fetched course data:", data);
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

    const handleEnroll = async () => {
        if (!courseId) return;
        if (course?.isEnrolled) {
            navigate(`/courses/${courseId}/lessons/${course?.moduleId}`);
            return;
        }
        setIsEnrolling(true);
        try {
            await CourseService.enrollInCourse(courseId);
            // After enrollment, send to the first lesson
            navigate(`/courses/${courseId}/lessons/intro`);
        } catch (error) {
            console.error("Enrollment failed", error);
        } finally {
            setIsEnrolling(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#4F39F6]" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Course Details...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto text-left pb-20">
            <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-slate-400 hover:text-[#4F39F6] font-bold text-xs transition-colors mb-6 uppercase">
                <ChevronLeft size={16} /> Back to Courses
            </button>

            {/* Hero Section */}
            <section className="grid lg:grid-cols-5 gap-12 items-start mb-16">
                <div className="lg:col-span-3 space-y-6">
                    <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F39F6] text-[10px] font-black uppercase tracking-widest">
                        {course?.category}
                    </span>
                    <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">{course?.title}</h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">{course?.description || "Learn to bridge the gap between high-end design and high-performance frontend code for Palantir foundry."}</p>

                    <div className="flex flex-wrap gap-8 py-4">
                        <MetaItem icon={BarChart2} label="Level" val={course?.level} color="text-blue-500" bg="bg-blue-50" />
                        <MetaItem icon={BookOpen} label="Lessons" val={`${course?.modulesCount} Modules`} color="text-[#4F39F6]" bg="bg-indigo-50" />
                        <MetaItem icon={Clock} label="Duration" val={course?.duration} color="text-orange-500" bg="bg-orange-50" />
                    </div>

                    <button
                        disabled={isEnrolling}
                        onClick={handleEnroll}
                        className="bg-[#4F39F6] text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-[#3f2dd1] transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        {course?.isEnrolled ? "View Course" : isEnrolling ? <Loader2 className="animate-spin" size={20} /> : "Enroll Now"}
                    </button>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200 border-8 border-white">
                        <img src={`${import.meta.env.VITE_IMAGE_URL}${course?.thumbnail}`} alt={course?.title} className="w-full aspect-video object-cover" />
                    </div>
                </div>
            </section>
            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">About this course</h2>
                        <p className="text-[15px] text-slate-500 leading-relaxed font-medium">{course?.longDescription}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-2">
                            {course?.takeaways && JSON.parse(course?.takeaways)?.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#4F39F6] shrink-0 mt-0.5" />
                                    <span className="text-[14px] font-semibold text-slate-600 leading-snug">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900">Curriculum</h2>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{course?.modulesCount} Modules</span>
                        </div>
                        <div>
                            {[{
                                id: "m1",
                                order: 1,
                                title: "Introduction to Palantir Foundry",
                                items: [
                                    { id: "l1", title: "The History & Use Cases of Python", type: "video", duration: "12:45" },
                                    { id: "l2", title: "Setting up your Development Environment", type: "video", duration: "15:20" },
                                    { id: "l3", title: "Module 1 Assessment", type: "assessment", questions: 10 },
                                ]
                            },
                            ].map((module) => (
                                <ModuleAccordion
                                    key={module.id}
                                    module={module}
                                    isOpen={openModule === module.id}
                                    onToggle={() => setOpenModule(openModule === module.id ? null : module.id)}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1 text-left">
                    <div className="bg-[#F9FAFF] border border-indigo-50 p-8 rounded-[40px] sticky top-28 shadow-sm flex flex-col gap-8">
                        <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.25em] leading-none">
                            Course Includes
                        </h3>
                        {/* List Container - Spacing between items */}
                        <div className="flex flex-col gap-7">
                            {course?.include?.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className="mt-0.5 shrink-0">
                                        <Zap size={18} className="text-[#4F39F6] fill-[#4F39F6]/10" />
                                    </div>
                                    <span className="text-[14px] font-bold text-slate-600 leading-snug">
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for cleaner hero section
const MetaItem = ({ icon: Icon, label, val, color, bg }: any) => (
    <div className="flex items-center gap-3">
        <div className={`p-2.5 ${bg} ${color} rounded-xl`}><Icon size={20} /></div>
        <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className="text-sm font-bold text-slate-800">{val}</p>
        </div>
    </div>
);