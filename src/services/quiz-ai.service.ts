import api from "@/lib/axios";
import { getAuthHeaders } from "./auth";
import { QuizQuestion, TestSubmissionRequest, TestSubmissionResponse } from "@/types/quiz";

export interface TopicQuizResponse {
  id?: string;
  title?: string;
  topicId?: string;
  moduleId?: string;
  courseId?: string;
  timeLimit?: number;
  timeLimitMinutes?: number;
  time_limit_minutes?: number;
  passingThreshold?: number;
  passing_score_percentage?: number;
  questions: QuizQuestion[];
  [key: string]: any;
}

export const QuizAiService = {
  /**
   * Fetch topic-level quiz questions generated from interview PDF or curriculum.
   */
  getTopicQuiz: async (
    courseId: string,
    moduleId?: string,
    topicId?: string
  ): Promise<TopicQuizResponse> => {
    // Build candidate endpoints in priority order
    const candidateEndpoints: string[] = [];

    if (moduleId && topicId) {
      candidateEndpoints.push(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/quiz`);
      candidateEndpoints.push(`/courses/${courseId}/modules/${moduleId}/topics/${topicId}/questions`);
      candidateEndpoints.push(`/courses/${courseId}/${moduleId}/${topicId}/quiz`);
    }

    if (topicId) {
      candidateEndpoints.push(`/courses/${courseId}/topics/${topicId}/quiz`);
      candidateEndpoints.push(`/courses/${courseId}/topics/${topicId}/questions`);
    }

    if (moduleId) {
      candidateEndpoints.push(`/courses/${courseId}/modules/${moduleId}/quiz`);
    }

    candidateEndpoints.push(`/courses/${courseId}/quiz`);

    let lastError: any = null;

    for (const endpoint of candidateEndpoints) {
      try {
        const response = await api.get(endpoint, getAuthHeaders());
        const data = response?.data;
        if (!data) continue;

        // Check various response formats
        let questions: QuizQuestion[] = [];
        if (Array.isArray(data)) {
          questions = data;
        } else if (Array.isArray(data.questions)) {
          questions = data.questions;
        } else if (data.quiz && Array.isArray(data.quiz.questions)) {
          questions = data.quiz.questions;
        } else if (data.data && Array.isArray(data.data.questions)) {
          questions = data.data.questions;
        }

        if (questions && questions.length > 0) {
          const quizObj = data.quiz || data.data || data;
          return {
            id: quizObj.id || quizObj.quiz_id || topicId || "topic_quiz",
            title: quizObj.title || "Topic Assessment",
            timeLimit: quizObj.timeLimit || quizObj.timeLimitMinutes || quizObj.time_limit_minutes || 15,
            timeLimitMinutes: quizObj.timeLimit || quizObj.timeLimitMinutes || quizObj.time_limit_minutes || 15,
            passingThreshold: quizObj.passingThreshold || quizObj.passing_score_percentage || 70,
            passing_score_percentage: quizObj.passingThreshold || quizObj.passing_score_percentage || 70,
            questions: questions,
            ...quizObj,
          };
        }
      } catch (err) {
        lastError = err;
        // Continue to next candidate endpoint
      }
    }

    console.warn(`[QuizAiService] All endpoints failed to find quiz questions for course ${courseId}:`, lastError);
    throw lastError || new Error("No quiz found from database");
  },

  /**
   * Submit quiz answers to Palantir Foundry / AI Evaluation Engine.
   */
  submitTopicQuiz: async (
    courseId: string,
    moduleIdOrTopicId: string,
    topicIdOrPayload: string | TestSubmissionRequest,
    maybePayload?: TestSubmissionRequest
  ): Promise<TestSubmissionResponse> => {
    let moduleId: string | undefined;
    let topicId: string;
    let payload: TestSubmissionRequest;

    if (typeof topicIdOrPayload === "string") {
      moduleId = moduleIdOrTopicId;
      topicId = topicIdOrPayload;
      payload = maybePayload as TestSubmissionRequest;
    } else {
      topicId = moduleIdOrTopicId;
      payload = topicIdOrPayload;
    }

    try {
      let endpoint = `/courses/${courseId}/topics/${topicId}/quiz/submit`;
      if (moduleId) {
        endpoint = `/courses/${courseId}/modules/${moduleId}/topics/${topicId}/quiz/submit`;
      }

      try {
        const response = await api.post(endpoint, payload, getAuthHeaders());
        return response.data;
      } catch (err) {
        // Fallback to secondary endpoint structure
        if (moduleId) {
          const altResponse = await api.post(
            `/courses/${courseId}/${moduleId}/${topicId}/quiz/submit`,
            payload,
            getAuthHeaders()
          );
          return altResponse.data;
        }
        throw err;
      }
    } catch (error) {
      console.error(`[QuizAiService] submitTopicQuiz API error:`, error);
      throw error;
    }
  },

  /**
   * Get Topic Quiz Preview (Admin)
   */
  getAdminTopicQuizPreview: async (
    courseId: string,
    moduleId: string,
    topicId: string
  ): Promise<TopicQuizResponse> => {
    try {
      const response = await api.get(
        `/admin/courses/${courseId}/module/${moduleId}/topic/${topicId}/quiz`,
        getAuthHeaders()
      );
      return response.data;
    } catch (error) {
      // Fallback to plural path
      const altResponse = await api.get(
        `/admin/courses/${courseId}/modules/${moduleId}/topics/${topicId}/quiz`,
        getAuthHeaders()
      );
      return altResponse.data;
    }
  },
};
