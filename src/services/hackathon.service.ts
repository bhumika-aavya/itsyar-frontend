import api from "@/lib/axios";
import { Hackathon, HackathonDetail } from "@/schemas/hackathon.schema";

const MOCK_HACKATHONS: Hackathon[] = [
    { id: "h1", title: "CodeSprint 2024", date: "21 May 2024", status: "COMPLETED" },
    { id: "h2", title: "AI Innovate Hack", date: "16 June 2025", status: "COMPLETED" },
    { id: "h3", title: "Web Wizards Challenge", date: "21 July 2025", status: "ON-GOING" },
    { id: "h4", title: "BlockBuilders", date: "25 Aug 2025", status: "OPEN" },
    { id: "h5", title: "InnovateX", date: "06 Nov 2025", status: "ON-GOING" },
    { id: "h6", title: "AI Innova Challenge", date: "10 Jan 2026", status: "COMPLETED" },
    { id: "h7", title: "CodeSprint 2024", date: "15 May 2026", status: "OPEN" },
];

const MOCK_DETAIL: HackathonDetail = {
    id: "h7",
    title: "Code Sprint 2026",
    startDate: "21 May 2026",
    endDate: "30 May 2026",
    status: "OPEN",
    description: "CodeSprint 2024 is an elite coding competition designed for developers to showcase their creative problem-solving skills and technical expertise. Join a global community of innovators to build functional prototypes in under 48 hours.",
    teamSize: "1-4 Members",
    registrationDeadline: "20 May 2026",
    mode: "Online",
    participantCount: "1250+",
    rules: [
        "Teams must consist of 1-4 members.",
        "All code must be written during the hackathon period.",
        "Use of open-source libraries is permitted but must be disclosed.",
        "Plagiarism will lead to immediate disqualification."
    ],
    prices: [
        { rank: "1st Place", amount: "$5,000", perk: "Internship Interview at ForgeInsight" },
        { rank: "2nd Place", amount: "$2,500", perk: "Foundry Certification Voucher" },
        { rank: "3rd Place", amount: "$1,000", perk: "Premium Swag Kit" }
    ],
    faqs: [
        { q: "Is there a registration fee?", a: "No, participation in Code Sprint 2026 is completely free." },
        { q: "Can I participate alone?", a: "Yes, you can join as a solo participant or in a team of up to 4." },
        { q: "What tech stack should I use?", a: "You are free to use any stack as long as it solves the problem statement." }
    ],
    timeline: [
        { label: "Registration Starts", date: "01 May 2026" },
        { label: "Registration Ends", date: "20 May 2026" },
        { label: "Hackathon Starts", date: "21 May 2026" },
        { label: "Hackathon Ends", date: "30 May 2026" },
        { label: "Winner Announcement", date: "02 June 2026" },
    ]
};

export const HackathonService = {
    getHackathons: async (): Promise<Hackathon[]> => {
        try {
            const response = await api.get("/hackathons");
            return response.data.hackathons;
        } catch (error) {
            console.warn("API Error: Falling back to mock Hackathon data");
            return MOCK_HACKATHONS;
        }
    },

    joinHackathon: async (id: string) => {
        return (await api.post(`/hackathons/${id}/join`)).data;
    },

    getHackathonById: async (id: string): Promise<HackathonDetail> => {
        try {
            const response = await api.get(`/hackathons/${id}`);
            return response.data.hackathon;
        } catch (error) {
            console.warn("Using Mock Detail for ID:", id);
            return MOCK_DETAIL;
        }
    }
};