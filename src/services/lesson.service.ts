import api from "@/lib/axios";
import { LessonData, QuizData } from "@/schemas/lesson.schema";

// 1. Expanded Mock Database to support multiple individual lessons
const LESSON_MOCKS: Record<string, LessonData> = {
    "intro": {
        id: "intro",
        title: "Course Introduction",
        videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
        summary: "Welcome to the course! In this introductory lesson, we cover the roadmap and goals.",
        course_completion_percentage: 5,
        materials: [
            { id: "m0", title: "Course Roadmap", type: "pdf", meta: "1.2 MB" }
        ]
    },
    "1-1": {
        id: "1-1",
        title: "Lesson 1.1: What is AI?",
        videoUrl: "https://www.youtube.com/watch?v=ad79nYk2keg",
        summary: "A fundamental look at Artificial Intelligence and its impact on the modern world.",
        course_completion_percentage: 10,
        materials: []
    },
    "3-1": {
        id: "3-1",
        title: "Lesson 3.1: Introduction to RNNs",
        videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw",
        summary: "Recurrent Neural Networks (RNNs) are a type of neural network designed for processing sequential data...",
        course_completion_percentage: 35,
        materials: [
            { id: "m1", title: "PDF Lecture Notes", type: "pdf", meta: "4.2 MB" }
        ]
    },
    "3-2": {
        id: "3-2",
        title: "Lesson 3.2: LSTMs and GRUs",
        videoUrl: "https://www.youtube.com/watch?v=WCUNPb-5EYI", // LSTM specific video
        summary: "Deep dive into Long Short-Term Memory (LSTM) and Gated Recurrent Units (GRU). Learn how these architectures solve the vanishing gradient problem in standard RNNs.",
        course_completion_percentage: 45,
        materials: [
            { id: "m3", title: "LSTM Architecture PDF", type: "pdf", meta: "2.1 MB" }
        ]
    },
    "2-1": {
        id: "2-1",
        title: "Lesson 2.1: Intro to CNNs",
        videoUrl: "https://www.youtube.com/watch?v=YRhxdVk_sIs", // CNN Tutorial
        summary: "Introduction to Convolutional Neural Networks. Understanding filters, kernels, and spatial hierarchies in image processing.",
        course_completion_percentage: 20,
        materials: [
            { id: "m4", title: "CNN Visualizer", type: "link", meta: "EXTERNAL TOOL" }
        ]
    }
};

const MOCK_QUIZ: QuizData = {
    id: "q1",
    title: "Module Test: Introduction to RNNs",
    path: "Foundational Deep Learning Path",
    timeLimit: 10,
    questions: [
        {
            id: "q_1",
            text: "What is the vanishing gradient problem in the context of RNNs, and how does it typically manifest?",
            options: [
                "Gradients shrink exponentially through long sequences, making it difficult to learn long-range dependencies.",
                "The weights become too large during training, causing overflows.",
                "The network overfits to noise in the training data.",
                "It refers to data loss in network packets during distributed training."
            ],
            correctAnswer: 0
        }
    ]
};

export const LessonService = {
    getLessonDetails: async (lessonId: string): Promise<LessonData> => {
        try {
            // Lower the timeout for the real API call so it fails faster and hits the mock
            const response = await api.get(`/lessons/${lessonId}`, { timeout: 2000 });
            return response.data.lesson;
        } catch (error) {
            // This is actually working correctly! It's finding the error and giving you mock data.
            console.log(`Using Mock Data for: ${lessonId}`);
            return LESSON_MOCKS[lessonId] || LESSON_MOCKS["intro"];
        }
    },

    getModuleQuiz: async (lessonId: string): Promise<QuizData> => {
        try {
            const response = await api.get(`/lessons/${lessonId}/quiz`);
            return response.data.quiz;
        } catch (error) {
            console.warn("API Error: Falling back to Mock Quiz Data");
            return MOCK_QUIZ;
        }
    },

    submitQuiz: async (quizId: string, answers: number[]) => {
        const response = await api.post(`/quizzes/${quizId}/submit`, { answers });
        return response.data;
    }
};