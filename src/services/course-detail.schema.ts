import { z } from "zod";

const CurriculumItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: z.enum(["video", "reading", "assessment"]),
  duration: z.string().optional(), // e.g., "12:45"
  questions: z.number().optional(), // for assessments
});

const ModuleSchema = z.object({
  id: z.string(),
  order: z.number(),
  title: z.string(),
  items: z.array(CurriculumItemSchema),
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
  includes: z.array(z.object({
    icon: z.string(),
    text: z.string()
  })),
  curriculum: z.array(ModuleSchema),
  isEnrolled: z.boolean().default(false),
});

export type CourseDetail = z.infer<typeof CourseDetailSchema>;
export type CourseModule = z.infer<typeof ModuleSchema>;