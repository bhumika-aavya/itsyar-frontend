import api from "@/lib/axios";

const FALLBACK_METRICS = {
    developersSkilled: "25K+",
    industryExperts: "12K+",
    skillImprovementRate: "70%",
    placementMultiplier: "3x",
};

const FALLBACK_CONTENT = {
    courses: [
        { id: 1, name: "Cloud & DevOps", progress: "80%", colorClass: "text-blue-500", bgClass: "bg-blue-50" },
        { id: 2, name: "AI / ML Track", progress: "40%", colorClass: "text-orange-500", bgClass: "bg-orange-50" },
    ],
    hackathons: [
        { id: 1, title: "AI Challenge 2024", date: "12 June - Jul 15", registrations: "1.2K+", type: "zap" },
        { id: 2, title: "Web3 Buildathon", date: "20 July - Aug 10", registrations: "800", type: "globe" },
    ],
    categories: ["Cloud & DevOps", "AI / Machine Learning", "Web3", "Data Science"],
};

const FALLBACK_LEADERBOARD = [
    { rank: 1, name: "@nitish_dev", pts: "5,840 pts", pct: 90, img: "https://i.pravatar.cc/100?u=1" },
    { rank: 2, name: "@code_queen", pts: "4,210 pts", pct: 65, img: "https://i.pravatar.cc/100?u=2" },
    { rank: 3, name: "@build_master", pts: "3,750 pts", pct: 55, img: "https://i.pravatar.cc/100?u=3" },
    { rank: 4, name: "@hackpro89", pts: "3,100 pts", pct: 45, img: "https://i.pravatar.cc/100?u=4" },
];

const FALLBACK_REVIEWS = [
    {
        name: "Sarah K.",
        role: "Software Engineer",
        text: '"Won my first hackathon after just 2 weeks of learning. The format of platform is amazing!"',
    },
    {
        name: "James T.",
        role: "Full Stack Developer",
        text: '"Best platform for sharpening skills before interviews and real-world projects."',
    },
];

export const LandingService = {
    getImpactMetrics: async () => {
        try {
            const res = await api.get("/landing/metrics");
            const d = res.data?.data ?? res.data;
            return {
                developersSkilled: d.developers_skilled ?? d.developersSkilled ?? FALLBACK_METRICS.developersSkilled,
                industryExperts: d.industry_experts ?? d.industryExperts ?? FALLBACK_METRICS.industryExperts,
                skillImprovementRate: d.skill_improvement_rate ?? d.skillImprovementRate ?? FALLBACK_METRICS.skillImprovementRate,
                placementMultiplier: d.placement_multiplier ?? d.placementMultiplier ?? FALLBACK_METRICS.placementMultiplier,
            };
        } catch {
            return FALLBACK_METRICS;
        }
    },

    getLandingContent: async () => {
        try {
            const res = await api.get("/landing/content");
            const d = res.data?.data ?? res.data;
            return {
                courses: d.courses ?? FALLBACK_CONTENT.courses,
                hackathons: (d.hackathons ?? FALLBACK_CONTENT.hackathons).map((h: any) => ({
                    id: h.id,
                    title: h.title,
                    date: h.date ?? `${h.start_date ?? h.startDate ?? ""} – ${h.end_date ?? h.endDate ?? ""}`,
                    registrations: h.registrations ?? h.participant_count ?? h.participantCount ?? "—",
                    type: h.type ?? "zap",
                })),
                categories: d.categories ?? FALLBACK_CONTENT.categories,
            };
        } catch {
            return FALLBACK_CONTENT;
        }
    },

    getLeaderboard: async () => {
        try {
            const res = await api.get("/landing/leaderboards");
            const list = res.data?.data ?? res.data?.leaderboard ?? res.data ?? [];
            return list.map((u: any, i: number) => ({
                rank: u.rank ?? i + 1,
                name: u.username ?? u.name ?? u.full_name ?? `@user${i + 1}`,
                pts: u.points_display ?? `${u.points ?? u.score ?? 0} pts`,
                pct: u.percentage ?? Math.max(10, 90 - i * 15),
                img: u.avatar ?? u.profile_image ?? `https://i.pravatar.cc/100?u=${u.id ?? i}`,
            }));
        } catch {
            return FALLBACK_LEADERBOARD;
        }
    },

    getReviews: async () => {
        try {
            const res = await api.get("/landing/reviews");
            const list = res.data?.data ?? res.data?.reviews ?? res.data ?? [];
            return list.map((r: any) => ({
                name: r.name ?? r.reviewer_name ?? r.full_name ?? "User",
                role: r.role ?? r.reviewer_role ?? "Developer",
                text: r.text ?? r.review ?? r.content ?? "",
            }));
        } catch {
            return FALLBACK_REVIEWS;
        }
    },
};
