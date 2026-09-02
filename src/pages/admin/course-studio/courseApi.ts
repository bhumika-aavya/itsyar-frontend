import api from "@/lib/axios";
import { getAuthHeaders } from "@/services/auth";
import { CourseCategory } from "./types";

export interface CreateCoursePayload {
  title: string;
  description: string;
  instructor: string;
  category: CourseCategory | string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  instructor?: string;
  category?: CourseCategory | string;
  price?: number;
}

export interface CreateModulePayload {
  title: string;
  summary?: string;
}

export interface UpdateModulePayload {
  title?: string;
  summary?: string;
}

export const CourseStudioApi = {
  /** 1. GET /api/admin/courses?search= */
  getCourses: async (search?: string) => {
    const res = await api.get("/admin/courses", {
      ...getAuthHeaders(),
      params: search ? { search } : undefined,
    });
    return res.data;
  },

  /** 2. POST /api/admin/courses */
  createCourse: async (data: CreateCoursePayload): Promise<{ courseId?: string; course?: any; raw: any }> => {
    const validCategories = ["Python", "Palantir", "React"];
    const category = validCategories.includes(data.category) ? data.category : "Palantir";

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      instructor: data.instructor.trim(),
      category,
    };

    const res = await api.post("/admin/courses", payload, getAuthHeaders());
    let courseId =
      res.data?.course?.id ||
      res.data?.course?.course_id ||
      res.data?.course?.courseId ||
      res.data?.course_id ||
      res.data?.id;

    // ⚠️ Response does not include the new course_id yet — after creating, re-fetch GET /api/admin/courses to find it
    if (!courseId) {
      try {
        const fetchRes = await api.get("/admin/courses", {
          ...getAuthHeaders(),
          params: { search: data.title.trim() },
        });
        const courses = fetchRes.data?.courses || [];
        const match = courses.find((c: any) => {
          const titleMatch = c.title?.toLowerCase().trim() === data.title.toLowerCase().trim();
          const instrMatch =
            !data.instructor.trim() ||
            c.instructor?.toLowerCase().trim() === data.instructor.toLowerCase().trim() ||
            c.author?.toLowerCase().trim() === data.instructor.toLowerCase().trim();
          return titleMatch && instrMatch;
        });

        if (match) {
          courseId = match.id || match.course_id || match.courseId;
        } else if (courses.length > 0) {
          courseId = courses[0].id || courses[0].course_id || courses[0].courseId;
        }
      } catch (err) {
        console.warn("Could not re-fetch courses to resolve new course_id", err);
      }
    }

    return {
      courseId: courseId ? String(courseId) : undefined,
      course: res.data?.course,
      raw: res.data,
    };
  },

  /** 3. PUT /api/admin/courses/{course_id} */
  updateCourse: async (courseId: string, data: UpdateCoursePayload) => {
    const payload: Record<string, any> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.description !== undefined) payload.description = data.description.trim();
    if (data.instructor !== undefined) payload.instructor = data.instructor.trim();
    if (data.category !== undefined) {
      const validCategories = ["Python", "Palantir", "React"];
      payload.category = validCategories.includes(data.category) ? data.category : "Palantir";
    }
    if (data.price !== undefined) payload.price = data.price;

    const res = await api.put(`/admin/courses/${courseId}`, payload, getAuthHeaders());
    return res.data;
  },

  /** 4. POST /api/admin/courses/{course_id}/image (Multipart file upload) */
  uploadThumbnail: async (courseId: string, file: File | Blob) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(`/admin/courses/${courseId}/image`, formData, {
      ...getAuthHeaders(),
      headers: {
        ...getAuthHeaders().headers,
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  },

  /** 5. GET /api/admin/courses/{course_id}/module */
  getCourseModules: async (courseId: string) => {
    const res = await api.get(`/admin/courses/${courseId}/module`, getAuthHeaders());
    return res.data?.modules || [];
  },

  /** 6. POST /api/admin/courses/{course_id}/module */
  createModule: async (courseId: string, data: CreateModulePayload) => {
    const payload = {
      title: data.title.trim(),
      summary: data.summary?.trim() || "",
    };
    const res = await api.post(`/admin/courses/${courseId}/module`, payload, getAuthHeaders());
    return res.data;
  },

  /** 7. PUT /api/admin/courses/{course_id}/module/{module_id} */
  updateModule: async (courseId: string, moduleId: string, data: UpdateModulePayload) => {
    const payload: Record<string, any> = {};
    if (data.title !== undefined) payload.title = data.title.trim();
    if (data.summary !== undefined) payload.summary = data.summary.trim();

    const res = await api.put(`/admin/courses/${courseId}/module/${moduleId}`, payload, getAuthHeaders());
    return res.data;
  },

  /** 8. DELETE /api/admin/courses/{course_id} */
  deleteCourse: async (courseId: string) => {
    const res = await api.delete(`/admin/courses/${courseId}`, getAuthHeaders());
    return res.data;
  },

  /** 9. DELETE /api/admin/courses/{course_id}/module/{module_id} */
  deleteModule: async (courseId: string, moduleId: string) => {
    const res = await api.delete(`/admin/courses/${courseId}/module/${moduleId}`, getAuthHeaders());
    return res.data;
  },
};

