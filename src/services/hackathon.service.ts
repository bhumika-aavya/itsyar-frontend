import axios from "axios";
import api from "@/lib/axios";
import { Hackathon, HackathonDetail, Team, CreateTeamValues, HackathonProblem, SubmitSolutionValues, SubmitSolutionResponse, SaveProgressValues, SaveProgressResponse, MentorSubmission, MentorReviewValues } from "@/schemas/hackathon.schema";
import { getAuthHeaders } from "./auth";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { getLocalProgress, saveLocalProgress, clearLocalProgress } from "@/lib/progressStore";
import { loadHackathons } from "./organizer.service";

const MOCK_HACKATHONS: Hackathon[] = [
    { id: "h1", title: "CodeSprint 2024", startDate: "2024-05-21", endDate: "2024-05-23", status: "COMPLETED", iconType: "trophy", iconBg: "bg-yellow-50 text-yellow-500" },
    { id: "h2", title: "AI Innovate Hack", startDate: "2025-06-16", endDate: "2025-06-18", status: "COMPLETED", iconType: "cpu", iconBg: "bg-purple-50 text-purple-500" },
    { id: "h3", title: "Web Wizards Challenge", startDate: "2025-07-21", endDate: "2025-07-23", status: "Running", iconType: "zap", iconBg: "bg-blue-50 text-blue-500" },
    { id: "h4", title: "BlockBuilders", startDate: "2025-08-25", endDate: "2025-08-27", status: "Open", iconType: "database", iconBg: "bg-green-50 text-green-500" },
    { id: "h5", title: "InnovateX", startDate: "2025-11-06", endDate: "2025-11-08", status: "Running", iconType: "settings", iconBg: "bg-orange-50 text-orange-500" },
    { id: "h6", title: "AI Innova Challenge", startDate: "2026-01-10", endDate: "2026-01-12", status: "COMPLETED", iconType: "cpu", iconBg: "bg-pink-50 text-pink-500" },
    { id: "h7", title: "CodeSprint 2026", startDate: "2026-05-21", endDate: "2026-05-30", status: "Open", iconType: "trophy", iconBg: "bg-indigo-50 text-indigo-500" },
    { id: "h8", title: "CloudNative Summit", startDate: "2026-09-01", endDate: "2026-09-03", status: "UpComing", iconType: "cloud", iconBg: "bg-sky-50 text-sky-500" },
    { id: "h_pending_1", title: "NextGen Fintech Hackathon", startDate: "2026-10-15", endDate: "2026-10-20", status: "Draft", iconType: "zap", iconBg: "bg-amber-50 text-amber-500" },
];

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

// ── Mentor / Judge submission mock data ──────────────────────────────────────────
const MOCK_MENTOR_SUBMISSIONS: MentorSubmission[] = [
    {
        submissionId: "ms1",
        hackathonId: "h7",
        hackathonTitle: "CodeSprint 2026",
        participantName: "Riya Sharma",
        participantEmail: "riya.sharma@example.com",
        language: "Python",
        code: `def solve(arr):\n    \"\"\"Find the maximum sum of a contiguous subarray.\"\"\"\n    max_ending_here = max_so_far = arr[0]\n    for x in arr[1:]:\n        max_ending_here = max(x, max_ending_here + x)\n        max_so_far = max(max_so_far, max_ending_here)\n    return max_so_far\n\n# Test case\nprint(solve([-2, 1, -3, 4, -1, 2, 1, -5, 4]))  # Expected: 6`,
        notes: "Used Kadane's algorithm. Handles edge cases with negative numbers.",
        status: "PENDING",
        submittedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
        submissionId: "ms2",
        hackathonId: "h7",
        hackathonTitle: "CodeSprint 2026",
        participantName: "Arjun Mehta",
        participantEmail: "arjun.mehta@example.com",
        language: "JavaScript",
        code: `function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const complement = target - nums[i];\n        if (map.has(complement)) {\n            return [map.get(complement), i];\n        }\n        map.set(nums[i], i);\n    }\n    return [];\n}\n\nconsole.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]`,
        notes: "Efficient O(n) solution using hash map.",
        status: "ACCEPTED",
        submittedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        reviewNotes: "Clean code with optimal time complexity. Well done!",
        reviewedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
        submissionId: "ms3",
        hackathonId: "h7",
        hackathonTitle: "CodeSprint 2026",
        participantName: "Priya Nair",
        participantEmail: "priya.nair@example.com",
        language: "TypeScript",
        code: `interface TreeNode {\n    val: number;\n    left: TreeNode | null;\n    right: TreeNode | null;\n}\n\nfunction invertTree(root: TreeNode | null): TreeNode | null {\n    if (!root) return null;\n    const temp = root.left;\n    root.left = invertTree(root.right);\n    root.right = invertTree(temp);\n    return root;\n}`,
        notes: "Recursive solution for binary tree inversion.",
        status: "PENDING",
        submittedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
        submissionId: "ms4",
        hackathonId: "h3",
        hackathonTitle: "Web Wizards Challenge",
        participantName: "Karan Patel",
        participantEmail: "karan.patel@example.com",
        language: "JavaScript",
        code: `// React custom hook for debounced search\nimport { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n    const [debouncedValue, setDebouncedValue] = useState(value);\n\n    useEffect(() => {\n        const handler = setTimeout(() => {\n            setDebouncedValue(value);\n        }, delay);\n\n        return () => clearTimeout(handler);\n    }, [value, delay]);\n\n    return debouncedValue;\n}`,
        notes: "Implements a generic debounce hook for React with cleanup.",
        status: "REJECTED",
        submittedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        reviewNotes: "Missing error handling and TypeScript generics could be improved. Also consider adding AbortController for async operations.",
        reviewedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
        submissionId: "ms5",
        hackathonId: "h3",
        hackathonTitle: "Web Wizards Challenge",
        participantName: "Anika Roy",
        participantEmail: "anika.roy@example.com",
        language: "Python",
        code: `from fastapi import FastAPI, HTTPException\nfrom pydantic import BaseModel\n\napp = FastAPI()\n\nclass Item(BaseModel):\n    name: str\n    price: float\n    quantity: int = 1\n\nitems_db = {}\n\n@app.post("/items/")\nasync def create_item(item: Item):\n    if item.name in items_db:\n        raise HTTPException(status_code=400, detail="Item already exists")\n    items_db[item.name] = item\n    return {"message": "Item created", "item": item}`,
        notes: "FastAPI CRUD endpoint with input validation.",
        status: "PENDING",
        submittedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    },
    {
        submissionId: "ms6",
        hackathonId: "h2",
        hackathonTitle: "AI Innovate Hack",
        participantName: "Dev Joshi",
        participantEmail: "dev.joshi@example.com",
        language: "Python",
        code: `import tensorflow as tf\nfrom tensorflow import keras\n\nmodel = keras.Sequential([\n    keras.layers.Dense(128, activation='relu', input_shape=(784,)),\n    keras.layers.Dropout(0.2),\n    keras.layers.Dense(64, activation='relu'),\n    keras.layers.Dropout(0.2),\n    keras.layers.Dense(10, activation='softmax')\n])\n\nmodel.compile(\n    optimizer='adam',\n    loss='categorical_crossentropy',\n    metrics=['accuracy']\n)`,
        notes: "Neural network for MNIST classification with dropout regularization.",
        status: "ACCEPTED",
        submittedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
        reviewNotes: "Excellent model architecture with proper regularization. Good use of dropout layers to prevent overfitting.",
        reviewedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
        submissionId: "ms7",
        hackathonId: "h5",
        hackathonTitle: "InnovateX",
        participantName: "Maya Singh",
        participantEmail: "maya.singh@example.com",
        language: "Go",
        code: `package main\n\nimport (\n    "fmt"\n    "net/http"\n    "sync"\n)\n\nvar (\n    counter int\n    mu      sync.Mutex\n)\n\nfunc handler(w http.ResponseWriter, r *http.Request) {\n    mu.Lock()\n    counter++\n    count := counter\n    mu.Unlock()\n    fmt.Fprintf(w, "Request count: %d", count)\n}\n\nfunc main() {\n    http.HandleFunc("/", handler)\n    http.ListenAndServe(":8080", nil)\n}`,
        notes: "Concurrent-safe request counter using mutex.",
        status: "PENDING",
        submittedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    },
    {
        submissionId: "ms8",
        hackathonId: "h5",
        hackathonTitle: "InnovateX",
        participantName: "Rohit Verma",
        participantEmail: "rohit.verma@example.com",
        language: "Rust",
        code: `fn fibonacci(n: u32) -> u64 {\n    match n {\n        0 => 0,\n        1 => 1,\n        _ => fibonacci(n - 1) + fibonacci(n - 2),\n    }\n}\n\nfn fibonacci_memo(n: u32) -> u64 {\n    let mut memo = vec![0u64; (n + 1) as usize];\n    memo[1] = 1;\n    for i in 2..=n as usize {\n        memo[i] = memo[i - 1] + memo[i - 2];\n    }\n    memo[n as usize]\n}\n\nfn main() {\n    println!("{}", fibonacci_memo(40));\n}`,
        notes: "Both recursive and memoized Fibonacci implementations.",
        status: "REJECTED",
        submittedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        reviewNotes: "Recursive solution has O(2^n) complexity. Memoized version is good but lacks input validation and error handling for edge cases like overflow.",
        reviewedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
        submissionId: "ms9",
        hackathonId: "h1",
        hackathonTitle: "CodeSprint 2024",
        participantName: "Neha Gupta",
        participantEmail: "neha.gupta@example.com",
        language: "Java",
        code: `import java.util.*;\n\npublic class LRUCache {\n    private final int capacity;\n    private final LinkedHashMap<Integer, Integer> cache;\n\n    public LRUCache(int capacity) {\n        this.capacity = capacity;\n        this.cache = new LinkedHashMap<>(capacity, 0.75f, true) {\n            protected boolean removeEldestEntry(Map.Entry eldest) {\n                return size() > capacity;\n            }\n        };\n    }\n\n    public int get(int key) {\n        return cache.getOrDefault(key, -1);\n    }\n\n    public void put(int key, int value) {\n        cache.put(key, value);\n    }\n}`,
        notes: "LRU Cache implementation using LinkedHashMap with access-order ordering.",
        status: "PENDING",
        submittedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    },
    {
        submissionId: "ms10",
        hackathonId: "h1",
        hackathonTitle: "CodeSprint 2024",
        participantName: "Amit Bose",
        participantEmail: "amit.bose@example.com",
        language: "C++",
        code: `#include <vector>\n#include <algorithm>\n\nclass Solution {\npublic:\n    int lengthOfLIS(std::vector<int>& nums) {\n        std::vector<int> tails;\n        for (int num : nums) {\n            auto it = std::lower_bound(tails.begin(), tails.end(), num);\n            if (it == tails.end()) {\n                tails.push_back(num);\n            } else {\n                *it = num;\n            }\n        }\n        return tails.size();\n    }\n};`,
        notes: "Longest Increasing Subsequence using patience sorting O(n log n).",
        status: "ACCEPTED",
        submittedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        reviewNotes: "Elegant O(n log n) solution. Code is clean and well-structured.",
        reviewedAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    },
];

// In-memory mutable store so reviews persist during the session
let mentorSubmissionsStore = [...MOCK_MENTOR_SUBMISSIONS];

export const HackathonService = {
    getHackathons: async (): Promise<Hackathon[]> => {
        try {
            const response = await api.get("/hackathons", getAuthHeaders());
            return response.data.hackathons;
        } catch {
            console.warn("API Error: Falling back to mock Hackathon data");
            const list = loadHackathons();
            // Filter out Draft, Approved, and Paid hackathons from participant catalog
            return list.filter(h => h.status !== 'Draft' && h.status !== 'Approved' && h.status !== 'Paid') as any;
        }
    },

    getHackathonById: async (id: string) => {
        try {
            const response = await api.get(`/hackathons/${id}`, getAuthHeaders());
            return response.data.hackathon;
        } catch (err) {
            const found = loadHackathons().find(h => h.id === id);
            if (found) return found;
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

    // ── Mentor / Judge submission endpoints ──────────────────────────────────

    /** Get all submissions assigned to this mentor/judge for review. */
    getMentorSubmissions: async (): Promise<MentorSubmission[]> => {
        try {
            const response = await api.get("/mentor/submissions", getAuthHeaders());
            return response.data.submissions;
        } catch {
            console.warn("API Error: Falling back to mock mentor submissions");
            return mentorSubmissionsStore;
        }
    },

    /** Get a single submission by its ID for detailed review. */
    getSubmissionById: async (submissionId: string): Promise<MentorSubmission> => {
        try {
            const response = await api.get(`/mentor/submissions/${submissionId}`, getAuthHeaders());
            return response.data.submission;
        } catch {
            console.warn("API Error: Falling back to mock submission lookup");
            const submission = mentorSubmissionsStore.find(s => s.submissionId === submissionId);
            if (!submission) throw new Error("Submission not found");
            return submission;
        }
    },

    /** Submit a mentor review (accept/reject with feedback). */
    reviewSubmission: async (submissionId: string, data: MentorReviewValues): Promise<{ success: boolean }> => {
        try {
            const response = await api.post(`/mentor/submissions/${submissionId}/review`, data, getAuthHeaders());
            return response.data;
        } catch {
            console.warn("API Error: Simulating mentor review submission");
            const index = mentorSubmissionsStore.findIndex(s => s.submissionId === submissionId);
            if (index !== -1) {
                mentorSubmissionsStore[index] = {
                    ...mentorSubmissionsStore[index],
                    status: data.status,
                    reviewNotes: data.reviewNotes,
                    reviewedAt: new Date().toISOString(),
                };
            }
            return { success: true };
        }
    },
};
