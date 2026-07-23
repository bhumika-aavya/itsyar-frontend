import React from 'react';
import { PaymentLineItem } from '@/types/payment.types';
import { CreditCard, Lock } from 'lucide-react';

interface PaymentSummaryProps {
    /** Title displayed at the top of the summary card */
    title: string;
    /** Image URL for the product (optional) */
    imageUrl?: string;
    /** Array of line items for the price breakdown */
    items: PaymentLineItem[];
    /** The total amount formatted (e.g. "$49.99") */
    total: string;
    /** Children — typically a CheckoutButton component */
    children?: React.ReactNode;
}

/**
 * PaymentSummary — Displays an order summary panel with product info,
 * a price breakdown, and a checkout CTA slot.
 *
 * Used on the Hackathon Payment and Course Checkout pages.
 */
export default function PaymentSummary({
    title,
    imageUrl,
    items,
    total,
    children,
}: PaymentSummaryProps) {
    return (
        <div className="bg-white border border-slate-100 rounded-[32px] p-8 shadow-2xl shadow-slate-200/50 space-y-6">
            {/* Product Image */}
            {imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-slate-50">
                    <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-48 object-cover"
                    />
                </div>
            )}

            {/* Title */}
            <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 mb-1">
                    Order Summary
                </p>
                <h3 className="text-xl font-extrabold text-slate-900">{title}</h3>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
                {items.map((item, i) => (
                    <div
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-slate-50 last:border-b-0"
                    >
                        <span className="text-sm font-medium text-slate-500">
                            {item.label}
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                            {item.value}
                        </span>
                    </div>
                ))}
            </div>

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <span className="text-base font-extrabold text-slate-900">Total</span>
                <span className="text-2xl font-extrabold text-slate-900">{total}</span>
            </div>

            {/* Secure Badge */}
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400">
                <Lock size={12} />
                Secure checkout powered by Stripe
            </div>

            {/* CTA Slot */}
            {children && <div className="pt-2">{children}</div>}

            {/* Payment Methods */}
            <div className="flex items-center justify-center gap-3 pt-2">
                <CreditCard size={18} className="text-slate-300" />
                <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-50 rounded text-[10px] font-bold text-slate-400">
                        Visa
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 rounded text-[10px] font-bold text-slate-400">
                        MC
                    </span>
                    <span className="px-2 py-0.5 bg-slate-50 rounded text-[10px] font-bold text-slate-400">
                        Amex
                    </span>
                </div>
            </div>
        </div>
    );
}

