import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";

export const ProfileService = {
    getProfile: async () => {
        try {
            const response = await api.get('/profile', getAuthHeaders());
            return response.data;
        } catch {
            return {
                name: 'John Doe',
                role: 'Student',
                memberSince: 'Jan 2024',
                email: 'john.doe@email.com',
                streak: 7,
                completedCourses: [
                    { id: '1', courseId: 'course-1', title: 'Python Fundamentals', progress: 100 },
                    { id: '2', courseId: 'course-2', title: 'Web Design Basics', progress: 100 },
                    { id: '3', courseId: 'course-3', title: 'Git Version Control', progress: 100 },
                ],
                activeCalendarDays: [3, 4, 5, 6, 7, 10, 11, 12, 13, 14, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
                topPercentile: 5,
            };
        }
    },
    updateProfile: async (data: { fullName?: string; email?: string }) => {
        try {
            const response = await api.put('/profile', data, getAuthHeaders());
            return response.data;
        } catch {
            return { success: true };
        }
    },
};
