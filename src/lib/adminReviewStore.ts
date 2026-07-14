const STORAGE_KEY = "adminSubmissionReviews";

export interface SubmissionScores {
  innovation: number;
  technicalFeasibility: number;
  uiUx: number;
  accessibility: number;
}

export interface SubmissionReview {
  scores: SubmissionScores;
  feedback: string;
  weightedScore: number;
  reviewedAt: string;
  status: "UNDER_REVIEW" | "EVALUATED";
}

const key = (userId: string, hackathonId: string) => `${userId}:${hackathonId}`;

function readAll(): Record<string, SubmissionReview> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function getReview(userId: string, hackathonId: string): SubmissionReview | null {
  return readAll()[key(userId, hackathonId)] ?? null;
}

export function saveReview(userId: string, hackathonId: string, review: SubmissionReview): void {
  const all = readAll();
  all[key(userId, hackathonId)] = review;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
