import React from 'react';
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { PurchaseType } from '@/types/payment.types';

interface SuccessCardProps {
    /** The type of product that was purchased */
    productType: PurchaseType;
    /** Product title */
    productTitle: string;
    /** Order / Purchase ID */
    orderId: string;
    /** Formatted amount (e.g. "$49.99") */
    amount: string;
    /** Called when the primary action button is clicked */
    onAction: () => void;
    /** Loading state for the action button */
    isActionLoading?: boolean;
}

/**
 * SuccessCard — An animated success card displayed after a completed Stripe
 * payment. Shows a checkmark animation, purchase details, and a contextual
 * CTA (Publish Hackathon or Start Learning).
 */
export default function SuccessCard({
    productType,
    productTitle,
    orderId,
    amount,
    onAction,
    isActionLoading = false,
}: SuccessCardProps) {
    const actionLabel =
        productType === 'hackathon_subscription'
            ? 'Publish Hackathon'
            : 'Start Learning';

    const subtitle =
        productType === 'hackathon_subscription'
            ? 'Your hackathon is now ready to be published!'
            : 'Your course is now unlocked. Start learning today!';

    return (
        <div className="max-w-lg mx-auto text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
            {/* Success Animation */}
            <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center animate-in zoom-in-95 duration-700">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2
                            size={48}
                            className="text-emerald-500 animate-in zoom-in-95 duration-1000"
                            strokeWidth={2.5}
                        />
                    </div>
                </div>
            </div>

            {/* Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Payment Successful! 🎉
                </h1>
                <p className="text-slate-500 font-medium">{subtitle}</p>
            </div>

            {/* Purchase Details */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 text-left">
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Product
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">
                        {productTitle}
                    </span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Order ID
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                        {orderId}
                    </span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Amount Paid
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600">
                        {amount}
                    </span>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={onAction}
                disabled={isActionLoading}
                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isActionLoading ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        {actionLabel}
                        <ArrowRight size={16} />
                    </>
                )}
            </button>
        </div>
    );
}

