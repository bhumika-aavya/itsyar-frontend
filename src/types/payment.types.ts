// ── Payment Flow Types ──────────────────────────────────────────────────────
// These types define the data structures for the Stripe Checkout payment flow,
// including purchases, sessions, and payment history.

export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type PurchaseType = 'hackathon_subscription' | 'course';

/** A purchase record returned after a successful payment. */
export interface Purchase {
    id: string;
    productId: string;
    productTitle: string;
    productImage?: string;
    type: PurchaseType;
    amount: number;
    currency: string;
    status: PaymentStatus;
    sessionId: string;
    purchaseDate: string;
    invoiceUrl?: string;
}

/** Stripe Checkout session data sent to / returned from the API. */
export interface PaymentSession {
    sessionId: string;
    sessionUrl: string;
    successUrl: string;
    cancelUrl: string;
}

/** Line item for the payment summary UI. */
export interface PaymentLineItem {
    label: string;
    value: string;
}

/** Props passed to the success page via URL search params or router state. */
export interface PaymentSuccessData {
    sessionId: string;
    productId: string;
    productTitle: string;
    productType: PurchaseType;
    amount: number;
    currency: string;
}

/** Props passed to the failed page. */
export interface PaymentFailedData {
    sessionId?: string;
    errorMessage?: string;
}

/** Stripe Checkout session creation request. */
export interface CreateCheckoutSessionPayload {
    productId: string;
    productType: PurchaseType;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
}

/** Payment history query response. */
export interface PaymentHistoryResponse {
    purchases: Purchase[];
    total: number;
    page: number;
    pageSize: number;
}

/** Hackathon subscription pricing config. */
export interface HackathonSubscriptionPricing {
    price: number;
    currency: string;
    interval: 'one-time';
    features: string[];
}

/** Course pricing config. */
export interface CoursePricing {
    price: number;
    currency: string;
    type: 'lifetime';
    features: string[];
}

/** Predefined pricing data used in the Payment Packages page. */
export const HACKATHON_SUBSCRIPTION_PRICE = 49.99;
export const COURSE_LIFETIME_PRICE = 29.99;
export const CURRENCY = 'usd';

export const HACKATHON_SUBSCRIPTION_FEATURES = [
    'Publish hackathon to public listing',
    'Unlimited updates for selected hackathon',
    'Secure Stripe payment processing',
    'Valid for the entire hackathon duration',
    'Priority organizer support',
    'Real-time participant analytics',
];

export const COURSE_FEATURES = [
    'Full lifetime access to all course content',
    'Completion certificate upon finishing',
    'Unlimited learning at your own pace',
    'Access to all future updates',
    'Community discussion access',
    'Downloadable resources & code samples',
];

