import api from "@/lib/axios";
import { LessonData, QuizData } from "@/schemas/lesson.schema";

// 1. Expanded Mock Database to support multiple individual lessons
const LESSON_MOCKS: Record<string, LessonData> = {
    "3-1": {
        id: "3-1",
        title: "Lesson 3.1: Introduction to RNNs",
        videoUrl: "https://www.youtube.com/watch?v=rfscVS0vtbw", // Python RNN Tutorial
        summary: "Recurrent Neural Networks (RNNs) are a type of neural network designed for processing sequential data. This video introduces the core concept of recurrence and explains how RNNs use previous states to handle dependencies.",
        course_completion_percentage: 35,
        materials: [
            { id: "m1", title: "PDF Lecture Notes", type: "pdf", meta: "4.2 MB • PDF DOCUMENT" },
            { id: "m2", title: "RNN Implementation", type: "link", meta: "GOOGLE COLAB" }
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
            const response = await api.get(`/lessons/${lessonId}`);
            return response.data.lesson;
        } catch (error) {
            console.warn(`API Error: Falling back to Mock Lesson Data for ID: ${lessonId}`);
            // Return the specific lesson from our mock DB, or default to the first one
            return LESSON_MOCKS[lessonId] || LESSON_MOCKS["3-1"];
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