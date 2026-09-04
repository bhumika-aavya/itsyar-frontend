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

// --- Sub-component: Curriculum Accordion ---
const TopicAccordion = ({
    topic,
    index,
    isOpen,
    onToggle,
    moduleId,
    onOpenPdf,
    onOpenQuiz,
}: {
    topic: any;
    index: number;
    isOpen: boolean;
    onToggle: () => void;
    moduleId: string;
    onOpenPdf?: (url: string, title: string, subtitle: string) => void;
    onOpenQuiz?: (topic: any) => void;
}) => {
    const displayNum = index + 1;
    const baseSubItems = topic.assets ?? topic.subItems ?? [];
    
    // Ensure Step 05: Topic Quiz & Knowledge Assessment is present
    const subItems = [...baseSubItems];
    if (!subItems.some((it: any) => it.type === 'topic-quiz' || it.type === 'quiz')) {
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
        <div className="border border-slate-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all duration-300">
            <button onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[11px] font-extrabold text-slate-400">
                        {displayNum < 10 ? `0${displayNum}` : displayNum}
                    </span>
                    <div>
                        <h4 className="font-bold text-slate-800">{topic.title || topic.topic_title}</h4>
                        {topic.duration && (
                            <span className="text-[11px] font-medium text-slate-400">{topic.duration}</span>
                        )}
                    </div>
                </div>
                {isOpen ? <ChevronUp className="text-slate-400" size={20} /> : <ChevronDown className="text-slate-400" size={20} />}
            </button>
            {isOpen && (
                <div className="px-5 pb-5 border-t border-slate-50 pt-5">
                    {topic.topic_summary ? (
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4">{topic.topic_summary}</p>
                    ) : (
                        <p className="text-[13px] text-slate-500 font-medium leading-relaxed mb-4">Master the art of writing PRDs, defining user personas, and scoping MVPs.</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {subItems.length > 0 && subItems.map((item: any, assetIdx: number) => {
                            const isQuiz = item.type === 'topic-quiz' || item.type === 'quiz';
                            const isDoc = !isQuiz && (item.type === 'topic-documentation' || item.type === 'interview-questions' || item.type === 'documentation' || item.type === 'interview_pdf' || item.type === 'interview');

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
                                    className={`flex items-center gap-4 p-4 border rounded-xl cursor-pointer group transition-all ${
                                        isQuiz
                                            ? "bg-amber-50/40 hover:bg-amber-50/80 border-amber-200/70 hover:border-amber-400"
                                            : "bg-slate-50 hover:bg-[#EEF0FF] border-slate-100 hover:border-[#4F46E5]"
                                    }`}
                                >
                                    <div className="relative">
                                        <div className={`p-2.5 rounded-lg bg-white shadow-sm transition-all ${
                                            isQuiz
                                                ? "text-amber-600 group-hover:text-amber-700 group-hover:shadow-md"
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
                                        <div className={`absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center shadow-xs border border-white transition-all duration-200 ${
                                            isQuiz
                                                ? "bg-amber-500 group-hover:bg-amber-600 text-white"
                                                : "bg-slate-200 group-hover:bg-[#4F46E5] text-slate-600 group-hover:text-white"
                                        }`}>
                                            {assetIdx + 1}
                                        </div>
                                    </div>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${
                                                isQuiz ? "text-amber-600" : "text-[#4F46E5] opacity-60 group-hover:opacity-100"
                                            }`}>
                                                Step 0{assetIdx + 1}
                                            </span>
                                            {isQuiz && (
                                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-700">
                                                    AI Graded
                                                </span>
                                            )}
                                        </div>
                                        <span className={`text-sm font-bold truncate leading-tight ${
                                            isQuiz ? "text-slate-900 group-hover:text-amber-700" : "text-slate-700 group-hover:text-[#4F46E5]"
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
        data: any;
        topicId: string;
        topicTitle: string;
    }>({
        isOpen: false,
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

        try {
            if (courseId && topicIdVal) {
                const quizRes = await QuizAiService.getTopicQuizStudent(courseId, topicIdVal);
                if (quizRes && quizRes.quiz && quizRes.quiz.questions && quizRes.quiz.questions.length > 0) {
                    setQuizModalState({
                        isOpen: true,
                        data: quizRes.quiz,
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
            data: {
                title: `${topicTitle} Assessment`,
                path: `Course Assessment • ${topicTitle}`,
                timeLimit: 15,
                passingThreshold: 70,
                questions: [
                    {
                        id: `q_sample_1_${topicIdVal}`,
                        type: 'mcq',
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
                        id: `q_sample_2_${topicIdVal}`,
                        type: 'true_false',
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
                            <p className="text-xs text-emerald-600 font-medium leading-relaxed">
                                Get instant access to all video modules, interactive walkthroughs, interview question banks, AI assessments, and downloadable resources with no monthly fees.
                            </p>
                        </div>
                    </div>

                    {/* Right: Checkout card */}
                    <div className="lg:col-span-2">
                        <div className="bg-white border border-indigo-100 rounded-[32px] p-8 shadow-xl shadow-indigo-100/50 space-y-6">
                            <div className="flex items-baseline justify-between border-b border-indigo-50/50 pb-6">
                                <div>
                                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">One-time payment</span>
                                    <span className="text-3xl font-extrabold text-slate-900">{formattedPrice}</span>
                                </div>
                                <span className="text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                    Lifetime Access
                                </span>
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
            <button onClick={() => navigate(`/courses/${courseId}`)} className="flex items-center gap-2 text-slate-400 hover:text-[#4F46E5] font-bold text-xs transition-colors mb-6 uppercase">
                <ChevronLeft size={16} /> Back to Module Overview
            </button>

            {/* Hero Section */}
            <section className="mb-16">
                <div className="w-full space-y-6">
                    <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F46E5] text-[10px] font-extrabold uppercase tracking-widest">
                        Module {activeModule?.order || ''}
                    </span>
                    <h2 className="text-2xl font-bold text-slate-900">{activeModule?.title || course?.title}</h2>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed w-full max-w-none">{activeModule?.summary || course?.description}</p>
                </div>
            </section>

            <section className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-slate-900">Module Topics</h2>
                </div>
                <div className="flex flex-col gap-4 max-w-4xl">
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
            </section>

            {/* In-App PDF Viewer Modal */}
            <InAppPdfModal
                isOpen={pdfModalState.isOpen}
                url={pdfModalState.url}
                title={pdfModalState.title}
                subtitle={pdfModalState.subtitle}
                onClose={() => setPdfModalState((prev) => ({ ...prev, isOpen: false }))}
            />

            {/* Topic Quiz Assessment Modal */}
            {quizModalState.isOpen && (
                <QuizModal
                    isOpen={quizModalState.isOpen}
                    onClose={() => setQuizModalState(prev => ({ ...prev, isOpen: false }))}
                    data={quizModalState.data}
                    isFinalQuiz={false}
                    courseId={courseId || ''}
                    topicId={quizModalState.topicId}
                    moduleId={moduleId}
                />
            )}
        </div>
    );
}
