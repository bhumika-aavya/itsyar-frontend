import React from "react";
import {
  CourseModuleData,
  CourseTopicData,
  CourseAssetData,
  TopicQuizData,
  TopicQuizQuestion,
  QuizQuestionType,
  AdminCourse
} from "@/services/admin.service";

export type {
  CourseModuleData,
  CourseTopicData,
  CourseAssetData,
  TopicQuizData,
  TopicQuizQuestion,
  QuizQuestionType,
  AdminCourse
};

export const CATEGORIES = ["Palantir", "React", "Python"] as const;
export type CourseCategory = typeof CATEGORIES[number];

export const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"] as const;

export interface CourseInfoStepProps {
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  instructor: string;
  setInstructor: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
  level: string;
  setLevel: (val: string) => void;
  duration: string;
  setDuration: (val: string) => void;
  thumbnail: string;
  setThumbnail: (val: string) => void;
  errors: Record<string, string>;
  onNext: () => void;
  modulesCount: number;
  totalTopicsCount: number;
  totalAssetsCount: number;
  totalQuizzesCount: number;
  onThumbnailFileSelected: (file: File) => void;
  status: "published" | "draft";
  setStatus: (val: "published" | "draft") => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
}

export interface CurriculumStepProps {
  modules: CourseModuleData[];
  selectedModuleId: string | null;
  setSelectedModuleId: (id: string | null) => void;
  onOpenCreateModule: () => void;
  onOpenEditModule: (m: CourseModuleData, e?: React.MouseEvent) => void;
  onDeleteModule: (moduleId: string, e: React.MouseEvent) => void;
  onOpenCreateTopic: (modId: string) => void;
  onOpenEditTopic: (modId: string, topic: CourseTopicData) => void;
  onDeleteTopic: (modId: string, topicId: string) => void;
  onOpenQuizBuilder: (modId: string, topic: CourseTopicData) => void;
  onContinueToReview: () => void;
}

export interface CourseReviewStepProps {
  title: string;
  description: string;
  instructor: string;
  category: string;
  level: string;
  duration: string;
  thumbnail: string;
  modules: CourseModuleData[];
  totalTopicsCount: number;
  isEditing: boolean;
  saving: boolean;
  status: "published" | "draft";
  setStatus: (val: "published" | "draft") => void;
  isActive: boolean;
  setIsActive: (val: boolean) => void;
  onBack: () => void;
  onPublish: () => void;
  onSaveDraft?: () => void;
}

export interface ModuleModalProps {
  isOpen: boolean;
  isEditing: boolean;
  moduleTitle: string;
  setModuleTitle: (val: string) => void;
  moduleSummary: string;
  setModuleSummary: (val: string) => void;
  moduleError: string;
  onClose: () => void;
  onSave: (andAddTopic?: boolean) => void;
}

export interface TopicModalProps {
  isOpen: boolean;
  isEditing: boolean;
  moduleTitle: string;
  topicNumber: number;
  setTopicNumber: (num: number) => void;
  topicTitle: string;
  setTopicTitle: (val: string) => void;
  topicSummary: string;
  setTopicSummary: (val: string) => void;
  topicDocPdf: { name: string; url: string; size?: string };
  setTopicDocPdf: React.Dispatch<React.SetStateAction<{ name: string; url: string; size?: string }>>;
  interviewPdf: { name: string; url: string; size?: string };
  setInterviewPdf: React.Dispatch<React.SetStateAction<{ name: string; url: string; size?: string }>>;
  topicVideo: { name: string; url: string; duration?: string };
  setTopicVideo: React.Dispatch<React.SetStateAction<{ name: string; url: string; duration?: string }>>;
  practicalVideo: { name: string; url: string; duration?: string };
  setPracticalVideo: React.Dispatch<React.SetStateAction<{ name: string; url: string; duration?: string }>>;
  topicQuiz: TopicQuizData | null;
  onOpenQuizBuilder: () => void;
  onRemoveQuiz: () => void;
  topicError: string;
  onClose: () => void;
  isSavingTopic?: boolean;
  onFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: { name: string; url: string; duration?: string }) => void,
    type: "pdf" | "video",
    fileSetter?: (f: File) => void
  ) => void;
}

export interface QuizBuilderModalProps {
  isOpen: boolean;
  topicTitle: string;
  moduleTitle: string;
  quizTitle: string;
  setQuizTitle: (val: string) => void;
  quizDescription: string;
  setQuizDescription: (val: string) => void;
  quizTimeLimit: number;
  setQuizTimeLimit: (val: number) => void;
  quizPassingScore: number;
  setQuizPassingScore: (val: number) => void;
  quizQuestions: TopicQuizQuestion[];
  expandedQuestionId: string | null;
  setExpandedQuestionId: (id: string | null) => void;
  quizError: string;
  onAddQuestion: (type: QuizQuestionType) => void;
  onUpdateQuestion: (qId: string, updates: Partial<TopicQuizQuestion>) => void;
  onUpdateMcqOption: (qId: string, optIdx: number, text: string) => void;
  onAddMcqOption: (qId: string) => void;
  onRemoveMcqOption: (qId: string, optIdx: number) => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onDeleteQuestion: (qId: string) => void;
  onClose: () => void;
  onSave: () => void;
}
