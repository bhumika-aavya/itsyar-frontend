import api from "@/lib/axios";
import { Course, MyCourse } from "@/schemas/course.schema";

export const CourseService = {
    // Get all available courses
    getAllCourses: async (): Promise<Course[]> => {
        const response = await api.get("/courses");
        return response.data.courses;
    },

    // Get courses current user is enrolled in
    getMyCourses: async (): Promise<MyCourse[]> => {
        const response = await api.get("/courses/my-learning");
        return response.data.myCourses;
    },

    // Enroll in a new course
    enrollInCourse: async (courseId: string) => {
        const response = await api.post(`/courses/${courseId}/enroll`);
        return response.data;
    }
};