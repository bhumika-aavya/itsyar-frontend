import api from "@/lib/axios";
import { QuizData } from "@/schemas/lesson.schema";
import { getAuthHeaders } from "./auth";

import { CourseService } from "./course.service";

export const LessonService = {
    getLessonDetails: async (courseId: string): Promise<any> => {
        try {
            // return unified course data
            const course = await CourseService.getCourseById(courseId);
            return course;
        } catch (error) {
            console.log(`Using mock data for course: ${courseId}`);
            const course = await CourseService.getCourseById(courseId);
            return course;
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
