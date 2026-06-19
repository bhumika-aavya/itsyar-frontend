import { z } from "zod";

export const registerSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    // interest: z.string().min(1, "Please select an interest"),
    userType: z.enum(["Student", "Working Professional", "Other"], {
        errorMap: () => ({ message: "Please select your current role" }),
    }),
    acceptTerms: z.literal(true, {
        errorMap: () => ({ message: "You must accept the terms" }),
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;