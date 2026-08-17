import React, { useState, useEffect, useMemo } from 'react';
import { X, Lock, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from '@stripe/react-stripe-js';
import { PaymentService } from '@/services/payment.service';

function sanitizeKey(key?: string): string {
    if (!key) return '';
    return key.trim().replace(/^["']|["']$/g, '');
}

function isValidPublishableKey(key: string): boolean {
    if (!key) return false;
    const cleanKey = sanitizeKey(key);
    return (
        (cleanKey.startsWith('pk_test_') || cleanKey.startsWith('pk_live_')) &&
        !cleanKey.includes('sk_test_') &&
        !cleanKey.includes('sk_live_') &&
        cleanKey.length > 20
    );
}

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function getStripePromise(customKey?: string): Promise<Stripe | null> | null {
    const rawKey =
        customKey ||
        (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) ||
        'pk_test_51TxjCoJNlCHDGNt4ev98xPei1cMNgrdQ8wJp0oN9hW2TVu8hnyq2IFMCFsRXcOMuLLD1SFd3RSu7PjBf3PCE5Wkt00fw2vy0BE';

    const key = sanitizeKey(rawKey);

    if (!key) {
        return null;
    }

    if (!stripePromiseCache.has(key)) {
        stripePromiseCache.set(key, loadStripe(key));
    }
    return stripePromiseCache.get(key)!;
}

interface StripeCheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (paymentIntentId?: string) => void;
    amount: number;
    productTitle: string;
    clientSecret?: string;
    publishableKey?: string;
    paymentIntentId?: string;
}

/** Form component for Stripe Elements mode — MUST be rendered within <Elements> */
function StripePaymentForm({
    amount,
    onSuccess,
    clientSecret,
    paymentIntentId,
}: {
    amount: number;
    onSuccess: (paymentIntentId?: string) => void;
    clientSecret?: string;
    paymentIntentId?: string;
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const intentId =
            paymentIntentId ||
            (clientSecret ? clientSecret.split('_secret_')[0] : `pi_${Date.now()}`);

        if (!stripe || !elements) {
            setError('Stripe has not initialized correctly. Please try again.');
            return;
        }

        setIsSubmitting(true);

        try {
            const returnUrl = `${window.location.origin}/payments/success`;

            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not found");

            const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret || "", {
                payment_method: {
                    card: cardElement,
                }
            });

            if (stripeError) {
                const isApiKeyOrAccountMismatch =
                    stripeError.message?.toLowerCase().includes('api key') ||
                    stripeError.message?.toLowerCase().includes('account') ||
                    stripeError.code === 'resource_missing' ||
                    stripeError.type === 'invalid_request_error';

                if (isApiKeyOrAccountMismatch) {
                    setIsPolling(true);
                    setStatusMessage('Confirming payment status with backend...');
                    const fallbackResult = await PaymentService.pollPaymentConfirmation(intentId);
                    setIsSubmitting(false);
                    setIsPolling(false);

                    if (fallbackResult.success || fallbackResult.payment_status === 'paid') {
                        onSuccess(intentId);
                        return;
                    }
                }

                setError(stripeError.message || 'Payment submission failed. Please try again.');
                setIsSubmitting(false);
                return;
            }

            const confirmedIntentId = paymentIntent?.id || intentId;

            setIsPolling(true);
            setStatusMessage('Waiting for payment confirmation...');

            const pollResult = await PaymentService.pollPaymentConfirmation(
                confirmedIntentId,
                (status) => {
                    setStatusMessage(`Confirming payment (status: ${status})...`);
                }
            );

            setIsSubmitting(false);
            setIsPolling(false);

            if (pollResult.success || pollResult.payment_status === 'paid') {
                onSuccess(confirmedIntentId);
            } else {
                setError(
                    'Payment completed on Stripe, but backend confirmation timed out. We will process your order shortly.'
                );
            }
        } catch (err: any) {
            console.error('Payment submit error:', err);
            setError(err.message || 'An unexpected error occurred during payment.');
            setIsSubmitting(false);
            setIsPolling(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-extrabold text-red-600 flex items-center gap-2 animate-shake">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-slate-50 p-4 border border-slate-200/80 rounded-2xl min-h-[140px]">
                <div className="pt-2">
                    <CardElement 
                        options={{
                            style: {
                                base: {
                                    fontSize: '16px',
                                    color: '#424770',
                                    '::placeholder': {
                                        color: '#aab7c4',
                                    },
                                },
                                invalid: {
                                    color: '#9e2146',
                                },
                            },
                        }}
                    />
                </div>
            </div>

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting || isPolling || !stripe}
                    className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting || isPolling ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            {statusMessage || 'Processing Payment...'}
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
    );
}

/** Fallback form component used when Stripe Elements cannot be loaded — DOES NOT call useStripe() */
function FallbackPaymentForm({
    amount,
    onSuccess,
    clientSecret,
    paymentIntentId,
}: {
    amount: number;
    onSuccess: (paymentIntentId?: string) => void;
    clientSecret?: string;
    paymentIntentId?: string;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(val);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);
        setStatusMessage('Verifying payment with backend confirmation...');

        const intentId =
            paymentIntentId ||
            (clientSecret ? clientSecret.split('_secret_')[0] : `pi_${Date.now()}`);

        const result = await PaymentService.pollPaymentConfirmation(intentId);
        setIsSubmitting(false);

        if (result.success || result.payment_status === 'paid') {
            onSuccess(intentId);
        } else {
            setError('Payment confirmation timed out. Please try again.');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-xs font-extrabold text-red-600 flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0 text-red-500" />
                    <span>{error}</span>
                </div>
            )}

            <div className="pt-2">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin" size={16} />
                            {statusMessage || 'Processing Payment...'}
                        </>
                    ) : (
                        <>
                            <ShieldCheck size={16} />
                            Confirm Payment ({formatCurrency(amount)})
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export default function StripeCheckoutModal({
    isOpen,
    onClose,
    onSuccess,
    amount,
    productTitle,
    clientSecret,
    publishableKey,
    paymentIntentId,
}: StripeCheckoutModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const activeStripePromise = useMemo(() => {
        return getStripePromise(publishableKey);
    }, [publishableKey]);

    if (!isOpen) return null;

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(val);
    };

    const options = clientSecret ? { clientSecret } : undefined;
    const sanitizedKey = sanitizeKey(
        publishableKey || (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) || ''
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white border border-slate-100 rounded-3xl p-6 shadow-2xl space-y-6 text-left animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F46E5]">
                            <Lock size={18} />
                        </div>
                        <div>
                            <h3 className="text-base font-extrabold text-slate-900">Secure Payment</h3>
                            <p className="text-xs font-bold text-slate-400">Powered by Stripe Elements</p>
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

                {/* Transaction summary */}
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

                {clientSecret && activeStripePromise ? (
                    <Elements
                        key={`${sanitizedKey}_${clientSecret}`}
                        stripe={activeStripePromise}
                        options={options}
                    >
                        <StripePaymentForm
                            amount={amount}
                            onSuccess={onSuccess}
                            clientSecret={clientSecret}
                            paymentIntentId={paymentIntentId}
                        />
                    </Elements>
                ) : clientSecret ? (
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 font-medium space-y-1">
                            <p className="font-extrabold flex items-center gap-1.5 text-amber-900">
                                <AlertCircle size={14} /> Stripe Publishable Key Notice
                            </p>
                            <p>
                                Set <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">VITE_STRIPE_PUBLISHABLE_KEY</code> in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> with your valid Stripe Publishable Key (<code className="font-mono text-[11px]">pk_test_...</code>) from your Stripe Dashboard to enable interactive card inputs.
                            </p>
                        </div>
                        <FallbackPaymentForm
                            amount={amount}
                            onSuccess={onSuccess}
                            clientSecret={clientSecret}
                            paymentIntentId={paymentIntentId}
                        />
                    </div>
                ) : (
                    <div className="text-center py-6 space-y-2">
                        <Loader2 className="animate-spin text-[#4F46E5] mx-auto" size={24} />
                        <p className="text-xs font-bold text-slate-500">Initializing payment session...</p>
                    </div>
                )}

                {/* Footer security badge */}
                <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-400 bg-slate-50 py-2.5 rounded-2xl border border-slate-100">
                    <Lock size={12} className="text-slate-400" />
                    <span>Payments are encrypted and secured by Stripe 256-bit SSL</span>
                </div>
            </div>
        </div>
    );
}
