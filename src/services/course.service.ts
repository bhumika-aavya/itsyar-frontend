import api from "@/lib/axios";
import { capitalizeTitle } from "@/lib/utils";
import { CertificateData, Course, MyCourse } from "@/schemas/course.schema";
import { CourseDetail, CourseModule, ApiModuleList, ApiTopic, ApiModuleDetail } from "./course-detail.schema";
import { getAuthHeaders } from "./auth";

export const CourseService = {
    getAllCourses: async (): Promise<Course[]> => {
        try {
            const response = await api.get("/courses", getAuthHeaders());
            const courses: Course[] = response.data.courses ?? [];
            return courses.map(c => ({
                ...c,
                title: capitalizeTitle(c.title ?? ""),
            }));
        } catch (error) {
            console.error("API Error: getAllCourses failed", error);
            throw new Error("Courses not found");
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
            console.error("API Error: getMyCourses failed", error);
            throw new Error("Courses not found");
        }
    },

    getCourseModules: async (courseId: string): Promise<ApiModuleList[]> => {
        try {
            const response = await api.get(`/courses/course-modules/${courseId}`, getAuthHeaders());
            const list = response.data.modules ?? [];
            if (list.length > 0) return list;
        } catch (error) {
            console.error(`API Error: getCourseModules failed for course ${courseId}`, error);
        }

        // Check locally created admin courses
        try {
            const raw = localStorage.getItem("forge_admin_courses");
            if (raw) {
                const storedCourses = JSON.parse(raw);
                const found = storedCourses.find((c: any) => String(c.id) === String(courseId));
                if (found && found.modules && found.modules.length > 0) {
                    return found.modules.map((m: any) => ({
                        moduleId: m.id,
                        title: m.title,
                        summary: m.summary || "",
                        topics: (m.topics || []).map((t: any) => t.title),
                        topicCount: m.topics?.length || 0,
                        totalDuration: "N/A",
                        progressPercentage: 0,
                        topicsCompleted: 0,
                    }));
                }
            }
        } catch { }

        return [];
    },
    //     getCourseModuleTopics: async (courseId: string): Promise<ApiModuleList[]> => {
    //     try {
    //         const response = await api.get(`/courses//${courseId}${moduleId}`, getAuthHeaders());
    //         return response.data.modules ?? [];
    //     } catch (error) {
    //         console.error(`API Error: getCourseModules failed for course ${courseId}`, error);
    //         return [];
    //     }
    // },

    getCourseById: async (id: string): Promise<CourseDetail> => {
        try {
            // Fetch basic details from the list (fallback since no dedicated endpoint)
            const allCourses = await CourseService.getAllCourses();
            const basicCourse = allCourses.find(c => c.id === id);
            
            // Fetch curriculum modules
            const modules = await CourseService.getCourseModules(id);
            
            // Map ApiModuleList to CourseModule schema expected by UI
            const mappedModules: CourseModule[] = modules.map((m, i) => ({
                id: m.moduleId,
                moduleId: m.moduleId,
                courseId: id,
                order: i + 1,
                title: m.title,
                duration: m.totalDuration,
                summary: m.summary,
                progress: m.progressPercentage,
                status: m.topicsCompleted > 0 ? "In Progress" : "Upcoming",
                items: [],
                topics: m.topics || []
            }));

            return {
                id: id,
                moduleId: mappedModules[0]?.moduleId || "",
                title: basicCourse?.title || "Course Details",
                category: basicCourse?.category || "Category",
                description: basicCourse?.description || "",
                longDescription: basicCourse?.description || "",
                level: basicCourse?.level || "Beginner",
                modulesCount: mappedModules.length,
                duration: basicCourse?.duration || "N/A",
                thumbnail: basicCourse?.imageUrl || "",
                takeaways: [],
                include: [],
                curriculum: mappedModules,
                isEnrolled: basicCourse?.enrolled || false,
                hasPaid: basicCourse?.hasPaid || false,
                price: 0,
                courseCompletionPercentage: 0
            };
        } catch (error) {
            console.error(`API Error: getCourseById failed for course ${id}`, error);
            throw new Error("Course not found");
        }
    },

    getModuleTopics: async (courseId: string, moduleId: string): Promise<ApiModuleDetail> => {
        try {
            const response = await api.get(`/courses/${courseId}/${moduleId}`, getAuthHeaders());
            if (response.data) return response.data;
        } catch (error) {
            console.error(`API Error: getModuleTopics failed`, error);
        }

        // Local course fallback
        try {
            const raw = localStorage.getItem("forge_admin_courses");
            if (raw) {
                const storedCourses = JSON.parse(raw);
                const course = storedCourses.find((c: any) => String(c.id) === String(courseId));
                const mod = course?.modules?.find((m: any) => String(m.id) === String(moduleId));
                if (mod) {
                    return {
                        moduleId: mod.id,
                        moduleTitle: mod.title,
                        moduleSummary: mod.summary || "",
                        topics: (mod.topics || []).map((t: any) => ({
                            topicId: t.id,
                            title: t.title,
                            sequenceOrder: String(t.topicNumber || 1),
                            topicSummary: t.summary || "",
                            assets: (t.assets || []).map((a: any) => ({
                                type: a.type === "topic_video" ? "video"
                                    : a.type === "practical_video" ? "practical_video"
                                    : a.type === "documentation_pdf" ? "documentation"
                                    : "interview_pdf",
                                title: a.title,
                                duration: a.duration || null,
                                url: a.url,
                            })),
                        })),
                        courseCompletionPercentage: 0,
                    };
                }
            }
        } catch { }

        throw new Error("Module topics not found");
    },

    getTopicDetail: async (courseId: string, moduleId: string, topicId: string): Promise<ApiModuleDetail> => {
        try {
            const response = await api.get(`/courses/${courseId}/${moduleId}/${topicId}`, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error(`API Error: getTopicDetail failed`, error);
            throw error;
        }
    },

    enrollInCourse: async (courseId: string) => {
        try {
            const response = await api.post(`/courses/${courseId}/enroll`, {}, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error("API Error: Enrollment failed", error);
            throw error;
        }
    },

    completeCourse: async (courseId: string) => {
        try {
            const response = await api.post(`/courses/${courseId}/complete`, {}, getAuthHeaders());
            return response.data;
        } catch (error) {
            console.error("API Error: Course complete failed", error);
            throw error;
        }
    },

    updateProgress: async (courseId: string, lessonId: string, data: { playedSeconds: number; totalSeconds: number; isCompleted: boolean }) => {
        // Deprecated or redirecting to completeCourse if fully completed
        if (data.isCompleted) {
            return await CourseService.completeCourse(courseId);
        }
        return { success: true };
    },

    getCertificate: async (courseId: string): Promise<CertificateData> => {
        try {
            const response = await api.get(`/courses/${courseId}/certificate`, getAuthHeaders());
            return response.data.certificate;
        } catch (error) {
            console.error("API Error: getCertificate failed", error);
            throw error;
        }
    },

    getResults: async (): Promise<any[]> => {
        try {
            const response = await api.get("/courses/results", getAuthHeaders());
            return response.data.results;
        } catch (error) {
            console.warn("API Error: getResults failed");
            return [];
        }
    }
};
