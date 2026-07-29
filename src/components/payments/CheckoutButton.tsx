import React from 'react';
import { Loader2, ShoppingCart, AlertCircle } from 'lucide-react';

interface CheckoutButtonProps {
    /** Label shown on the button */
    label?: string;
    /** Loading state while redirecting to Stripe */
    isLoading?: boolean;
    /** Disabled state */
    disabled?: boolean;
    /** Payment amount */
    amount?: number;
    /** Error message to display above the button */
    error?: string | null;
    /** Called when the button is clicked */
    onClick: () => void;
}

/**
 * CheckoutButton — A full-width CTA button for initiating Stripe Checkout.
 * Handles loading state, error display, and disabled state.
 */
export default function CheckoutButton({
    label = 'Proceed to Checkout',
    isLoading = false,
    disabled = false,
    amount,
    error = null,
    onClick,
}: CheckoutButtonProps) {
    const isZeroAmount = amount !== undefined && amount <= 0;
    const isDisabled = disabled || isLoading || isZeroAmount;
    const displayError = error || (isZeroAmount ? 'Payment amount must be greater than $0.00.' : null);

    return (
        <div className="space-y-3">
            {/* Error message */}
            {displayError && (
                <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600">
                    <AlertCircle size={14} />
                    {displayError}
                </div>
            )}

            <button
                onClick={onClick}
                disabled={isDisabled}
                className="w-full py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 size={18} className="animate-spin" />
                        Redirecting to Stripe...
                    </>
                ) : (
                    <>
                        <ShoppingCart size={16} />
                        {label}
                    </>
                )}
            </button>
        </div>
    );
}

