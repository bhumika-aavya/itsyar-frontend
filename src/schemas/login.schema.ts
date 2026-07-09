import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .email("Please enter a valid email"),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),

  role: z.enum(
    ["student", "participant", "organizer", "admin", "mentor/judge"],
    {
      errorMap: () => ({ message: "Please select a valid role" }),
    }
  ),
});

export type LoginFormValues = z.infer<typeof loginSchema>;