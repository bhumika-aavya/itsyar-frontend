import { z } from "zod";

export const MaterialSchema = z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(["pdf", "link"]),
    size: z.string().optional(),
    meta: z.string(),
    url: z.string().optional(),
});

export const LessonSchema = z.object({
    id: z.string(),
    title: z.string(),
    videoUrl: z.string().url(),
    summary: z.string(),
    materials: z.array(MaterialSchema),
    courseCompletionPercentage: z.number().min(0).max(100),
});

export const QuizQuestionSchema = z.object({
    id: z.string(),
    text: z.string(),
    options: z.array(z.string()),
    correctAnswer: z.number(),
});

export const QuizSchema = z.object({
    id: z.string(),
    title: z.string(),
    path: z.string(),
    timeLimit: z.number(), // in minutes
    questions: z.array(QuizQuestionSchema),
});

export type LessonData = z.infer<typeof LessonSchema>;
export type QuizData = z.infer<typeof QuizSchema>;
export type Material = z.infer<typeof MaterialSchema>;