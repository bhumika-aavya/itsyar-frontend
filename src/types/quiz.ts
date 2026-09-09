export type QuestionType =
  | "QA"
  | "TRUE_FALSE"
  | "SINGLE_CHOICE"
  | "MULTIPLE_CHOICE"
  | "mcq"
  | "true_false"
  | "question_answer"
  | "code_challenge";

export interface QuizQuestion {
  id: string;
  text: string;
  question?: string;
  type: QuestionType;
  options?: string[];
  points?: number;
  sequenceOrder?: string;
  correctAnswer?: string;
  correct_answer?: string;
  correctOptionIndex?: number;
  correctBoolean?: boolean;
  explanation?: string;
}

export interface QuizAnswerPayload {
  questionId: string;
  question_id?: string;
  answer?: string;            // Text response for QA
  selectedAnswers?: string[]; // Array for TRUE_FALSE, SINGLE_CHOICE, MULTIPLE_CHOICE
}

export interface TestSubmissionRequest {
  attemptId?: string;
  topicId?: string;
  answers: QuizAnswerPayload[];
  timeElapsedSeconds?: number;
  time_elapsed_seconds?: number;
}

export interface QuestionFeedback {
  questionId: string;
  question_id?: string;
  questionText: string;
  question_text?: string;
  question_type?: string;
  type?: string;
  userAnswer?: string;
  user_answer?: string;
  selectedAnswers?: string[];
  expectedAnswer: string;
  expected_answer?: string;
  correctAnswer?: string;
  correct_answer?: string;
  whatWentWrong?: string;
  what_went_wrong?: string;
  correctExplanation?: string;
  explanation?: string;
  recommendations?: string;
  how_to_improve?: string;
  technicalScore: number;
  completenessScore: number;
  clarityScore: number;
  pointsEarned?: number;
  score?: number;
  max_score?: number;
  points?: number;
  isCorrect?: boolean;
  is_correct?: boolean;
  source_pages?: number[];
}

export interface TestSubmissionResponse {
  attemptId: string;
  test_id?: string;
  quiz_id?: string;
  passed: boolean;
  score: number;
  percentage?: number;
  totalPointsEarned: number;
  totalPointsPossible: number;
  total_questions?: number;
  passing_threshold?: number;
  overallTechnicalScore: number;
  overallCompletenessScore: number;
  overallClarityScore: number;
  overallRecommendations: string;
  feedback: QuestionFeedback[];
  evaluations?: QuestionFeedback[];
  submittedAt: string;
  time_elapsed_seconds?: number;
  message: string;
  overall_feedback?: string;
  completion?: any;
}
