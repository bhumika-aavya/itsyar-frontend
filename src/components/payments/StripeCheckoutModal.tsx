import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, Loader2, Calendar, ShieldCheck } from 'lucide-react';

interface StripeCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    amount: number;
    productTitle: string;
}

export default function StripeCheckoutModal({
    isOpen,
    onClose,
    onSuccess,
    amount,
    productTitle,
}: StripeCheckoutModalProps) {
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Close on ESC key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Detect card type based on number prefix
    const getCardType = () => {
        const cleanNumber = cardNumber.replace(/\s+/g, '');
        if (cleanNumber.startsWith('4')) return 'Visa';
        if (/^5[1-5]/.test(cleanNumber)) return 'Mastercard';
        if (/^3[47]/.test(cleanNumber)) return 'American Express';
        return 'Card';
    };

    // Format Card Number (adds spaces every 4 digits)
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/\D/g, '').substring(0, 16);
        const formatted = input.replace(/(\d{4})(?=\d)/g, '$1 ');
        setCardNumber(formatted);
        setError(null);
    };

    // Format Expiry Date (MM/YY)
    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let input = e.target.value.replace(/\D/g, '').substring(0, 4);
        if (input.length > 2) {
            input = `${input.substring(0, 2)}/${input.substring(2)}`;
        }
        setExpiry(input);
        setError(null);
    };

    // Handle CVC (numeric, max 4 digits)
    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value.replace(/\D/g, '').substring(0, 4);
        setCvc(input);
        setError(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const cleanCard = cardNumber.replace(/\s+/g, '');
        if (cleanCard.length < 16) {
            setError('Please enter a valid 16-digit card number.');
            return;
        }
        if (expiry.length < 5) {
            setError('Please enter a valid expiry date (MM/YY).');
            return;
        }
        const [month, year] = expiry.split('/');
        const mVal = parseInt(month, 10);
        if (mVal < 1 || mVal > 12) {
            setError('Please enter a valid month (01-12).');
            return;
        }
        if (cvc.length < 3) {
            setError('Please enter a valid 3 or 4-digit CVC/CVV.');
            return;
        }
        if (!name.trim()) {
            setError('Please enter the name shown on your card.');
            return;
        }

        setIsSubmitting(true);
        // Simulate Stripe API transaction latency
        setTimeout(() => {
            setIsSubmitting(false);
            onSuccess();
        }, 1800);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(val);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
            {/* Backdrop click closer */}
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5]">
                            <Lock size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">Secure Payment</h3>
                            <p className="text-xs font-bold text-slate-400">Powered by Stripe Simulation</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Transaction summary card */}
                <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100/50 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5]">Purchasing</p>
                        <h4 className="text-sm font-extrabold text-slate-800 line-clamp-1 mt-0.5">{productTitle}</h4>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Amount</p>
                        <p className="text-lg font-black text-slate-900 mt-0.5">{formatCurrency(amount)}</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Error display */}
                    {error && (
                        <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-extrabold text-red-600 flex items-center gap-2 animate-shake">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* Name on Card */}
                    <div className="space-y-1">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            Name on Card
                        </label>
                        <input
                            type="text"
                            required
                            disabled={isSubmitting}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Jane Doe"
                            className="w-full h-11 border-2 border-slate-100 rounded-xl px-4 text-sm font-medium outline-none focus:border-[#4F46E5] bg-slate-50 focus:bg-white transition-all text-slate-800"
                        />
                    </div>

                    {/* Card Number */}
                    <div className="space-y-1">
                        <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                            Card Number
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                disabled={isSubmitting}
                                value={cardNumber}
                                onChange={handleCardNumberChange}
                                placeholder="4242 4242 4242 4242"
                                className="w-full h-11 border-2 border-slate-100 rounded-xl pl-11 pr-4 text-sm font-medium outline-none focus:border-[#4F46E5] bg-slate-50 focus:bg-white transition-all text-slate-800"
                            />
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <CreditCard size={16} />
                            </div>
                            {cardNumber.length > 0 && (
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                    {getCardType()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expiry and CVC grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                Expiration
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    disabled={isSubmitting}
                                    value={expiry}
                                    onChange={handleExpiryChange}
                                    placeholder="MM/YY"
                                    className="w-full h-11 border-2 border-slate-100 rounded-xl pl-10 pr-4 text-sm font-medium outline-none focus:border-[#4F46E5] bg-slate-50 focus:bg-white transition-all text-slate-800"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Calendar size={15} />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                                CVC / CVV
                            </label>
                            <input
                                type="password"
                                required
                                disabled={isSubmitting}
                                value={cvc}
                                onChange={handleCvcChange}
                                placeholder="•••"
                                className="w-full h-11 border-2 border-slate-100 rounded-xl px-4 text-sm font-medium tracking-widest outline-none focus:border-[#4F46E5] bg-slate-50 focus:bg-white transition-all text-slate-800"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={16} />
                                    Pay {formatCurrency(amount)}
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer security badge */}
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 py-2.5 rounded-2xl border border-slate-100">
                    <Lock size={12} className="text-slate-400" />
                    <span>Payments are encrypted and secured by 256-bit SSL</span>
                </div>

            </div>
        </div>
    );
}
