import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import SuccessCard from '@/components/payments/SuccessCard';
import PaymentLoader from '@/components/payments/PaymentLoader';
import { PaymentService } from '@/services/payment.service';
import { Purchase, PurchaseType, CURRENCY } from '@/types/payment.types';

/**
 * PaymentSuccessPage — Handles the Stripe Checkout success redirect.
 *
 * Reads the session_id and product info from search params, confirms
 * the payment with the backend, and shows a success card with a
 * contextual CTA (Publish Hackathon / Start Learning).
 *
 * Route: /payments/success?session_id=xxx&product_id=xxx&product_type=xxx
 */
export default function PaymentSuccessPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sessionId = searchParams.get('session_id') || '';
    const productId = searchParams.get('product_id') || '';
    const productType = (searchParams.get('product_type') as PurchaseType) || 'course';
    const productTitle = searchParams.get('product_title') || 'Product';
    const amountParam = searchParams.get('amount') || '0';

    const [purchase, setPurchase] = useState<Purchase | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const confirm = async () => {
            if (!sessionId) {
                setLoading(false);
                return;
            }
            try {
                const result = await PaymentService.confirmPayment(sessionId);
                setPurchase(result);
            } catch (err) {
                console.error('Payment confirmation failed', err);
            } finally {
                setLoading(false);
            }
        };
        confirm();
    }, [sessionId]);

    const formatPrice = (amount: string | number) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: CURRENCY.toUpperCase(),
        }).format(Number(amount));

    const handleAction = async () => {
        setActionLoading(true);
        if (productType === 'hackathon_subscription' && productId) {
            // Publish the hackathon
            const published = await PaymentService.publishHackathon(productId);
            if (published) {
                navigate(`/hackathons/${productId}`);
            } else {
                // Even if publish fails, still go to the hackathon detail
                navigate(`/hackathons/${productId}`);
            }
        } else if (productType === 'course' && productId) {
            // Start learning — go to the course detail (which will show "View Course")
            navigate(`/courses/${productId}`);
        } else {
            // Fallback — go to packages
            navigate('/payments/packages');
        }
        setActionLoading(false);
    };

    // Loading state while confirming payment
    if (loading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <PaymentLoader message="Confirming your payment..." />
            </div>
        );
    }

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

