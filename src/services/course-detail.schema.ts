import { z } from "zod";

const CurriculumItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["video", "reading", "assessment"]),
  duration: z.string().optional(), // e.g., "12:45"
  questions: z.number().optional(), // for assessments
});

const ModuleSchema = z.object({
  id: z.union([z.string(), z.number()]).transform((v) => String(v)),
  moduleId: z.string().optional(),
  courseId: z.string().optional(),
  order: z.number().optional(),
  title: z.string(),
  duration: z.string().optional(),
  summary: z.string().optional(),
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
  courseCompletionPercentage: z.number().min(0).max(100).optional(),
});

export type CourseDetail = z.infer<typeof CourseDetailSchema>;
export type CourseModule = z.infer<typeof ModuleSchema>;