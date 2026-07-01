import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";

export const DashboardService = {
    getOverview: async () => {
        try {
            const response = await api.get('/dashboard/overview', getAuthHeaders());
            return response.data;
        } catch {
            return {
                streak: 12,
                totalXP: 4850,
                weeklyGoalPct: 85,
                myCourses: [
                    { id: '1', title: 'Advanced Python Mastery', tag: 'Python Core', currentLesson: 'Decorators & Generators', progress: 64 },
                    { id: '2', title: 'Modern Web Development', tag: 'Frontend', currentLesson: 'Tailwind UI Systems', progress: 42 },
                ],
                upcoming: [
                    { id: '1', type: 'quiz', title: 'Algorithm Quiz', subtitle: 'Data Structures 101', date: 'Due in 4 hours', urgent: true },
                    { id: '2', type: 'project', title: 'Project Submission', subtitle: 'Python Mastery', date: 'Tomorrow, 11:59 PM', urgent: false },
                    { id: '3', type: 'meeting', title: 'Mentor Meeting', subtitle: 'Career Coaching', date: 'Friday, 10:00 AM', urgent: false },
                ],
                studyActivity: [
                    { day: 'Mon', hours: 2.2 }, { day: 'Tue', hours: 3.6 }, { day: 'Wed', hours: 4.1 },
                    { day: 'Thu', hours: 5.6 }, { day: 'Fri', hours: 3.0 }, { day: 'Sat', hours: 1.8 }, { day: 'Sun', hours: 2.7 },
                ],
                badges: [
                    { key: 'speed', label: 'SPEED', icon: '⚡' },
                    { key: 'logic', label: 'LOGIC', icon: '🧠' },
                    { key: '7day', label: '7-DAY', icon: '📅' },
                ],
                roadmap: [
                    { step: 1, title: 'HTML/CSS Basics', status: 'completed' },
                    { step: 2, title: 'JavaScript ES6+', status: 'in-progress' },
                    { step: 3, title: 'React Framework', status: 'next' },
                ],
            };
        }
    },
};
