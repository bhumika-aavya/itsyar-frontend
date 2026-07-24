import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { OrganizerCreateHackathonValues } from "@/schemas/hackathon.schema";
import { OrganizerHackathon, loadHackathons, saveHackathons } from "./organizer.service";

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

export interface LeaderboardUser {
  userId: string;
  participant: {
    name: string;
    initials: string;
    email: string;
    avatarUrl: string | null;
  };
  track: string;
  score: number;
  progress: number;
  certs: number;
  subm: number;
  status: string;
  rank: number;
}

export interface CourseCompletionRate {
  courseId: string;
  courseTitle: string;
  completionPercentage: number;
}

export interface ScoreDistributionPoint {
  range: string;
  count: number;
}

export interface AdminOverview {
  admin: { name: string; role: string };
  stats: AdminStats;
  platformHealth: PlatformHealth;
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
    registrationsDeadline: data.registrationsDeadline,
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
  return { ...buildAdminHackathonPayload(data), registrationsDeadline: data.registrationsDeadline };
}

const toLowerStatus = (s: string): AdminUser["status"] => {
  const v = (s ?? "").toLowerCase();
  return v === "banned" || v === "inactive" ? v : "active";
};

const toBackendStatus = (s: "active" | "inactive" | "banned") =>
  s === "banned" ? "Banned" : s === "inactive" ? "Inactive" : "Active";

export const AdminService = {
  /** 1. GET /overview */
  getOverview: async (): Promise<AdminOverview> => {
    try {
      const res = await api.get("/admin/overview", getAuthHeaders());
      const rawStats = res.data.stats || {};
      const rawHealth = res.data.platform_health || res.data.platformHealth || {};

      return {
        admin: res.data.admin || { name: "Emma James", role: "Admin" },
        stats: {
          totalUsers: rawStats.total_users ?? rawStats.totalUsers ?? 0,
          totalCourses: rawStats.total_courses ?? rawStats.totalCourses ?? 0,
          activeHackathons: rawStats.active_hackathons ?? rawStats.activeHackathons ?? 0,
          totalSubmissions: rawStats.total_submissions ?? rawStats.totalSubmissions ?? 0,
        },
        platformHealth: {
          apiStatus: rawHealth.api_status ?? rawHealth.apiStatus ?? "Operational",
          database: rawHealth.database ?? "Operational",
          authService: rawHealth.auth_service ?? rawHealth.authService ?? "Operational",
          emailService: rawHealth.email_service ?? rawHealth.emailService ?? "Operational",
        },
      };
    } catch (err) {
      console.error("Failed to load overview data", err);
      throw err;
    }
  },

  /** 2. GET /charts */
  getCharts: async (params?: { limit?: number; hackathon_id?: string }): Promise<{
    courseCompletionRates: CourseCompletionRate[];
    scoreDistribution: ScoreDistributionPoint[];
  }> => {
    try {
      const res = await api.get("/admin/charts", { ...getAuthHeaders(), params });
      const chartData = res.data.data || {};
      return {
        courseCompletionRates: chartData.courseCompletionRates || [],
        scoreDistribution: chartData.scoreDistribution || [],
      };
    } catch {
      return {
        courseCompletionRates: [],
        scoreDistribution: []
      };
    }
  },

  /** 3. GET /leaderboard */
  getLeaderboard: async (params?: {
    track?: string;
    cohort?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    leaderboard: LeaderboardUser[];
    pagination: { page: number; limit: number; totalRecords: number; totalPages: number };
  }> => {
    try {
      const res = await api.get("/admin/leaderboard", { ...getAuthHeaders(), params });
      return {
        leaderboard: res.data.leaderboard || [],
        pagination: res.data.pagination || { page: 1, limit: 10, totalRecords: 0, totalPages: 1 }
      };
    } catch {
      return {
        leaderboard: [],
        pagination: {
          page: params?.page ?? 1,
          limit: params?.limit ?? 10,
          totalRecords: 0,
          totalPages: 1
        }
      };
    }
  },

  /** 4. GET /export (secure download) */
  exportLeaderboard: async (track: string, cohort: string): Promise<Blob> => {
    const res = await api.get(`/admin/export`, {
      ...getAuthHeaders(),
      params: { track, cohort },
      responseType: 'blob'
    });
    return res.data;
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
      return [];
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
      const list = loadHackathons();
      return list.map(h => ({
        id: h.id,
        title: h.title,
        mode: h.mode ?? "standard",
        startDate: h.startDate,
        endDate: h.endDate,
        status: h.status,
        participants: h.participantCount,
      })) as any;
    }
  },

  getHackathonById: async (id: string): Promise<OrganizerHackathon | null> => {
    try {
      const res = await api.get(`/admin/hackathons/${id}`, getAuthHeaders());
      return res.data.hackathon;
    } catch {
      return loadHackathons().find(h => h.id === id) ?? null;
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
        status: "Open", // Admin can create and publish directly
        participantCount: "0",
        problemCount: 0,
      };
      const list = loadHackathons();
      saveHackathons([newHackathon, ...list]);
      return newHackathon;
    }
  },

  updateHackathon: async (id: string, data: OrganizerCreateHackathonValues): Promise<OrganizerHackathon> => {
    try {
      await api.put(`/admin/hackathons/${id}`, buildAdminHackathonPayload(data), getAuthHeaders());
    } catch {
      // fall through to local store update below
    }
    const list = loadHackathons();
    const idx = list.findIndex(h => h.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...buildLocalAdminHackathonFields(data) };
      saveHackathons(list);
      return list[idx];
    }
    const fallback = { id, ...buildLocalAdminHackathonFields(data), status: "Open", participantCount: "0", problemCount: 0 };
    return fallback;
  },

  deleteHackathon: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/hackathons/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
    const list = loadHackathons();
    saveHackathons(list.filter(h => h.id !== id));
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
    } catch (err) {
      console.error("Failed to load settings data", err);
      throw err;
    }
  },

  updateSettings: async (settings: PlatformSettings): Promise<void> => {
    try {
      await api.put("/admin/settings", settings, getAuthHeaders());
    } catch {
      // mock: no-op
    }
  },

  approveHackathon: async (id: string, pricing: string): Promise<void> => {
    try {
      await api.post(`/admin/hackathons/${id}/approve`, { pricing }, getAuthHeaders());
    } catch {
      console.warn("API Error: Falling back to mock hackathon approval");
    }
    // Update local storage status
    const list = loadHackathons();
    const idx = list.findIndex(h => h.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status: "Approved", pricing };
      saveHackathons(list);
    }
  },

  rejectHackathon: async (id: string): Promise<void> => {
    try {
      await api.post(`/admin/hackathons/${id}/reject`, {}, getAuthHeaders());
    } catch {
      console.warn("API Error: Falling back to mock hackathon rejection");
    }
    // Update local storage status
    const list = loadHackathons();
    const idx = list.findIndex(h => h.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], status: "Draft" };
      saveHackathons(list);
    }
  },
};
