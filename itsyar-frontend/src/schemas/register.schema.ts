import { z } from "zod";

export const registerSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    interest: z.string().min(1, "Please select your field of interest"),
    userType: z.enum(["Student", "Working Professional", "Other"], {
        errorMap: () => ({ message: "Please select your current role" }),
    }),
    acceptTerms: z.literal(true, {
        errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"], // This points the error to the confirmPassword field
});

export type RegisterFormValues = z.infer<typeof registerSchema>;