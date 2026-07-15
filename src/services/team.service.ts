import axios from "axios";
import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { CreateTeamValues } from "@/schemas/hackathon.schema";
import { HackathonService } from "./hackathon.service";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";

export interface TeamCardData {
  id: string;
  name: string;
  hackathonName: string;
  hackathonId: string;
  memberCount: number;
  maxMembers: number;
  description: string;
  iconBg: string;
  iconType: string;
}

export interface HackathonOption {
  id: string;
  title: string;
}

export interface MyTeamMember {
  id: string;
  name: string | null;
  username: string | null;
  email: string;
  status: 'APPROVED' | 'PENDING' | 'INVITED';
  isSelf: boolean;
}

export interface MyTeamData {
  id: string;
  name: string;
  hackathonName: string;
  hackathonId: string;
  maxMembers: number;
  members: MyTeamMember[];
  isOpenRequest: boolean;
}

export interface OutgoingRequest {
  id: string;
  type: 'INVITE' | 'OPEN_REQUEST';
  targetName: string;
  hackathonEvent: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

// An invite received BY the current user to join someone else's team —
// the inverse of OutgoingRequest, which only tracks invites/requests the
// current user sent out.
export interface TeamInvite {
  id: string;
  teamId: string;
  teamName: string;
  hackathonId: string;
  hackathonName: string;
  invitedByName: string;
  invitedAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

const MOCK_MY_TEAMS: MyTeamData[] = [
  {
    id: "t1",
    name: "Team NeuralNinjas",
    hackathonName: "CodeSprint 2026",
    hackathonId: "h7",
    maxMembers: 4,
    members: [
      { id: "m1", name: "John Doe", username: null, email: "john@example.com", status: "APPROVED", isSelf: true },
      { id: "m2", name: null, username: "@s_jenkins_ml", email: "s_jenkins_ml@example.com", status: "PENDING", isSelf: false },
    ],
    isOpenRequest: false,
  },
  {
    id: "t2",
    name: "Data Wranglers",
    hackathonName: "Data Challenge 2026",
    hackathonId: "h9",
    maxMembers: 3,
    members: [
      { id: "m3", name: "John Doe", username: null, email: "john@example.com", status: "APPROVED", isSelf: true },
      { id: "m4", name: "Priya Sharma", username: "@priya_s", email: "priya@example.com", status: "APPROVED", isSelf: false },
    ],
    isOpenRequest: true,
  },
];

const MOCK_OUTGOING_REQUESTS: OutgoingRequest[] = [
  { id: "r1", type: "INVITE", targetName: "@s_jenkins_ml", hackathonEvent: "Code Sprint 2026", status: "APPROVED" },
  { id: "r2", type: "OPEN_REQUEST", targetName: "@a_rivera_codes", hackathonEvent: "Code Sprint 2026", status: "REJECTED" },
  { id: "r3", type: "OPEN_REQUEST", targetName: "@s_chen_ux", hackathonEvent: "Code Sprint 2026", status: "APPROVED" },
];

let MOCK_MY_INVITES: TeamInvite[] = [
  {
    id: "inv1",
    teamId: "t5",
    teamName: "The Sparkle Squad",
    hackathonId: "h7",
    hackathonName: "CodeSprint 2026",
    invitedByName: "Priya Sharma",
    invitedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    status: "PENDING",
  },
  {
    id: "inv2",
    teamId: "t6",
    teamName: "Query Masters",
    hackathonId: "h9",
    hackathonName: "Data Challenge 2026",
    invitedByName: "Charlie Davis",
    invitedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    status: "PENDING",
  },
];

export const HACKATHON_COLOR_MAP: Record<string, string> = {
  "CodeSprint 2026": "#4F46E5",
  "Data Challenge 2026": "#0d9488",
  "BlockBuilders": "#16a34a",
  "InnovateX": "#ea580c",
  "AI Innovate Hack": "#7c3aed",
  "Web Wizards Challenge": "#2563eb",
  "CloudNative Summit": "#0284c7",
  "AI Innova Challenge": "#db2777",
};

const MOCK_ALL_TEAMS: TeamCardData[] = [
  {
    id: "t1",
    name: "Neural Ninjas V2",
    hackathonName: "CodeSprint 2026",
    hackathonId: "h7",
    memberCount: 3,
    maxMembers: 4,
    description: "Looking for Backend Developer",
    iconBg: "#1e293b",
    iconType: "settings",
  },
  {
    id: "t2",
    name: "Python Prodigies",
    hackathonName: "Data Challenge 2026",
    hackathonId: "h9",
    memberCount: 2,
    maxMembers: 4,
    description: "Need a UI/UX specialist",
    iconBg: "#14b8a6",
    iconType: "code",
  },
  {
    id: "t3",
    name: "AI Avengers",
    hackathonName: "Data Challenge 2026",
    hackathonId: "h9",
    memberCount: 3,
    maxMembers: 4,
    description: "Skill gap: ML optimization",
    iconBg: "#ef4444",
    iconType: "target",
  },
  {
    id: "t4",
    name: "Nexus Devs",
    hackathonName: "CodeSprint 2026",
    hackathonId: "h7",
    memberCount: 1,
    maxMembers: 4,
    description: "Looking for React experts",
    iconBg: "#64748b",
    iconType: "network",
  },
  {
    id: "t5",
    name: "The Sparkle Squad",
    hackathonName: "CodeSprint 2026",
    hackathonId: "h7",
    memberCount: 4,
    maxMembers: 4,
    description: "Team Full - Preparing for Launch",
    iconBg: "#94a3b8",
    iconType: "sparkle",
  },
  {
    id: "t6",
    name: "Query Masters",
    hackathonName: "Data Challenge 2026",
    hackathonId: "h9",
    memberCount: 3,
    maxMembers: 4,
    description: "PostgreSQL / NoSQL Specialist",
    iconBg: "#f97316",
    iconType: "database",
  },
];

const MOCK_HACKATHON_OPTIONS: HackathonOption[] = [
  { id: "h7", title: "CodeSprint 2026" },
  { id: "h9", title: "Data Challenge 2026" },
  { id: "h4", title: "BlockBuilders" },
  { id: "h5", title: "InnovateX" },
];

export const TeamService = {
  getAllTeams: async (): Promise<TeamCardData[]> => {
    try {
      const response = await api.get("/hackathons/teams/all", getAuthHeaders());
      return response.data.teams;
    } catch {
      console.warn("TeamService.getAllTeams: falling back to mock data");
      return MOCK_ALL_TEAMS;
    }
  },

  requestToJoin: async (teamId: string): Promise<void> => {
    try {
      await api.post(`/teams/${teamId}/request-join`, {}, getAuthHeaders());
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
    }
  },

  getHackathonOptions: async (): Promise<HackathonOption[]> => {
    try {
      const hackathons = await HackathonService.getHackathons();
      return hackathons.map((h) => ({ id: h.id, title: h.title }));
    } catch {
      return MOCK_HACKATHON_OPTIONS;
    }
  },

  getMyTeams: async (): Promise<MyTeamData[]> => {
    try {
      const response = await api.get('/teams/my-teams', getAuthHeaders());
      return response.data.teams ?? [];
    } catch {
      return MOCK_MY_TEAMS;
    }
  },

  updateTeamName: async (teamId: string, name: string): Promise<void> => {
    try {
      await api.put(`/teams/${teamId}/name`, { name }, getAuthHeaders());
    } catch {
      // mock success
    }
  },

  inviteMember: async (teamId: string, email: string): Promise<MyTeamMember> => {
    try {
      const response = await api.post(`/teams/${teamId}/invite`, { email }, getAuthHeaders());
      return response.data.member;
    } catch {
      return {
        id: `m${Date.now()}`,
        name: null,
        username: `@${email.split('@')[0]}`,
        email,
        status: 'PENDING',
        isSelf: false,
      };
    }
  },

  resendInvite: async (teamId: string, memberId: string): Promise<void> => {
    try {
      await api.post(`/teams/${teamId}/members/${memberId}/resend`, {}, getAuthHeaders());
    } catch {
      // mock success
    }
  },

  toggleOpenRequest: async (teamId: string, open: boolean): Promise<void> => {
    try {
      await api.put(`/teams/${teamId}/open-request`, { open }, getAuthHeaders());
    } catch {
      // mock success
    }
  },

  getMyRequests: async (): Promise<OutgoingRequest[]> => {
    try {
      const response = await api.get('/teams/my-requests', getAuthHeaders());
      return response.data.requests;
    } catch {
      return MOCK_OUTGOING_REQUESTS;
    }
  },

  withdrawRequest: async (requestId: string): Promise<void> => {
    try {
      await api.delete(`/teams/requests/${requestId}`, getAuthHeaders());
    } catch {
      // mock success
    }
  },

  getMyInvites: async (): Promise<TeamInvite[]> => {
    try {
      const response = await api.get('/teams/my-invites', getAuthHeaders());
      return response.data.invites ?? [];
    } catch {
      return MOCK_MY_INVITES.filter(i => i.status === 'PENDING');
    }
  },

  acceptInvite: async (inviteId: string): Promise<void> => {
    try {
      await api.post(`/teams/${inviteId}/accept`, {}, getAuthHeaders());
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
      MOCK_MY_INVITES = MOCK_MY_INVITES.map(i => i.id === inviteId ? { ...i, status: 'ACCEPTED' } : i);
    }
  },

  declineInvite: async (inviteId: string): Promise<void> => {
    try {
      await api.post(`/teams/${inviteId}/decline`, {}, getAuthHeaders());
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) throw new Error(getApiErrorMessage(err));
      MOCK_MY_INVITES = MOCK_MY_INVITES.map(i => i.id === inviteId ? { ...i, status: 'DECLINED' } : i);
    }
  },

  createTeamForHub: async (data: CreateTeamValues): Promise<TeamCardData> => {
    try {
      const created = await HackathonService.createTeam(data);
      return {
        id: created.id,
        name: created.name,
        hackathonName: "",
        hackathonId: data.hackathonId,
        memberCount: created.members.length,
        maxMembers: 4,
        description: created.description,
        iconBg: "#4F46E5",
        iconType: "settings",
      };
    } catch (err: any) {
      throw err;
    }
  },
};
