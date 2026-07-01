import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";

export type LeaderboardFilter = 'today' | 'week' | 'month';

export const LeaderboardService = {
    getLeaderboard: async (filter: LeaderboardFilter = 'month') => {
        try {
            const response = await api.get(`/leaderboard?filter=${filter}`, getAuthHeaders());
            return response.data;
        } catch {
            return {
                top3: [
                    { rank: 2, username: '@code_queen', points: 2850, initials: 'CQ' },
                    { rank: 1, username: '@build_master', points: 3520, initials: 'BM' },
                    { rank: 3, username: '@dev_wizard', points: 2650, initials: 'DW' },
                ],
                rankings: [
                    { rank: 4, name: 'John Doe', handle: '@johndoe_dev', role: 'Student', points: 2450, isCurrentUser: true },
                    { rank: 5, name: 'Python Ninja', handle: '@python_ninja', role: 'Developer', points: 2200, isCurrentUser: false },
                    { rank: 6, name: 'Code Hunter', handle: '@code_hunter', role: 'Systems Engineer', points: 1980, isCurrentUser: false },
                    { rank: 7, name: 'Dev Explorer', handle: '@dev_explorer', role: 'Full Stack', points: 1750, isCurrentUser: false },
                ],
            };
        }
    },
};
