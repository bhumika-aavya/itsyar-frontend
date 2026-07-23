import React, { useEffect, useState } from 'react';
import {
    ChevronLeft, BarChart2, BookOpen, Clock, CheckCircle2,
    PlayCircle, FileText, HelpCircle, ChevronDown, ChevronUp,
    Loader2, Zap, ShoppingCart, Lock
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { PaymentService } from '@/services/payment.service';
import { CourseDetail, CourseModule } from '@/services/course-detail.schema';
import { COURSE_LIFETIME_PRICE, CURRENCY } from '@/types/payment.types';

// --- Sub-component: Curriculum Accordion ---
const ModuleAccordion = ({ module, index, isOpen, onToggle }: { module: CourseModule, index: number, isOpen: boolean, onToggle: () => void }) => {
    const displayNum = module.order ?? index + 1;
    const items = module.items ?? [];
    console.log("Module items:", module); // Debugging log
    return (
        <div className="border border-slate-100 rounded-2xl overflow-hidden mb-4 bg-white shadow-sm">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-extrabold text-slate-400">
                        {displayNum < 10 ? `0${displayNum}` : displayNum}
                    </span>
                    <div>
                        <h4 className="font-bold text-slate-800">{module.title}</h4>
                        {module.duration && (
                            <span className="text-[11px] font-medium text-slate-400">{module.duration}</span>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </button>
            {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-5 space-y-4">
                    {module.summary && (
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed">{module.summary}</p>
                    )}
                    {items.length > 0 && items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between group cursor-pointer">
                            <div className="flex items-center gap-3">
                                {item.type === 'video' && <PlayCircle size={18} className="text-slate-300 group-hover:text-[#4F46E5]" />}
                                {item.type === 'reading' && <FileText size={18} className="text-slate-300 group-hover:text-[#4F46E5]" />}
                                {item.type === 'assessment' && <HelpCircle size={18} className="text-slate-300 group-hover:text-[#4F46E5]" />}
                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900">{item.title}</span>
                            </div>
                            <span className="text-[11px] font-bold text-slate-400">{item.duration || `${item.questions} Qs`}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function CourseDetailPage() {
    const { courseId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [openModule, setOpenModule] = useState<string | null>(null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                if (courseId) {
                    const data = await CourseService.getCourseById(courseId);
                    setCourse(data);

                    // Check if course has been purchased
                    const purchased = await PaymentService.getPurchaseByProduct(courseId, 'course');
                    setIsPurchased(purchased?.status === 'completed');
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
        // If purchased, go directly to lessons
        if (isPurchased) {
            navigate(`/courses/${courseId}/lessons/${course?.moduleId}`);
            return;
        }
        // If not purchased, redirect to checkout
        navigate(`/payments/course/${courseId}`);
    };

    const handleBuyCourse = () => {
        if (!courseId) return;
        setIsPurchaseLoading(true);
        navigate(`/payments/course/${courseId}`);
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#4F46E5]" />
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Course Details...</p>
            </div>
        );
    }

    if (!isPurchased) {
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(COURSE_LIFETIME_PRICE);

        return (
            <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 text-left animate-in fade-in duration-500">
                <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-slate-400 hover:text-[#4F46E5] font-bold text-xs transition-colors mb-6 uppercase">
                    <ChevronLeft size={16} /> Back to Courses
                </button>

                <div className="grid lg:grid-cols-5 gap-12 items-start">
                    {/* Left: Course details and lifetime benefits */}
                    <div className="lg:col-span-3 space-y-8">
                        <div className="space-y-4">
                            <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F46E5] text-[10px] font-extrabold uppercase tracking-widest">
                                {course?.category || 'Development'}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                                {course?.title}
                            </h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                {course?.description || 'Learn to bridge the gap between high-end design and high-performance frontend code.'}
                            </p>
                        </div>

                        {/* Lifetime Access Premium Badge */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6">
                            <div className="flex items-center gap-3 mb-3">
                                <Zap size={20} className="text-emerald-500" />
                                <h3 className="font-extrabold text-emerald-700">
                                    Lifetime Access Unlocked
                                </h3>
                            </div>
                            <p className="text-sm font-medium text-emerald-600">
                                Pay once. Own the course forever. Learn at your own pace with all future updates and resources included.
                            </p>
                            <ul className="mt-4 space-y-2">
                                {[
                                    'Full access to all video lectures and modules',
                                    'Verified course completion certificate',
                                    'Downloadable starter templates and source code projects',
                                    'Direct support from the instructor via forums',
                                ].map((feature, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm font-medium text-emerald-700">
                                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* What you'll learn */}
                        <div className="space-y-3">
                            <h3 className="font-extrabold text-slate-900">What you'll learn in this course</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {course?.takeaways?.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                        <CheckCircle2 size={16} className="text-[#4F46E5] shrink-0 mt-0.5" />
                                        {item}
                                    </div>
                                )) || [
                                    'Create beautiful frontend UI',
                                    'Write secure and optimized code',
                                    'Integrate Stripe payment gateways',
                                    'Understand full stack routing',
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                        <CheckCircle2 size={16} className="text-[#4F46E5] shrink-0 mt-0.5" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Payment Summary Panel */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#F9FAFF] border border-indigo-50 p-8 rounded-[40px] shadow-sm flex flex-col gap-6">
                            <div className="border-b border-indigo-50/50 pb-4">
                                <h3 className="font-extrabold text-slate-900 text-lg">Payment Summary</h3>
                                <p className="text-xs font-bold text-slate-400 mt-1">Review your order details</p>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-bold text-slate-600">
                                    <span>Lifetime Access License</span>
                                    <span>{formattedPrice}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-600">
                                    <span>Updates & Support</span>
                                    <span className="text-emerald-500">Free</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold text-slate-400 text-xs">
                                    <span>Sales Tax</span>
                                    <span>Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-indigo-50/50 pt-4 flex justify-between items-center mb-2">
                                <span className="font-extrabold text-slate-800">Total Price</span>
                                <span className="text-2xl font-extrabold text-slate-900">{formattedPrice}</span>
                            </div>

                            <button
                                onClick={handleBuyCourse}
                                disabled={isPurchaseLoading}
                                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isPurchaseLoading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Zap size={16} />
                                )}
                                Unlock lifetime access
                            </button>

                            <p className="text-[11px] font-bold text-slate-400 text-center">
                                Secure checkout processed via Stripe. 100% money-back guarantee.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto text-left pb-20">
            <button onClick={() => navigate('/courses')} className="flex items-center gap-2 text-slate-400 hover:text-[#4F46E5] font-bold text-xs transition-colors mb-6 uppercase">
                <ChevronLeft size={16} /> Back to Courses
            </button>

            {/* Hero Section */}
            <section className="grid lg:grid-cols-5 gap-12 items-start mb-16">
                <div className="lg:col-span-3 space-y-6">
                    <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F46E5] text-[10px] font-extrabold uppercase tracking-widest">
                        {course?.category}
                    </span>
                    <h1 className="text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">{course?.title}</h1>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">{course?.description || "Learn to bridge the gap between high-end design and high-performance frontend code for Palantir foundry."}</p>

                    <div className="flex flex-wrap gap-8 py-4">
                        <MetaItem icon={BarChart2} label="Level" val={course?.level} color="text-blue-500" bg="bg-blue-50" />
                        <MetaItem icon={BookOpen} label="Lessons" val={`${course?.modulesCount} Modules`} color="text-[#4F46E5]" bg="bg-indigo-50" />
                        <MetaItem icon={Clock} label="Duration" val={course?.duration} color="text-orange-500" bg="bg-orange-50" />
                    </div>

                    <button
                        disabled={isEnrolling}
                        onClick={handleEnroll}
                        className="bg-[#4F46E5] text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all transform active:scale-95 flex items-center gap-2"
                    >
                        {isPurchased ? "Continue Learning" : "Buy Lifetime Access →"}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 pt-6">
                            {course?.takeaways?.map((item, i) => (
                                <div key={i} className="flex items-start gap-3">
                                    <CheckCircle2 size={18} className="text-[#4F46E5] shrink-0 mt-0.5" />
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
                            {(course?.curriculum ?? []).map((module, idx) => (
                                <ModuleAccordion
                                    key={module.id}
                                    module={module}
                                    index={idx}
                                    isOpen={openModule === module.id}
                                    onToggle={() => setOpenModule(openModule === module.id ? null : module.id)}
                                />
                            ))}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-1 text-left">
                    <div className="bg-[#F9FAFF] border border-indigo-50 p-8 rounded-[40px] sticky top-28 shadow-sm flex flex-col gap-8">
                        {course?.isEnrolled && course?.courseCompletionPercentage !== undefined && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.2em]">Your Progress</span>
                                    <span className="text-[13px] font-extrabold text-[#4F46E5]">{course.courseCompletionPercentage}%</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-[#4F46E5] transition-all"
                                        style={{ width: `${course.courseCompletionPercentage}%` }}
                                    />
                                </div>
                            </div>
                        )}


                        {/* Purchase Status & CTA */}
                        {isPurchased ? (
                            <div className="flex items-center gap-2 px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
                                <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                                <div>
                                    <p className="text-sm font-extrabold text-emerald-700">Lifetime Access</p>
                                    <p className="text-[10px] font-bold text-emerald-500">Course unlocked</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-2xl">
                                    <Lock size={16} className="text-amber-500 shrink-0" />
                                    <p className="text-sm font-extrabold text-amber-700">Requires Purchase</p>
                                </div>
                                <button
                                    onClick={handleBuyCourse}
                                    disabled={isPurchaseLoading}
                                    className="w-full py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isPurchaseLoading ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <ShoppingCart size={16} />
                                    )}
                                    Buy Lifetime Access — ${COURSE_LIFETIME_PRICE}
                                </button>
                            </div>
                        )}

                        <h3 className="text-[11px] font-extrabold text-slate-900 uppercase tracking-[0.25em] leading-none">
                            Course Includes
                        </h3>
                        {/* List Container - Spacing between items */}
                        <div className="flex flex-col gap-7">
                            {course?.include?.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-4 group">
                                    <div className="mt-0.5 shrink-0">
                                        <Zap size={18} className="text-[#4F46E5] fill-[#4F46E5]/10" />
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