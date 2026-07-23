import React from 'react';
import { ShoppingCart, Lock, Loader2 } from 'lucide-react';

interface ProtectedPurchaseButtonProps {
    /** Whether the product is already purchased/unlocked */
    isPurchased: boolean;
    /** Whether the user is authenticated */
    isAuthenticated: boolean;
    /** Label for the purchase CTA */
    purchaseLabel?: string;
    /** Label for the "already purchased" state */
    unlockedLabel?: string;
    /** Loading state */
    isLoading?: boolean;
    /** Called when the purchase button is clicked */
    onPurchase: () => void;
}

/**
 * ProtectedPurchaseButton — A smart CTA button that adapts based on
 * authentication and purchase state. Shows "Unlocked" + icon if already
 * purchased, a "Buy Now" CTA if not, and a "Login to Purchase" if
 * unauthenticated.
 */
export default function ProtectedPurchaseButton({
    isPurchased,
    isAuthenticated,
    purchaseLabel = 'Buy Now',
    unlockedLabel = 'Unlocked',
    isLoading = false,
    onPurchase,
}: ProtectedPurchaseButtonProps) {
    // Already purchased — green unlocked state
    if (isPurchased) {
        return (
            <div className="flex items-center gap-2 px-6 py-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl font-extrabold text-sm text-emerald-700">
                <Lock size={16} className="text-emerald-500" />
                {unlockedLabel}
            </div>
        );
    }

    // Not authenticated — show a login-prompting CTA
    if (!isAuthenticated) {
        return (
            <button
                disabled
                className="flex items-center gap-2 px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-extrabold text-sm text-slate-400 cursor-not-allowed"
            >
                <Lock size={16} />
                Login to Purchase
            </button>
        );
    }

    // Purchase CTA
    return (
        <button
            onClick={onPurchase}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
            ) : (
                <ShoppingCart size={16} />
            )}
            {isLoading ? 'Processing...' : purchaseLabel}
        </button>
    );
}

