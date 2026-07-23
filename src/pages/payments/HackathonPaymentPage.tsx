import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Trophy, Calendar, Users } from 'lucide-react';
import PaymentSummary from '@/components/payments/PaymentSummary';
import CheckoutButton from '@/components/payments/CheckoutButton';
import { PaymentService } from '@/services/payment.service';
import { OrganizerService, OrganizerHackathon } from '@/services/organizer.service';
import {
    HACKATHON_SUBSCRIPTION_PRICE,
    CURRENCY,
} from '@/types/payment.types';
import StripeCheckoutModal from '@/components/payments/StripeCheckoutModal';

/**
 * HackathonPaymentPage — Displays the hackathon details, subscription price,
 * and a checkout button to purchase the subscription.
 *
 * Route: /payments/hackathon/:id
 */
export default function HackathonPaymentPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [hackathon, setHackathon] = useState<OrganizerHackathon | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pendingSession, setPendingSession] = useState<any>(null);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await OrganizerService.getHackathonById(id);
                setHackathon(data);
            } catch (err) {
                console.error('Failed to load hackathon', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const subscriptionPrice = parseFloat(hackathon?.pricing || "0") || 49.99;

    const handleCheckout = async () => {
        if (!id || !hackathon) return;
        setCheckoutLoading(true);
        setCheckoutError(null);

        try {
            const session = await PaymentService.purchaseHackathonSubscription(
                id,
                hackathon.title,
                subscriptionPrice
            );

            // In production the sessionUrl points to Stripe Checkout.
            // In dev/fallback mode, redirect to the success page directly.
            if (session.sessionUrl.startsWith('http')) {
                window.location.href = session.sessionUrl;
            } else {
                setPendingSession(session);
                setIsModalOpen(true);
            }
        } catch (err) {
            setCheckoutError(
                'Failed to create checkout session. Please try again.'
            );
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handlePaymentSuccess = () => {
        setIsModalOpen(false);
        if (pendingSession && hackathon) {
            navigate(
                `/payments/success?session_id=${pendingSession.sessionId}&product_id=${id}&product_type=hackathon_subscription&product_title=${encodeURIComponent(
                    hackathon.title
                )}&amount=${subscriptionPrice}`
            );
        }
    };

    const formatPrice = (amount: number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(amount);

    const formatDate = (d: string) =>
        new Date(d).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
            </div>
        );
    }

    if (!hackathon) {
        return (
            <div className="max-w-lg mx-auto text-center py-20">
                <p className="text-slate-400 font-bold text-lg">Hackathon not found</p>
                <button
                    onClick={() => navigate('/organizer')}
                    className="mt-4 px-6 py-3 bg-[#4F46E5] text-white rounded-2xl font-bold text-sm"
                >
                    Back to Dashboard
                </button>
            </div>
        );
    }

    const totalPrice = formatPrice(subscriptionPrice);

    return (
        <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 text-left animate-in fade-in duration-500">
            {/* Back button */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#4F46E5] font-bold text-sm mb-8 hover:opacity-80 transition-all"
            >
                <ChevronLeft size={18} />
                Back
            </button>

            <div className="grid lg:grid-cols-5 gap-12 items-start">
                {/* Left: Hackathon Details */}
                <div className="lg:col-span-3 space-y-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Trophy size={24} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#4F46E5]">
                                    Purchase Subscription
                                </p>
                                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                                    {hackathon.title}
                                </h1>
                            </div>
                        </div>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed">
                            {hackathon.description}
                        </p>
                    </div>

                    {/* Hackathon Meta */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                            <Calendar size={18} className="text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Date
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">
                                    {formatDate(hackathon.startDate)} – {formatDate(hackathon.endDate)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl">
                            <Users size={18} className="text-slate-400" />
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    Participants
                                </p>
                                <p className="text-sm font-extrabold text-slate-800">
                                    {hackathon.participantCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* What's included */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100 rounded-3xl p-6">
                        <h3 className="font-extrabold text-slate-900 mb-4">
                            What's included in the subscription
                        </h3>
                        <ul className="space-y-3">
                            {[
                                'Publish your hackathon to the public listing',
                                'Unlimited updates during the hackathon',
                                'Secure payment processing via Stripe',
                                'Access to participant analytics dashboard',
                                'Priority support from our team',
                            ].map((feature, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-2 shrink-0" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right: Payment Summary */}
                <div className="lg:col-span-2">
                    <PaymentSummary
                        title={`${hackathon.title} — Subscription`}
                        items={[
                            { label: 'Subscription', value: totalPrice },
                            { label: 'Platform fee', value: '$0.00' },
                            { label: 'Tax', value: 'Calculated at checkout' },
                        ]}
                        total={totalPrice}
                    >
                        <CheckoutButton
                            label="Purchase Subscription"
                            isLoading={checkoutLoading}
                            disabled={checkoutLoading}
                            error={checkoutError}
                            onClick={handleCheckout}
                        />
                    </PaymentSummary>
                </div>
            </div>

            {hackathon && (
                <StripeCheckoutModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handlePaymentSuccess}
                    amount={subscriptionPrice}
                    productTitle={`${hackathon.title} — Subscription`}
                />
            )}
        </div>
    );
}

