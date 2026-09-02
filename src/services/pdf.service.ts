import api from "@/lib/axios";

export interface PdfUrlResponse {
  success?: boolean;
  url: string;
  expiresIn?: number;
  title?: string;
}

export const PdfService = {
  /**
   * Resolves a document URL for a course module or topic.
   * First tries the dedicated module PDF endpoint, then falls back to topic/module PDF streaming endpoints.
   */
  resolvePdfUrl: async (
    courseId: string,
    moduleId: string,
    topicId?: string,
    type: "documentation" | "interview" = "documentation"
  ): Promise<string> => {
    // 1. Try dedicated PDF endpoint: /api/courses/{course_id}/modules/{module_id}/pdf
    try {
      const res = await api.get(`/courses/${courseId}/modules/${moduleId}/pdf`, {
        params: {
          topic_id: topicId,
          type,
        },
      });
      if (res.data?.url) {
        return res.data.url;
      }
    } catch {
      // Gracefully continue to fallback endpoints
    }

    // 2. Fallback to topic streaming endpoint: /courses/{course_id}/{module_id}/{topic_id}/pdf
    if (topicId) {
      return `/courses/${courseId}/${moduleId}/${topicId}/pdf?type=${type}`;
    }

    // 3. Fallback to module PDF endpoint: /courses/{course_id}/pdf/{module_id}
    return `/courses/${courseId}/pdf/${moduleId}`;
  },
};
