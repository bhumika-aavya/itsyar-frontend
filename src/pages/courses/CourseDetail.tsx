import React, { useEffect, useState } from 'react';
import {
    ChevronLeft, BarChart2, BookOpen, Clock, CheckCircle2,
    PlayCircle, FileText, HelpCircle, ChevronDown, ChevronUp,
    Award, Infinity, Smartphone, Zap
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseDetail, CourseModule } from '@/schemas/course-detail.schema';
import { CourseService } from '@/services/course.service';

// --- Sub-component: Curriculum Accordion ---
const ModuleAccordion = ({ module, isOpen, onToggle }: { module: CourseModule, isOpen: boolean, onToggle: () => void }) => {
    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden mb-4 bg-white shadow-sm transition-all">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors"
            >
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
                            <span className="text-[11px] font-bold text-slate-400">
                                {item.duration || `${item.questions} Questions`}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CourseDetail() {
          // Dummy data strictly following the Zod schema
    const courses: CourseDetail = {
        id: "python-101",
        title: "Python Programming for Beginners",
        category: "DEVELOPMENT",
        description: "Master the fundamentals of Python with hands-on projects and real-world exercises. Start your coding journey with the most popular language today.",
        longDescription: "Python is the world's most popular language for data science, web development, and automation. This comprehensive course is designed for absolute beginners who want to build a rock-solid foundation in software engineering through Python programming.",
        level: "Beginner",
        modulesCount: 12,
        duration: "6 Weeks",
        thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
        takeaways: [
            "Master syntax, variables, and data structures from scratch.",
            "Build 5 real-world portfolio projects using Python.",
            "Learn object-oriented programming (OOP) principles.",
            "Automate repetitive tasks with custom scripts."
        ],
        includes: [
            { icon: 'Award', text: 'Certificate of completion' },
            { icon: 'BookOpen', text: '12 modules & 48 lessons' },
            { icon: 'Infinity', text: 'Lifetime access to updates' },
            { icon: 'Smartphone', text: 'Access on mobile and TV' }
        ],
        curriculum: [
            {
                id: "m1",
                order: 1,
                title: "Introduction to Python",
                items: [
                    { id: "l1", title: "The History & Use Cases of Python", type: "video", duration: "12:45" },
                    { id: "l2", title: "Setting up your Development Environment", type: "video", duration: "15:20" },
                    { id: "l3", title: "Module 1 Assessment", type: "assessment", questions: 10 },
                ]
            },
            { id: "m2", order: 2, title: "Variables and Data Types", items: [] },
            { id: "m3", order: 3, title: "Control Flow & Logic", items: [] }
        ]
    };
    const { courseId } = useParams();
    const navigate = useNavigate();
     const [course, setCourse] = useState<any>(courses);
  const [loading, setLoading] = useState(true);
    const [openModule, setOpenModule] = useState<string | null>("m1");

  
//      useEffect(() => {
//     const fetchCourse = async () => {
//       try {
//         if (courseId) {
//           const data = await CourseService.getCourseById(courseId);
//           setCourse(data);
//           // Default open the first module
//           if (data.curriculum.length > 0) setOpenModule(data.curriculum[0].id);
//         }
//       } catch (error) {
//         console.error("Error fetching course details", error);
//         navigate('/courses'); // Redirect back if course not found
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchCourse();
//   }, [courseId]);


    return (
        <div className="max-w-6xl mx-auto text-left pb-20">
            {/* Navigation */}
            <button
                onClick={() => navigate('/courses')}
                className="flex items-center gap-2 text-slate-400 hover:text-[#4F39F6] font-bold text-xs transition-colors mb-6"
            >
                <ChevronLeft size={16} /> BACK TO COURSES
            </button>

            {/* Hero Section */}
            <section className="grid lg:grid-cols-5 gap-12 items-start mb-16">
                <div className="lg:col-span-3 space-y-6">
                    <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F39F6] text-[10px] font-black uppercase tracking-widest">
                        {course.category}
                    </span>
                    <h1 className="text-5xl font-black text-slate-900 leading-tight tracking-tight">
                        {course.title}
                    </h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
                        {course.description}
                    </p>

                    <div className="flex flex-wrap gap-8 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-500 rounded-xl"><BarChart2 size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Level</p>
                                <p className="text-sm font-bold text-slate-800">{course.level}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 text-[#4F39F6] rounded-xl"><BookOpen size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lessons</p>
                                <p className="text-sm font-bold text-slate-800">{course.modulesCount} Modules</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-orange-50 text-orange-500 rounded-xl"><Clock size={20} /></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duration</p>
                                <p className="text-sm font-bold text-slate-800">{course.duration}</p>
                            </div>
                        </div>
                    </div>

                    <button className="bg-[#4F39F6] text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-[#3f2dd1] transition-all transform active:scale-95">
                        Enroll Now
                    </button>
                </div>

                <div className="lg:col-span-2">
                    <div className="rounded-[40px] overflow-hidden shadow-2xl shadow-slate-200 border-8 border-white">
                        <img src={course.thumbnail} alt={course.title} className="w-full aspect-video object-cover" />
                    </div>
                </div>
            </section>

            <div className="grid lg:grid-cols-3 gap-12">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-12">
                    {/* About Section */}
                    <section className="space-y-6">
                        <h2 className="text-2xl font-bold text-slate-900">About this course</h2>
                        <p className="text-[15px] text-slate-500 leading-relaxed font-medium">
                            {course.longDescription}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-2">
                            {course.takeaways.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#4F39F6] shrink-0 mt-0.5" />
                                    <span className="text-[14px] font-semibold text-slate-600 leading-snug">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Curriculum */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-bold text-slate-900">Curriculum</h2>
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">12 Modules • 48 Lectures</span>
                        </div>
                        <div>
                            {course.curriculum.map((module) => (
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

                {/* Sidebar widget */}
                <div className="lg:col-span-1">
                    <div className="bg-[#F9FAFF] border border-indigo-50 p-8 rounded-[32px] sticky top-28">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em] mb-8">Course Includes</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4 text-slate-600">
                                <Award size={20} className="text-[#4F39F6]" />
                                <span className="text-[13px] font-bold">Certificate of completion</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <PlayCircle size={20} className="text-[#4F39F6]" />
                                <span className="text-[13px] font-bold">12 modules & 48 lessons</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <Infinity size={20} className="text-[#4F39F6]" />
                                <span className="text-[13px] font-bold">Lifetime access to updates</span>
                            </div>
                            <div className="flex items-center gap-4 text-slate-600">
                                <Smartphone size={20} className="text-[#4F39F6]" />
                                <span className="text-[13px] font-bold">Access on mobile and TV</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}