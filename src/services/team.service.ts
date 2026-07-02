import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { CreateTeamValues } from "@/schemas/hackathon.schema";
import { HackathonService } from "./hackathon.service";

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

export const HACKATHON_COLOR_MAP: Record<string, string> = {
  "CodeSprint 2026": "#4F39F6",
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
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (msg) throw new Error(msg);
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
        iconBg: "#4F39F6",
        iconType: "settings",
      };
    } catch (err: any) {
      throw err;
    }
  },
};
