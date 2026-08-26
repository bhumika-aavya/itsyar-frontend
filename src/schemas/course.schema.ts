import { z } from "zod";

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  level: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  instructor: z.string().nullable().optional(),
  lessonCount: z.number().nullable().optional(),
  duration: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  enrolled: z.boolean().default(false),
  hasPaid: z.boolean().default(false),
  // Legacy UI mappings (fallbacks)
  tag: z.string().optional(),
  image: z.string().optional(),
  badge: z.string().optional(),
  price: z.number().optional(),
  pricing: z.union([z.string(), z.number()]).optional(),
});

export const MyCourseSchema = z.object({
  id: z.string(),
  courseId: z.string().optional(),
  title: z.string(),
  level: z.string().nullable().optional(),
  lessons: z.string().nullable().optional(),
  courseCompletionPercentage: z.number().min(0).max(100),
  category: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  enrolledAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
});

export const CertificateSchema = z.object({
  certificateId: z.string(),
  courseTitle: z.string(),
  studentName: z.string(),
  issueDate: z.string(),
  instructorName: z.string(),
});

export type CertificateData = z.infer<typeof CertificateSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type MyCourse = z.infer<typeof MyCourseSchema>;
