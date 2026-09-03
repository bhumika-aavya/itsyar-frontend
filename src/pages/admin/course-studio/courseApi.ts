import api from "@/lib/axios";
import { getAuthHeaders } from "@/services/auth";
import { CourseCategory } from "./types";

export interface CreateCoursePayload {
  title: string;
  description: string;
  instructor: string;
  category?: CourseCategory | string;
  tag?: string;
  level?: string;
}

export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  instructor?: string;
  category?: CourseCategory | string;
  tag?: string;
  level?: string;
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

export interface FinalizeTopicPayload {
  topic_id: string;
  title: string;
  summary?: string;
  topic_video_gcs_path?: string;
  topic_video_content_type?: string;
  topic_video_size_byte?: number;
  topic_video_duration?: string;
  practical_video_gcs_path?: string;
  practical_video_content_type?: string;
  practical_video_size_byte?: number;
  practical_video_duration?: string;
  documentation_pdf?: File | null;
  interview_pdf?: File | null;
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
    const tag = validCategories.includes(data.tag || "")
      ? data.tag
      : validCategories.includes(data.category || "")
      ? data.category
      : "Palantir";

    const validLevels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
    const level = validLevels.includes(data.level || "") ? data.level : "Beginner";

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      instructor: data.instructor.trim(),
      tag,
      category: tag,
      level,
    };

    const res = await api.post("/admin/courses", payload, getAuthHeaders());
    let courseId =
      res.data?.course?.id ||
      res.data?.course?.course_id ||
      res.data?.course?.courseId ||
      res.data?.course_id ||
      res.data?.id;

    // ⚠️ Response does not include the new course_id — re-fetch GET /api/admin/courses to find it
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
    if (data.category !== undefined || data.tag !== undefined) {
      const validCategories = ["Python", "Palantir", "React"];
      const cat = data.tag || data.category || "Palantir";
      payload.tag = validCategories.includes(cat) ? cat : "Palantir";
    }
    if (data.level !== undefined) {
      const validLevels = ["Beginner", "Intermediate", "Advanced", "All Levels"];
      payload.level = validLevels.includes(data.level) ? data.level : "Beginner";
    }
    if (data.price !== undefined) payload.price = data.price;

    const res = await api.put(`/admin/courses/${courseId}`, payload, getAuthHeaders());
    return res.data;
  },

  /** 4. POST /api/admin/courses/{course_id}/image (Multipart file upload) */
  uploadThumbnail: async (courseId: string, file: File | Blob) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post(`/admin/courses/${courseId}/image`, formData, getAuthHeaders());
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

  // =========================================================
  // TOPIC APIs (4-Step Creation Flow)
  // Hierarchy: Course → Module → Topic
  // Base: /api/admin/courses/{course_id}/module/{module_id}
  // =========================================================

  /** GET .../topic : Returns topics for the module */
  getModuleTopics: async (courseId: string, moduleId: string) => {
    const res = await api.get(`/admin/courses/${courseId}/module/${moduleId}/topic`, getAuthHeaders());
    return res.data;
  },

  /** Step 1 — Reserve a topic_id: POST .../topic */
  reserveTopic: async (courseId: string, moduleId: string, data: { title: string; summary?: string }) => {
    const formData = new FormData();
    formData.append("title", data.title.trim());
    if (data.summary?.trim()) {
      formData.append("summary", data.summary.trim());
    }

    const res = await api.post(
      `/admin/courses/${courseId}/module/${moduleId}/topic`,
      formData,
      getAuthHeaders()
    );
    return res.data as { success: boolean; status: string; topic_id: string };
  },

  /** Step 2 & 3 — Upload Video: POST /api/admin/{course_id}/modules/{module_id}/upload-video */
  uploadTopicVideo: async (
    courseId: string,
    moduleId: string,
    topicId: string,
    videoType: "topic" | "practical",
    file: File
  ) => {
    const formData = new FormData();
    formData.append("topic_id", topicId);
    formData.append("video_type", videoType);
    formData.append("file", file);

    // Try admin endpoint first, then courses endpoint
    try {
      const res = await api.post(
        `/admin/courses/${courseId}/module/${moduleId}/upload-video`,
        formData,
        getAuthHeaders()
      );
      return res.data as {
        success: boolean;
        topic_id: string;
        gcs_path: string;
        content_type: string;
        size_byte: number;
      };
    } catch {
      const res = await api.post(
        `/admin/${courseId}/modules/${moduleId}/upload-video`,
        formData,
        getAuthHeaders()
      );
      return res.data as {
        success: boolean;
        topic_id: string;
        gcs_path: string;
        content_type: string;
        size_byte: number;
      };
    }
  },

  /** Step 4 — Finalize Topic: POST .../topic */
  finalizeTopic: async (courseId: string, moduleId: string, payload: FinalizeTopicPayload) => {
    const formData = new FormData();
    formData.append("topic_id", payload.topic_id);
    formData.append("title", payload.title.trim());
    if (payload.summary?.trim()) {
      formData.append("summary", payload.summary.trim());
    }

    if (payload.topic_video_gcs_path) {
      formData.append("topic_video_gcs_path", payload.topic_video_gcs_path);
    }
    if (payload.topic_video_content_type) {
      formData.append("topic_video_content_type", payload.topic_video_content_type);
    }
    if (payload.topic_video_size_byte) {
      formData.append("topic_video_size_byte", String(payload.topic_video_size_byte));
    }
    if (payload.topic_video_duration) {
      formData.append("topic_video_duration", payload.topic_video_duration);
    }

    if (payload.practical_video_gcs_path) {
      formData.append("practical_video_gcs_path", payload.practical_video_gcs_path);
    }
    if (payload.practical_video_content_type) {
      formData.append("practical_video_content_type", payload.practical_video_content_type);
    }
    if (payload.practical_video_size_byte) {
      formData.append("practical_video_size_byte", String(payload.practical_video_size_byte));
    }
    if (payload.practical_video_duration) {
      formData.append("practical_video_duration", payload.practical_video_duration);
    }

    if (payload.documentation_pdf) {
      formData.append("documentation_pdf", payload.documentation_pdf);
    }
    if (payload.interview_pdf) {
      formData.append("interview_pdf", payload.interview_pdf);
    }

    const res = await api.post(
      `/admin/courses/${courseId}/module/${moduleId}/topic`,
      formData,
      getAuthHeaders()
    );
    return res.data as { success: boolean; status: string; topic_id: string };
  },

  /** DELETE .../topic/{topic_id} */
  deleteTopic: async (courseId: string, moduleId: string, topicId: string) => {
    const res = await api.delete(
      `/admin/courses/${courseId}/module/${moduleId}/topic/${topicId}`,
      getAuthHeaders()
    );
    return res.data;
  },

  /** POST /api/admin/courses/{course_id}/topics/{topic_id}/quiz/save */
  saveTopicQuiz: async (courseId: string, topicId: string, payload: any) => {
    try {
      const res = await api.post(
        `/admin/courses/${courseId}/topics/${topicId}/quiz/save`,
        payload,
        getAuthHeaders()
      );
      return res.data;
    } catch (err) {
      console.warn("Quiz save backend warning:", err);
      return null;
    }
  },

  /** POST /api/admin/courses/{course_id}/topics/{topic_id}/quiz/generate */
  generateTopicQuiz: async (
    courseId: string,
    topicId: string,
    payload: { topic_title?: string; topic_summary?: string; count?: number }
  ) => {
    const res = await api.post(
      `/admin/courses/${courseId}/topics/${topicId}/quiz/generate`,
      payload,
      getAuthHeaders()
    );
    return res.data;
  },
};
