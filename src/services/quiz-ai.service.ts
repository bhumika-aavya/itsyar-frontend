import api from "@/lib/axios";
import { getAuthHeaders } from "@/services/auth";

export type QuizQuestionType = "mcq" | "true_false" | "question_answer" | "code_challenge";

export interface AIGeneratedQuestion {
  id?: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correct_answer?: string;
  expected_answer?: string;
  explanation?: string;
  points?: number;
  source_chunk_ids?: string[];
  source_pages?: number[];
  validation_status?: "generated" | "structurally_valid" | "semantically_valid" | "repaired" | "failed";
  validation_notes?: string;
}

export interface ValidationSummary {
  total_generated: number;
  structurally_valid: number;
  semantically_valid: number;
  repaired: number;
  final_valid_count: number;
}

export interface QuizGenerationConfig {
  num_questions: number;
  question_types: QuizQuestionType[];
  difficulty?: "beginner" | "intermediate" | "advanced";
}

export interface GenerateQuizRequest {
  topic_id?: string;
  topic_title: string;
  topic_summary?: string;
  module_id?: string;
  course_id?: string;
  config?: QuizGenerationConfig;
  raw_content?: string;
}

export interface GenerateQuizResponse {
  success: boolean;
  phase: string;
  quiz_title: string;
  questions: AIGeneratedQuestion[];
  validation_summary: ValidationSummary;
  error_message?: string;
}

export interface StudentAnswerItem {
  question_id: string;
  answer: any;
}

export interface StudentQuizSubmitRequest {
  answers: StudentAnswerItem[];
  time_elapsed_seconds?: number;
}

export interface QuestionDiagnosticResult {
  question_id: string;
  question_text: string;
  question_type: string;
  user_answer: any;
  correct_answer: any;
  is_correct: boolean;
  score: number;
  max_score: number;
  what_went_wrong?: string;
  how_to_improve?: string;
  explanation?: string;
  source_pages?: number[];
}

export interface DetailedQuizSubmissionResponse {
  test_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  passing_threshold: number;
  time_elapsed_seconds: number;
  evaluations: QuestionDiagnosticResult[];
  overall_feedback?: string;
  module_unlocked?: string;
}

export const QuizAiService = {
  /**
   * Admin: Generate a mixed quiz in ONE batch call with structural & semantic validation + repair
   */
  generateQuiz: async (courseId: string, topicId: string, req: GenerateQuizRequest): Promise<GenerateQuizResponse> => {
    const res = await api.post(
      `/admin/courses/${courseId}/topics/${topicId}/quiz/generate`,
      req,
      getAuthHeaders()
    );
    return res.data;
  },

  /**
   * Admin: Save/Update topic quiz and questions
   */
  saveTopicQuiz: async (courseId: string, topicId: string, payload: {
    title: string;
    description?: string;
    time_limit_minutes: number;
    passing_score_percentage: number;
    questions: AIGeneratedQuestion[];
  }) => {
    const res = await api.post(
      `/admin/courses/${courseId}/topics/${topicId}/quiz`,
      payload,
      getAuthHeaders()
    );
    return res.data;
  },

  /**
   * Admin: Get existing topic quiz
   */
  getTopicQuizAdmin: async (courseId: string, topicId: string) => {
    const res = await api.get(
      `/admin/courses/${courseId}/topics/${topicId}/quiz`,
      getAuthHeaders()
    );
    return res.data;
  },

  /**
   * Student: Get topic quiz questions (without answers)
   */
  getTopicQuizStudent: async (courseId: string, topicId: string) => {
    const res = await api.get(
      `/courses/${courseId}/topics/${topicId}/quiz`,
      getAuthHeaders()
    );
    return res.data;
  },

  /**
   * Student: Submit quiz answers and receive authoritative diagnostic feedback
   */
  submitTopicQuiz: async (
    courseId: string,
    topicId: string,
    payload: StudentQuizSubmitRequest
  ): Promise<DetailedQuizSubmissionResponse> => {
    const res = await api.post(
      `/courses/${courseId}/topics/${topicId}/quiz/submit`,
      payload,
      getAuthHeaders()
    );
    return res.data?.data || res.data;
  }
};
