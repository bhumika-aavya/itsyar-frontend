import { z } from "zod";

export const HackathonStatusSchema = z.string();

export const HackathonSchema = z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: HackathonStatusSchema,
    iconType: z.string().optional(),
    iconBg: z.string().optional(),
    isRegistered: z.boolean().optional(),
    isSubmit: z.boolean().optional(),
    isPublished: z.boolean().optional(),
});

export const HackathonDetailSchema = z.object({
    id: z.string(),
    title: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    status: z.string(),
    description: z.string(),
    teamSize: z.string(),
    registrationsDeadline: z.string(),
    mode: z.string(),
    platform: z.string().optional(),
    foundryLink: z.string().optional(),
    iconType: z.string().optional(),
    participantCount: z.string(),
    timeline: z.array(z.object({
        label: z.string(),
        date: z.string(),
        type: z.enum(["event", "phase"]).optional(),
        description: z.string().optional(),
    })),
    ideationStartDate: z.string().optional(),
    ideationEndDate: z.string().optional(),
    isRegistered: z.boolean().optional(),
    isSubmit: z.boolean().optional(),
    isPublished: z.boolean().optional(),
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

export const HackathonTestCaseSchema = z.object({
    id: z.string(),
    label: z.string(),
    stdin: z.string(),
    expectedOutput: z.string(),
    isHidden: z.boolean().optional(),
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
    testCases: z.array(HackathonTestCaseSchema).optional(),
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

export const SaveProgressSchema = z.object({
    language: z.string(),
    code: z.string(),
    // When present, progress is shared across the whole team so a teammate
    // who resumes later (even on their own device) picks up from here too.
    teamId: z.string().optional(),
});

export const SaveProgressResponseSchema = z.object({
    saved: z.boolean(),
    savedAt: z.string().optional(),
});

export type HackathonDetail = z.infer<typeof HackathonDetailSchema>;
export type Hackathon = z.infer<typeof HackathonSchema>;
export type HackathonStatus = z.infer<typeof HackathonStatusSchema>;
export type HackathonRegistrationValues = z.infer<typeof HackathonRegistrationSchema>;
export type TeamMember = z.infer<typeof TeamMemberSchema>;
export type Team = z.infer<typeof TeamSchema>;
export type CreateTeamValues = z.infer<typeof CreateTeamSchema>;
export const MentorSubmissionSchema = z.object({
    submissionId: z.string(),
    hackathonId: z.string(),
    hackathonTitle: z.string(),
    participantName: z.string(),
    participantEmail: z.string(),
    language: z.string(),
    code: z.string(),
    notes: z.string().optional(),
    status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'SUBMITTED', 'UNDER_REVIEW', 'EVALUATED']),
    submittedAt: z.string(),
    reviewNotes: z.string().optional(),
    reviewedAt: z.string().optional(),
    scores: z.object({
        innovation: z.number(),
        technicalFeasibility: z.number(),
        uiUx: z.number(),
        accessibility: z.number()
    }).optional(),
    weightedScore: z.number().optional(),
    problemStatement: z.string().optional(),
    hackathonDescription: z.string().optional(),
    teamName: z.string().optional(),
    userName: z.string().optional(),
    userEmail: z.string().optional(),
});

export const MentorReviewSchema = z.object({
    status: z.enum(['ACCEPTED', 'REJECTED']),
    reviewNotes: z.string().min(10, 'Please provide at least 10 characters of feedback'),
});

export type HackathonProblem = z.infer<typeof HackathonProblemSchema>;
export type HackathonTestCase = z.infer<typeof HackathonTestCaseSchema>;
export type SubmitSolutionValues = z.infer<typeof SubmitSolutionSchema>;
export type SubmitSolutionResponse = z.infer<typeof SubmitSolutionResponseSchema>;
export type SaveProgressValues = z.infer<typeof SaveProgressSchema>;
export type SaveProgressResponse = z.infer<typeof SaveProgressResponseSchema>;
export type MentorSubmission = z.infer<typeof MentorSubmissionSchema>;
export type MentorReviewValues = z.infer<typeof MentorReviewSchema>;

export const HackathonCriteriaSchema = z.object({
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    weight: z.coerce.number().min(1, 'Weight is required').max(100, 'Weight cannot exceed 100'),
});

export const HackathonFaqSchema = z.object({
    q: z.string().min(1, 'Question is required'),
    a: z.string().min(1, 'Answer is required'),
});

export const HackathonPrizeSchema = z.object({
    rank: z.string().min(1, 'Rank is required'),
    amount: z.string().min(1, 'Amount is required'),
    perk: z.string().optional(),
});

export const HackathonTimelineItemSchema = z.object({
    date: z.string().min(1, 'Date is required'),
    description: z.string().optional(),
});

export type HackathonCriteriaValues = z.infer<typeof HackathonCriteriaSchema>;
export type HackathonFaqValues = z.infer<typeof HackathonFaqSchema>;
export type HackathonPrizeValues = z.infer<typeof HackathonPrizeSchema>;
export type HackathonTimelineItemValues = z.infer<typeof HackathonTimelineItemSchema>;

export const OrganizerJudgeSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
});

export type OrganizerJudgeValues = z.infer<typeof OrganizerJudgeSchema>;

export const OrganizerCreateHackathonSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(20, 'Description must be at least 20 characters'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    platform: z.enum(['foundry', 'standard']),
    foundryLink: z.string().optional(),
    iconType: z.string().optional(),
    registrationsDeadline: z.string().min(1, 'Registration deadline is required'),
    difficultyLevel: z.string().min(1, 'Difficulty level is required'),
    rulesText: z.string().optional(),
    pricing: z.string().min(1, 'Pricing is required'),
    judges: z.array(OrganizerJudgeSchema).default([]),
    criteria: z.array(HackathonCriteriaSchema).default([]),
    prizes: z.array(HackathonPrizeSchema).default([]),
    faqs: z.array(HackathonFaqSchema).default([]),
    timeline: z.array(HackathonTimelineItemSchema).default([]),
});

export const OrganizerCreateProblemSchema = z.object({
    title: z.string().min(3, 'Problem title required'),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    points: z.coerce.number().min(1, 'Points must be at least 1'),
    description: z.string().min(20, 'Problem description required'),
    constraintsText: z.string().optional(),
    supportedLanguages: z.array(z.string()).min(1, 'Select at least one language'),
});

export type OrganizerCreateHackathonValues = z.infer<typeof OrganizerCreateHackathonSchema>;
export type OrganizerCreateProblemValues = z.infer<typeof OrganizerCreateProblemSchema>;
