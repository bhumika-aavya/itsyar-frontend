import React from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface FailedCardProps {
    /** Optional error message to display */
    errorMessage?: string;
    /** Called when the "Retry Payment" button is clicked */
    onRetry: () => void;
    /** Called when the "Return to Dashboard" button is clicked */
    onReturn: () => void;
    /** Loading state for the retry button */
    isRetryLoading?: boolean;
}

/**
 * FailedCard — An error state card displayed after a failed Stripe payment.
 * Shows an alert icon, the error details, and two actions: retry or return.
 */
export default function FailedCard({
    errorMessage = 'Your payment could not be processed. Please try again or use a different payment method.',
    onRetry,
    onReturn,
    isRetryLoading = false,
}: FailedCardProps) {
    return (
        <div className="max-w-lg mx-auto text-center space-y-8 animate-in fade-in duration-500">
            {/* Error Animation */}
            <div className="flex justify-center">
                <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle
                            size={48}
                            className="text-red-500"
                            strokeWidth={2}
                        />
                    </div>
                </div>
            </div>

            {/* Title */}
            <div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
                    Payment Failed
                </h1>
                <p className="text-slate-500 font-medium max-w-sm mx-auto">
                    {errorMessage}
                </p>
            </div>

            {/* Error Details Card */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <div className="text-left">
                        <p className="text-sm font-bold text-red-700 mb-1">
                            Transaction Declined
                        </p>
                        <p className="text-xs font-medium text-red-600 leading-relaxed">
                            {errorMessage}
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button
                    onClick={onRetry}
                    disabled={isRetryLoading}
                    className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRetryLoading ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} />
                            Retry Payment
                        </>
                    )}
                </button>

                <button
                    onClick={onReturn}
                    className="w-full py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-extrabold text-sm hover:bg-slate-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <ArrowLeft size={16} />
                    Return to Dashboard
                </button>
            </div>
        </div>
    );
}

