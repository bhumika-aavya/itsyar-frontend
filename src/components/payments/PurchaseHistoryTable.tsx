import React from 'react';
import { Purchase } from '@/types/payment.types';
import PaymentStatusBadge from './PaymentStatusBadge';
import { FileText, Receipt } from 'lucide-react';

interface PurchaseHistoryTableProps {
    /** Array of purchases to display */
    purchases: Purchase[];
    /** Loading state */
    isLoading?: boolean;
    /** Called when the invoice button is clicked for a purchase */
    onInvoice?: (purchase: Purchase) => void;
}

/**
 * PurchaseHistoryTable — A clean table displaying all user purchases with
 * product info, amount, status, date, and an invoice action.
 */
export default function PurchaseHistoryTable({
    purchases,
    isLoading = false,
    onInvoice,
}: PurchaseHistoryTableProps) {
    /** Format a date string for display */
    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    /** Format amount with currency */
    const formatAmount = (amount: number, currency: string) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency.toUpperCase(),
        }).format(amount);

    /** Human-readable type label */
    const typeLabel = (type: string) =>
        type === 'hackathon_subscription'
            ? 'Hackathon Subscription'
            : type === 'course'
                ? 'Course Purchase'
                : type;

    if (isLoading) {
        return (
            <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-16 bg-slate-50 rounded-xl animate-pulse"
                    />
                ))}
            </div>
        );
    }

    if (purchases.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-slate-100 rounded-3xl">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <Receipt size={28} className="text-slate-400" />
                </div>
                <p className="font-extrabold text-slate-700 text-lg">
                    No purchase history yet
                </p>
                <p className="text-sm text-slate-400 font-medium mt-1">
                    Your completed payments will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
            {/* Table Header (hidden on mobile) */}
            <div className="hidden md:grid grid-cols-5 gap-4 px-6 py-4 bg-slate-50 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
                <span>Product</span>
                <span>Type</span>
                <span>Amount</span>
                <span>Status</span>
                <span className="text-right">Date</span>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-slate-50">
                {purchases.map((purchase) => (
                    <div
                        key={purchase.id}
                        className="grid md:grid-cols-5 gap-4 px-6 py-5 items-center hover:bg-slate-50/50 transition-colors"
                    >
                        {/* Product */}
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                <Receipt size={16} className="text-[#4F46E5]" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 truncate">
                                {purchase.productTitle}
                            </span>
                        </div>

                        {/* Type */}
                        <span className="text-xs font-bold text-slate-500 hidden md:block">
                            {typeLabel(purchase.type)}
                        </span>

                        {/* Amount */}
                        <span className="text-sm font-extrabold text-slate-900">
                            {formatAmount(purchase.amount, purchase.currency)}
                        </span>

                        {/* Status */}
                        <div className="hidden md:block">
                            <PaymentStatusBadge status={purchase.status} />
                        </div>

                        {/* Date + Invoice */}
                        <div className="flex items-center justify-end gap-3">
                            <span className="text-xs font-bold text-slate-400">
                                {formatDate(purchase.purchaseDate)}
                            </span>
                            {purchase.invoiceUrl && onInvoice && (
                                <button
                                    onClick={() => onInvoice(purchase)}
                                    className="p-2 text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 rounded-lg transition-all"
                                    title="View Invoice"
                                >
                                    <FileText size={14} />
                                </button>
                            )}
                        </div>

                        {/* Mobile status indicator */}
                        <div className="md:hidden col-span-5 -mt-2">
                            <PaymentStatusBadge status={purchase.status} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

