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

export type HackathonDetail = z.infer<typeof HackathonDetailSchema>;
export type Hackathon = z.infer<typeof HackathonSchema>;
export type HackathonStatus = z.infer<typeof HackathonStatusSchema>;