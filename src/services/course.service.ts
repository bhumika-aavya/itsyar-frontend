import api from "@/lib/axios";
import { Course, MyCourse } from "@/schemas/course.schema";
import { CourseDetail } from "./course-detail.schema";


// High-quality dummy data for "All Courses"
const MOCK_COURSES: Course[] = [
    {
        _id: "c1",
        title: "Decentralized Apps with Solidity",
        tag: "Web3",
        duration: "6 Weeks",
        instructor: "Team NeuralNinjas",
        description: "Master the art of building secure smart contracts and full-stack dApps on Ethereum.",
        image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=800",
        badge: "New",
        enrolled: false
    },
    {
        _id: "c2",
        title: "UI/UX with React",
        tag: "Frontend",
        duration: "8 Weeks",
        instructor: "Team WebWizards",
        description: "Learn to bridge the gap between high-end design and high-performance frontend code.",
        image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=800",
        enrolled: false
    },
    {
        _id: "c3",
        title: "Cloud Native Architectures",
        tag: "Cloud",
        duration: "10 Weeks",
        instructor: "Team CodeCrafters",
        description: "Deep dive into Kubernetes, Docker, and serverless scaling strategies for global traffic.",
        image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800",
        enrolled: false
    },
    {
        _id: "c4",
        title: "Deep Learning & LLMs",
        tag: "AI/ML",
        duration: "12 Weeks",
        instructor: "Team NeuralNinjas",
        description: "Build, train, and deploy your own large language models and generative AI systems.",
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800",
        enrolled: false
    }
];

// High-quality dummy data for "My Courses"
const MOCK_MY_COURSES: MyCourse[] = [
    {
        _id: "m1",
        title: "Python Programming for Beginners",
        level: "Beginner",
        lessons: "12 Lessons",
        progress: 45,
        category: "code"
    },
    {
        _id: "m2",
        title: "Web Development Bootcamp",
        level: "Intermediate",
        lessons: "18 Lessons",
        progress: 15,
        category: "layout"
    }
];
const MOCK_COURSE_DETAILS: CourseDetail = {
    id: "c1",
    title: "Python Programming for Beginners",
    category: "DEVELOPMENT",
    description: "Master the fundamentals of Python with hands-on projects and real-world exercises. Start your coding journey with the most popular language today.",
    longDescription: "Python is the world's most popular language for data science, web development, and automation. This comprehensive course is designed for absolute beginners who want to build a rock-solid foundation in software engineering through Python programming.",
    level: "Beginner",
    modulesCount: 12,
    duration: "6 Weeks",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1200",
    takeaways: [
        "Master syntax, variables, and data structures from scratch.",
        "Build 5 real-world portfolio projects using Python.",
        "Learn object-oriented programming (OOP) principles.",
        "Automate repetitive tasks with custom scripts."
    ],
    curriculum: [
        {
            id: "m1",
            order: 1,
            title: "Introduction to Python",
            items: [
                { id: "l1", title: "The History & Use Cases of Python", type: "video", duration: "12:45" },
                { id: "l2", title: "Setting up your Development Environment", type: "video", duration: "15:20" },
                { id: "l3", title: "Module 1 Assessment", type: "assessment", questions: 10 },
            ]
        },
        { id: "m2", order: 2, title: "Variables and Data Types", items: [] },
        { id: "m3", order: 3, title: "Control Flow & Logic", items: [] }
    ],
    "includes": [{
        "text": "Certificate of completion",
        "icon": ""
    }],
};
export const CourseService = {
    getAllCourses: async (): Promise<Course[]> => {
        try {
            const response = await api.get("/courses");
            return response.data.courses;
        } catch (error) {
            console.warn("API Error: Falling back to mock data for Catalog");
            return MOCK_COURSES;
        }
    },

    getMyCourses: async (): Promise<MyCourse[]> => {
        try {
            const response = await api.get("/courses/my-learning");
            return response.data.myCourses;
        } catch (error) {
            console.warn("API Error: Falling back to mock data for My Learning");
            return MOCK_MY_COURSES;
        }
    },

    getCourseById: async (id: string): Promise<CourseDetail> => {
        try {
            const response = await api.get(`/courses/${id}`);
            return response.data.course;
        } catch (error) {
            console.warn(`API Error: Falling back to mock data for course ${id}`);
            // Return the specific mock or the first one available as a default
            return MOCK_COURSE_DETAILS;
        }
    },

    enrollInCourse: async (courseId: string) => {
        try {
            const response = await api.post(`/courses/${courseId}/enroll`);
            return response.data;
        } catch (error) {
            console.warn("API Error: Enrollment simulated via mock");
            return { success: true };
        }
    }
};


