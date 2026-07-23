import React from 'react';
import { PaymentStatus } from '@/types/payment.types';
import {
    CheckCircle2,
    Clock,
    AlertTriangle,
    Ban,
} from 'lucide-react';

interface SubscriptionStatusProps {
    /** The payment status for the subscription */
    paymentStatus?: PaymentStatus;
    /** Whether the hackathon is published */
    isPublished?: boolean;
    /** Whether the hackathon is in draft state */
    isDraft?: boolean;
}

/** Mapping of subscription status to visual and label config */
const SUBSCRIPTION_STATUS_CONFIG: Record<
    string,
    { label: string; icon: React.ReactNode; bg: string; text: string }
> = {
    draft: {
        label: 'Draft',
        icon: <Clock size={14} />,
        bg: 'bg-slate-50',
        text: 'text-slate-500',
    },
    payment_required: {
        label: 'Payment Required',
        icon: <AlertTriangle size={14} />,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
    },
    paid: {
        label: 'Paid',
        icon: <CheckCircle2 size={14} />,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
    },
    published: {
        label: 'Published',
        icon: <CheckCircle2 size={14} />,
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
    },
    blocked: {
        label: 'Payment Failed',
        icon: <Ban size={14} />,
        bg: 'bg-red-50',
        text: 'text-red-600',
    },
};

/**
 * SubscriptionStatus — A status badge for the organizer dashboard that
 * displays the current lifecycle state of a hackathon subscription.
 *
 * Resolves the display status from payment status + publish state:
 * - Draft + no payment → "Draft"
 * - Draft + payment completed → "Paid" (ready to publish)
 * - Published + payment completed → "Published"
 * - Payment failed → "Payment Failed"
 * - Pending payment → "Payment Required"
 */
export default function SubscriptionStatus({
    paymentStatus,
    isPublished = false,
    isDraft = true,
}: SubscriptionStatusProps) {
    let resolvedStatus: string;

    if (isPublished) {
        resolvedStatus = 'published';
    } else if (paymentStatus === 'completed') {
        resolvedStatus = 'paid';
    } else if (paymentStatus === 'failed') {
        resolvedStatus = 'blocked';
    } else if (paymentStatus === 'pending') {
        resolvedStatus = 'payment_required';
    } else if (isDraft) {
        resolvedStatus = 'draft';
    } else {
        resolvedStatus = 'draft';
    }

    const config = SUBSCRIPTION_STATUS_CONFIG[resolvedStatus];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold ${config.bg} ${config.text}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}

