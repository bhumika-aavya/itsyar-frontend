import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import SuccessCard from '@/components/payments/SuccessCard';
import FailedCard from '@/components/payments/FailedCard';
import PaymentLoader from '@/components/payments/PaymentLoader';
import { PaymentService } from '@/services/payment.service';
import { Purchase, PurchaseType, CURRENCY } from '@/types/payment.types';

/**
 * PaymentSuccessPage — Handles payment confirmation and success display.
 *
 * Reads session_id and product info from URL search params.
 * Executes backend confirmation API (POST /api/payments/confirm/{session_id}).
 *
 * CRITICAL REQUIREMENT:
 * The "Payment Successful!" page will NOT appear until the backend confirmation API
 * successfully executes and returns payment_status === "paid" / completed status.
 *
 * Route: /payments/success?session_id=xxx&product_id=xxx&product_type=xxx
 */
export default function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sessionId = searchParams.get('session_id') || searchParams.get('payment_intent') || '';
    const productId = searchParams.get('product_id') || '';
    const productType = (searchParams.get('product_type') as PurchaseType) || 'hackathon_subscription';
    const productTitle = searchParams.get('product_title') || 'Subscription';
    const amountParam = searchParams.get('amount') || '0';

    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const verifyPaymentWithBackend = async () => {
            if (!sessionId) {
                setLoading(false);
                setIsConfirmed(false);
                setErrorMessage('Missing transaction session ID.');
                return;
            }

            setLoading(true);
            setErrorMessage(null);

            try {
                // Poll/confirm with backend endpoint: POST /api/payments/confirm/{sessionId}
                const result = await PaymentService.pollPaymentConfirmation(sessionId, (status) => {
                    console.log(`Confirming payment status with backend: ${status}`);
                });

                const isPaid =
                    result?.success === true ||
                    result?.payment_status === 'paid' ||
                    result?.payment_status === 'completed' ||
                    result?.purchase?.status === 'completed';

                if (isPaid) {
                    setPurchase(result?.purchase || null);
                    setIsConfirmed(true);
                } else {
                    setIsConfirmed(false);
                    setErrorMessage(
                        'Payment status is pending or backend webhook confirmation timed out.'
                    );
                }
            } catch (err: any) {
                console.error('Payment confirmation API error:', err);
                setIsConfirmed(false);
                setErrorMessage(
                    err?.message || 'Failed to confirm payment with backend API.'
                );
            } finally {
                setLoading(false);
            }
        };

        verifyPaymentWithBackend();
    }, [sessionId]);

    const formatPrice = (amount: string | number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(Number(amount));

    const handleAction = async () => {
        setActionLoading(true);
        if (productType === 'hackathon_subscription' && productId) {
            const published = await PaymentService.publishHackathon(productId);
            if (published) {
                navigate(`/hackathons/${productId}`);
            } else {
                navigate(`/hackathons/${productId}`);
            }
        } else if (productType === 'course' && productId) {
            navigate(`/courses/${productId}`);
        } else {
            navigate('/payments/packages');
        }
        setActionLoading(false);
    };

    const handleRetryVerification = () => {
        window.location.reload();
    };

    const handleReturnToDashboard = () => {
        navigate('/organizer');
    };

    // 1. Show PaymentLoader while backend confirmation API is actively executing
    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <PaymentLoader message="Verifying payment confirmation with backend API..." />
            </div>
        );
    }

    // 2. If backend confirmation API failed or payment is not confirmed paid, DO NOT show SuccessCard!
    if (!isConfirmed) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
                <FailedCard
                    errorMessage={
                        errorMessage ||
                        'Payment status could not be verified by backend. Please try again.'
                    }
                    onRetry={handleRetryVerification}
                    onReturn={handleReturnToDashboard}
                    isRetryLoading={false}
                />
            </div>
        );
    }

    // 3. Render "Payment Successful!" screen ONLY AFTER backend API has successfully executed and confirmed paid status
    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
            <SuccessCard
                productType={productType}
                productTitle={purchase?.productTitle || productTitle}
                orderId={purchase?.id || sessionId || 'N/A'}
                amount={formatPrice(purchase?.amount || amountParam)}
                onAction={handleAction}
                isActionLoading={actionLoading}
            />
        </div>
    );
}
