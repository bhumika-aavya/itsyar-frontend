import axios from "axios";
import api from "@/lib/axios";
import { Hackathon, HackathonDetail, Team, CreateTeamValues, HackathonProblem, SubmitSolutionValues, SubmitSolutionResponse, SaveProgressValues, SaveProgressResponse } from "@/schemas/hackathon.schema";
import { getAuthHeaders } from "./auth";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { getLocalProgress, saveLocalProgress, clearLocalProgress } from "@/lib/progressStore";

const MOCK_HACKATHONS: Hackathon[] = [
    { id: "h1", title: "CodeSprint 2024", startDate: "2024-05-21", endDate: "2024-05-23", status: "COMPLETED", iconType: "trophy", iconBg: "bg-yellow-50 text-yellow-500" },
    { id: "h2", title: "AI Innovate Hack", startDate: "2025-06-16", endDate: "2025-06-18", status: "COMPLETED", iconType: "cpu", iconBg: "bg-purple-50 text-purple-500" },
    { id: "h3", title: "Web Wizards Challenge", startDate: "2025-07-21", endDate: "2025-07-23", status: "Running", iconType: "zap", iconBg: "bg-blue-50 text-blue-500" },
    { id: "h4", title: "BlockBuilders", startDate: "2025-08-25", endDate: "2025-08-27", status: "Open", iconType: "database", iconBg: "bg-green-50 text-green-500" },
    { id: "h5", title: "InnovateX", startDate: "2025-11-06", endDate: "2025-11-08", status: "Running", iconType: "settings", iconBg: "bg-orange-50 text-orange-500" },
    { id: "h6", title: "AI Innova Challenge", startDate: "2026-01-10", endDate: "2026-01-12", status: "COMPLETED", iconType: "cpu", iconBg: "bg-pink-50 text-pink-500" },
    { id: "h7", title: "CodeSprint 2026", startDate: "2026-05-21", endDate: "2026-05-30", status: "Open", iconType: "trophy", iconBg: "bg-indigo-50 text-indigo-500" },
    { id: "h8", title: "CloudNative Summit", startDate: "2026-09-01", endDate: "2026-09-03", status: "UpComing", iconType: "cloud", iconBg: "bg-sky-50 text-sky-500" },
];

const MOCK_DETAIL: HackathonDetail & { rules: string[]; prices: any[]; faqs: any[]; criteria: any[] } = {
    id: "h7",
    title: "Code Sprint 2026",
    startDate: "2026-05-21",
    endDate: "2026-05-30",
    status: "Open",
    description: "CodeSprint 2026 is an elite coding competition designed for developers to showcase their creative problem-solving skills and technical expertise. Join a global community of innovators to build functional prototypes in under 48 hours.",
    teamSize: "1-4 Members",
    registrationsDeadline: "20 May 2026",
    mode: "Online",
    participantCount: "1250+",
    rules: [
        "Teams must consist of 1-4 members.",
        "All code must be written during the hackathon period.",
        "Use of open-source libraries is permitted but must be disclosed.",
        "Plagiarism will lead to immediate disqualification."
    ],
    prices: [
        { rank: "1st Place", amount: "$5,000", perk: "Internship Interview at ForgeInsight" },
        { rank: "2nd Place", amount: "$2,500", perk: "Foundry Certification Voucher" },
        { rank: "3rd Place", amount: "$1,000", perk: "Premium Swag Kit" }
    ],
    faqs: [
        { q: "Is there a registration fee?", a: "No, participation in Code Sprint 2026 is completely free." },
        { q: "Can I participate alone?", a: "Yes, you can join as a solo participant or in a team of up to 4." },
        { q: "What tech stack should I use?", a: "You are free to use any stack as long as it solves the problem statement." }
    ],
    criteria: [
        { category: 'Innovation', weight: 30, description: 'Originality and creativity of the solution' },
        { category: 'Technical Execution', weight: 25, description: 'Code quality, architecture, and scalability' },
        { category: 'Impact', weight: 20, description: 'Real-world usefulness and potential for scale' },
        { category: 'Presentation', weight: 15, description: 'Demo clarity, slide deck, and documentation quality' },
        { category: 'Completeness', weight: 10, description: 'How fully the solution addresses the problem statement' },
    ],
    ideationStartDate: "2026-05-05",
    ideationEndDate: "2026-05-15",
    timeline: [
        { label: "Registration Starts", date: "01 May 2026", type: "event" as const },
        { label: "Registration Ends", date: "20 May 2026", type: "event" as const },
        { label: "Ideation Phase", date: "05 May – 15 May 2026", type: "phase" as const, description: "Brainstorm ideas, form strategies, and prepare your approach before the hack begins." },
        { label: "Hackathon Starts", date: "21 May 2026", type: "event" as const },
        { label: "Hackathon Ends", date: "30 May 2026", type: "event" as const },
        { label: "Winner Announcement", date: "02 June 2026", type: "event" as const },
    ]
};

const MOCK_TEAMS: Team[] = [
    {
        id: "t1", name: "Neural Ninjas V2", description: "AI/ML focused hackathon team pushing state-of-the-art solutions.",
        hackathonId: "h7", leadId: "current-user",
        members: [
            { id: "m1", name: "You", email: "you@example.com", role: "LEAD", status: "JOINED" },
            { id: "m2", name: "Jane Smith", email: "jane@example.com", role: "MEMBER", status: "JOINED" },
            { id: "m3", name: "Bob Wilson", email: "bob@example.com", role: "MEMBER", status: "JOINED" },
            { id: "m4", name: "Alice Brown", email: "alice@example.com", role: "MEMBER", status: "INVITED" },
        ]
    },
    {
        id: "t2", name: "Team Neural", description: "Machine learning specialists focused on NLP and computer vision.",
        hackathonId: "h7", leadId: "u5",
        members: [
            { id: "m5", name: "Charlie Davis", email: "charlie@example.com", role: "LEAD", status: "JOINED" },
            { id: "m6", name: "Diana Prince", email: "diana@example.com", role: "MEMBER", status: "JOINED" },
            { id: "m7", name: "Eve Wilson", email: "eve@example.com", role: "MEMBER", status: "JOINED" },
            { id: "m8", name: "Frank Miller", email: "frank@example.com", role: "MEMBER", status: "JOINED" },
        ]
    },
    {
        id: "t3", name: "Team Ninjas", description: "Full-stack development team specializing in rapid prototyping.",
        hackathonId: "h7", leadId: "u9",
        members: [
            { id: "m9", name: "Grace Hopper", email: "grace@example.com", role: "LEAD", status: "JOINED" },
            { id: "m10", name: "Hank Pym", email: "hank@example.com", role: "MEMBER", status: "JOINED" },
            { id: "m11", name: "Iris West", email: "iris@example.com", role: "MEMBER", status: "JOINED" },
        ]
    },
    {
        id: "t4", name: "Pixel Pushers", description: "UI/UX focused team creating beautiful user experiences.",
        hackathonId: "h7", leadId: "u13",
        members: [
            { id: "m13", name: "Lena Storm", email: "lena@example.com", role: "LEAD", status: "JOINED" },
            { id: "m14", name: "Marco Polo", email: "marco@example.com", role: "MEMBER", status: "JOINED" },
        ]
    },
];

// teams the current user belongs to (subset of all teams)
const USER_TEAMS = MOCK_TEAMS.filter(t => t.leadId === "current-user");

let teamsStore = [...MOCK_TEAMS];

export const HackathonService = {
    getHackathons: async (): Promise<Hackathon[]> => {
        try {
            const response = await api.get("/hackathons", getAuthHeaders());
            return response.data.hackathons;
        } catch {
            console.warn("API Error: Falling back to mock Hackathon data");
            return MOCK_HACKATHONS;
        }
    },

    getHackathonById: async (id: string) => {
        try {
            const response = await api.get(`/hackathons/${id}`, getAuthHeaders());
            return response.data.hackathon;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
            return { success: true };
        }
    },

    joinHackathon: async (id: string) => {
        try {
            return (await api.post(`/hackathons/${id}/join`, {}, getAuthHeaders())).data;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
            return { success: true };
        }
    },

    registerHackathon: async (id: string, data?: { fullName: string; email: string; role: string; agreeToRules: boolean }) => {
        try {
            return (await api.post(`/hackathons/${id}/register`, data ?? {}, getAuthHeaders())).data;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
            return { success: true };
        }
    },

    getTeams: async (hackathonId: string): Promise<Team[]> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/teams`, getAuthHeaders());
            return response.data.teams;
        } catch (err) {
            console.warn("getTeams: falling back to mock data", err);
            return teamsStore.filter(t => t.hackathonId === hackathonId);
        }
    },

    getUserTeams: async (hackathonId: string): Promise<Team[]> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/my-teams`, getAuthHeaders());
            return response.data.teams;
        } catch (err) {
            console.warn("getUserTeams: falling back to mock data", err);
            return USER_TEAMS.filter(t => t.hackathonId === hackathonId);
        }
    },

    createTeam: async (data: CreateTeamValues): Promise<Team> => {
        try {
            const response = await api.post(`/hackathons/${data.hackathonId}/teams`, data, getAuthHeaders());
            return response.data.team;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
            // dev fallback — no backend available
            const newTeam: Team = {
                id: `t${Date.now()}`,
                name: data.name,
                description: data.description,
                hackathonId: data.hackathonId,
                leadId: "current-user",
                members: [
                    { id: `m${Date.now()}`, name: "You", email: "you@example.com", role: "LEAD", status: "JOINED" },
                    ...data.inviteEmails.map((email, i) => ({
                        id: `m${Date.now() + i + 1}`,
                        name: email.split("@")[0],
                        email,
                        role: "MEMBER" as const,
                        status: "INVITED" as const,
                    })),
                ],
            };
            teamsStore = [newTeam, ...teamsStore];
            return newTeam;
        }
    },

    joinTeamById: async (teamId: string): Promise<void> => {
        try {
            await api.post(`/teams/${teamId}/join`, {}, getAuthHeaders());
        } catch (err) {
            if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
        }
    },

    getProblem: async (hackathonId: string): Promise<HackathonProblem[]> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/problem`, getAuthHeaders());
            const raw = response.data;
            if (Array.isArray(raw)) return raw;
            if (Array.isArray(raw.problems)) return raw.problems;
            if (raw.problem) return [raw.problem];
            return [raw];
        } catch (err) {
            throw new Error(getApiErrorMessage(err, 'Failed to load problem'));
        }
    },

    runCode: async (language: string, code: string, stdin: string): Promise<{
        stdout: string | null;
        stderr: string | null;
        compileError: string | null;
        exitCode: number;
        timedOut: boolean;
        durationMs: number;
    }> => {
        const PISTON: Record<string, { language: string; version: string; filename: string }> = {
            'JavaScript': { language: 'javascript', version: '18.15.0', filename: 'solution.js' },
            'TypeScript': { language: 'typescript', version: '5.0.3', filename: 'solution.ts' },
            'Python': { language: 'python', version: '3.10.0', filename: 'solution.py' },
            'Java': { language: 'java', version: '15.0.2', filename: 'Main.java' },
            'C++': { language: 'c++', version: '10.2.0', filename: 'solution.cpp' },
            'Go': { language: 'go', version: '1.16.2', filename: 'main.go' },
            'Rust': { language: 'rust', version: '1.50.0', filename: 'main.rs' },
            'Ruby': { language: 'ruby', version: '3.0.1', filename: 'solution.rb' },
        };
        const runtime = PISTON[language] ?? PISTON['JavaScript'];
        const t0 = performance.now();
        try {
            const res = await fetch('https://emkc.org/api/v2/piston/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    language: runtime.language,
                    version: runtime.version,
                    files: [{ name: runtime.filename, content: code }],
                    stdin,
                    run_timeout: 10000,
                    compile_timeout: 30000,
                }),
            });
            if (!res.ok) throw new Error(`Piston responded ${res.status}`);
            const data = await res.json();
            const durationMs = Math.round(performance.now() - t0);
            const compileError = data.compile?.code !== 0 ? (data.compile?.stderr || data.compile?.output || null) : null;
            return {
                stdout: data.run?.stdout ?? null,
                stderr: data.run?.stderr ?? null,
                compileError,
                exitCode: data.run?.code ?? (compileError ? 1 : 0),
                timedOut: data.run?.signal === 'SIGKILL',
                durationMs,
            };
        } catch (err) {
            return {
                stdout: null,
                stderr: String(err),
                compileError: null,
                exitCode: -1,
                timedOut: false,
                durationMs: Math.round(performance.now() - t0),
            };
        }
    },

    checkRegistration: async (hackathonId: string): Promise<boolean> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/registration-status`, getAuthHeaders());
            return response.data;
        } catch {
            return true; // graceful fallback — don't block sandbox when backend is unavailable
        }
    },

    submitSolution: async (hackathonId: string, data: SubmitSolutionValues, teamId?: string): Promise<SubmitSolutionResponse> => {
        try {
            const response = await api.post(`/hackathons/${hackathonId}/submit`, data, getAuthHeaders());
            clearLocalProgress(hackathonId, teamId);
            return response.data;
        } catch {
            console.warn("API Error: Simulating solution submission for hackathon:", hackathonId);
            clearLocalProgress(hackathonId, teamId);
            return { submissionId: `sub_${Date.now()}`, status: "PENDING", message: "Submission received and queued for review." };
        }
    },

    // Saves in-progress (unsubmitted) code so a participant can leave the
    // sandbox and resume later. Always mirrored to localStorage as a safety
    // net since the backend endpoint may not persist it yet. When solving as
    // a team, passing teamId lets any teammate's session resume from here too.
    saveProgress: async (hackathonId: string, data: SaveProgressValues): Promise<SaveProgressResponse> => {
        saveLocalProgress(hackathonId, data.language, data.code, data.teamId);
        try {
            const response = await api.post(`/hackathons/${hackathonId}/teams/${data.teamId}/save`, data, getAuthHeaders());
            return response.data;
        } catch {
            return { saved: true, savedAt: new Date().toISOString() };
        }
    },

    getSavedProgress: async (hackathonId: string, teamId?: string): Promise<SaveProgressValues | null> => {
        try {
            const params = teamId ? { teamId } : undefined;
            const response = await api.get(`/hackathons/${hackathonId}/progress`, { ...getAuthHeaders(), params });
            return response.data?.progress ?? null;
        } catch {
            return getLocalProgress(hackathonId, teamId);
        }
    },

    getChatMessages: async (hackathonId: string, since?: number): Promise<Array<{
        id: string; sender: string; senderId: string; text: string;
        timestamp: number; type: string; code?: string; language?: string;
    }>> => {
        try {
            const params = since != null ? `?since=${since}` : '';
            const response = await api.get(`/hackathons/${hackathonId}/chat${params}`, getAuthHeaders());
            return response.data?.messages ?? [];
        } catch {
            return [];
        }
    },

    sendChatMessage: async (hackathonId: string, payload: {
        text: string; type: string; code?: string; language?: string;
    }): Promise<{
        id: string; sender: string; senderId: string; text: string;
        timestamp: number; type: string; code?: string; language?: string;
    } | null> => {
        try {
            const response = await api.post(`/hackathons/${hackathonId}/chat`, payload, getAuthHeaders());
            return response.data?.message ?? null;
        } catch {
            return null;
        }
    },
};
