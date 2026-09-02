import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, BookOpen, Layers, CheckCircle2, Check
} from "lucide-react";
import {
  AdminService, CourseModuleData, CourseTopicData, CourseAssetData,
  TopicQuizData, TopicQuizQuestion, QuizQuestionType
} from "@/services/admin.service";
import { CourseStudioApi } from "./course-studio/courseApi";
import CourseInfoStep from "./course-studio/CourseInfoStep";
import CurriculumStep from "./course-studio/CurriculumStep";
import CourseReviewStep from "./course-studio/CourseReviewStep";
import ModuleModal from "./course-studio/ModuleModal";
import TopicModal from "./course-studio/TopicModal";
import QuizBuilderModal from "./course-studio/QuizBuilderModal";
import { toast } from "sonner";

export default function AdminCreateCoursePage() {
  const navigate = useNavigate();
  const { id: editCourseId } = useParams<{ id: string }>();
  const isEditing = Boolean(editCourseId);

  // Stepper State: 1 = Details, 2 = Curriculum (Modules & Topics), 3 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState<boolean>(isEditing);
  const [saving, setSaving] = useState<boolean>(false);

  // Active backend course ID (can be established on create or from edit params)
  const [activeCourseId, setActiveCourseId] = useState<string | null>(editCourseId || null);

  // Step 1: Course Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [category, setCategory] = useState("Palantir");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2: Modules & Topics
  const [modules, setModules] = useState<CourseModuleData[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Module Modal State
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSummary, setModuleSummary] = useState("");
  const [moduleError, setModuleError] = useState("");

  // Topic Modal State
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicTargetModuleId, setTopicTargetModuleId] = useState<string | null>(null);
  const [topicNumber, setTopicNumber] = useState<number>(1);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicSummary, setTopicSummary] = useState("");
  const [topicError, setTopicError] = useState("");

  // 4 Assets for Topic
  const [topicDocPdf, setTopicDocPdf] = useState<{ name: string; url: string; size?: string }>({ name: "", url: "" });
  const [interviewPdf, setInterviewPdf] = useState<{ name: string; url: string; size?: string }>({ name: "", url: "" });
  const [topicVideo, setTopicVideo] = useState<{ name: string; url: string; duration?: string }>({ name: "", url: "", duration: "" });
  const [practicalVideo, setPracticalVideo] = useState<{ name: string; url: string; duration?: string }>({ name: "", url: "", duration: "" });

  // Topic Quiz State
  const [topicQuiz, setTopicQuiz] = useState<TopicQuizData | null>(null);

  // Standalone Quiz Builder Modal State
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizModalSource, setQuizModalSource] = useState<"topic_modal" | "topic_card">("topic_modal");
  const [quizCardTargetModuleId, setQuizCardTargetModuleId] = useState<string | null>(null);
  const [quizCardTargetTopicId, setQuizCardTargetTopicId] = useState<string | null>(null);
  const [quizTopicTitle, setQuizTopicTitle] = useState<string>("");
  const [quizModuleTitle, setQuizModuleTitle] = useState<string>("");

  // Working copy in Quiz Modal
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [quizTimeLimit, setQuizTimeLimit] = useState<number>(15);
  const [quizPassingScore, setQuizPassingScore] = useState<number>(70);
  const [quizQuestions, setQuizQuestions] = useState<TopicQuizQuestion[]>([]);
  const [quizError, setQuizError] = useState("");
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);

  // Load existing course if in edit mode
  useEffect(() => {
    if (!editCourseId) return;
    setLoading(true);

    const loadData = async () => {
      try {
        const c = await AdminService.getCourseDetail(editCourseId);
        if (!c) {
          toast.error("Course not found");
          navigate("/admin/courses");
          return;
        }

        setTitle(c.title || "");
        setDescription(c.description || "");
        setInstructor(c.instructor || "");
        const validCats = ["Palantir", "React", "Python"];
        const cat = c.category || c.tag || "Palantir";
        setCategory(validCats.includes(cat) ? cat : "Palantir");
        setLevel(c.level || "Beginner");
        setDuration(c.duration || "");
        setThumbnail(c.thumbnail || "");

        // 5. GET /api/admin/courses/{course_id}/module to fetch dynamic modules
        let serverModules: any[] = [];
        try {
          serverModules = await CourseStudioApi.getCourseModules(editCourseId);
        } catch {
          // Backend module endpoint might be unavailable or empty; fallback to course detail modules
          serverModules = [];
        }

        let combinedModules: CourseModuleData[] = c.modules && c.modules.length > 0 ? [...c.modules] : [];

        if (serverModules && serverModules.length > 0) {
          // Merge server modules while preserving topics & quizzes
          const serverMapped: CourseModuleData[] = serverModules.map((sm: any, idx: number) => {
            const modId = sm.moduleId || sm.id || `mod_${idx + 1}`;
            const existing = combinedModules.find((cm) => cm.id === modId);
            return {
              id: modId,
              order: idx + 1,
              title: sm.title || sm.moduleTitle || `Module ${idx + 1}`,
              summary: sm.summary || sm.moduleSummary || "",
              topics: existing?.topics || [],
            };
          });
          combinedModules = serverMapped;
        }

        setModules(combinedModules);
        if (combinedModules.length > 0) {
          setSelectedModuleId(combinedModules[0].id);
        }
      } catch {
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [editCourseId, navigate]);

  // Step 1 Validation
  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = "Course title is required";
    if (!instructor.trim()) errs.instructor = "Instructor name is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextToModules = () => {
    if (!validateStep1()) {
      toast.error("Please fill in the required course details");
      return;
    }
    setCurrentStep(2);
    if (!selectedModuleId && modules.length > 0) {
      setSelectedModuleId(modules[0].id);
    }
  };

  // ================= MODULE ACTIONS =================
  const openCreateModule = () => {
    setEditingModuleId(null);
    setModuleTitle("");
    setModuleSummary("");
    setModuleError("");
    setShowModuleModal(true);
  };

  const openEditModule = (m: CourseModuleData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingModuleId(m.id);
    setModuleTitle(m.title);
    setModuleSummary(m.summary || "");
    setModuleError("");
    setShowModuleModal(true);
  };

  const handleSaveModule = async (andAddTopic = false) => {
    if (!moduleTitle.trim()) {
      setModuleError("Module title is required");
      return;
    }
    setModuleError("");

    let activeId = selectedModuleId;

    if (editingModuleId) {
      // 7. PUT /api/admin/courses/{course_id}/module/{module_id}
      if (activeCourseId) {
        try {
          await CourseStudioApi.updateModule(activeCourseId, editingModuleId, {
            title: moduleTitle.trim(),
            summary: moduleSummary.trim(),
          });
        } catch {
          // Continue gracefully
        }
      }

      setModules((prev) =>
        prev.map((m) =>
          m.id === editingModuleId
            ? { ...m, title: moduleTitle.trim(), summary: moduleSummary.trim() }
            : m
        )
      );
      activeId = editingModuleId;
      toast.success("Module updated");
    } else {
      let newModId = `mod_${Date.now()}`;

      // 6. POST /api/admin/courses/{course_id}/module
      if (activeCourseId) {
        try {
          const res = await CourseStudioApi.createModule(activeCourseId, {
            title: moduleTitle.trim(),
            summary: moduleSummary.trim(),
          });
          if (res?.module?.moduleId || res?.module?.id || res?.moduleId) {
            newModId = res?.module?.moduleId || res?.module?.id || res?.moduleId;
          }
        } catch {
          // Continue gracefully
        }
      }

      const newModule: CourseModuleData = {
        id: newModId,
        order: modules.length + 1,
        title: moduleTitle.trim(),
        summary: moduleSummary.trim(),
        topics: [],
      };
      setModules((prev) => [...prev, newModule]);
      activeId = newModId;
      setSelectedModuleId(newModId);
      toast.success("New module created");
    }

    setShowModuleModal(false);

    if (andAddTopic && activeId) {
      openCreateTopic(activeId);
    }
  };

  const handleDeleteModule = async (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this module and all its topics?")) return;

    // 9. DELETE /api/admin/courses/{course_id}/module/{module_id}
    const courseIdToUse = activeCourseId || editCourseId;
    if (courseIdToUse) {
      try {
        await CourseStudioApi.deleteModule(courseIdToUse, moduleId);
      } catch (err) {
        console.warn("Module delete warning", err);
      }
    }

    const remaining = modules.filter((m) => m.id !== moduleId);
    setModules(remaining);
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(remaining[0]?.id || null);
    }
    toast.success("Module deleted");
  };

  // ================= TOPIC ACTIONS =================
  const openCreateTopic = (modId: string) => {
    const targetMod = modules.find((m) => m.id === modId);
    const nextNum = (targetMod?.topics?.length || 0) + 1;

    setEditingTopicId(null);
    setTopicTargetModuleId(modId);
    setTopicNumber(nextNum);
    setTopicTitle("");
    setTopicSummary("");
    setTopicDocPdf({ name: "", url: "" });
    setInterviewPdf({ name: "", url: "" });
    setTopicVideo({ name: "", url: "", duration: "" });
    setPracticalVideo({ name: "", url: "", duration: "" });
    setTopicQuiz(null);
    setTopicError("");
    setShowTopicModal(true);
  };

  const openEditTopic = (modId: string, topic: CourseTopicData) => {
    setEditingTopicId(topic.id);
    setTopicTargetModuleId(modId);
    setTopicNumber(topic.topicNumber || 1);
    setTopicTitle(topic.title);
    setTopicSummary(topic.summary || "");

    const docAsset = topic.assets?.find((a) => a.type === "documentation_pdf");
    const intAsset = topic.assets?.find((a) => a.type === "interview_pdf");
    const vidAsset = topic.assets?.find((a) => a.type === "topic_video");
    const pracAsset = topic.assets?.find((a) => a.type === "practical_video");

    setTopicDocPdf({ name: docAsset?.fileName || docAsset?.title || "", url: docAsset?.url || "" });
    setInterviewPdf({ name: intAsset?.fileName || intAsset?.title || "", url: intAsset?.url || "" });
    setTopicVideo({ name: vidAsset?.fileName || vidAsset?.title || "", url: vidAsset?.url || "", duration: vidAsset?.duration || "" });
    setPracticalVideo({ name: pracAsset?.fileName || pracAsset?.title || "", url: pracAsset?.url || "", duration: pracAsset?.duration || "" });

    setTopicQuiz(topic.quiz ? JSON.parse(JSON.stringify(topic.quiz)) : null);
    setTopicError("");
    setShowTopicModal(true);
  };

  const handleSaveTopic = () => {
    if (!topicTitle.trim()) {
      setTopicError("Topic title is required");
      return;
    }
    if (!topicTargetModuleId) return;
    setTopicError("");

    const assets: CourseAssetData[] = [];
    if (topicDocPdf.url || topicDocPdf.name) {
      assets.push({
        id: `ast_doc_${Date.now()}`,
        type: "documentation_pdf",
        title: "Topic Documentation",
        url: topicDocPdf.url,
        fileName: topicDocPdf.name,
      });
    }
    if (interviewPdf.url || interviewPdf.name) {
      assets.push({
        id: `ast_int_${Date.now()}`,
        type: "interview_pdf",
        title: "Interview Questions",
        url: interviewPdf.url,
        fileName: interviewPdf.name,
      });
    }
    if (topicVideo.url || topicVideo.name) {
      assets.push({
        id: `ast_vid_${Date.now()}`,
        type: "topic_video",
        title: "Topic Video Lecture",
        url: topicVideo.url,
        fileName: topicVideo.name,
        duration: topicVideo.duration,
      });
    }
    if (practicalVideo.url || practicalVideo.name) {
      assets.push({
        id: `ast_prac_${Date.now()}`,
        type: "practical_video",
        title: "Practical Walkthrough Video",
        url: practicalVideo.url,
        fileName: practicalVideo.name,
        duration: practicalVideo.duration,
      });
    }

    const topicPayload: CourseTopicData = {
      id: editingTopicId || `top_${Date.now()}`,
      topicNumber,
      title: topicTitle.trim(),
      summary: topicSummary.trim(),
      assets,
      quiz: topicQuiz || undefined,
    };

    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== topicTargetModuleId) return m;
        const exists = m.topics?.some((t) => t.id === topicPayload.id);
        const updatedTopics = exists
          ? m.topics.map((t) => (t.id === topicPayload.id ? topicPayload : t))
          : [...(m.topics || []), topicPayload];
        return { ...m, topics: updatedTopics };
      })
    );

    setShowTopicModal(false);
    toast.success(editingTopicId ? "Topic updated" : "Topic created successfully");
  };

  const handleDeleteTopic = (modId: string, topicId: string) => {
    if (!confirm("Delete this topic?")) return;
    setModules((prev) =>
      prev.map((m) =>
        m.id === modId
          ? { ...m, topics: m.topics.filter((t) => t.id !== topicId) }
          : m
      )
    );
    toast.success("Topic removed");
  };

  const handleGenericFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: { name: string; url: string; duration?: string }) => void,
    type: "pdf" | "video"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setter({
      name: file.name,
      url: URL.createObjectURL(file),
      duration: type === "video" ? "10:00" : undefined,
    });
    toast.success(`Attached ${file.name}`);
  };

  // ================= QUIZ BUILDER ACTIONS =================
  const openQuizBuilderFromTopicModal = () => {
    setQuizModalSource("topic_modal");
    setQuizCardTargetModuleId(topicTargetModuleId);
    setQuizCardTargetTopicId(editingTopicId);
    setQuizTopicTitle(topicTitle.trim() || `Topic ${topicNumber}`);
    const mod = modules.find((m) => m.id === topicTargetModuleId);
    setQuizModuleTitle(mod?.title || "Current Module");

    if (topicQuiz) {
      setQuizTitle(topicQuiz.title);
      setQuizDescription(topicQuiz.description || "");
      setQuizTimeLimit(topicQuiz.timeLimitMinutes ?? 15);
      setQuizPassingScore(topicQuiz.passingScorePercentage ?? 70);
      setQuizQuestions(JSON.parse(JSON.stringify(topicQuiz.questions || [])));
      if (topicQuiz.questions?.length > 0) {
        setExpandedQuestionId(topicQuiz.questions[0].id);
      }
    } else {
      const defaultTitle = `${topicTitle.trim() || `Topic ${topicNumber}`} Knowledge Check`;
      setQuizTitle(defaultTitle);
      setQuizDescription("Test your knowledge and retention on this topic.");
      setQuizTimeLimit(15);
      setQuizPassingScore(70);
      const initialQ: TopicQuizQuestion = {
        id: `q_${Date.now()}_1`,
        type: "mcq",
        question: "",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 0,
        explanation: "",
        points: 1,
      };
      setQuizQuestions([initialQ]);
      setExpandedQuestionId(initialQ.id);
    }
    setQuizError("");
    setShowQuizModal(true);
  };

  const openQuizBuilderFromCard = (modId: string, topic: CourseTopicData) => {
    setQuizModalSource("topic_card");
    setQuizCardTargetModuleId(modId);
    setQuizCardTargetTopicId(topic.id);
    setQuizTopicTitle(topic.title);
    const mod = modules.find((m) => m.id === modId);
    setQuizModuleTitle(mod?.title || "Module");

    if (topic.quiz) {
      setQuizTitle(topic.quiz.title);
      setQuizDescription(topic.quiz.description || "");
      setQuizTimeLimit(topic.quiz.timeLimitMinutes ?? 15);
      setQuizPassingScore(topic.quiz.passingScorePercentage ?? 70);
      setQuizQuestions(JSON.parse(JSON.stringify(topic.quiz.questions || [])));
      if (topic.quiz.questions?.length > 0) {
        setExpandedQuestionId(topic.quiz.questions[0].id);
      }
    } else {
      setQuizTitle(`${topic.title} Knowledge Check`);
      setQuizDescription("Test your knowledge and retention on this topic.");
      setQuizTimeLimit(15);
      setQuizPassingScore(70);
      const initialQ: TopicQuizQuestion = {
        id: `q_${Date.now()}_1`,
        type: "mcq",
        question: "",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 0,
        explanation: "",
        points: 1,
      };
      setQuizQuestions([initialQ]);
      setExpandedQuestionId(initialQ.id);
    }
    setQuizError("");
    setShowQuizModal(true);
  };

  const handleAddQuestion = (type: QuizQuestionType) => {
    const newId = `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    let newQ: TopicQuizQuestion;

    if (type === "mcq") {
      newQ = {
        id: newId,
        type: "mcq",
        question: "",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctOptionIndex: 0,
        explanation: "",
        points: 1,
      };
    } else if (type === "question_answer") {
      newQ = {
        id: newId,
        type: "question_answer",
        question: "",
        correctAnswerText: "",
        explanation: "",
        points: 2,
      };
    } else if (type === "true_false") {
      newQ = {
        id: newId,
        type: "true_false",
        question: "",
        correctBoolean: true,
        explanation: "",
        points: 1,
      };
    } else {
      newQ = {
        id: newId,
        type: "code_challenge",
        question: "",
        codeLanguage: "python",
        codeStarter: "# Write your solution below:\ndef solution():\n    pass",
        codeSolution: "# Reference solution\ndef solution():\n    return True",
        explanation: "",
        points: 3,
      };
    }

    setQuizQuestions((prev) => [...prev, newQ]);
    setExpandedQuestionId(newId);
    toast.success(`Added question`);
  };

  const updateQuestion = (qId: string, updates: Partial<TopicQuizQuestion>) => {
    setQuizQuestions((prev) => prev.map((q) => (q.id === qId ? { ...q, ...updates } : q)));
  };

  const updateMcqOption = (qId: string, optIdx: number, text: string) => {
    setQuizQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const newOpts = [...(q.options || [])];
        newOpts[optIdx] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const addMcqOption = (qId: string) => {
    setQuizQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const currentOpts = q.options || [];
        if (currentOpts.length >= 6) {
          toast.error("Maximum 6 options allowed");
          return q;
        }
        return {
          ...q,
          options: [...currentOpts, `Option ${String.fromCharCode(65 + currentOpts.length)}`],
        };
      })
    );
  };

  const removeMcqOption = (qId: string, optIdx: number) => {
    setQuizQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== qId) return q;
        const currentOpts = q.options || [];
        if (currentOpts.length <= 2) {
          toast.error("At least 2 options are required for MCQ");
          return q;
        }
        const newOpts = currentOpts.filter((_, i) => i !== optIdx);
        let correct = q.correctOptionIndex ?? 0;
        if (correct >= newOpts.length) {
          correct = Math.max(0, newOpts.length - 1);
        }
        return { ...q, options: newOpts, correctOptionIndex: correct };
      })
    );
  };

  const moveQuestion = (index: number, direction: "up" | "down") => {
    setQuizQuestions((prev) => {
      const targetIdx = direction === "up" ? index - 1 : index + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const deleteQuestion = (qId: string) => {
    setQuizQuestions((prev) => prev.filter((q) => q.id !== qId));
    toast.success("Question deleted");
  };

  const handleAddGeneratedQuestions = (newQuestions: TopicQuizQuestion[]) => {
    setQuizQuestions((prev) => {
      if (prev.length === 1 && !prev[0].question.trim()) {
        return newQuestions;
      }
      return [...prev, ...newQuestions];
    });
    if (newQuestions.length > 0) {
      setExpandedQuestionId(newQuestions[0].id);
    }
    toast.success(`Added ${newQuestions.length} generated questions to quiz`);
  };

  const handleSaveQuiz = () => {
    if (!quizTitle.trim()) {
      setQuizError("Quiz title is required");
      return;
    }
    if (quizQuestions.length === 0) {
      setQuizError("Please add at least one question to the quiz");
      return;
    }
    const emptyPromptIdx = quizQuestions.findIndex((q) => !q.question.trim());
    if (emptyPromptIdx !== -1) {
      setQuizError(`Question ${emptyPromptIdx + 1} has an empty question statement`);
      setExpandedQuestionId(quizQuestions[emptyPromptIdx].id);
      return;
    }

    setQuizError("");

    const quizPayload: TopicQuizData = {
      id: `qz_${Date.now()}`,
      title: quizTitle.trim(),
      description: quizDescription.trim(),
      timeLimitMinutes: Number(quizTimeLimit) || 15,
      passingScorePercentage: Number(quizPassingScore) || 70,
      questions: quizQuestions,
    };

    if (quizModalSource === "topic_modal") {
      setTopicQuiz(quizPayload);
      toast.success("Quiz updated for this topic");
      setShowQuizModal(false);
    } else if (quizModalSource === "topic_card" && quizCardTargetModuleId && quizCardTargetTopicId) {
      setModules((prev) =>
        prev.map((m) => {
          if (m.id !== quizCardTargetModuleId) return m;
          return {
            ...m,
            topics: m.topics.map((t) =>
              t.id === quizCardTargetTopicId ? { ...t, quiz: quizPayload } : t
            ),
          };
        })
      );
      toast.success("Topic quiz saved successfully!");
      setShowQuizModal(false);
    }
  };

  // ================= PUBLISH / SAVE COURSE (DYNAMIC APIs) =================
  const handlePublishCourse = async () => {
    if (!title.trim() || !instructor.trim()) {
      setCurrentStep(1);
      toast.error("Please fill in course title and instructor name");
      return;
    }

    setSaving(true);
    try {
      const courseIdToUse = activeCourseId || editCourseId;

      if (isEditing && courseIdToUse) {
        // 3. PUT /api/admin/courses/{course_id}
        await CourseStudioApi.updateCourse(courseIdToUse, {
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          category,
          price: 0,
        });

        // 4. POST /api/admin/courses/{course_id}/image
        if (thumbnailFile) {
          try {
            await CourseStudioApi.uploadThumbnail(courseIdToUse, thumbnailFile);
          } catch (imgErr) {
            console.warn("Thumbnail upload warning", imgErr);
          }
        }

        // Also update local store
        await AdminService.updateCourse(courseIdToUse, {
          title,
          description,
          instructor,
          level,
          category,
          duration,
          thumbnail,
          modules,
        });

        toast.success("Course changes saved successfully!");
      } else {
        // 2. POST /api/admin/courses
        const createResult = await CourseStudioApi.createCourse({
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          category,
        });

        const newCourseId = createResult.courseId || `crs_${Date.now()}`;
        setActiveCourseId(newCourseId);

        // 4. POST image if thumbnail file attached
        if (thumbnailFile && createResult.courseId) {
          try {
            await CourseStudioApi.uploadThumbnail(createResult.courseId, thumbnailFile);
          } catch (imgErr) {
            console.warn("Thumbnail upload warning", imgErr);
          }
        }

        // 6. Sync modules to backend
        if (createResult.courseId && modules.length > 0) {
          for (const m of modules) {
            try {
              await CourseStudioApi.createModule(createResult.courseId, {
                title: m.title,
                summary: m.summary,
              });
            } catch (modErr) {
              console.warn("Module sync warning", modErr);
            }
          }
        }

        // Also save to local store
        await AdminService.createCourse({
          title,
          description,
          instructor,
          level,
          category,
          duration,
          thumbnail,
          modules,
        });

        toast.success("Course created and published successfully!");
      }

      navigate("/admin/courses");
    } catch {
      toast.error("Failed to save course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const totalTopicsCount = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
  const totalAssetsCount = modules.reduce(
    (acc, m) => acc + (m.topics || []).reduce((tAcc, t) => tAcc + (t.assets?.length || 0), 0),
    0
  );
  const totalQuizzesCount = modules.reduce(
    (acc, m) => acc + (m.topics || []).reduce((tAcc, t) => tAcc + (t.quiz?.questions?.length ? 1 : 0), 0),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2e303a] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/courses")}
            className="p-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] text-slate-500 dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                Course Studio
              </span>
              <span className="text-xs font-bold text-slate-400">
                {isEditing ? "Editing Course" : "New Course"}
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
              {title ? title : "Untitled Course"}
            </h1>
          </div>
        </div>

        {/* Stepper Navigation Pills */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-[#1c1d24] p-1.5 rounded-2xl border border-slate-200/60 dark:border-[#2e303a]">
          {[
            { step: 1, label: "Details", icon: BookOpen },
            { step: 2, label: "Curriculum", icon: Layers },
            { step: 3, label: "Review", icon: CheckCircle2 },
          ].map((s) => {
            const Icon = s.icon;
            const active = currentStep === s.step;
            const completed = currentStep > s.step;
            return (
              <button
                key={s.step}
                onClick={() => {
                  if (s.step === 2 && !validateStep1()) return;
                  setCurrentStep(s.step as 1 | 2 | 3);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  active
                    ? "bg-[#4F46E5] text-white shadow-sm"
                    : completed
                    ? "text-[#4F46E5] dark:text-indigo-400 hover:bg-white dark:hover:bg-[#252630]"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
                {completed && <Check size={12} strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= STEP 1: COURSE DETAILS ================= */}
      {currentStep === 1 && (
        <CourseInfoStep
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          instructor={instructor}
          setInstructor={setInstructor}
          category={category}
          setCategory={setCategory}
          level={level}
          setLevel={setLevel}
          duration={duration}
          setDuration={setDuration}
          thumbnail={thumbnail}
          setThumbnail={setThumbnail}
          errors={errors}
          onNext={handleNextToModules}
          modulesCount={modules.length}
          totalTopicsCount={totalTopicsCount}
          totalAssetsCount={totalAssetsCount}
          totalQuizzesCount={totalQuizzesCount}
          onThumbnailFileSelected={setThumbnailFile}
        />
      )}

      {/* ================= STEP 2: MODULES & TOPICS BUILDER ================= */}
      {currentStep === 2 && (
        <CurriculumStep
          modules={modules}
          selectedModuleId={selectedModuleId}
          setSelectedModuleId={setSelectedModuleId}
          onOpenCreateModule={openCreateModule}
          onOpenEditModule={openEditModule}
          onDeleteModule={handleDeleteModule}
          onOpenCreateTopic={openCreateTopic}
          onOpenEditTopic={openEditTopic}
          onDeleteTopic={handleDeleteTopic}
          onOpenQuizBuilder={openQuizBuilderFromCard}
          onContinueToReview={() => setCurrentStep(3)}
        />
      )}

      {/* ================= STEP 3: REVIEW & PUBLISH ================= */}
      {currentStep === 3 && (
        <CourseReviewStep
          title={title}
          description={description}
          instructor={instructor}
          category={category}
          level={level}
          duration={duration}
          thumbnail={thumbnail}
          modules={modules}
          totalTopicsCount={totalTopicsCount}
          isEditing={isEditing}
          saving={saving}
          onBack={() => setCurrentStep(2)}
          onPublish={handlePublishCourse}
        />
      )}

      {/* ================= MODAL: CREATE / EDIT MODULE ================= */}
      <ModuleModal
        isOpen={showModuleModal}
        isEditing={Boolean(editingModuleId)}
        moduleTitle={moduleTitle}
        setModuleTitle={setModuleTitle}
        moduleSummary={moduleSummary}
        setModuleSummary={setModuleSummary}
        moduleError={moduleError}
        onClose={() => setShowModuleModal(false)}
        onSave={handleSaveModule}
      />

      {/* ================= MODAL: ADD / EDIT TOPIC ================= */}
      <TopicModal
        isOpen={showTopicModal}
        isEditing={Boolean(editingTopicId)}
        moduleTitle={modules.find((m) => m.id === topicTargetModuleId)?.title || "Module"}
        topicNumber={topicNumber}
        setTopicNumber={setTopicNumber}
        topicTitle={topicTitle}
        setTopicTitle={setTopicTitle}
        topicSummary={topicSummary}
        setTopicSummary={setTopicSummary}
        topicDocPdf={topicDocPdf}
        setTopicDocPdf={setTopicDocPdf}
        interviewPdf={interviewPdf}
        setInterviewPdf={setInterviewPdf}
        topicVideo={topicVideo}
        setTopicVideo={setTopicVideo}
        practicalVideo={practicalVideo}
        setPracticalVideo={setPracticalVideo}
        topicQuiz={topicQuiz}
        onOpenQuizBuilder={openQuizBuilderFromTopicModal}
        onRemoveQuiz={() => {
          if (confirm("Remove quiz from this topic?")) {
            setTopicQuiz(null);
            toast.success("Quiz detached from topic");
          }
        }}
        topicError={topicError}
        onClose={() => setShowTopicModal(false)}
        onSave={handleSaveTopic}
        onFileUpload={handleGenericFileUpload}
      />

      {/* ================= MODAL: TOPIC QUIZ BUILDER ================= */}
      <QuizBuilderModal
        isOpen={showQuizModal}
        topicTitle={quizTopicTitle}
        moduleTitle={quizModuleTitle}
        quizTitle={quizTitle}
        setQuizTitle={setQuizTitle}
        quizDescription={quizDescription}
        setQuizDescription={setQuizDescription}
        quizTimeLimit={quizTimeLimit}
        setQuizTimeLimit={setQuizTimeLimit}
        quizPassingScore={quizPassingScore}
        setQuizPassingScore={setQuizPassingScore}
        quizQuestions={quizQuestions}
        expandedQuestionId={expandedQuestionId}
        setExpandedQuestionId={setExpandedQuestionId}
        quizError={quizError}
        onAddQuestion={handleAddQuestion}
        onUpdateQuestion={updateQuestion}
        onUpdateMcqOption={updateMcqOption}
        onAddMcqOption={addMcqOption}
        onRemoveMcqOption={removeMcqOption}
        onMoveQuestion={moveQuestion}
        onDeleteQuestion={deleteQuestion}
        onClose={() => setShowQuizModal(false)}
        onSave={handleSaveQuiz}
        courseId={activeCourseId || editCourseId || undefined}
        topicId={quizCardTargetTopicId || undefined}
        topicSummary={topicSummary || undefined}
        onAddGeneratedQuestions={handleAddGeneratedQuestions}
      />
    </div>
  );
}
