import api from "@/lib/axios";
import { QuizData } from "@/schemas/lesson.schema";

const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
        headers: {
            Authorization: token ? `Bearer ${token}` : "",
        },
    };
};

const MOCK_COURSE_DATA = {
    id: "1",
    title: "Welcome to the World of Palantir",
    description: "An introductory course designed to familiarize learners with the Palantir ecosystem, including Foundry, data integration, analytics, and real-world applications.",
    curriculum: [
        {
            id: 1,
            title: "Welcome to the World of Palantir",
            lessons: [
                {
                    id: "1-1",
                    title: "Welcome to the World of Palantir",
                    videoUrl: "https://aavya.palantirfoundry.com/workspace/preview-app/ri.blobster.main.video.7fd1176e-db42-47ad-b611-f5e65a3a9afb",
                    summary: "This course provides a foundational overview of Palantir's data integration and analytics platforms, designed for analysts, engineers, and business users new to the ecosystem. Participants will learn the core concepts behind Palantir's approach to connecting, transforming, and operationalizing data across an organization. By the end of the course, participants will understand what Palantir does through hands-on examples and learners will get to explore how to navigate the interface, work with datasets, and turn data into operational decisions.",
                    materials: [
                        {
                            id: "m-1-pdf",
                            title: "Course PDF Notes",
                            type: "pdf",
                            meta: "PDF Document",
                            url: "https://www.africau.edu/images/default/sample.pdf"
                        }
                    ]
                }
            ]
        }
    ]
};

const MOCK_QUIZ: QuizData = {
    id: "q1",
    title: "Module Test: Welcome to Palantir",
    path: "Foundational Palantir Path",
    timeLimit: 10,
    questions: [
        {
            id: "q_1",
            text: "What is Palantir Foundry primarily designed for?",
            options: [
                "Data integration, analytics, and operational decision-making at scale.",
                "Social media management and content scheduling.",
                "Cloud gaming and multimedia streaming.",
                "E-commerce and payment gateway processing."
            ],
            correctAnswer: 0
        }
    ]
};

export const LessonService = {
    getLessonDetails: async (courseId: string): Promise<any> => {
        try {
            const response = await api.get(`/courses/${courseId}/modules`, getAuthHeaders());
            return response.data.course;
        } catch (error) {
            console.log(`Using mock data for course: ${courseId}`);
            return MOCK_COURSE_DATA;
        }
    },

    getModuleQuiz: async (courseId: string, lessonId: string): Promise<QuizData> => {
        try {
            const response = await api.get(`/courses/${courseId}/modules/${lessonId}/quiz`, getAuthHeaders());
            return response.data.quiz;
        } catch (error) {
            console.warn("API error: falling back to mock quiz data");
            return MOCK_QUIZ;
        }
    },

    submitQuiz: async (quizId: string, answers: number[]) => {
        const response = await api.post(`/quizzes/${quizId}/submit`, { answers }, getAuthHeaders());
        return response.data;
    }
};
