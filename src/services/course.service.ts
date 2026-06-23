import api from "@/lib/axios";
import { CertificateData, Course, MyCourse } from "@/schemas/course.schema";
import { CourseDetail } from "./course-detail.schema";

// Helper to get headers with the token
const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
        },
    };
};

export const CourseService = {
    getAllCourses: async (): Promise<Course[]> => {
        try {
            // Passing the auth headers in the request config
            const response = await api.get("/courses", getAuthHeaders());
            return response.data.courses;
        } catch (error) {
            console.warn("API Error: Falling back to mock data for Catalog");
            throw new Error("Course not found"); // Let the component handle the error state
        }
    },

    getMyCourses: async (): Promise<MyCourse[]> => {
        try {
            const response = await api.get("/courses/my", getAuthHeaders());
            return response.data.courses;
        } catch (error) {
            console.warn("API Error: Falling back to mock data for My Learning");
            throw new Error("Course not found"); // Let the component handle the error state

        }
    },

    getCourseById: async (id: string): Promise<CourseDetail> => {
        try {
            const response = await api.get(`/courses/${id}`, getAuthHeaders());
            return response.data.data;
        } catch (error) {
            console.warn(`API Error: Falling back to mock data for course ${id}`);
            throw new Error("Course not found"); // Let the component handle the error state
        }
    },
    getCertificate: async (courseId: string): Promise<CertificateData> => {
        try {
            const response = await api.get(`/courses/${courseId}/certificate`);
            return response.data.certificate;
        } catch (error) {
            console.warn("API Error: Falling back to mock certificate data");
            return {
                certificateId: `ITS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                courseTitle: "Python Programming for Beginners",
                studentName: "John Doe", // Fallback
                issueDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                instructorName: "Team NeuralNinjas"
            };
        }
    },
    enrollInCourse: async (courseId: string) => {
        try {
            const response = await api.post(`/courses/${courseId}/enroll`, {}, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.warn("API Error: Enrollment simulated via mock");
            return { success: true };
        }
    }
};