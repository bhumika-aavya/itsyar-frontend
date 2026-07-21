import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { OrganizerCreateHackathonValues } from "@/schemas/hackathon.schema";
import type { OrganizerHackathon } from "./organizer.service";

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "inactive" | "banned";
  createdAt: string;
  coursesEnrolled?: number;
  hackathonsJoined?: number;
}

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  activeHackathons: number;
  totalSubmissions: number;
}

export interface PlatformHealth {
  apiStatus: string;
  database: string;
  authService: string;
  emailService: string;
}

export interface LeaderboardRow {
  rank: number;
  name: string;
  initials: string;
  track: string;
  score: number;
  progress: number;
  certs: number;
  submissions: number;
  status: string;
}

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface AdminOverview {
  admin: { name: string; role: string };
  stats: AdminStats;
  platformHealth: PlatformHealth;
  leaderboard: LeaderboardRow[];
  courseCompletion: AnalyticsPoint[];
  scoreDistribution: AnalyticsPoint[];
}

export interface AdminCourse {
  id: string;
  title: string;
  instructor: string;
  level: string;
  enrolled: number;
  modulesCount: number;
  thumbnail?: string;
}

export interface AdminHackathon {
  id: string;
  title: string;
  mode: string;
  startDate: string;
  endDate: string;
  status: string;
  participants: string;
}

export interface AdminTeam {
  id: string;
  name: string;
  hackathonName: string;
  hackathonId: string;
  members: string;
  memberCount: number;
  maxMembers: number;
  description: string;
  status: string;
}

export interface AdminTeamsResponse {
  stats: { totalTeams: number; openForJoin: number; fullTeams: number };
  teams: AdminTeam[];
}

export interface PlatformSettings {
  platform: {
    platformName: string;
    supportEmail: string;
    platformTagline: string;
    defaultMaxTeamSize: number;
  };
  accessControl: {
    maintenanceMode: boolean;
    allowNewRegistrations: boolean;
  };
}

const MOCK_LEADERBOARD: LeaderboardRow[] = [
  { rank: 1, name: "Riya Kapoor", initials: "RK", track: "Hackathon", score: 2840, progress: 96, certs: 4, submissions: 3, status: "Active" },
  { rank: 2, name: "Arjun Sharma", initials: "AS", track: "Training", score: 2610, progress: 88, certs: 3, submissions: 1, status: "Active" },
  { rank: 3, name: "Priya Menon", initials: "PM", track: "Hackathon", score: 2490, progress: 82, certs: 2, submissions: 4, status: "Review" },
  { rank: 4, name: "Nikhil Kumar", initials: "NK", track: "Training", score: 2310, progress: 75, certs: 3, submissions: 2, status: "Active" },
  { rank: 5, name: "Sara Reddy", initials: "SR", track: "Hackathon", score: 2190, progress: 70, certs: 2, submissions: 2, status: "Inactive" },
];

const MOCK_COURSE_COMPLETION: AnalyticsPoint[] = [
  { label: "Foundry Basics", value: 91 },
  { label: "Ontology 101", value: 78 },
  { label: "OSDK Integration", value: 43 },
  { label: "AI Safety", value: 65 },
  { label: "Data Pipelines", value: 58 },
];

const MOCK_SCORE_DISTRIBUTION: AnalyticsPoint[] = [
  { label: "<40", value: 8 },
  { label: "40–55", value: 22 },
  { label: "56–70", value: 48 },
  { label: "71–85", value: 62 },
  { label: "86–100", value: 30 },
];

const MOCK_OVERVIEW: AdminOverview = {
  admin: { name: "Admin", role: "Admin" },
  stats: { totalUsers: 2847, totalCourses: 34, activeHackathons: 5, totalSubmissions: 412 },
  platformHealth: { apiStatus: "Operational", database: "Operational", authService: "Operational", emailService: "Operational" },
  leaderboard: MOCK_LEADERBOARD,
  courseCompletion: MOCK_COURSE_COMPLETION,
  scoreDistribution: MOCK_SCORE_DISTRIBUTION,
};

const MOCK_USERS: AdminUser[] = [
  { id: "u1", fullName: "Alice Johnson", email: "alice@example.com", role: "student", status: "active", createdAt: "2025-01-15", coursesEnrolled: 3, hackathonsJoined: 2 },
  { id: "u2", fullName: "Bob Smith", email: "bob@example.com", role: "mentor", status: "active", createdAt: "2025-02-10", coursesEnrolled: 0, hackathonsJoined: 0 },
  { id: "u3", fullName: "Carol White", email: "carol@example.com", role: "student", status: "active", createdAt: "2025-03-05", coursesEnrolled: 5, hackathonsJoined: 1 },
];

const MOCK_SETTINGS: PlatformSettings = {
  platform: { platformName: "ForgeInsight", supportEmail: "support@forgeinsight.com", platformTagline: "Build. Learn. Compete.", defaultMaxTeamSize: 4 },
  accessControl: { maintenanceMode: false, allowNewRegistrations: true },
};

// Admin manages hackathons directly under /admin/hackathons — a distinct,
// higher-privilege endpoint from the organizer's own /admin/organizer/hackathons.
// Keep a small local store so create/edit still works if the backend route
// isn't live yet, matching the fallback pattern used elsewhere in this file.
let adminHackathonsStore: OrganizerHackathon[] = [];

function buildAdminHackathonPayload(data: OrganizerCreateHackathonValues) {
  const rules = data.rulesText
    ?.split('\n')
    .map(s => s.trim())
    .filter(Boolean) ?? [];

  return {
    title: data.title,
    description: data.description,
    platform: data.platform,
    foundryLink: data.foundryLink,
    iconType: data.iconType,
    startDate: data.startDate,
    endDate: data.endDate,
    registrationsDeadline: data.registrationDeadline,
    difficultyLevel: data.difficultyLevel,
    pricing: data.pricing,
    judges: data.judges,
    rules,
    criteria: data.criteria,
    prizes: data.prizes,
    faqs: data.faqs,
    timeline: data.timeline,
  };
}

function buildLocalAdminHackathonFields(data: OrganizerCreateHackathonValues) {
  return { ...buildAdminHackathonPayload(data), registrationDeadline: data.registrationDeadline };
}

// Backend User.status is stored capitalized ("Active"/"Inactive"/"Banned"); the
// frontend UI works in lowercase throughout — normalize at the service boundary.
const toLowerStatus = (s: string): AdminUser["status"] => {
  const v = (s ?? "").toLowerCase();
  return v === "banned" || v === "inactive" ? v : "active";
};
const toBackendStatus = (s: "active" | "inactive" | "banned") =>
  s === "banned" ? "Banned" : s === "inactive" ? "Inactive" : "Active";

export const AdminService = {
  getOverview: async (): Promise<AdminOverview> => {
    try {
      const res = await api.get("/admin/overview", getAuthHeaders());
      return {
        admin: res.data.admin,
        stats: res.data.stats,
        platformHealth: res.data.platformHealth,
        // Leaderboard/analytics are optional on the backend response for now —
        // fall back to mock data per-section so partial rollouts still render.
        leaderboard: res.data.leaderboard ?? MOCK_LEADERBOARD,
        courseCompletion: res.data.courseCompletion ?? MOCK_COURSE_COMPLETION,
        scoreDistribution: res.data.scoreDistribution ?? MOCK_SCORE_DISTRIBUTION,
      };
    } catch {
      return MOCK_OVERVIEW;
    }
  },

  // Kept for backwards compatibility with existing callers expecting just stats.
  getStats: async (): Promise<AdminStats> => (await AdminService.getOverview()).stats,

  getUsers: async (params?: { search?: string; role?: string; status?: string }): Promise<AdminUser[]> => {
    try {
      const res = await api.get("/admin/users", { ...getAuthHeaders(), params });
      const users = res.data?.users ?? [];
      return users.map((u: any) => ({
        id: u.id,
        fullName: u.name ?? "",
        email: u.email,
        role: u.role,
        status: toLowerStatus(u.status),
        createdAt: u.joined ?? "",
        coursesEnrolled: u.activity?.courses ?? 0,
        hackathonsJoined: u.activity?.hackathons ?? 0,
      }));
    } catch {
      return MOCK_USERS;
    }
  },

  updateUserStatus: async (userId: string, status: "active" | "inactive" | "banned"): Promise<void> => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: toBackendStatus(status) }, getAuthHeaders());
    } catch {
      // mock: no-op
    }
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role }, getAuthHeaders());
    } catch {
      // mock: no-op
    }
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      await api.delete(`/admin/users/${userId}`, getAuthHeaders());
    } catch {
      // mock: no-op
    }
  },

  createUser: async (data: { fullName: string; email: string; role: string; password: string }): Promise<AdminUser> => {
    try {
      const res = await api.post("/admin/users", data, getAuthHeaders());
      return {
        id: res.data.user.id,
        fullName: data.fullName,
        email: res.data.user.email,
        role: res.data.user.role,
        status: "active",
        createdAt: new Date().toISOString(),
        coursesEnrolled: 0,
        hackathonsJoined: 0,
      };
    } catch {
      return {
        id: `u${Date.now()}`,
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        status: "active",
        createdAt: new Date().toISOString(),
        coursesEnrolled: 0,
        hackathonsJoined: 0,
      };
    }
  },

  getCourses: async (search?: string): Promise<AdminCourse[]> => {
    try {
      const res = await api.get("/admin/courses", { ...getAuthHeaders(), params: { search } });
      return res.data?.courses ?? [];
    } catch {
      return [];
    }
  },

  createCourse: async (data: { title: string; description?: string; instructor?: string; level?: string; category?: string }): Promise<any> => {
    const payload = { title: data.title, description: data.description, instructor: data.instructor, level: data.level, tag: data.category };
    try {
      const res = await api.post("/admin/courses", payload, getAuthHeaders());
      return { id: `c${Date.now()}`, ...data, ...res.data?.course };
    } catch {
      return { id: `c${Date.now()}`, ...data, enrolledCount: 0 };
    }
  },

  updateCourse: async (id: string, data: { title?: string; description?: string; instructor?: string; level?: string; category?: string }): Promise<any> => {
    const payload = { title: data.title, description: data.description, instructor: data.instructor, level: data.level, tag: data.category };
    try {
      await api.put(`/admin/courses/${id}`, payload, getAuthHeaders());
      return { id, ...data };
    } catch {
      return { id, ...data };
    }
  },

  deleteCourse: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/courses/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
  },

  getHackathons: async (params?: { search?: string; status?: string }): Promise<AdminHackathon[]> => {
    try {
      const res = await api.get("/admin/hackathons", { ...getAuthHeaders(), params });
      return res.data?.hackathons ?? [];
    } catch {
      return [];
    }
  },

  getHackathonById: async (id: string): Promise<OrganizerHackathon | null> => {
    try {
      const res = await api.get(`/admin/hackathons/${id}`, getAuthHeaders());
      return res.data.hackathon;
    } catch {
      return adminHackathonsStore.find(h => h.id === id) ?? null;
    }
  },

  createHackathon: async (data: OrganizerCreateHackathonValues): Promise<OrganizerHackathon> => {
    try {
      const res = await api.post("/admin/hackathons", buildAdminHackathonPayload(data), getAuthHeaders());
      return res.data.hackathon;
    } catch {
      const newHackathon: OrganizerHackathon = {
        id: `h${Date.now()}`,
        ...buildLocalAdminHackathonFields(data),
        status: "UpComing",
        participantCount: "0",
        problemCount: 0,
      };
      adminHackathonsStore = [newHackathon, ...adminHackathonsStore];
      return newHackathon;
    }
  },

  updateHackathon: async (id: string, data: OrganizerCreateHackathonValues): Promise<OrganizerHackathon> => {
    try {
      await api.put(`/admin/hackathons/${id}`, buildAdminHackathonPayload(data), getAuthHeaders());
    } catch {
      // fall through to local store update below
    }
    const idx = adminHackathonsStore.findIndex(h => h.id === id);
    if (idx !== -1) adminHackathonsStore[idx] = { ...adminHackathonsStore[idx], ...buildLocalAdminHackathonFields(data) };
    return adminHackathonsStore[idx] ?? { id, ...buildLocalAdminHackathonFields(data), status: "UpComing", participantCount: "0", problemCount: 0 };
  },

  deleteHackathon: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/hackathons/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
    adminHackathonsStore = adminHackathonsStore.filter(h => h.id !== id);
  },

  getTeams: async (params?: { search?: string; hackathonId?: string }): Promise<AdminTeamsResponse> => {
    try {
      const res = await api.get("/admin/teams", {
        ...getAuthHeaders(),
        params: { search: params?.search, hackathon_id: params?.hackathonId },
      });
      return { stats: res.data.stats, teams: res.data.teams ?? [] };
    } catch {
      return { stats: { totalTeams: 0, openForJoin: 0, fullTeams: 0 }, teams: [] };
    }
  },

  deleteTeam: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/teams/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
  },

  getSettings: async (): Promise<PlatformSettings> => {
    try {
      const res = await api.get("/admin/settings", getAuthHeaders());
      return res.data.settings;
    } catch {
      return MOCK_SETTINGS;
    }
  },

  updateSettings: async (settings: PlatformSettings): Promise<void> => {
    try {
      await api.put("/admin/settings", settings, getAuthHeaders());
    } catch {
      // mock: no-op
    }
  },
};
