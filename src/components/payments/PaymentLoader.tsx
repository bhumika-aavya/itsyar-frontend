import React from 'react';
import { Loader2, CreditCard } from 'lucide-react';

interface PaymentLoaderProps {
    /** Message to display below the spinner */
    message?: string;
}

/**
 * PaymentLoader — A centered loading state with a spinner and message,
 * used during Stripe Checkout redirect or payment status polling.
 */
export default function PaymentLoader({
    message = 'Processing your payment...',
}: PaymentLoaderProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in duration-500">
            {/* Animated spinner with card icon */}
            <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Loader2
                        size={36}
                        className="text-[#4F46E5] animate-spin"
                        strokeWidth={2.5}
                    />
                </div>
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-lg">
                    <CreditCard size={18} className="text-emerald-500" />
                </div>
            </div>

            {/* Message */}
            <div>
                <p className="text-lg font-extrabold text-slate-900 mb-1">
                    {message}
                </p>
                <p className="text-sm font-medium text-slate-400">
                    Please wait — do not close this page.
                </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                    <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[#4F46E5] animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                    />
                ))}
            </div>
        </div>
    );
}

