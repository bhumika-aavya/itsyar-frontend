import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import {
    CreateCheckoutSessionPayload,
    PaymentSession,
    PaymentHistoryResponse,
    Purchase,
    PaymentStatus,
    PurchaseType,
} from "@/types/payment.types";
import { loadHackathons, saveHackathons } from "./organizer.service";

// ── Persistence Helpers ───────────────────────────────────────────────────────
// Persist payment data to localStorage so state survives page refreshes.

const LS_KEY_PURCHASES = 'forge_purchases';
const LS_KEY_PAID_HACKATHONS = 'forge_paid_hackathons';
const LS_KEY_PURCHASED_COURSES = 'forge_purchased_courses';

function loadPurchases(): Purchase[] {
    try {
        const raw = localStorage.getItem(LS_KEY_PURCHASES);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

function savePurchases(purchases: Purchase[]) {
    try { localStorage.setItem(LS_KEY_PURCHASES, JSON.stringify(purchases)); } catch { }
}

function loadPaidHackathons(): Record<string, string> {
    try {
        const raw = localStorage.getItem(LS_KEY_PAID_HACKATHONS);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function savePaidHackathons(map: Record<string, string>) {
    try { localStorage.setItem(LS_KEY_PAID_HACKATHONS, JSON.stringify(map)); } catch { }
}

function loadPurchasedCourses(): Record<string, string> {
    try {
        const raw = localStorage.getItem(LS_KEY_PURCHASED_COURSES);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

function savePurchasedCourses(map: Record<string, string>) {
    try { localStorage.setItem(LS_KEY_PURCHASED_COURSES, JSON.stringify(map)); } catch { }
}

// ── Mock Data Stores (persisted) ──────────────────────────────────────────────

let mockPurchasesStore: Purchase[] = loadPurchases();

if (mockPurchasesStore.length === 0) {
    mockPurchasesStore = [
        {
            id: "purch_001",
            productId: "h7",
            productTitle: "CodeSprint 2026",
            type: "hackathon_subscription",
            amount: 49.99,
            currency: "usd",
            status: "completed",
            sessionId: "cs_test_001",
            purchaseDate: new Date(Date.now() - 86400000 * 5).toISOString(),
            invoiceUrl: "#",
        },
        {
            id: "purch_002",
            productId: "course-1",
            productTitle: "Python Programming for Beginners",
            type: "course",
            amount: 29.99,
            currency: "usd",
            status: "completed",
            sessionId: "cs_test_002",
            purchaseDate: new Date(Date.now() - 86400000 * 3).toISOString(),
            invoiceUrl: "#",
        },
        {
            id: "purch_003",
            productId: "h8",
            productTitle: "CloudNative Summit",
            type: "hackathon_subscription",
            amount: 49.99,
            currency: "usd",
            status: "failed",
            sessionId: "cs_test_003",
            purchaseDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        },
    ];
    savePurchases(mockPurchasesStore);
}

// Tracks which hackathons have been paid for (hackathonId -> purchaseId)
const paidHackathonsStore: Record<string, string> = loadPaidHackathons();

// Tracks which courses have been purchased (courseId -> purchaseId)
const purchasedCoursesStore: Record<string, string> = loadPurchasedCourses();

// ── Payment Service ───────────────────────────────────────────────────────────

export const PaymentService = {
    /**
     * Creates a Stripe Checkout session for the given product.
     * On the real backend this returns a sessionId + sessionUrl for redirect.
     */
    createCheckoutSession: async (
        payload: CreateCheckoutSessionPayload
    ): Promise<PaymentSession> => {
        try {
            const response = await api.post(
                "/payments/create-checkout-session",
                payload,
                getAuthHeaders()
            );
            return response.data.session;
        } catch (error) {
            console.warn(
                "API Error: Simulating Stripe Checkout session creation"
            );
            // Simulate a Stripe Checkout session
            const sessionId = `cs_test_${Date.now()}`;
            const amount = payload.metadata?.amount || "29.99";
            return {
                sessionId,
                sessionUrl: `/payments/success?session_id=${sessionId}&product_id=${payload.productId}&product_type=${payload.productType}&amount=${amount}`,
                successUrl: payload.successUrl,
                cancelUrl: payload.cancelUrl,
            };
        }
    },

    /**
     * Polls the payment status for a given Stripe Checkout session.
     */
    getPaymentStatus: async (
        sessionId: string
    ): Promise<{
        status: PaymentStatus;
        purchase?: Purchase;
    }> => {
        try {
            const response = await api.get(
                `/payments/status/${sessionId}`,
                getAuthHeaders()
            );
            return response.data;
        } catch (error) {
            console.warn("API Error: Simulating payment status check");
            // Fallback: check our mock store
            const purchase = mockPurchasesStore.find(
                (p) => p.sessionId === sessionId
            );
            return {
                status: purchase?.status ?? "pending",
                purchase,
            };
        }
    },

    /**
     * Retrieves the authenticated user's full payment history.
     */
    getPaymentHistory: async (
        page = 1,
        pageSize = 10
    ): Promise<PaymentHistoryResponse> => {
        try {
            const response = await api.get("/payments/history", {
                ...getAuthHeaders(),
                params: { page, pageSize },
            });
            return response.data;
        } catch (error) {
            console.warn("API Error: Falling back to mock payment history");
            return {
                purchases: [...mockPurchasesStore].sort(
                    (a, b) =>
                        new Date(b.purchaseDate).getTime() -
                        new Date(a.purchaseDate).getTime()
                ),
                total: mockPurchasesStore.length,
                page,
                pageSize,
            };
        }
    },

    /**
     * Purchases a hackathon subscription — calls the checkout endpoint,
     * stores the purchase record locally on fallback.
     */
    purchaseHackathonSubscription: async (
        hackathonId: string,
        hackathonTitle: string,
        amount: number
    ): Promise<PaymentSession> => {
        const successUrl = `${window.location.origin}/payments/success?type=hackathon&product_id=${hackathonId}&amount=${amount}`;
        const cancelUrl = `${window.location.origin}/payments/failed`;

        const session = await PaymentService.createCheckoutSession({
            productId: hackathonId,
            productType: "hackathon_subscription",
            successUrl,
            cancelUrl,
            metadata: { hackathonTitle, amount: amount.toString() },
        });

        // On fallback, simulate a local purchase record
        if (!session.sessionUrl.startsWith("http")) {
            const purchase: Purchase = {
                id: `purch_${Date.now()}`,
                productId: hackathonId,
                productTitle: hackathonTitle,
                type: "hackathon_subscription",
                amount: amount,
                currency: "usd",
                status: "pending",
                sessionId: session.sessionId,
                purchaseDate: new Date().toISOString(),
            };
            mockPurchasesStore = [purchase, ...mockPurchasesStore];
        }

        return session;
    },

    /**
     * Purchases a course — calls the checkout endpoint,
     * stores the purchase record locally on fallback.
     */
    purchaseCourse: async (
        courseId: string,
        courseTitle: string
    ): Promise<PaymentSession> => {
        const successUrl = `${window.location.origin}/payments/success?type=course&product_id=${courseId}`;
        const cancelUrl = `${window.location.origin}/payments/failed`;

        const session = await PaymentService.createCheckoutSession({
            productId: courseId,
            productType: "course",
            successUrl,
            cancelUrl,
            metadata: { courseTitle },
        });

        // On fallback, simulate a local purchase record
        if (!session.sessionUrl.startsWith("http")) {
            const purchase: Purchase = {
                id: `purch_${Date.now()}`,
                productId: courseId,
                productTitle: courseTitle,
                type: "course",
                amount: 29.99,
                currency: "usd",
                status: "pending",
                sessionId: session.sessionId,
                purchaseDate: new Date().toISOString(),
            };
            mockPurchasesStore = [purchase, ...mockPurchasesStore];
        }

        return session;
    },

    /**
     * Marks a pending purchase as completed (called after Stripe redirects back).
     */
    confirmPayment: async (sessionId: string): Promise<Purchase | null> => {
        try {
            const response = await api.post(
                `/payments/confirm/${sessionId}`,
                {},
                getAuthHeaders()
            );
            return response.data.purchase;
        } catch (error) {
            console.warn("API Error: Simulating payment confirmation");
            const idx = mockPurchasesStore.findIndex(
                (p) => p.sessionId === sessionId
            );
            if (idx !== -1) {
                mockPurchasesStore[idx] = {
                    ...mockPurchasesStore[idx],
                    status: "completed",
                    purchaseDate: new Date().toISOString(),
                };
                const purchase = mockPurchasesStore[idx];

                // Track the paid product
                if (purchase.type === "hackathon_subscription") {
                    paidHackathonsStore[purchase.productId] = purchase.id;
                    savePaidHackathons(paidHackathonsStore);
                    
                    // Update status in shared store
                    const list = loadHackathons();
                    const hIdx = list.findIndex(h => h.id === purchase.productId);
                    if (hIdx !== -1) {
                        list[hIdx].status = "Paid";
                        saveHackathons(list);
                    }
                } else if (purchase.type === "course") {
                    purchasedCoursesStore[purchase.productId] = purchase.id;
                    savePurchasedCourses(purchasedCoursesStore);
                }

                // Persist purchases
                savePurchases(mockPurchasesStore);

                return purchase;
            }
            return null;
        }
    },

    /**
     * Checks whether a hackathon has a confirmed (paid) subscription.
     */
    isHackathonPaid: (hackathonId: string): boolean => {
        return !!paidHackathonsStore[hackathonId];
    },

    /**
     * Checks whether a course has been purchased.
     */
    isCoursePurchased: (courseId: string): boolean => {
        return !!purchasedCoursesStore[courseId];
    },

    /**
     * Publishes a hackathon (only works if payment is confirmed).
     * This calls the API — on fallback, it simulates success.
     */
    publishHackathon: async (hackathonId: string): Promise<boolean> => {
        try {
            await api.post(
                `/hackathons/${hackathonId}/publish`,
                {},
                getAuthHeaders()
            );
            return true;
        } catch (error) {
            console.warn("API Error: Simulating hackathon publication");
            const list = loadHackathons();
            const hackathon = list.find(h => h.id === hackathonId);
            const isPaid = PaymentService.isHackathonPaid(hackathonId) || hackathon?.status === "Paid";
            if (isPaid) {
                // Update status in shared store
                const hIdx = list.findIndex(h => h.id === hackathonId);
                if (hIdx !== -1) {
                    list[hIdx].status = "Open"; // becomes public
                    saveHackathons(list);
                }
                return true;
            }
            return false;
        }
    },

    /**
     * Fetches purchase status for a specific product.
     */
    getPurchaseByProduct: async (
        productId: string,
        type: PurchaseType
    ): Promise<Purchase | null> => {
        try {
            const response = await api.get(
                `/payments/product/${productId}`,
                getAuthHeaders()
            );
            return response.data.purchase;
        } catch (error) {
            console.warn("API Error: Falling back to mock purchase lookup");
            return (
                mockPurchasesStore.find(
                    (p) => p.productId === productId && p.type === type
                ) ?? null
            );
        }
    },

    /**
     * Returns a list of purchased course IDs for the current user.
     */
    getPurchasedCourseIds: async (): Promise<string[]> => {
        try {
            const response = await api.get("/courses/purchased", getAuthHeaders());
            return response.data.courseIds;
        } catch (error) {
            console.warn("API Error: Falling back to mock purchased courses");
            return Object.keys(purchasedCoursesStore);
        }
    },
};

