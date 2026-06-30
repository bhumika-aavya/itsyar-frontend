import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { HackathonProblem, OrganizerCreateHackathonValues, OrganizerCreateProblemValues } from "@/schemas/hackathon.schema";

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

export const OrganizerService = {
    getMyHackathons: async (): Promise<OrganizerHackathon[]> => {
        try {
            const response = await api.get("/organizer/hackathons", getAuthHeaders());
            return response.data.hackathons;
        } catch {
            return orgHackathonsStore;
        }
    },

    getHackathonById: async (id: string): Promise<OrganizerHackathon | null> => {
        try {
            const response = await api.get(`/organizer/hackathons/${id}`, getAuthHeaders());
            return response.data.hackathon;
        } catch {
            return orgHackathonsStore.find(h => h.id === id) ?? null;
        }
    },

    createHackathon: async (data: OrganizerCreateHackathonValues): Promise<OrganizerHackathon> => {
        try {
            const response = await api.post("/organizer/hackathons", data, getAuthHeaders());
            return response.data.hackathon;
        } catch {
            const newHackathon: OrganizerHackathon = {
                id: `h${Date.now()}`,
                ...data,
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
            const response = await api.put(`/organizer/hackathons/${id}`, data, getAuthHeaders());
            return response.data.hackathon;
        } catch {
            const idx = orgHackathonsStore.findIndex(h => h.id === id);
            if (idx !== -1) orgHackathonsStore[idx] = { ...orgHackathonsStore[idx], ...data };
            return orgHackathonsStore[idx];
        }
    },

    deleteHackathon: async (id: string): Promise<void> => {
        try {
            await api.delete(`/organizer/hackathons/${id}`, getAuthHeaders());
        } catch {
            orgHackathonsStore = orgHackathonsStore.filter(h => h.id !== id);
        }
    },

    getProblem: async (hackathonId: string): Promise<HackathonProblem | null> => {
        try {
            const response = await api.get(`/organizer/hackathons/${hackathonId}/problem`, getAuthHeaders());
            return response.data.problem;
        } catch {
            return null;
        }
    },

    upsertProblem: async (hackathonId: string, data: OrganizerCreateProblemValues): Promise<HackathonProblem> => {
        try {
            const response = await api.post(`/organizer/hackathons/${hackathonId}/problem`, data, getAuthHeaders());
            return response.data.problem;
        } catch {
            const constraints = data.constraintsText
                ?.split('\n')
                .map(s => s.trim())
                .filter(Boolean) ?? [];

            const starterCode: Record<string, string> = {};
            data.supportedLanguages.forEach(lang => {
                starterCode[lang] = STARTER_CODE_TEMPLATES[lang] ?? `// Write your ${lang} solution here\n`;
            });

            const problem: HackathonProblem = {
                id: `p${Date.now()}`,
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

            const idx = orgHackathonsStore.findIndex(h => h.id === hackathonId);
            if (idx !== -1) orgHackathonsStore[idx].problemCount = 1;
            return problem;
        }
    },
};
