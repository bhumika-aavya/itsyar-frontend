import { z } from "zod";

const BaseCurriculumItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["topic-documentation", "topic-video", "practical-video", "interview-questions", "video", "reading", "assessment"]),
  duration: z.string().optional(), // e.g., "12:45"
  questions: z.number().optional(), // for assessments
  url: z.string().optional(),
});

const CurriculumItemSchema = BaseCurriculumItemSchema.extend({
  subItems: z.array(BaseCurriculumItemSchema).optional()
});

const ModuleSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  moduleId: z.string().optional(),
  courseId: z.string().optional(),
  order: z.number().optional(),
  title: z.string(),
  duration: z.string().optional(),
  summary: z.string().optional(),
  progress: z.number().optional(),
  status: z.enum(["Completed", "In Progress", "Upcoming"]).optional(),
  items: z.array(CurriculumItemSchema).nullable().optional(),
});

export const CourseDetailSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  category: z.string().optional(),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  level: z.string().optional(),
  modulesCount: z.number().optional(),
  duration: z.string().nullable().optional(),
  thumbnail: z.string().optional(),
  takeaways: z.array(z.string()).optional(),
  include: z.array(z.object({
    icon: z.string(),
    text: z.string()
  })).optional(),
  curriculum: z.array(ModuleSchema).optional(),
  isEnrolled: z.boolean().default(false),
  hasPaid: z.boolean().default(false),
  price: z.number().optional(),
  courseCompletionPercentage: z.number().min(0).max(100).optional(),
});

// New API Types
export type ApiAsset = {
  type: "documentation" | "video" | "practical_video" | "interview_pdf";
  title: string;
  duration: string | null;
  url?: string;
};

export type ApiTopic = {
  topicId: string;
  title: string;
  sequenceOrder: string;
  topicSummary?: string;
  assets: ApiAsset[];
};

export type ApiModuleDetail = {
  moduleId: string;
  moduleTitle: string;
  moduleSummary: string;
  topics: ApiTopic[];
  courseCompletionPercentage?: number;
  selectedTopicId?: string;
};

export type ApiModuleList = {
  moduleId: string;
  title: string;
  summary: string;
  topics: string[];
  topicCount: number;
  totalDuration: string;
  progressPercentage: number;
  topicsCompleted: number;
};

export type CourseDetail = z.infer<typeof CourseDetailSchema>;
export type CourseModule = z.infer<typeof ModuleSchema>;
