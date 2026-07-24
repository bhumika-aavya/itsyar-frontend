import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, BookOpen, ArrowRight } from 'lucide-react';
import PricingCard from '@/components/payments/PricingCard';
import {
    HACKATHON_SUBSCRIPTION_PRICE,
    COURSE_LIFETIME_PRICE,
    HACKATHON_SUBSCRIPTION_FEATURES,
    COURSE_FEATURES,
    CURRENCY,
} from '@/types/payment.types';

/**
 * PaymentPackagesPage — The pricing/landing page for payment packages.
 *
 * Displays two pricing cards side-by-side:
 * 1. Hackathon Organizer Subscription
 * 2. Course Lifetime Access
 *
 * Each card navigates to its respective checkout flow on CTA click.
 */
export default function PaymentPackagesPage() {
    const navigate = useNavigate();
    const [hackathonLoading, setHackathonLoading] = useState(false);
    const [courseLoading, setCourseLoading] = useState(false);

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(amount);

    const hackathonPrice = formatPrice(HACKATHON_SUBSCRIPTION_PRICE);
    const coursePrice = formatPrice(COURSE_LIFETIME_PRICE);

    const handleHackathonAction = () => {
        setHackathonLoading(true);
        // Navigate to the hackathon selection or directly to a specific hackathon's
        // payment page. For the MVP, provide a way to select or enter a hackathon.
        navigate('/organizer');
    };

    const handleCourseAction = () => {
        setCourseLoading(true);
        navigate('/courses');
    };

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-16 text-left animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center mb-12 md:mb-16 space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-extrabold text-[#4F46E5] uppercase tracking-widest">
                    <Zap size={14} />
                    Simple & Transparent Pricing
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                    Choose Your Package
                </h1>
                <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto">
                    Pick the plan that fits your needs. All payments are processed
                    securely through Stripe.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {/* Card 1: Hackathon Organizer Subscription */}
                <PricingCard
                    title="Hackathon Organizer"
                    price={hackathonPrice}
                    description="Publish your hackathon and reach participants worldwide."
                    features={HACKATHON_SUBSCRIPTION_FEATURES}
                    ctaLabel="Purchase Subscription"
                    icon="🚀"
                    onAction={handleHackathonAction}
                    isLoading={hackathonLoading}
                />

                {/* Card 2: Course Lifetime Access */}
                <PricingCard
                    title="Course Lifetime Access"
                    price={coursePrice}
                    description="Get lifetime access to your selected course and all future updates."
                    features={COURSE_FEATURES}
                    ctaLabel="Buy Course"
                    icon="📚"
                    featured
                    onAction={handleCourseAction}
                    isLoading={courseLoading}
                />
            </div>

            {/* Trust indicators */}
            <div className="mt-16 text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="1" y="4" width="22" height="16" rx="2" />
                        <path d="M1 10h22" />
                    </svg>
                    Secure payments powered by Stripe
                </div>
                <div className="flex items-center justify-center gap-6 text-xs font-bold text-slate-300">
                    <span>256-bit SSL Encrypted</span>
                    <span>•</span>
                    <span>PCI Compliant</span>
                    <span>•</span>
                    <span>Instant Access</span>
                </div>
            </div>
        </div>
    );
}

