import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Receipt } from 'lucide-react';
import PurchaseHistoryTable from '@/components/payments/PurchaseHistoryTable';
import { PaymentService } from '@/services/payment.service';
import { Purchase } from '@/types/payment.types';

/**
 * PaymentHistoryPage — Displays the authenticated user's full payment history
 * in a tabular format with product, type, amount, status, date, and invoice.
 *
 * Route: /payments/history
 */
export default function PaymentHistoryPage() {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await PaymentService.getPaymentHistory();
                setPurchases(response.purchases);
            } catch (err) {
                console.error('Failed to load payment history', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleInvoice = (purchase: Purchase) => {
        // In production this would open/download the invoice.
        // For the MVP, we log it and could open a modal or redirect.
        console.log('Invoice requested for:', purchase.id);
        if (purchase.invoiceUrl) {
            window.open(purchase.invoiceUrl, '_blank');
        }
    };

    // Compute summary stats
    const totalSpent = purchases
        .filter((p) => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0);

    const totalPurchases = purchases.filter(
        (p) => p.status === 'completed'
    ).length;

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 text-left animate-in fade-in duration-500">
            {/* Header */}
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-[#4F46E5] font-bold text-sm mb-6 hover:opacity-80 transition-all"
            >
                <ArrowLeft size={18} />
                Back to Dashboard
            </button>

            <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#4F46E5] mb-1">
                        Payments
                    </p>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                        Payment History
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        View all your past purchases and subscriptions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/payments/packages')}
                        className="px-5 py-3 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm hover:bg-[#4338CA] transition-all"
                    >
                        Browse Packages
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <Receipt size={18} className="text-[#4F46E5] mb-2" />
                    <p className="text-2xl font-extrabold text-slate-900">
                        {purchases.length}
                    </p>
                    <p className="text-xs font-bold text-slate-400">Total Transactions</p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <p className="text-2xl font-extrabold text-emerald-600">
                        {totalPurchases}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                        Successful Purchases
                    </p>
                </div>
                <div className="bg-white border border-slate-100 rounded-2xl p-5">
                    <p className="text-2xl font-extrabold text-slate-900">
                        {formatPrice(totalSpent)}
                    </p>
                    <p className="text-xs font-bold text-slate-400">Total Spent</p>
                </div>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
                </div>
            ) : (
                <PurchaseHistoryTable
                    purchases={purchases}
                    isLoading={false}
                    onInvoice={handleInvoice}
                />
            )}
        </div>
    );
}

