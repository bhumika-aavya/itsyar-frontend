import api from "@/lib/axios";

export const LandingService = {
    getImpactMetrics: async () => {
        // In real scenario: return (await api.get("/landing/metrics")).data;
        // Hardcoded fallback for now:
        return {
            developersSkilled: "25K+",
            industryExperts: "12K+",
            skillImprovementRate: "70%",
            placementMultiplier: "3x",
        };
    },

    getLandingContent: async () => {
        return {
            hackathons: [
                { id: 1, title: 'AI Challenge 2024', date: '12 June - Jul 15', registrations: '1.2K+', type: 'zap' },
                { id: 2, title: 'Web3 Buildathon', date: '20 July - Aug 10', registrations: '800', type: 'globe' }
            ],
            leaderboard: [
                { rank: 1, name: '@nitish_dev', pts: '5,840 pts', pct: 90, img: 'https://i.pravatar.cc/100?u=1' },
                { rank: 2, name: '@code_queen', pts: '4,210 pts', pct: 65, img: 'https://i.pravatar.cc/100?u=2' },
                { rank: 3, name: '@build_master', pts: '3,750 pts', pct: 55, img: 'https://i.pravatar.cc/100?u=3' },
                { rank: 4, name: '@hackpro89', pts: '3,100 pts', pct: 45, img: 'https://i.pravatar.cc/100?u=4' }
            ]
        };
    }
};