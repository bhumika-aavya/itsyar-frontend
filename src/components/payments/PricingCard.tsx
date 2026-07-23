import React from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface PricingCardProps {
    /** Title displayed at the top of the card */
    title: string;
    /** Price formatted as a string (e.g. "$49.99") */
    price: string;
    /** Short description shown below the price */
    description: string;
    /** List of feature strings with checkmarks */
    features: string[];
    /** CTA button label */
    ctaLabel: string;
    /** Whether this is the primary / featured card (gradient variant) */
    featured?: boolean;
    /** Loading state for the CTA */
    isLoading?: boolean;
    /** Disabled state for the CTA */
    disabled?: boolean;
    /** Emoji / icon shown beside the title */
    icon?: string;
    /** Called when the CTA button is clicked */
    onAction: () => void;
}

/**
 * PricingCard — A modern SaaS-style pricing card with gradient background
 * support, feature checklist, and an action CTA.
 *
 * Used in the Payment Packages page to display the two product offerings.
 */
export default function PricingCard({
    title,
    price,
    description,
    features,
    ctaLabel,
    featured = false,
    isLoading = false,
    disabled = false,
    icon = '🚀',
    onAction,
}: PricingCardProps) {
    return (
        <div
            className={`relative rounded-[32px] p-8 md:p-10 transition-all duration-300 flex flex-col ${featured
                    ? 'bg-gradient-to-br from-[#4F46E5] via-[#4338CA] to-[#3730A3] text-white shadow-2xl shadow-indigo-200 scale-[1.02] border border-indigo-300/20'
                    : 'bg-white border border-slate-100 text-slate-900 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-slate-200/60'
                }`}
        >
            {/* Featured badge */}
            {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-[#4F46E5] text-[10px] font-extrabold uppercase tracking-widest rounded-full shadow-lg">
                    Most Popular
                </div>
            )}

            {/* Icon */}
            <div className="text-4xl mb-4">{icon}</div>

            {/* Title */}
            <h3 className={`text-lg font-extrabold uppercase tracking-widest mb-1 ${featured ? 'text-indigo-200' : 'text-slate-400'}`}>
                {title}
            </h3>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-2">
                <span className={`text-5xl font-extrabold tracking-tight ${featured ? 'text-white' : 'text-slate-900'}`}>
                    {price}
                </span>
                <span className={`text-sm font-bold ${featured ? 'text-indigo-200' : 'text-slate-400'}`}>
                    / one-time
                </span>
            </div>

            {/* Description */}
            <p className={`text-sm font-medium mb-6 ${featured ? 'text-indigo-200' : 'text-slate-500'}`}>
                {description}
            </p>

            {/* Features */}
            <ul className="space-y-3 mb-8 flex-1">
                {features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                        <CheckCircle2
                            size={18}
                            className={`shrink-0 mt-0.5 ${featured ? 'text-emerald-300' : 'text-emerald-500'
                                }`}
                        />
                        <span
                            className={`text-sm font-semibold leading-snug ${featured ? 'text-white/90' : 'text-slate-600'
                                }`}
                        >
                            {feature}
                        </span>
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <button
                onClick={onAction}
                disabled={disabled || isLoading}
                className={`w-full py-4 rounded-2xl font-extrabold text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${featured
                        ? 'bg-white text-[#4F46E5] hover:bg-indigo-50 shadow-lg'
                        : 'bg-[#4F46E5] text-white hover:bg-[#4338CA] shadow-xl shadow-indigo-100'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
                {isLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    ctaLabel
                )}
            </button>
        </div>
    );
}

