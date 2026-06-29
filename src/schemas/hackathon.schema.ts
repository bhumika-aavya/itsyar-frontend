import { z } from "zod";

export const HackathonStatusSchema = z.enum(["Open", "Running", "COMPLETED", "UpComing"]);

export const HackathonSchema = z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: HackathonStatusSchema,
    iconType: z.string().optional(),
    iconBg: z.string().optional(),
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

export const TeamMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["LEAD", "MEMBER"]),
    status: z.enum(["JOINED", "INVITED"]),
});

export const TeamSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    hackathonId: z.string(),
    leadId: z.string(),
    members: z.array(TeamMemberSchema),
});

export const CreateTeamSchema = z.object({
    name: z.string().min(2, "Team name must be at least 2 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    hackathonId: z.string(),
    inviteEmails: z.array(z.string().email()).max(3),
});

export const HackathonProblemExampleSchema = z.object({
    label: z.string(),
    result: z.string(),
});

export const HackathonProblemSchema = z.object({
    id: z.string(),
    hackathonId: z.string(),
    title: z.string(),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    points: z.number(),
    description: z.string(),
    constraints: z.array(z.string()),
    examples: z.array(HackathonProblemExampleSchema),
    starterCode: z.record(z.string(), z.string()),
    supportedLanguages: z.array(z.string()),
});

export const SubmitSolutionSchema = z.object({
    language: z.string(),
    code: z.string().min(1, "Code is required"),
    notes: z.string().optional(),
});

export const SubmitSolutionResponseSchema = z.object({
    submissionId: z.string(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED']),
    message: z.string().optional(),
});

export type HackathonDetail = z.infer<typeof HackathonDetailSchema>;
export type Hackathon = z.infer<typeof HackathonSchema>;
export type HackathonStatus = z.infer<typeof HackathonStatusSchema>;
export type HackathonRegistrationValues = z.infer<typeof HackathonRegistrationSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type CreateTeamValues = z.infer<typeof CreateTeamSchema>;
export type HackathonProblem = z.infer<typeof HackathonProblemSchema>;
export type SubmitSolutionValues = z.infer<typeof SubmitSolutionSchema>;
export type SubmitSolutionResponse = z.infer<typeof SubmitSolutionResponseSchema>;
