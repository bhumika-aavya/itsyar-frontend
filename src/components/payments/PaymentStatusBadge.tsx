import React from 'react';
import { PaymentStatus } from '@/types/payment.types';
import { CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface PaymentStatusBadgeProps {
    /** The payment status to display */
    status: PaymentStatus;
    /** Optional CSS class overrides */
    className?: string;
}

/** Mapping of status to visual config */
const STATUS_CONFIG: Record<
    PaymentStatus,
    { label: string; icon: React.ReactNode; bg: string; text: string }
> = {
    completed: {
        label: 'Paid',
        icon: <CheckCircle2 size={14} />,
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
    },
    pending: {
        label: 'Pending',
        icon: <Clock size={14} />,
        bg: 'bg-amber-50',
        text: 'text-amber-700',
    },
    failed: {
        label: 'Failed',
        icon: <AlertCircle size={14} />,
        bg: 'bg-red-50',
        text: 'text-red-600',
    },
};

/**
 * PaymentStatusBadge — A small colored badge that displays the current
 * payment status with an icon and label.
 */
export default function PaymentStatusBadge({
    status,
    className = '',
}: PaymentStatusBadgeProps) {
    const config = STATUS_CONFIG[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold ${config.bg} ${config.text} ${className}`}
        >
            {config.icon}
            {config.label}
        </span>
    );
}

