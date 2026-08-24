import { z } from "zod";

const BaseCurriculumItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["topic-documentation", "topic-video", "practical-video", "interview-questions", "video", "reading", "assessment"]),
  duration: z.string().optional(), // e.g., "12:45"
  questions: z.number().optional(), // for assessments
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
  category: z.string(),
  description: z.string(),
  longDescription: z.string(),
  level: z.string(),
  modulesCount: z.number(),
  duration: z.string(),
  thumbnail: z.string(),
  takeaways: z.array(z.string()),
  include: z.array(z.object({
    icon: z.string(),
    text: z.string()
  })),
  curriculum: z.array(ModuleSchema),
  isEnrolled: z.boolean().default(false),
  hasPaid: z.boolean().default(false),
  price: z.number().optional(),
  courseCompletionPercentage: z.number().min(0).max(100).optional(),
});

export type CourseDetail = z.infer<typeof CourseDetailSchema>;
export type CourseModule = z.infer<typeof ModuleSchema>;