import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { AdminService } from "./admin.service";
import { HackathonService } from "./hackathon.service";
import { getMockSubmissionsForUser } from "@/lib/mockUserSubmissions";
import { getReview, saveReview, SubmissionScores } from "@/lib/adminReviewStore";

// Base path per the Admin Submission Review API doc: /api/admin/submissions
// (VITE_API_URL already ends in /api)
const BASE = "/admin/submissions";

export type { SubmissionScores };
export type SubmissionStatus = "SUBMITTED" | "UNDER_REVIEW" | "EVALUATED";

export interface Submitter {
    userId: string;
    name: string;
    email: string;
    submissionCount: number;
}

export interface UserSubmissionRow {
    id: string;
    teamName: string;
    hackathonTitle: string;
    hackathonId: string;
    language: string;
    submittedAt: string;
    status: SubmissionStatus;
}

export interface UserSubmissionsResult {
    user: { name: string; email: string };
    reviewed: number;
    total: number;
    submissions: UserSubmissionRow[];
}

export interface SubmissionDetail {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    teamName: string;
    teamId: string;
    hackathonId: string;
    hackathonTitle: string;
    hackathonDescription: string;
    problemStatement: string;
    language: string;
    code: string;
    fileRef: string;
    submittedAt: string;
    status: SubmissionStatus;
    score: number | null;
    feedback: string | null;
    weightedScore: number | null;
    // Per-category score breakdown — NOT part of the documented API response
    // (the real GET only returns the aggregate `score`/`weightedScore`), only
    // populated by the local mock fallback so an in-progress draft's sliders
    // can be resumed. Undefined when backed by the real endpoint.
    scores?: SubmissionScores;
}

export interface ReviewPayload {
    scores: SubmissionScores;
    feedback: string;
}

export interface SubmitReviewResponse {
    success: boolean;
    message?: string;
    weightedScore: number;
    status: SubmissionStatus;
}

export interface SaveDraftResponse {
    success: boolean;
    message?: string;
}

// ── Mock fallback ────────────────────────────────────────────────────────
// The backend does not persist hackathon submissions anywhere yet (see
// mockUserSubmissions.ts), so every method below falls back to a
// deterministic mock built from real users/hackathons — same convention
// used across every other service in this codebase. Submission ids are
// synthesized as `${userId}__${hackathonId}` so a mock submission can be
// looked up by id alone, mirroring how the real API is keyed purely by
// `submission_id`.
const encodeId = (userId: string, hackathonId: string) => `${userId}__${hackathonId}`;
const decodeId = (submissionId: string): [string, string] | null => {
    const idx = submissionId.indexOf("__");
    if (idx === -1) return null;
    return [submissionId.slice(0, idx), submissionId.slice(idx + 2)];
};

function weightedScoreOf(scores: SubmissionScores): number {
    return (scores.innovation + scores.technicalFeasibility + scores.uiUx + scores.accessibility) / 4;
}

function statusFor(userId: string, hackathonId: string): SubmissionStatus {
    const review = getReview(userId, hackathonId);
    if (review?.status === "EVALUATED") return "EVALUATED";
    if (review) return "UNDER_REVIEW";
    return "SUBMITTED";
}

async function mockSubmitterList(): Promise<Submitter[]> {
    const [users, hackathons] = await Promise.all([AdminService.getUsers(), HackathonService.getHackathons()]);
    return users
        .map(u => ({
            userId: u.id,
            name: u.fullName,
            email: u.email,
            submissionCount: getMockSubmissionsForUser(u.id, hackathons).length,
        }))
        .filter(row => row.submissionCount > 0);
}

async function mockUserSubmissions(userId: string): Promise<UserSubmissionsResult> {
    const [users, hackathons] = await Promise.all([AdminService.getUsers(), HackathonService.getHackathons()]);
    const user = users.find(u => String(u.id) === String(userId));
    const raw = getMockSubmissionsForUser(userId, hackathons);
    const submissions: UserSubmissionRow[] = raw.map(s => ({
        id: encodeId(userId, s.hackathonId),
        teamName: s.team,
        hackathonTitle: s.hackathonTitle,
        hackathonId: s.hackathonId,
        language: s.language,
        submittedAt: s.submittedAt,
        status: statusFor(userId, s.hackathonId),
    }));
    return {
        user: { name: user?.fullName ?? "Unknown user", email: user?.email ?? "" },
        reviewed: submissions.filter(s => s.status === "EVALUATED").length,
        total: submissions.length,
        submissions,
    };
}

async function mockSubmissionDetail(submissionId: string): Promise<SubmissionDetail | null> {
    const decoded = decodeId(submissionId);
    if (!decoded) return null;
    const [userId, hackathonId] = decoded;
    const [users, hackathons] = await Promise.all([AdminService.getUsers(), HackathonService.getHackathons()]);
    const user = users.find(u => String(u.id) === String(userId));
    const raw = getMockSubmissionsForUser(userId, hackathons).find(s => s.hackathonId === hackathonId);
    if (!raw) return null;
    const review = getReview(userId, hackathonId);
    return {
        id: submissionId,
        userId,
        userName: user?.fullName ?? "Unknown user",
        userEmail: user?.email ?? "",
        teamName: raw.team,
        teamId: `${userId}-team`,
        hackathonId,
        hackathonTitle: raw.hackathonTitle,
        hackathonDescription: raw.aboutProject,
        problemStatement: raw.problemStatement,
        language: raw.language,
        code: "",
        fileRef: raw.files[0]?.name ?? "",
        submittedAt: raw.submittedAt,
        status: statusFor(userId, hackathonId),
        score: review?.weightedScore ?? null,
        feedback: review?.feedback ?? null,
        weightedScore: review?.weightedScore ?? null,
        scores: review?.scores,
    };
}

export const AdminSubmissionService = {
    getSubmitters: async (params?: { search?: string; hackathonId?: string }): Promise<Submitter[]> => {
        try {
            const response = await api.get(`${BASE}/users`, {
                ...getAuthHeaders(),
                params: { search: params?.search, hackathon_id: params?.hackathonId },
            });
            return response.data.users;
        } catch {
            return mockSubmitterList();
        }
    },

    getUserSubmissions: async (userId: string): Promise<UserSubmissionsResult> => {
        try {
            const response = await api.get(`${BASE}/users/${userId}`, getAuthHeaders());
            return response.data;
        } catch {
            return mockUserSubmissions(userId);
        }
    },

    getSubmissionDetail: async (submissionId: string): Promise<SubmissionDetail | null> => {
        try {
            const response = await api.get(`${BASE}/${submissionId}/detail`, getAuthHeaders());
            return response.data.submission;
        } catch {
            return mockSubmissionDetail(submissionId);
        }
    },

    submitReview: async (submissionId: string, data: ReviewPayload): Promise<SubmitReviewResponse> => {
        try {
            const response = await api.post(`${BASE}/${submissionId}/review`, data, getAuthHeaders());
            return response.data;
        } catch {
            const weightedScore = weightedScoreOf(data.scores);
            const decoded = decodeId(submissionId);
            if (decoded) {
                const [userId, hackathonId] = decoded;
                saveReview(userId, hackathonId, {
                    scores: data.scores,
                    feedback: data.feedback,
                    weightedScore,
                    reviewedAt: new Date().toISOString(),
                    status: "EVALUATED",
                });
            }
            return { success: true, message: "Review submitted", weightedScore, status: "EVALUATED" };
        }
    },

    saveReviewDraft: async (submissionId: string, data: ReviewPayload): Promise<SaveDraftResponse> => {
        try {
            const response = await api.post(`${BASE}/${submissionId}/review/draft`, data, getAuthHeaders());
            return response.data;
        } catch {
            const decoded = decodeId(submissionId);
            if (decoded) {
                const [userId, hackathonId] = decoded;
                saveReview(userId, hackathonId, {
                    scores: data.scores,
                    feedback: data.feedback,
                    weightedScore: weightedScoreOf(data.scores),
                    reviewedAt: new Date().toISOString(),
                    status: "UNDER_REVIEW",
                });
            }
            return { success: true, message: "Review draft saved" };
        }
    },
};
