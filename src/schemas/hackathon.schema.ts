import { z } from "zod";

export const HackathonStatusSchema = z.enum(["OPEN", "ON-GOING", "COMPLETED"]);

export const HackathonSchema = z.object({
    id: z.string(),
    title: z.string(),
    date: z.string(),
    status: HackathonStatusSchema,
});

export const HackathonDetailSchema = z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.string(),
    description: z.string(),
    teamSize: z.string(),
    registrationDeadline: z.string(),
    mode: z.string(),
    participantCount: z.string(),
    timeline: z.array(z.object({
        label: z.string(),
        date: z.string()
    }))
});

export const HackathonRegistrationSchema = z.object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    role: z.string().min(1, "Role is required"),
    agreeToRules: z.literal(true, {
        errorMap: () => ({ message: "You must agree to the rules" }),
    }),
    consentToOrganizers: z.boolean().default(false),
});

export type HackathonDetail = z.infer<typeof HackathonDetailSchema>;
export type Hackathon = z.infer<typeof HackathonSchema>;
export type HackathonStatus = z.infer<typeof HackathonStatusSchema>;
export type HackathonRegistrationValues = z.infer<typeof HackathonRegistrationSchema>;