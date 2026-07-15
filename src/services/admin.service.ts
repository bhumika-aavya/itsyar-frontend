import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";

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

const MOCK_OVERVIEW: AdminOverview = {
  admin: { name: "Admin", role: "Admin" },
  stats: { totalUsers: 2847, totalCourses: 34, activeHackathons: 5, totalSubmissions: 412 },
  platformHealth: { apiStatus: "Operational", database: "Operational", authService: "Operational", emailService: "Operational" },
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
      return { admin: res.data.admin, stats: res.data.stats, platformHealth: res.data.platformHealth };
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

  deleteHackathon: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/hackathons/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
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
