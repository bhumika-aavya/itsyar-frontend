import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import FailedCard from '@/components/payments/FailedCard';

/**
 * PaymentFailedPage — Handles the Stripe Checkout cancel/failure redirect.
 *
 * Reads optional error info from search params and shows a failure card
 * with retry and return-to-dashboard actions.
 *
 * Route: /payments/failed?session_id=xxx
 */
export default function PaymentFailedPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const sessionId = searchParams.get('session_id');
    const productType = searchParams.get('product_type');
    const productId = searchParams.get('product_id');

    const handleRetry = () => {
        // Navigate back to the appropriate checkout page based on product type
        if (productType === 'hackathon_subscription' && productId) {
            navigate(`/payments/hackathon/${productId}`);
        } else if (productType === 'course' && productId) {
            navigate(`/payments/course/${productId}`);
        } else {
            navigate('/payments/packages');
        }
    };

    const handleReturn = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
            <FailedCard
                errorMessage={
                    sessionId
                        ? 'Your payment could not be processed. Please try again or use a different payment method.'
                        : 'The payment was cancelled. No charges have been made.'
                }
                onRetry={handleRetry}
                onReturn={handleReturn}
            />
        </div>
    );
}

