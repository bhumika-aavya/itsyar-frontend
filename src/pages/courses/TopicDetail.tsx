import React, { useEffect, useState } from 'react';
import {
    ChevronLeft, BarChart2, BookOpen, Clock, CheckCircle2,
    PlayCircle, FileText, HelpCircle, ChevronDown, ChevronUp,
    Loader2, Zap, ShoppingCart, Lock, BrainCircuit, Sparkles
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { PaymentService } from '@/services/payment.service';
import { CourseDetail, CourseModule, ApiModuleDetail } from '@/services/course-detail.schema';
import { COURSE_LIFETIME_PRICE, CURRENCY } from '@/types/payment.types';

import InAppPdfModal from '@/components/pdf/InAppPdfModal';
import { PdfService } from '@/services/pdf.service';
import QuizModal from '@/pages/courses/QuizModal';
import { QuizAiService } from '@/services/quiz-ai.service';
import { toast } from 'sonner';

interface TopicAccordionProps {
    topic: any;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    moduleId: string;
    onOpenPdf?: (url: string, title: string, subtitle: string) => void;
    onOpenQuiz?: (topic: any) => void;
}

// --- Sub-component: Curriculum Accordion ---
const TopicAccordion: React.FC<TopicAccordionProps> = ({
    topic,
    index,
    isOpen,
    onToggle,
    moduleId,
    onOpenPdf,
    onOpenQuiz,
}) => {
    const displayNum = index + 1;
    const topicHasQuiz = Boolean(topic.isQuiz ?? topic.isquiz ?? topic.is_quiz ?? false);
    const baseSubItems = (topic.assets ?? topic.subItems ?? []).filter((it: any) => {
        if (!topicHasQuiz && (it.type === 'topic-quiz' || it.type === 'quiz')) {
            return false;
        }
        return true;
    });

    // Only display Step 05: Topic Quiz & Knowledge Assessment when topic has quiz enabled
    const subItems = [...baseSubItems];
    if (topicHasQuiz && !subItems.some((it: any) => it.type === 'topic-quiz' || it.type === 'quiz')) {
        subItems.push({
            type: 'topic-quiz',
            title: 'Topic Quiz & Knowledge Assessment',
            duration: '10-15 mins'
        });
    }

    const navigate = useNavigate();
    const { courseId } = useParams();

    const topicIdVal = topic.topic_id || topic.topicId || `t-${index}`;

    return (
        <div className="border border-slate-100 dark:border-[#2e303a] rounded-2xl overflow-hidden bg-white dark:bg-[#16171d] shadow-sm dark:shadow-none transition-all duration-300">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 dark:hover:bg-[#1c1d24]/50 transition-colors">
                <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-[#252630] flex items-center justify-center text-[11px] font-extrabold text-slate-400 dark:text-slate-500">
                        {displayNum < 10 ? `0${displayNum}` : displayNum}
                    </span>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{topic.title || topic.topic_title}</h4>
                        {topic.duration && (
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{topic.duration}</span>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </button>
            {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-50 dark:border-[#2e303a] pt-5">
                    {topic.topic_summary ? (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">{topic.topic_summary}</p>
                    ) : (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-4">Master the art of writing PRDs, defining user personas, and scoping MVPs.</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subItems.length > 0 && subItems.map((item: any, assetIdx: number) => {
                            const isQuiz = item.type === 'topic-quiz' || item.type === 'quiz';
                            const isDoc = !isQuiz && (item.type === 'topic-documentation' || item.type === 'interview-questions' || item.type === 'documentation' || item.type === 'interview_pdf' || item.type === 'interview');
                            const hasUrl = Boolean(item.url);

                            const handleAssetClick = async () => {
                                if (isQuiz) {
                                    onOpenQuiz?.(topic);
                                    return;
                                }

                                if (isDoc) {
                                    let targetUrl = item.url;
                                    const docType = item.type.includes('interview') ? 'interview' : 'documentation';
                                    if (!targetUrl && courseId && moduleId && topicIdVal) {
                                        targetUrl = await PdfService.resolvePdfUrl(courseId, moduleId, topicIdVal, docType);
                                    }
                                    const docTitle = item.title || (docType === 'interview' ? 'Interview Questions' : 'Topic Documentation');
                                    const subtitle = `${topic.title || topic.topic_title || 'Topic'} • Documentation`;

                                    const params = new URLSearchParams({
                                        url: targetUrl || '',
                                        title: docTitle,
                                        subtitle: subtitle,
                                        courseId: courseId || '',
                                        moduleId: moduleId || '',
                                        topicId: topicIdVal,
                                        type: docType,
                                    });

                                    // Open in new tab in full screen
                                    window.open(`/pdf-viewer?${params.toString()}`, '_blank');
                                } else {
                                    navigate(`/course/${courseId}/module/${moduleId}/topic/${topicIdVal}?asset=${item.type}`);
                                }
                            };

                            return (
                                <div
                                    key={assetIdx}
                                    onClick={handleAssetClick}
                                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer group transition-all ${isQuiz
                                        ? "bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50/80 dark:hover:bg-amber-950/40 border-amber-200/70 dark:border-amber-800/40 hover:border-amber-400 dark:hover:border-amber-600"
                                        : "bg-slate-50 dark:bg-[#1C1D24] hover:bg-[#EEF0FF] dark:hover:bg-[#1e1b4b]/40 border-slate-100 dark:border-white/5 hover:border-[#4F46E5] dark:hover:border-[#4F46E5]"
                                        }`}
                                >
                                    <div className="relative">
                                        <div className={`p-2.5 rounded-lg bg-white dark:bg-[#16171d] shadow-sm dark:shadow-none transition-all ${isQuiz
                                            ? "text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 group-hover:shadow-md"
                                            : "text-slate-400 group-hover:text-[#4F46E5] group-hover:shadow-md"
                                            }`}>
                                            {isQuiz ? (
                                                <BrainCircuit size={18} />
                                            ) : isDoc ? (
                                                <FileText size={18} />
                                            ) : (
                                                <PlayCircle size={18} />
                                            )}
                                        </div>
                                        <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs border border-white dark:border-[#16171d] transition-all duration-200 ${isQuiz
                                            ? "bg-amber-500 group-hover:bg-amber-600 text-white"
                                            : "bg-slate-200 dark:bg-[#252630] group-hover:bg-[#4F46E5] text-slate-600 dark:text-slate-300 group-hover:text-white"
                                            }`}>
                                            {assetIdx + 1}
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isQuiz ? "text-amber-600 dark:text-amber-400" : "text-[#4F46E5] dark:text-[#818cf8] opacity-60 group-hover:opacity-100"
                                                }`}>
                                                Step 0{assetIdx + 1}
                                            </span>
                                            {isQuiz && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40">
                                                    AI Graded
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold truncate leading-tight ${isQuiz ? "text-slate-900 dark:text-slate-100 group-hover:text-amber-700 dark:group-hover:text-amber-300" : "text-slate-700 dark:text-slate-200 group-hover:text-[#4F46E5] dark:group-hover:text-[#818cf8]"
                                            }`}>
                                            {item.title}
                                        </span>
                                        {item.duration && (
                                            <span className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                                                {item.duration}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function TopicDetailPage() {
    const { courseId, moduleId } = useParams();
    const navigate = useNavigate();

    const [course, setCourse] = useState<CourseDetail | null>(null);
    const [apiModuleDetail, setApiModuleDetail] = useState<ApiModuleDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [openModule, setOpenModule] = useState<string | null>(moduleId || null);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isPurchaseLoading, setIsPurchaseLoading] = useState(false);
    const [pdfModalState, setPdfModalState] = useState<{
        isOpen: boolean;
        url: string;
        title: string;
        subtitle: string;
    }>({
        isOpen: false,
        url: '',
        title: '',
        subtitle: '',
    });

    const [quizModalState, setQuizModalState] = useState<{
        isOpen: boolean;
        isLoading?: boolean;
        data: any;
        topicId: string;
        topicTitle: string;
    }>({
        isOpen: false,
        isLoading: false,
        data: null,
        topicId: '',
        topicTitle: '',
    });

    const handleOpenPdf = (url: string, title: string, subtitle: string) => {
        setPdfModalState({
            isOpen: true,
            url,
            title,
            subtitle,
        });
    };

    const handleOpenTopicQuiz = async (topic: any) => {
        const topicIdVal = topic.topic_id || topic.topicId || '';
        const topicTitle = topic.title || topic.topic_title || 'Topic Assessment';
        const targetModuleId = moduleId || activeModule?.moduleId || (activeModule as any)?.id || topic.moduleId || topic.module_id || '';

        // Open modal immediately with loading state
        setQuizModalState({
            isOpen: true,
            isLoading: true,
            data: null,
            topicId: topicIdVal,
            topicTitle: topicTitle,
        });

        try {
            if (courseId && topicIdVal) {
                const quizRes = await QuizAiService.getTopicQuiz(courseId, targetModuleId, topicIdVal);
                const quizData = quizRes?.quiz || quizRes?.data || quizRes;
                const questions = quizData?.questions || quizRes?.questions;

                if (questions && questions.length > 0) {
                    setQuizModalState({
                        isOpen: true,
                        isLoading: false,
                        data: {
                            ...quizData,
                            title: quizData.title || `${topicTitle} Knowledge Assessment`,
                            path: `Course Assessment • ${topicTitle}`,
                            questions: questions,
                            timeLimit: quizData.timeLimit || quizData.time_limit_minutes || 15,
                            passingThreshold: quizData.passingThreshold || quizData.passing_score_percentage || 70,
                        },
                        topicId: topicIdVal,
                        topicTitle: topicTitle,
                    });
                    return;
                }
            }
        } catch (e) {
            console.warn("[TopicDetail] Could not fetch quiz from API, using fallback quiz", e);
        }

        // Fallback default quiz structure if not yet created in DB
        setQuizModalState({
            isOpen: true,
            isLoading: false,
            data: {
                title: `${topicTitle} Knowledge Assessment`,
                path: `Course Assessment • ${topicTitle}`,
                timeLimit: 15,
                passingThreshold: 70,
                questions: [
                    {
                        id: `q_sample_1_${topicIdVal}`,
                        type: 'QA',
                        text: `Explain the fundamental concepts, data pipeline architecture, and implementation best practices of ${topicTitle}.`,
                        points: 2
                    },
                    {
                        id: `q_sample_2_${topicIdVal}`,
                        type: 'SINGLE_CHOICE',
                        text: `What is the primary architectural concept introduced in ${topicTitle}?`,
                        options: [
                            "Core functional data architecture and pipeline transformations",
                            "Deprecated legacy manual batch scripting",
                            "Unmonitored unencrypted database transactions",
                            "Single-node volatile caching storage"
                        ],
                        points: 1
                    },
                    {
                        id: `q_sample_3_${topicIdVal}`,
                        type: 'TRUE_FALSE',
                        text: `True or False: The principles in ${topicTitle} enforce data validation and reproducible pipeline workflows.`,
                        points: 1
                    }
                ]
            },
            topicId: topicIdVal,
            topicTitle: topicTitle,
        });
    };

    useEffect(() => {
        const fetchCourse = async () => {
            setLoading(true);
            try {
                if (courseId) {
                    const data = await CourseService.getCourseById(courseId);
                    setCourse(data);

                    // Fetch module topics with assets
                    if (moduleId) {
                        const moduleData = await CourseService.getModuleTopics(courseId, moduleId);
                        setApiModuleDetail(moduleData);
                        if (moduleData?.topics?.length) {
                            const firstTopicId = moduleData.topics[0].topic_id || moduleData.topics[0].topicId;
                            setOpenModule(firstTopicId);
                        }
                    }

                    // Check if course has been purchased
                    const productData = await PaymentService.getPurchaseByProduct(courseId, 'course');
                    setIsPurchased(productData.purchase?.status === 'completed');
                    if (productData.price !== undefined) {
                        setCourse(prev => prev ? { ...prev, price: productData.price } : prev);
                    }
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

    const hasAccess = isPurchased || course?.hasPaid;

    const handleEnroll = async () => {
        if (!courseId) return;

        // Scenario 1: Already paid and enrolled
        if (hasAccess && course?.isEnrolled) {
            navigate(`/courses/${courseId}/lessons/${course?.moduleId}`);
            return;
        }

        // Scenario 2: Paid but not yet enrolled
        if (hasAccess && !course?.isEnrolled) {
            setIsEnrolling(true);
            try {
                await CourseService.enrollInCourse(courseId);
                setCourse(prev => prev ? { ...prev, isEnrolled: true } : prev);
                navigate(`/courses/${courseId}/lessons/${course?.moduleId}`);
            } catch (error) {
                console.error("Failed to enroll in course", error);
            } finally {
                setIsEnrolling(false);
            }
            return;
        }

        // Scenario 3: Not paid
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
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Topic Details...</p>
            </div>
        );
    }

    const activeModule = course?.curriculum?.find((m: any) => m.moduleId === moduleId || m.id === moduleId);
    const shouldShowPayment = !hasAccess;

    const getPriceVal = (c: any) => {
        if (!c) return COURSE_LIFETIME_PRICE;
        if (c.price !== undefined && c.price !== null) return Number(c.price);
        if (c.pricing !== undefined && c.pricing !== null) return Number(c.pricing);
        return COURSE_LIFETIME_PRICE;
    };

    if (shouldShowPayment) {
        const price = getPriceVal(course);
        const formattedPrice = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(price);

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
                                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
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
        <div className="min-h-screen pb-20 relative overflow-hidden font-sans text-left">
            {/* Header Section */}
            <div className="relative z-10">
                <div className="max-w-5xl">
                    <button onClick={() => navigate(`/courses/${courseId}`)} className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold text-xs transition-colors mb-3 uppercase tracking-widest cursor-pointer">
                        <ChevronLeft size={16} /> Back to Module Overview
                    </button>

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6">
                        <div className="relative max-w-4xl">
                            <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-[10px] font-extrabold uppercase tracking-widest mb-3">
                                Module {activeModule?.order || ''}
                            </span>
                            <h2 className="md:text-[50px] text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                                {activeModule?.title || course?.title}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-medium text-[17px] mt-2 leading-relaxed">
                                {activeModule?.summary || course?.description}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="max-w-5xl pt-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-1">
                        <h3 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Module Topics
                        </h3>
                    </div>
                    <div className="flex flex-col gap-4">
                        {(apiModuleDetail?.topics ?? []).map((topic: any, idx: number) => (
                            <TopicAccordion
                                key={topic.topic_id || topic.topicId || idx}
                                topic={topic}
                                moduleId={activeModule?.moduleId || ''}
                                index={idx}
                                isOpen={openModule === (topic.topic_id || topic.topicId)}
                                onToggle={() => setOpenModule(openModule === (topic.topic_id || topic.topicId) ? null : (topic.topic_id || topic.topicId))}
                                onOpenPdf={handleOpenPdf}
                                onOpenQuiz={handleOpenTopicQuiz}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* In-App PDF Viewer Modal */}
            <InAppPdfModal
                isOpen={pdfModalState.isOpen}
                url={pdfModalState.url}
                title={pdfModalState.title}
                subtitle={pdfModalState.subtitle}
                onClose={() => setPdfModalState((prev) => ({ ...prev, isOpen: false }))}
            />

            {/* Topic Knowledge Assessment / Quiz Modal */}
            <QuizModal
                isOpen={quizModalState.isOpen}
                isLoading={quizModalState.isLoading}
                onClose={() => setQuizModalState((prev) => ({ ...prev, isOpen: false }))}
                data={quizModalState.data}
                courseId={courseId || ''}
                moduleId={moduleId || activeModule?.moduleId}
                topicId={quizModalState.topicId}
                onQuizComplete={() => {
                    // Update progress or state when quiz is completed
                }}
            />
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