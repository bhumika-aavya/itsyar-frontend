import api from "@/lib/axios";
import { Hackathon, HackathonDetail, Team, CreateTeamValues, HackathonProblem, SubmitSolutionValues, SubmitSolutionResponse } from "@/schemas/hackathon.schema";
import { getAuthHeaders } from "./auth";

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

const MOCK_DETAIL: HackathonDetail & { rules: string[]; prices: any[]; faqs: any[] } = {
    id: "h7",
    title: "Code Sprint 2026",
    startDate: "2026-05-21",
    endDate: "2026-05-30",
    status: "Open",
    description: "CodeSprint 2026 is an elite coding competition designed for developers to showcase their creative problem-solving skills and technical expertise. Join a global community of innovators to build functional prototypes in under 48 hours.",
    teamSize: "1-4 Members",
    registrationDeadline: "20 May 2026",
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
    timeline: [
        { label: "Registration Starts", date: "01 May 2026" },
        { label: "Registration Ends", date: "20 May 2026" },
        { label: "Hackathon Starts", date: "21 May 2026" },
        { label: "Hackathon Ends", date: "30 May 2026" },
        { label: "Winner Announcement", date: "02 June 2026" },
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

const MOCK_PROBLEM: HackathonProblem = {
    id: "p1",
    hackathonId: "h7",
    title: "Real-Time Collaboration Tool",
    difficulty: "Medium",
    points: 100,
    description: `Build a real-time collaboration feature for a document editing application. Your solution should handle:

1. Multiple users editing the same document simultaneously
2. Conflict resolution when two users edit the same section
3. User presence indicators (who is currently viewing/editing)
4. Undo/redo functionality that works across sessions

Focus on the architecture and core algorithm. You may use pseudocode for complex sections, but working code is preferred.`,
    constraints: [
        "Solution must handle at least 10 concurrent users",
        "Maximum latency of 100ms for conflict resolution",
        "Memory usage should scale linearly with number of users",
        "No external real-time databases (Firebase, Supabase) — build from primitives",
    ],
    examples: [
        { label: "User A types \"Hello\"", result: "All other users see \"Hello\" within 100ms" },
        { label: "Users A and B both edit line 5", result: "One edit wins; other user sees merged result" },
    ],
    supportedLanguages: ["JavaScript", "TypeScript", "Python", "Java", "C++", "Go", "Rust", "Ruby"],
    starterCode: {
        JavaScript: `// Real-Time Collaboration Tool
// Your solution starts here

class CollaborationEngine {
  constructor() {
    this.document = '';
    this.users = new Map();
    this.operations = [];
  }

  // TODO: Implement operational transformation
  applyOperation(userId, operation) {

  }

  // TODO: Resolve conflicts between concurrent edits
  resolveConflict(op1, op2) {

  }
}

module.exports = CollaborationEngine;`,
        TypeScript: `// Real-Time Collaboration Tool

interface Operation {
  userId: string;
  type: 'insert' | 'delete';
  position: number;
  content?: string;
  timestamp: number;
}

class CollaborationEngine {
  private document: string = '';
  private users: Map<string, any> = new Map();

  // TODO: Implement operational transformation
  applyOperation(op: Operation): void {

  }

  // TODO: Resolve conflicts between concurrent edits
  resolveConflict(op1: Operation, op2: Operation): Operation {
    throw new Error('Not implemented');
  }
}

export default CollaborationEngine;`,
        Python: `# Real-Time Collaboration Tool

class CollaborationEngine:
    def __init__(self):
        self.document = ""
        self.users = {}
        self.operations = []

    # TODO: Implement operational transformation
    def apply_operation(self, user_id: str, operation: dict) -> None:
        pass

    # TODO: Resolve conflicts between concurrent edits
    def resolve_conflict(self, op1: dict, op2: dict) -> dict:
        pass
`,
    },
};

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

    getHackathonById: async (id: string): Promise<HackathonDetail> => {
        try {
            const response = await api.get(`/hackathons/${id}`, getAuthHeaders());
            return response.data.hackathon;
        } catch {
            console.warn("Using Mock Detail for ID:", id);
            return MOCK_DETAIL;
        }
    },

    joinHackathon: async (id: string) => {
        try {
            return (await api.post(`/hackathons/${id}/join`, {}, getAuthHeaders())).data;
        } catch {
            return { success: true };
        }
    },

    getTeams: async (hackathonId: string): Promise<Team[]> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/teams`, getAuthHeaders());
            return response.data.teams;
        } catch {
            return teamsStore.filter(t => t.hackathonId === hackathonId);
        }
    },

    getUserTeams: async (hackathonId: string): Promise<Team[]> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/my-teams`, getAuthHeaders());
            return response.data.teams;
        } catch {
            return USER_TEAMS.filter(t => t.hackathonId === hackathonId);
        }
    },

    createTeam: async (data: CreateTeamValues): Promise<Team> => {
        try {
            const response = await api.post(`/hackathons/${data.hackathonId}/teams`, data, getAuthHeaders());
            return response.data.team;
        } catch {
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
        } catch {
            // mock: no-op
        }
    },

    getProblem: async (hackathonId: string): Promise<HackathonProblem> => {
        try {
            const response = await api.get(`/hackathons/${hackathonId}/problem`, getAuthHeaders());
            return response.data.problem;
        } catch {
            console.warn("API Error: Falling back to mock problem data for hackathon:", hackathonId);
            return MOCK_PROBLEM;
        }
    },

    submitSolution: async (hackathonId: string, data: SubmitSolutionValues): Promise<SubmitSolutionResponse> => {
        try {
            const response = await api.post(`/hackathons/${hackathonId}/submit`, data, getAuthHeaders());
            return response.data;
        } catch {
            console.warn("API Error: Simulating solution submission for hackathon:", hackathonId);
            return { submissionId: `sub_${Date.now()}`, status: "PENDING", message: "Submission received and queued for review." };
        }
    },
};
