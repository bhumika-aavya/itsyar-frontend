import api from "@/lib/axios";
import { QuizData } from "@/schemas/lesson.schema";
import { getAuthHeaders } from "./auth";

export const LessonService = {
    getLessonDetails: async (courseId: string): Promise<any> => {
        try {
            const response = await api.get(`/courses/${courseId}/modules`, getAuthHeaders());
            return response.data.course;
        } catch (error) {
            console.log(`Using mock data for course: ${courseId}`);
        }
    },

    getModuleQuiz: async (courseId: string, lessonId: string): Promise<QuizData | undefined> => {
        try {
            const response = await api.get(`/courses/${courseId}/modules/${lessonId}/quiz`, getAuthHeaders());
            return response.data.quiz;
        } catch (error) {
            console.warn("API error: falling back to mock quiz data");
            return undefined;
        }
    },

    submitQuiz: async (quizId: string, answers: number[]) => {
        const response = await api.post(`/quizzes/${quizId}/submit`, { answers }, getAuthHeaders());
        return response.data;
    }
};
