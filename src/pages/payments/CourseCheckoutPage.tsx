import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, BookOpen, Clock, BarChart2, CheckCircle2, Zap } from 'lucide-react';
import PaymentSummary from '@/components/payments/PaymentSummary';
import CheckoutButton from '@/components/payments/CheckoutButton';
import { PaymentService } from '@/services/payment.service';
import { CourseService } from '@/services/course.service';
import { Course } from '@/schemas/course.schema';
import { COURSE_LIFETIME_PRICE, CURRENCY } from '@/types/payment.types';
import StripeCheckoutModal from '@/components/payments/StripeCheckoutModal';

/**
 * CourseCheckoutPage — Displays course details and a checkout CTA
 * for purchasing lifetime access to a course.
 *
 * Route: /payments/course/:courseId
 */
export default function CourseCheckoutPage() {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [isPurchased, setIsPurchased] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingSession, setPendingSession] = useState<any>(null);

    useEffect(() => {
        const load = async () => {
            if (!courseId) return;
            setLoading(true);
            try {
                // Try to load from the catalog
                const courses = await CourseService.getAllCourses();
                const found = courses.find((c) => c.id === courseId);
                setCourse(found ?? null);

                // Check if already purchased
                const purchased = await PaymentService.getPurchaseByProduct(
                    courseId,
                    'course'
                );
                setIsPurchased(purchased?.status === 'completed');
            } catch (err) {
                console.error('Failed to load course', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [courseId]);

    const handleCheckout = async () => {
        if (!courseId || !course) return;
        setCheckoutLoading(true);
        setCheckoutError(null);

        try {
            const session = await PaymentService.purchaseCourse(
                courseId,
                course.title
            );

            if (session.sessionUrl.startsWith('http')) {
                window.location.href = session.sessionUrl;
            } else {
                setPendingSession(session);
                setIsModalOpen(true);
            }
        } catch (err) {
            setCheckoutError(
                'Failed to create checkout session. Please try again.'
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setIsModalOpen(false);
        if (pendingSession && course) {
            navigate(
                `/payments/success?session_id=${pendingSession.sessionId}&product_id=${courseId}&product_type=course&product_title=${encodeURIComponent(
                    course.title
                )}&amount=${COURSE_LIFETIME_PRICE}`
            );
        }
    };

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(amount);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
            </div>
        );
    }

    if (!course) {
        return (
            <div className="max-w-lg mx-auto text-center py-20">
                <p className="text-slate-400 font-bold text-lg">Course not found</p>
                <button
                    onClick={() => navigate('/courses')}
                    className="mt-4 px-6 py-3 bg-[#4F46E5] text-white rounded-2xl font-bold text-sm"
                >
                    Browse Courses
                </button>
            </div>
        );
    }

    const totalPrice = formatPrice(COURSE_LIFETIME_PRICE);

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 text-left animate-in fade-in duration-500">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#4F46E5] font-bold text-sm mb-8 hover:opacity-80 transition-all"
            >
                <ChevronLeft size={18} />
                Back to Course
            </button>

            <div className="grid lg:grid-cols-5 gap-12 items-start">
                {/* Left: Course Details */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                                <BookOpen size={24} className="text-orange-500" />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-500">
                                    Course Purchase
                                </p>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    {course.title}
                                </h1>
                            </div>
                        </div>

                        {course.tag && (
                            <span className="inline-block px-3 py-1 rounded-md bg-indigo-50 text-[#4F46E5] text-[10px] font-extrabold uppercase tracking-widest">
                                {course.tag}
                            </span>
                        )}

                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            {course.description}
                        </p>
                    </div>

                    {/* Course Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                            <BarChart2 size={18} className="text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Instructor
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">
                                    {course.instructor}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                            <Clock size={18} className="text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Duration
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">
                                    {course.duration}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Lifetime Access Badge */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Zap size={20} className="text-emerald-500" />
                            <h3 className="font-extrabold text-emerald-700">
                                Lifetime Access
                            </h3>
                        </div>
                        <p className="text-sm font-medium text-emerald-600">
                            One-time payment. Access the course forever, including all
                            future updates and new content.
                        </p>
                        <ul className="mt-4 space-y-2">
                            {[
                                'Full access to all modules and lessons',
                                'Course completion certificate',
                                'Downloadable resources & code',
                                'All future updates included',
                            ].map((feature, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-sm font-medium text-emerald-700"
                                >
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* What you'll learn */}
                    <div className="space-y-3">
                        <h3 className="font-extrabold text-slate-900">What you'll learn</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {[
                                'Build real-world projects',
                                'Industry best practices',
                                'Hands-on coding exercises',
                                'Expert instructor guidance',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm font-medium text-slate-600">
                                    <CheckCircle2 size={16} className="text-[#4F46E5] shrink-0 mt-0.5" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Payment Summary */}
                <div className="lg:col-span-2">
                    <PaymentSummary
                        title={course.title}
                        items={[
                            { label: 'Course Access', value: totalPrice },
                            { label: 'Lifetime Updates', value: '$0.00' },
                            { label: 'Tax', value: 'Calculated at checkout' },
                        ]}
                        total={totalPrice}
                    >
                        <CheckoutButton
                            label={isPurchased ? 'Already Purchased' : 'Buy Lifetime Access'}
                            isLoading={checkoutLoading}
                            disabled={checkoutLoading || isPurchased}
                            error={checkoutError}
                            onClick={handleCheckout}
                        />
                    </PaymentSummary>
                </div>
            </div>

            {course && (
                <StripeCheckoutModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={COURSE_LIFETIME_PRICE}
                    productTitle={course.title}
                />
            )}
        </div>
    );
}

