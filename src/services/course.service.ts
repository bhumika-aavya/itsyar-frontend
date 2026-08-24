import api from "@/lib/axios";
import { capitalizeTitle } from "@/lib/utils";
import { CertificateData, Course, MyCourse } from "@/schemas/course.schema";
import { CourseDetail } from "./course-detail.schema";
import { getAuthHeaders } from "./auth";

const MOCK_MODULE_DEFINITIONS = [
    {
        title: "Good To Know",
        summary: "Master the foundational documentation and lifecycle processes required for modern software engineering.",
        topics: [
            "Software Development Lifecycle (SDLC)",
            "Product Requirement Documentation (PRD)",
            "Functional Requirement Documentation (FRD)",
            "Technical Requirement Documentation (TRD)"
        ]
    },
    {
        title: "Palantir Introduction",
        summary: "An introduction to the Palantir ecosystem and how it differs from traditional software development.",
        topics: [
            "Introductory Video",
            "Palantir Development v/s Legacy Software Development",
            "Roles and Responsibilities as Forward Deployed Engineer (FDE)"
        ]
    },
    {
        title: "Foundry Fundamentals",
        summary: "Learn the core architecture and basic concepts of Palantir Foundry.",
        topics: [
            "Foundry architecture",
            "Projects & folders",
            "Resources",
            "Datasets",
            "Branches",
            "Permissions"
        ]
    },
    {
        title: "Data Connections & Ingestion",
        summary: "Understand how to ingest and connect various data sources into Foundry.",
        topics: [
            "File upload",
            "CSV/Excel/JSON",
            "Source connections",
            "Batch ingestion",
            "Incremental ingestion",
            "Syncs",
            "Schema management"
        ]
    },
    {
        title: "Pipeline Builder",
        summary: "Master the Pipeline Builder to transform and prepare data for analysis.",
        topics: [
            "Creating pipelines",
            "Datasets",
            "Transforms",
            "Filters",
            "Joins",
            "Unions",
            "Aggregations",
            "Calculated columns",
            "Null handling",
            "Type conversion"
        ]
    }
];

const generateMockModules = () => MOCK_MODULE_DEFINITIONS.map((mod, i) => ({
    id: String(i + 1),
    moduleId: String(i + 1),
    order: i + 1,
    title: mod.title,
    summary: mod.summary,
    duration: "45 mins",
    progress: i === 0 ? 100 : (i === 1 ? 40 : 0),
    status: i === 0 ? "Completed" : (i === 1 ? "In Progress" : "Upcoming"),
    items: mod.topics.map((topicTitle, idx) => ({
        id: `topic-${i + 1}-${idx + 1}`,
        title: topicTitle,
        type: "topic-documentation",
        duration: "45 mins",
        subItems: [
            { id: `topic-${i + 1}-${idx + 1}-doc`, title: "Topic Documentation", type: "topic-documentation", duration: "10 mins" },
            { id: `topic-${i + 1}-${idx + 1}-vid`, title: "Topic Video", type: "topic-video", duration: "10 mins" },
            { id: `topic-${i + 1}-${idx + 1}-prac`, title: "Practical Walk Through Video", type: "practical-video", duration: "15 mins" },
            { id: `topic-${i + 1}-${idx + 1}-int`, title: "Interview Questions", type: "interview-questions", duration: "10 mins" }
        ]
    }))
}));

const getMockCourse = (id: string): CourseDetail => ({
    id: id,
    moduleId: "1",
    title: "Welcome To The World Of Palantir Foundry",
    category: "Foundational Engineering",
    description: "An introductory course designed to familiarize learners with the Palantir ecosystem, including Foundry, data integration, analytics, and real-world applications.",
    longDescription: "This course provides a foundational overview of the Software Development Lifecycle and the essential documentation practices expected from engineers. You will learn how to read, write, and execute based on PRDs, FRDs, and TRDs.",
    level: "Beginner",
    modulesCount: MOCK_MODULE_DEFINITIONS.length,
    duration: "15.54 hours",
    thumbnail: "",
    takeaways: [
        "Understand the Software Development Lifecycle (SDLC)",
        "Learn to read and write PRDs",
        "Understand Functional Requirement Documentation (FRD)",
        "Master Technical Requirement Documentation (TRD)"
    ],
    include: [
        { icon: "certificate", text: "Certificate of completion" },
        { icon: "code", text: "Practical examples" }
    ],
    curriculum: generateMockModules() as any,
    isEnrolled: true,
    hasPaid: true,
    price: 0,
    courseCompletionPercentage: 0
});

export const CourseService = {
    getAllCourses: async (): Promise<Course[]> => {
        try {
            // Passing the auth headers in the request config
            const response = await api.get("/courses", getAuthHeaders());
            const courses: Course[] = response.data.courses ?? [];
            return courses.map(c => ({
                ...c,
                title: capitalizeTitle(c.title ?? ""),
            }));
        } catch (error) {
            console.warn("API Error: Falling back to mock data for Catalog");
            throw new Error("Course not found"); // Let the component handle the error state
        }
    },

    getMyCourses: async (): Promise<MyCourse[]> => {
        try {
            const response = await api.get("/courses/my-learnings", getAuthHeaders());
            const courses: MyCourse[] = response.data.courses ?? [];
            return courses.map(c => ({
                ...c,
                title: capitalizeTitle(c.title ?? ""),
            }));
        } catch (error) {
            console.warn("API Error: Falling back to mock data for My Learning");
            throw new Error("Course not found"); // Let the component handle the error state

        }
    },

    getCourseById: async (id: string): Promise<CourseDetail> => {
        try {
            // const response = await api.get(`/courses/${id}`, getAuthHeaders());
            // const data: CourseDetail = response.data.data;
            // if (data && data.title) {
            //     data.title = capitalizeTitle(data.title);
            // }
            // return data;
            return getMockCourse(id);
        } catch (error) {
            console.warn(`API Error: Falling back to mock data for course ${id}`);
            return getMockCourse(id);
        }
    },
    getCertificate: async (courseId: string): Promise<CertificateData> => {
        try {
            const response = await api.get(`/courses/${courseId}/certificate`, getAuthHeaders());
            return response.data.certificate;
        } catch (error) {
            console.warn("API Error: Falling back to mock certificate data");
            return {
                certificateId: `ITS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                courseTitle: "Python Programming for Beginners",
                studentName: "John Doe", // Fallback
                issueDate: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
                instructorName: "Team NeuralNinjas"
            };
        }
    },
    enrollInCourse: async (courseId: string) => {
        try {
            const response = await api.post(`/courses/${courseId}/enroll`, {}, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.warn("API Error: Enrollment simulated via mock");
            return { success: true };
        }
    },
    updateProgress: async (courseId: string, lessonId: string, data: { playedSeconds: number; totalSeconds: number; isCompleted: boolean }) => {
        return await api.post(`/courses/${courseId}/lessons/${lessonId}/progress`, data);
    },

    getResults: async (): Promise<any[]> => {
        try {
            const response = await api.get('/courses/results', getAuthHeaders());
            return response.data.results;
        } catch (error) {
            console.warn("API Error: Falling back to mock results data");
            return [
                {
                    id: '1',
                    courseId: 'course-1',
                    title: 'Python Programming for Beginners',
                    category: 'Foundational Engineering',
                    completionDate: 'April 15, 2026',
                    status: 'passed',
                    score: 85,
                },
                {
                    id: '2',
                    courseId: 'course-2',
                    title: 'Machine Learning: Foundational Concepts',
                    category: 'Artificial Intelligence',
                    completionDate: 'May 20, 2026',
                    status: 'passed',
                    score: 92,
                },
            ];
        }
    },
};