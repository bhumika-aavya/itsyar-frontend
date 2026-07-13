import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import {
    HackathonProblem, OrganizerCreateHackathonValues, OrganizerCreateProblemValues,
    HackathonCriteriaValues, HackathonFaqValues, HackathonPrizeValues, HackathonTimelineItemValues,
} from "@/schemas/hackathon.schema";

// Base path per the Organizer API doc: /api/admin/organizer (VITE_API_URL already ends in /api)
const BASE = "/admin/organizer";

export type OrganizerHackathon = {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    status: string;
    description: string;
    teamSize: string;
    registrationDeadline: string;
    mode: string;
    participantCount: string;
    problemCount: number;
    difficultyLevel?: string;
    ideationStartDate?: string;
    ideationEndDate?: string;
    rules?: string[];
    criteria?: HackathonCriteriaValues[];
    prizes?: HackathonPrizeValues[];
    faqs?: HackathonFaqValues[];
    timeline?: HackathonTimelineItemValues[];
};

export type HackathonLifecycleStatus = "Draft" | "Open" | "On-Going" | "Completed" | "Closed";

export type OrganizerJudge = {
    id: string;
    name: string;
    email: string;
    assignedAt: string;
};

export type OrganizerProblemSummary = {
    id: string;
    title: string;
    difficulty: string;
    points: number;
    supportedLanguages: string[];
    hasStarterCode: boolean;
    hasExamples: boolean;
};

export type OrganizerSubmission = {
    id: string;
    teamName: string;
    userName: string;
    language: string;
    submittedAt: string;
    status: "PENDING" | "REVIEWED" | "SCORED";
    score: number | null;
};

export type OrganizerTeam = {
    id: string;
    name: string;
    captainName: string;
    memberCount: number;
    maxMembers: number;
    status: string;
};

const MOCK_ORG_HACKATHONS: OrganizerHackathon[] = [
    {
        id: "h7",
        title: "CodeSprint 2026",
        startDate: "2026-05-21",
        endDate: "2026-05-30",
        status: "Open",
        description: "CodeSprint 2026 is an elite coding competition designed for developers to showcase their creative problem-solving skills.",
        teamSize: "1-4 Members",
        registrationDeadline: "2026-05-20",
        mode: "Online",
        participantCount: "1250+",
        problemCount: 1,
    },
    {
        id: "h8",
        title: "CloudNative Summit",
        startDate: "2026-09-01",
        endDate: "2026-09-03",
        status: "UpComing",
        description: "Cloud-native development and Kubernetes challenge for platform engineers.",
        teamSize: "1-3 Members",
        registrationDeadline: "2026-08-31",
        mode: "Hybrid",
        participantCount: "320",
        problemCount: 0,
    },
];

let orgHackathonsStore: OrganizerHackathon[] = [...MOCK_ORG_HACKATHONS];
const orgProblemsStore: Record<string, HackathonProblem[]> = {};
const orgJudgesStore: Record<string, OrganizerJudge[]> = {};

const STARTER_CODE_TEMPLATES: Record<string, string> = {
    JavaScript: `// Write your solution here\n\nfunction solution() {\n  // TODO: Implement\n}\n\nmodule.exports = solution;`,
    TypeScript: `// Write your solution here\n\nfunction solution(): void {\n  // TODO: Implement\n}\n\nexport default solution;`,
    Python: `# Write your solution here\n\ndef solution():\n    # TODO: Implement\n    pass\n`,
    Java: `// Write your solution here\n\npublic class Solution {\n    public void solve() {\n        // TODO: Implement\n    }\n}\n`,
    'C++': `// Write your solution here\n\n#include <iostream>\nusing namespace std;\n\nvoid solution() {\n    // TODO: Implement\n}\n`,
    Go: `// Write your solution here\n\npackage main\n\nfunc solution() {\n    // TODO: Implement\n}\n`,
    Rust: `// Write your solution here\n\nfn solution() {\n    // TODO: Implement\n}\n`,
    Ruby: `# Write your solution here\n\ndef solution\n  # TODO: Implement\nend\n`,
};

function problemToSummary(p: HackathonProblem): OrganizerProblemSummary {
    return {
        id: p.id,
        title: p.title,
        difficulty: p.difficulty,
        points: p.points,
        supportedLanguages: p.supportedLanguages,
        hasStarterCode: Object.keys(p.starterCode ?? {}).length > 0,
        hasExamples: (p.examples ?? []).length > 0,
    };
}

// The Organizer API doc names this field "registrationsDeadline" and expects
// rules as a plain string array — the form collects them as `registrationDeadline`
// and a newline-per-rule textarea, so translate before hitting the wire.
function buildHackathonPayload(data: OrganizerCreateHackathonValues) {
    const rules = data.rulesText
        ?.split('\n')
        .map(s => s.trim())
        .filter(Boolean) ?? [];

    return {
        title: data.title,
        description: data.description,
        mode: data.mode,
        startDate: data.startDate,
        endDate: data.endDate,
        teamSize: data.teamSize,
        registrationsDeadline: data.registrationDeadline,
        difficultyLevel: data.difficultyLevel,
        ideationStartDate: data.ideationStartDate,
        ideationEndDate: data.ideationEndDate,
        rules,
        criteria: data.criteria,
        prizes: data.prizes,
        faqs: data.faqs,
        timeline: data.timeline,
    };
}

function buildLocalHackathonFields(data: OrganizerCreateHackathonValues) {
    const rules = data.rulesText
        ?.split('\n')
        .map(s => s.trim())
        .filter(Boolean) ?? [];

    return {
        title: data.title,
        description: data.description,
        mode: data.mode,
        startDate: data.startDate,
        endDate: data.endDate,
        teamSize: data.teamSize,
        registrationDeadline: data.registrationDeadline,
        difficultyLevel: data.difficultyLevel,
        ideationStartDate: data.ideationStartDate,
        ideationEndDate: data.ideationEndDate,
        rules,
        criteria: data.criteria,
        prizes: data.prizes,
        faqs: data.faqs,
        timeline: data.timeline,
    };
}

function buildProblemFromForm(hackathonId: string, id: string, data: OrganizerCreateProblemValues): HackathonProblem {
    const constraints = data.constraintsText
        ?.split('\n')
        .map(s => s.trim())
        .filter(Boolean) ?? [];

    const starterCode: Record<string, string> = {};
    data.supportedLanguages.forEach(lang => {
        starterCode[lang] = STARTER_CODE_TEMPLATES[lang] ?? `// Write your ${lang} solution here\n`;
    });

    return {
        id,
        hackathonId,
        title: data.title,
        difficulty: data.difficulty,
        points: data.points,
        description: data.description,
        constraints,
        examples: [],
        starterCode,
        supportedLanguages: data.supportedLanguages,
    };
}

export const OrganizerService = {
    getMyHackathons: async (): Promise<OrganizerHackathon[]> => {
        try {
            const response = await api.get(`${BASE}/hackathons`, getAuthHeaders());
            return response.data.hackathons;
        } catch {
            return orgHackathonsStore;
        }
    },

    getHackathonById: async (id: string): Promise<OrganizerHackathon | null> => {
        try {
            const response = await api.get(`${BASE}/hackathons/${id}`, getAuthHeaders());
            return response.data.hackathon;
        } catch {
            return orgHackathonsStore.find(h => h.id === id) ?? null;
        }
    },

    createHackathon: async (data: OrganizerCreateHackathonValues): Promise<OrganizerHackathon> => {
        try {
            const response = await api.post(`${BASE}/hackathons`, buildHackathonPayload(data), getAuthHeaders());
            return response.data.hackathon;
        } catch {
            const newHackathon: OrganizerHackathon = {
                id: `h${Date.now()}`,
                ...buildLocalHackathonFields(data),
                status: "UpComing",
                participantCount: "0",
                problemCount: 0,
            };
            orgHackathonsStore = [newHackathon, ...orgHackathonsStore];
            return newHackathon;
        }
    },

    updateHackathon: async (id: string, data: OrganizerCreateHackathonValues): Promise<OrganizerHackathon> => {
        try {
            await api.put(`${BASE}/hackathons/${id}`, buildHackathonPayload(data), getAuthHeaders());
        } catch {
            // fall through to local store update below
        }
        const idx = orgHackathonsStore.findIndex(h => h.id === id);
        if (idx !== -1) orgHackathonsStore[idx] = { ...orgHackathonsStore[idx], ...buildLocalHackathonFields(data) };
        return orgHackathonsStore[idx];
    },

    deleteHackathon: async (id: string): Promise<void> => {
        try {
            await api.delete(`${BASE}/hackathons/${id}`, getAuthHeaders());
        } catch {
            // fall through to local store update below
        }
        orgHackathonsStore = orgHackathonsStore.filter(h => h.id !== id);
    },

    updateHackathonStatus: async (id: string, status: HackathonLifecycleStatus): Promise<void> => {
        try {
            await api.put(`${BASE}/hackathons/${id}/status`, { status }, getAuthHeaders());
        } catch {
            // fall through to local store update below
        }
        const idx = orgHackathonsStore.findIndex(h => h.id === id);
        if (idx !== -1) orgHackathonsStore[idx] = { ...orgHackathonsStore[idx], status };
    },

    getJudges: async (hackathonId: string): Promise<OrganizerJudge[]> => {
        try {
            const response = await api.get(`${BASE}/hackathons/${hackathonId}/judges`, getAuthHeaders());
            return response.data.judges;
        } catch {
            return orgJudgesStore[hackathonId] ?? [];
        }
    },

    assignJudge: async (hackathonId: string, data: { userId: string; name: string; email: string }): Promise<void> => {
        try {
            await api.post(`${BASE}/hackathons/${hackathonId}/judges`, data, getAuthHeaders());
        } catch {
            const judges = orgJudgesStore[hackathonId] ?? [];
            if (judges.some(j => j.email === data.email)) return;
            orgJudgesStore[hackathonId] = [
                ...judges,
                { id: data.userId, name: data.name, email: data.email, assignedAt: new Date().toISOString().slice(0, 10) },
            ];
        }
    },

    removeJudge: async (hackathonId: string, judgeId: string): Promise<void> => {
        try {
            await api.delete(`${BASE}/hackathons/${hackathonId}/judges/${judgeId}`, getAuthHeaders());
        } catch {
            orgJudgesStore[hackathonId] = (orgJudgesStore[hackathonId] ?? []).filter(j => j.id !== judgeId);
        }
    },

    getProblems: async (hackathonId: string): Promise<OrganizerProblemSummary[]> => {
        try {
            const response = await api.get(`${BASE}/hackathons/${hackathonId}/problems`, getAuthHeaders());
            return response.data.problems;
        } catch {
            return (orgProblemsStore[hackathonId] ?? []).map(problemToSummary);
        }
    },

    createProblem: async (hackathonId: string, data: OrganizerCreateProblemValues): Promise<HackathonProblem> => {
        const constraints = data.constraintsText
            ?.split('\n')
            .map(s => s.trim())
            .filter(Boolean) ?? [];

        try {
            const response = await api.post(`${BASE}/hackathons/${hackathonId}/problems`, {
                title: data.title,
                description: data.description,
                difficulty: data.difficulty,
                points: data.points,
                constraints,
                supportedLanguages: data.supportedLanguages,
            }, getAuthHeaders());
            const problem = buildProblemFromForm(hackathonId, response.data.problem?.id ?? `p${Date.now()}`, data);
            orgProblemsStore[hackathonId] = [...(orgProblemsStore[hackathonId] ?? []), problem];
            return problem;
        } catch {
            const problem = buildProblemFromForm(hackathonId, `p${Date.now()}`, data);
            orgProblemsStore[hackathonId] = [...(orgProblemsStore[hackathonId] ?? []), problem];
            const idx = orgHackathonsStore.findIndex(h => h.id === hackathonId);
            if (idx !== -1) orgHackathonsStore[idx].problemCount = orgProblemsStore[hackathonId].length;
            return problem;
        }
    },

    updateProblem: async (hackathonId: string, problemId: string, data: OrganizerCreateProblemValues): Promise<HackathonProblem> => {
        const constraints = data.constraintsText
            ?.split('\n')
            .map(s => s.trim())
            .filter(Boolean) ?? [];

        try {
            await api.put(`${BASE}/hackathons/${hackathonId}/problems/${problemId}`, {
                title: data.title,
                difficulty: data.difficulty,
                points: data.points,
                description: data.description,
                constraints,
                supportedLanguages: data.supportedLanguages,
            }, getAuthHeaders());
        } catch {
            // fall through to local store update below
        }
        const problem = buildProblemFromForm(hackathonId, problemId, data);
        const problems = orgProblemsStore[hackathonId] ?? [];
        const idx = problems.findIndex(p => p.id === problemId);
        orgProblemsStore[hackathonId] = idx !== -1
            ? problems.map((p, i) => (i === idx ? problem : p))
            : [...problems, problem];
        return problem;
    },

    // Convenience wrapper used by the create/edit hackathon form: creates the
    // hackathon's problem if none exists yet, otherwise edits the existing one.
    upsertProblem: async (hackathonId: string, data: OrganizerCreateProblemValues): Promise<HackathonProblem> => {
        const existing = await OrganizerService.getProblems(hackathonId);
        if (existing[0]?.id) {
            return OrganizerService.updateProblem(hackathonId, existing[0].id, data);
        }
        return OrganizerService.createProblem(hackathonId, data);
    },

    getSubmissions: async (hackathonId: string): Promise<OrganizerSubmission[]> => {
        try {
            const response = await api.get(`${BASE}/hackathons/${hackathonId}/submissions`, getAuthHeaders());
            return response.data.submissions;
        } catch {
            return [];
        }
    },

    getTeams: async (hackathonId: string): Promise<OrganizerTeam[]> => {
        try {
            const response = await api.get(`${BASE}/hackathons/${hackathonId}/teams`, getAuthHeaders());
            return response.data.teams;
        } catch {
            return [];
        }
    },
};
