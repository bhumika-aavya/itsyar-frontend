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
  newUsersThisMonth: number;
  revenueThisMonth?: string;
}

export interface AdminSubmission {
  id: string;
  hackathonId: string;
  hackathonTitle: string;
  participantName: string;
  participantEmail: string;
  language: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  submittedAt: string;
}

const MOCK_STATS: AdminStats = {
  totalUsers: 2847,
  totalCourses: 34,
  activeHackathons: 5,
  totalSubmissions: 412,
  newUsersThisMonth: 183,
};

const MOCK_USERS: AdminUser[] = [
  { id: "u1", fullName: "Alice Johnson", email: "alice@example.com", role: "student", status: "active", createdAt: "2025-01-15", coursesEnrolled: 3, hackathonsJoined: 2 },
  { id: "u2", fullName: "Bob Smith", email: "bob@example.com", role: "mentor", status: "active", createdAt: "2025-02-10", coursesEnrolled: 0, hackathonsJoined: 0 },
  { id: "u3", fullName: "Carol White", email: "carol@example.com", role: "student", status: "active", createdAt: "2025-03-05", coursesEnrolled: 5, hackathonsJoined: 1 },
  { id: "u4", fullName: "Dave Brown", email: "dave@example.com", role: "organizer", status: "active", createdAt: "2025-01-20", coursesEnrolled: 0, hackathonsJoined: 0 },
  { id: "u5", fullName: "Eve Davis", email: "eve@example.com", role: "student", status: "inactive", createdAt: "2025-04-01", coursesEnrolled: 1, hackathonsJoined: 0 },
  { id: "u6", fullName: "Frank Miller", email: "frank@example.com", role: "student", status: "banned", createdAt: "2024-12-01", coursesEnrolled: 2, hackathonsJoined: 3 },
  { id: "u7", fullName: "Grace Lee", email: "grace@example.com", role: "mentor", status: "active", createdAt: "2025-02-28", coursesEnrolled: 0, hackathonsJoined: 0 },
  { id: "u8", fullName: "Hank Wilson", email: "hank@example.com", role: "student", status: "active", createdAt: "2025-05-12", coursesEnrolled: 4, hackathonsJoined: 2 },
];

const MOCK_SUBMISSIONS: AdminSubmission[] = [
  { id: "s1", hackathonId: "h7", hackathonTitle: "CodeSprint 2026", participantName: "Alice Johnson", participantEmail: "alice@example.com", language: "Python", status: "PENDING", submittedAt: "2026-05-22T10:30:00Z" },
  { id: "s2", hackathonId: "h7", hackathonTitle: "CodeSprint 2026", participantName: "Bob Smith", participantEmail: "bob@example.com", language: "JavaScript", status: "ACCEPTED", submittedAt: "2026-05-22T11:15:00Z" },
  { id: "s3", hackathonId: "h7", hackathonTitle: "CodeSprint 2026", participantName: "Carol White", participantEmail: "carol@example.com", language: "TypeScript", status: "REJECTED", submittedAt: "2026-05-22T12:00:00Z" },
  { id: "s4", hackathonId: "h4", hackathonTitle: "BlockBuilders", participantName: "Dave Brown", participantEmail: "dave@example.com", language: "Go", status: "PENDING", submittedAt: "2026-05-23T09:00:00Z" },
  { id: "s5", hackathonId: "h4", hackathonTitle: "BlockBuilders", participantName: "Eve Davis", participantEmail: "eve@example.com", language: "Rust", status: "PENDING", submittedAt: "2026-05-23T10:45:00Z" },
];

export const AdminService = {
  getStats: async (): Promise<AdminStats> => {
    try {
      const res = await api.get("/admin/stats", getAuthHeaders());
      return res.data;
    } catch {
      return MOCK_STATS;
    }
  },

  getUsers: async (): Promise<AdminUser[]> => {
    try {
      const res = await api.get("/admin/users", getAuthHeaders());
      const users = res.data?.users ?? res.data ?? [];
      return users.map((u: any) => ({
        id: u.id,
        fullName: u.full_name ?? u.fullName ?? "",
        email: u.email,
        role: u.role,
        status: u.status ?? "active",
        createdAt: u.created_at ?? u.createdAt ?? "",
        coursesEnrolled: u.courses_enrolled ?? u.coursesEnrolled ?? 0,
        hackathonsJoined: u.hackathons_joined ?? u.hackathonsJoined ?? 0,
      }));
    } catch {
      return MOCK_USERS;
    }
  },

  updateUserStatus: async (userId: string, status: "active" | "inactive" | "banned"): Promise<void> => {
    try {
      await api.patch(`/admin/users/${userId}`, { status }, getAuthHeaders());
    } catch {
      // mock: no-op
    }
  },

  updateUserRole: async (userId: string, role: string): Promise<void> => {
    try {
      await api.patch(`/admin/users/${userId}`, { role }, getAuthHeaders());
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

  getSubmissions: async (): Promise<AdminSubmission[]> => {
    try {
      const res = await api.get("/admin/submissions", getAuthHeaders());
      return res.data?.submissions ?? res.data ?? [];
    } catch {
      return MOCK_SUBMISSIONS;
    }
  },

  createUser: async (data: { fullName: string; email: string; role: string }): Promise<AdminUser> => {
    try {
      const res = await api.post("/admin/users", data, getAuthHeaders());
      return res.data;
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

  createCourse: async (data: Record<string, string>): Promise<any> => {
    try {
      const res = await api.post("/admin/courses", data, getAuthHeaders());
      return res.data;
    } catch {
      return { id: `c${Date.now()}`, ...data, enrolledCount: 0 };
    }
  },

  updateCourse: async (id: string, data: Record<string, string>): Promise<any> => {
    try {
      const res = await api.put(`/admin/courses/${id}`, data, getAuthHeaders());
      return res.data;
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

  deleteHackathon: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/hackathons/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
  },

  deleteTeam: async (id: string): Promise<void> => {
    try {
      await api.delete(`/admin/teams/${id}`, getAuthHeaders());
    } catch {
      // mock no-op
    }
  },
};
