import { z } from "zod";

export const CourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  tag: z.string(),
  duration: z.string(),
  instructor: z.string(),
  description: z.string(),
  image: z.string().url(),
  badge: z.string().optional(),
  enrolled: z.boolean().default(false),
});

export const MyCourseSchema = z.object({
  _id: z.string(),
  title: z.string(),
  level: z.string(),
  lessons: z.string(),
  progress: z.number().min(0).max(100),
  category: z.enum(["code", "layout", "database"]),
});

export type Course = z.infer<typeof CourseSchema>;
export type MyCourse = z.infer<typeof MyCourseSchema>;