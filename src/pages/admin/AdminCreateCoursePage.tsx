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
import Swal from "sweetalert2";

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
  const [courseStatus, setCourseStatus] = useState<"published" | "draft">("published");
  const [courseIsActive, setCourseIsActive] = useState<boolean>(true);
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
  const [isSavingModule, setIsSavingModule] = useState(false);

  // Topic Modal State
  const [showTopicModal, setShowTopicModal] = useState(false);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [topicTargetModuleId, setTopicTargetModuleId] = useState<string | null>(null);
  const [topicNumber, setTopicNumber] = useState<number>(1);
  const [topicTitle, setTopicTitle] = useState("");
  const [topicSummary, setTopicSummary] = useState("");
  const [topicError, setTopicError] = useState("");
  const [isSavingTopic, setIsSavingTopic] = useState(false);

  // 4 Assets for Topic (Metadata & Object URLs)
  const [topicDocPdf, setTopicDocPdf] = useState<{ name: string; url: string; size?: string }>({ name: "", url: "" });
  const [interviewPdf, setInterviewPdf] = useState<{ name: string; url: string; size?: string }>({ name: "", url: "" });
  const [topicVideo, setTopicVideo] = useState<{ name: string; url: string; duration?: string }>({ name: "", url: "", duration: "" });
  const [practicalVideo, setPracticalVideo] = useState<{ name: string; url: string; duration?: string }>({ name: "", url: "", duration: "" });

  // 4 Raw File Objects for Multipart Upload
  const [topicDocPdfFile, setTopicDocPdfFile] = useState<File | null>(null);
  const [interviewPdfFile, setInterviewPdfFile] = useState<File | null>(null);
  const [topicVideoFile, setTopicVideoFile] = useState<File | null>(null);
  const [practicalVideoFile, setPracticalVideoFile] = useState<File | null>(null);

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
        const imgUrl = c.imageUrl ? `${import.meta.env.VITE_IMAGE_URL}${c.imageUrl}` : c.thumbnail || "";
        setThumbnail(imgUrl);
        setCourseStatus(c.status === "draft" ? "draft" : "published");
        setCourseIsActive(c.isActive !== undefined ? c.isActive : (c.status !== "inactive" && (c as any).is_active !== false));

        // 5. GET /api/admin/courses/{course_id}/module to fetch dynamic modules
        let serverModules: any[] = [];
        try {
          serverModules = await CourseStudioApi.getCourseModules(editCourseId);
        } catch {
          serverModules = [];
        }

        let combinedModules: CourseModuleData[] = c.modules && c.modules.length > 0 ? [...c.modules] : [];

        if (serverModules && serverModules.length > 0) {
          const serverMapped: CourseModuleData[] = await Promise.all(
            serverModules.map(async (sm: any, idx: number) => {
              const modId = sm.moduleId || sm.id || `mod_${idx + 1}`;
              const existing = combinedModules.find((cm) => cm.id === modId);

              // Actively fetch topics for this module from topic API
              let fetchedTopics: any[] = [];
              try {
                fetchedTopics = await CourseStudioApi.getModuleTopics(editCourseId, modId);
              } catch (tErr) {
                console.warn(`Could not fetch topics for module ${modId}`, tErr);
                fetchedTopics = [];
              }

              let mappedTopics: CourseTopicData[] = [];
              if (fetchedTopics && fetchedTopics.length > 0) {
                mappedTopics = fetchedTopics.map((t: any, tIdx: number) => {
                  const topicId = t.topicId || t.topic_id || t.id || `top_${tIdx + 1}`;
                  const seqNum = Number(t.sequenceOrder || t.topicNumber || tIdx + 1) || tIdx + 1;
                  const rawAssets = t.assets || t.subItems || [];
                  const mappedAssets: CourseAssetData[] = rawAssets.map((a: any, aIdx: number) => {
                    const rawType = String(a.type || "").toLowerCase();
                    let assetType: CourseAssetData["type"] = "topic_video";
                    if (rawType.includes("practical") || rawType === "practical_video") {
                      assetType = "practical_video";
                    } else if (rawType.includes("interview") || rawType === "interview_pdf") {
                      assetType = "interview_pdf";
                    } else if (rawType.includes("doc") || rawType === "documentation_pdf" || rawType === "documentation") {
                      assetType = "documentation_pdf";
                    } else if (rawType.includes("quiz")) {
                      assetType = "quiz";
                    }

                    return {
                      id: a.id || `asset_${aIdx + 1}`,
                      type: assetType,
                      title: a.title || "Asset",
                      url: a.url || a.gcs_path || a.gcsPath || "",
                      duration: a.duration || undefined,
                      fileName: a.fileName || a.filename || undefined,
                      fileSize: a.fileSize || a.size || undefined,
                    };
                  });

                  return {
                    id: topicId,
                    topicNumber: seqNum,
                    title: t.title || t.topic_title || `Topic ${tIdx + 1}`,
                    summary: t.summary || t.topicSummary || t.topic_summary || "",
                    assets: mappedAssets,
                    quiz: t.quiz,
                  };
                });
              } else if (existing?.topics && existing.topics.length > 0) {
                mappedTopics = existing.topics;
              }

              return {
                id: modId,
                order: idx + 1,
                title: sm.title || sm.moduleTitle || `Module ${idx + 1}`,
                summary: sm.summary || sm.moduleSummary || "",
                topics: mappedTopics,
              };
            })
          );
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

  /**
   * Helper: Ensure course exists in backend and activeCourseId is set before adding curriculum.
   * This prevents duplicate creation and provides the required courseId for modules & topics.
   */
  const ensureCourseCreated = async (): Promise<string> => {
    if (activeCourseId) return activeCourseId;
    if (editCourseId) {
      setActiveCourseId(editCourseId);
      return editCourseId;
    }

    if (!title.trim() || !instructor.trim()) {
      toast.error("Please fill in course title and instructor in Step 1 first");
      setCurrentStep(1);
      throw new Error("Course title and instructor required");
    }

    const res = await CourseStudioApi.createCourse({
      title: title.trim(),
      description: description.trim(),
      instructor: instructor.trim(),
      category,
      level,
    });

    const newId = res.courseId || `crs_${Date.now()}`;
    setActiveCourseId(newId);

    if (thumbnailFile && res.courseId) {
      try {
        await CourseStudioApi.uploadThumbnail(res.courseId, thumbnailFile);
      } catch (imgErr) {
        console.warn("Thumbnail upload warning", imgErr);
      }
    }

    return newId;
  };

  const handleNextToModules = async () => {
    if (!validateStep1()) {
      toast.error("Please fill in the required course details");
      return;
    }

    // Auto-provision course if starting brand new
    if (!activeCourseId && !editCourseId) {
      setSaving(true);
      try {
        await ensureCourseCreated();
      } catch {
        // user prompted
      } finally {
        setSaving(false);
      }
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
    setIsSavingModule(true);

    try {
      let courseId: string | null = activeCourseId || editCourseId || null;
      if (!courseId) {
        try {
          courseId = await ensureCourseCreated();
        } catch {
          // save locally
        }
      }

      let activeId = selectedModuleId;

      if (editingModuleId) {
        // 7. PUT /api/admin/courses/{course_id}/module/{module_id}
        if (courseId) {
          try {
            await CourseStudioApi.updateModule(courseId, editingModuleId, {
              title: moduleTitle.trim(),
              summary: moduleSummary.trim(),
            });
          } catch (err) {
            console.warn("Update module warning", err);
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
        if (courseId) {
          try {
            const res = await CourseStudioApi.createModule(courseId, {
              title: moduleTitle.trim(),
              summary: moduleSummary.trim(),
            });
            if (res?.module?.moduleId || res?.module?.id || res?.moduleId) {
              newModId = res?.module?.moduleId || res?.module?.id || res?.moduleId;
            }
          } catch (err) {
            console.warn("Create module warning", err);
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
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this module and all its topics?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const courseIdToUse = activeCourseId || editCourseId;
        if (courseIdToUse) {
          try {
            await CourseStudioApi.deleteModule(courseIdToUse, moduleId);
          } catch (err) {
            console.warn("Module delete warning", err);
            Swal.showValidationMessage("Failed to delete module");
          }
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });
    
    if (!result.isConfirmed) return;

    const remaining = modules.filter((m) => m.id !== moduleId);
    setModules(remaining);
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(remaining[0]?.id || null);
    }
    toast.success("Module deleted");
  };

  // ================= TOPIC ACTIONS (4-STEP FLOW) =================
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
    setTopicDocPdfFile(null);
    setInterviewPdfFile(null);
    setTopicVideoFile(null);
    setPracticalVideoFile(null);
    setIsSavingTopic(false);
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
    setTopicDocPdfFile(null);
    setInterviewPdfFile(null);
    setTopicVideoFile(null);
    setPracticalVideoFile(null);
    setIsSavingTopic(false);

    setTopicQuiz(topic.quiz ? JSON.parse(JSON.stringify(topic.quiz)) : null);
    setTopicError("");
    setShowTopicModal(true);
  };

  /**
   * Reads video duration client-side from HTML5 video element (per user specification)
   */
  const computeVideoDuration = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      try {
        const video = document.createElement("video");
        video.preload = "metadata";
        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          const mins = Math.floor(video.duration / 60);
          const secs = Math.floor(video.duration % 60);
          resolve(`${mins}:${secs.toString().padStart(2, "0")}`);
        };
        video.onerror = () => resolve("10:00");
        video.src = URL.createObjectURL(file);
      } catch {
        resolve("10:00");
      }
    });
  };

  const handleGenericFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: { name: string; url: string; duration?: string }) => void,
    type: "pdf" | "video",
    rawSetter?: (f: File) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (rawSetter) {
      rawSetter(file);
    } else {
      if (setter === setTopicDocPdf) setTopicDocPdfFile(file);
      else if (setter === setInterviewPdf) setInterviewPdfFile(file);
      else if (setter === setTopicVideo) setTopicVideoFile(file);
      else if (setter === setPracticalVideo) setPracticalVideoFile(file);
    }

    let dur: string | undefined = undefined;
    if (type === "video") {
      dur = await computeVideoDuration(file);
    }

    setter({
      name: file.name,
      url: URL.createObjectURL(file),
      duration: dur,
    });
    toast.success(`Attached ${file.name}${dur ? ` (${dur})` : ""}`);
  };

  const handleSaveTopic = async () => {
    if (!topicTitle.trim()) {
      setTopicError("Topic title is required");
      return;
    }
    if (!topicTargetModuleId) return;
    setTopicError("");
    setIsSavingTopic(true);

    try {
      let courseId = activeCourseId || editCourseId;
      if (!courseId) {
        courseId = await ensureCourseCreated();
      }

      let topicIdToUse = editingTopicId;
      let topicVideoGcsPath = "";
      let topicVideoContentType = "";
      let topicVideoSizeByte = 0;
      let practicalVideoGcsPath = "";
      let practicalVideoContentType = "";
      let practicalVideoSizeByte = 0;

      // Step 1: Reserve topic_id if new
      if (!topicIdToUse && courseId) {
        try {
          const reserveRes = await CourseStudioApi.reserveTopic(courseId, topicTargetModuleId, {
            title: topicTitle.trim(),
            summary: topicSummary.trim() || undefined,
          });
          const reservedId = reserveRes?.topicId || reserveRes?.topic_id;
          if (reservedId) {
            topicIdToUse = reservedId;
          }
        } catch (resErr) {
          console.warn("Topic reservation failed", resErr);
        }
      }

      if (!topicIdToUse) {
        throw new Error("Failed to reserve topic ID from server. Please try again.");
      }

      const finalTopicId = topicIdToUse;

      // Step 2: Upload Topic Video
      if (topicVideoFile && courseId) {
        try {
          toast.loading("Uploading lecture video...", { id: "topic-upload" });
          const vidRes = await CourseStudioApi.uploadTopicVideo(
            courseId,
            topicTargetModuleId,
            finalTopicId,
            "topic",
            topicVideoFile
          );
          if (vidRes?.gcsPath || vidRes?.gcs_path) {
            topicVideoGcsPath = vidRes.gcsPath || vidRes.gcs_path || "";
            topicVideoContentType = vidRes.contentType || vidRes.content_type || "video/mp4";
            topicVideoSizeByte = vidRes.sizeByte || vidRes.size_byte || topicVideoFile.size;
            toast.success("Video uploaded successfully");
          }
        } catch (vErr) {
          console.warn("Topic video upload warning", vErr);
        }
      }

      // Step 3: Upload Practical Walkthrough Video
      if (practicalVideoFile && courseId) {
        try {
          toast.loading("Uploading practical video...", { id: "topic-upload" });
          const pracRes = await CourseStudioApi.uploadTopicVideo(
            courseId,
            topicTargetModuleId,
            finalTopicId,
            "practical",
            practicalVideoFile
          );
          if (pracRes?.gcsPath || pracRes?.gcs_path) {
            practicalVideoGcsPath = pracRes.gcsPath || pracRes.gcs_path || "";
            practicalVideoContentType = pracRes.contentType || pracRes.content_type || "video/mp4";
            practicalVideoSizeByte = pracRes.sizeByte || pracRes.size_byte || practicalVideoFile.size;
            toast.success("Practical Video uploaded successfully");
          }
        } catch (pErr) {
          console.warn("Practical video upload warning", pErr);
        }
      }

      // Step 4: Edit topic to attach everything (PUT .../topic/{topic_id})
      const hasAssetsToAttach = Boolean(
        topicVideoGcsPath ||
        practicalVideoGcsPath ||
        topicDocPdfFile ||
        interviewPdfFile ||
        editingTopicId
      );

      if (courseId && hasAssetsToAttach) {
        try {
          toast.loading("Attaching topic assets & documentation...", { id: "topic-upload" });
          await CourseStudioApi.finalizeTopic(courseId, topicTargetModuleId, {
            topic_id: finalTopicId,
            title: topicTitle.trim(),
            summary: topicSummary.trim() || undefined,
            topic_video_gcs_path: topicVideoGcsPath || undefined,
            topic_video_content_type: topicVideoContentType || undefined,
            topic_video_size_byte: topicVideoSizeByte || undefined,
            topic_video_duration: topicVideo.duration || "10:00",
            practical_video_gcs_path: practicalVideoGcsPath || undefined,
            practical_video_content_type: practicalVideoContentType || undefined,
            practical_video_size_byte: practicalVideoSizeByte || undefined,
            practical_video_duration: practicalVideo.duration || "10:00",
            documentation_pdf: topicDocPdfFile || undefined,
            interview_pdf: interviewPdfFile || undefined,
          });
          
          if (topicDocPdfFile) toast.success("Document PDF uploaded successfully");
          if (interviewPdfFile) toast.success("Interview Questions PDF uploaded successfully");
        } catch (finErr) {
          console.warn("Topic finalize warning", finErr);
        }
      }

      // Step 5: Save topic quiz to PostgreSQL backend if attached
      if (topicQuiz && courseId) {
        try {
          await CourseStudioApi.saveTopicQuiz(courseId, finalTopicId, {
            title: topicQuiz.title,
            description: topicQuiz.description,
            time_limit_minutes: topicQuiz.timeLimitMinutes,
            passing_score_percentage: topicQuiz.passingScorePercentage,
            questions: topicQuiz.questions as any,
          });
        } catch (quizErr) {
          console.warn("Quiz save warning", quizErr);
        }
      }

      toast.dismiss("topic-upload");

      // Update Local State for Rendering
      const assets: CourseAssetData[] = [];
      if (topicDocPdf.url || topicDocPdf.name || topicDocPdfFile) {
        assets.push({
          id: `ast_doc_${Date.now()}`,
          type: "documentation_pdf",
          title: "Topic Documentation",
          url: topicDocPdf.url,
          fileName: topicDocPdf.name || topicDocPdfFile?.name || "documentation.pdf",
        });
      }
      if (interviewPdf.url || interviewPdf.name || interviewPdfFile) {
        assets.push({
          id: `ast_int_${Date.now()}`,
          type: "interview_pdf",
          title: "Interview Questions",
          url: interviewPdf.url,
          fileName: interviewPdf.name || interviewPdfFile?.name || "interview_questions.pdf",
        });
      }
      if (topicVideo.url || topicVideo.name || topicVideoFile) {
        assets.push({
          id: `ast_vid_${Date.now()}`,
          type: "topic_video",
          title: "Topic Video Lecture",
          url: topicVideo.url,
          fileName: topicVideo.name || topicVideoFile?.name || "topic_video.mp4",
          duration: topicVideo.duration || "10:00",
        });
      }
      if (practicalVideo.url || practicalVideo.name || practicalVideoFile) {
        assets.push({
          id: `ast_prac_${Date.now()}`,
          type: "practical_video",
          title: "Practical Walkthrough Video",
          url: practicalVideo.url,
          fileName: practicalVideo.name || practicalVideoFile?.name || "practical_video.mp4",
          duration: practicalVideo.duration || "10:00",
        });
      }

      const topicPayload: CourseTopicData = {
        id: finalTopicId,
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
      toast.success(editingTopicId ? "Topic updated successfully" : "Topic created successfully");
    } catch (err: any) {
      toast.dismiss("topic-upload");
      console.error("Topic save error", err);
      toast.error(err?.message || "Failed to create topic");
    } finally {
      setIsSavingTopic(false);
    }
  };

  const handleDeleteTopic = async (modId: string, topicId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Delete this topic?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const courseId = activeCourseId || editCourseId;
        if (courseId) {
          try {
            await CourseStudioApi.deleteTopic(courseId, modId, topicId);
          } catch (delErr) {
            console.warn("Delete topic warning", delErr);
            Swal.showValidationMessage("Failed to delete topic");
          }
        }
      },
      allowOutsideClick: () => !Swal.isLoading()
    });
    
    if (!result.isConfirmed) return;
    
    setModules((prev) =>
      prev.map((m) =>
        m.id === modId
          ? { ...m, topics: m.topics.filter((t) => t.id !== topicId) }
          : m
      )
    );
    toast.success("Topic removed");
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
      const courseId = activeCourseId || editCourseId;
      if (courseId) {
        CourseStudioApi.saveTopicQuiz(courseId, quizCardTargetTopicId, {
          title: quizPayload.title,
          description: quizPayload.description,
          time_limit_minutes: quizPayload.timeLimitMinutes,
          passing_score_percentage: quizPayload.passingScorePercentage,
          questions: quizPayload.questions as any,
        }).catch((e) => console.warn("Quiz save backend warning", e));
      }

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
  const handlePublishCourse = async (overrideStatus?: "published" | "draft", overrideActive?: boolean) => {
    if (saving) return; // Prevent duplicate requests on rapid clicks
    if (!title.trim() || !instructor.trim()) {
      setCurrentStep(1);
      toast.error("Please fill in course title and instructor name");
      return;
    }

    const finalStatus = overrideStatus || courseStatus;
    const finalActive = overrideActive !== undefined ? overrideActive : (finalStatus === "published" ? courseIsActive : false);

    setSaving(true);
    try {
      const courseIdToUse = activeCourseId || editCourseId;
      let finalThumbnailUrl = thumbnail;

      if (courseIdToUse) {
        // ALWAYS UPDATE existing course — NEVER DUPLICATE!
        await CourseStudioApi.updateCourse(courseIdToUse, {
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          category,
          level,
          price: 0,
          status: finalStatus,
          isActive: finalActive,
        });

        // Upload/replace thumbnail if new file selected
        if (thumbnailFile) {
          try {
            const uploadRes = await CourseStudioApi.uploadThumbnail(courseIdToUse, thumbnailFile);
            if (uploadRes && (uploadRes.url || uploadRes.thumbnailUrl || uploadRes.thumbnail_url)) {
              finalThumbnailUrl = uploadRes.url || uploadRes.thumbnailUrl || uploadRes.thumbnail_url;
            }
          } catch (imgErr) {
            console.warn("Thumbnail upload warning", imgErr);
          }
        }

        // Also update local cache
        await AdminService.updateCourse(courseIdToUse, {
          title,
          description,
          instructor,
          level,
          category,
          duration,
          thumbnail: finalThumbnailUrl,
          modules,
          status: finalStatus,
          isActive: finalActive,
        });

        toast.success(finalStatus === "draft" ? "Course saved as draft!" : "Course changes saved successfully!");
      } else {
        // ONLY call createCourse if course does NOT already exist
        const createResult = await CourseStudioApi.createCourse({
          title: title.trim(),
          description: description.trim(),
          instructor: instructor.trim(),
          category,
          level,
          status: finalStatus,
          isActive: finalActive,
        });

        const newCourseId = createResult.courseId || `crs_${Date.now()}`;
        setActiveCourseId(newCourseId);

        if (thumbnailFile && createResult.courseId) {
          try {
            const uploadRes = await CourseStudioApi.uploadThumbnail(createResult.courseId, thumbnailFile);
            if (uploadRes && (uploadRes.url || uploadRes.thumbnailUrl || uploadRes.thumbnail_url)) {
              finalThumbnailUrl = uploadRes.url || uploadRes.thumbnailUrl || uploadRes.thumbnail_url;
            }
          } catch (imgErr) {
            console.warn("Thumbnail upload warning", imgErr);
          }
        }

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

        await AdminService.createCourse({
          title,
          description,
          instructor,
          level,
          category,
          duration,
          thumbnail: finalThumbnailUrl,
          modules,
          status: finalStatus,
          isActive: finalActive,
        } as any);

        toast.success(finalStatus === "draft" ? "Course saved as draft!" : "Course created and published successfully!");
      }

      navigate("/admin/courses");
    } catch (err) {
      console.error("Publish course error", err);
      toast.error("Failed to save course. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    setCourseStatus("draft");
    handlePublishCourse("draft", false);
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
    <div className="space-y-4 max-w-6xl mx-auto pb-16">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2e303a] pb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => {
              if (editCourseId) {
                navigate(`/admin/courses/${editCourseId}`);
              } else if (activeCourseId) {
                navigate(`/admin/courses/${activeCourseId}`);
              } else {
                navigate("/admin/courses");
              }
            }}
            className="p-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] text-slate-500 dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                Course Studio
              </span>
              <span className="text-xs font-bold text-slate-400">
                {isEditing ? "Editing Course" : "New Course"}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 truncate max-w-full">
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
          status={courseStatus}
          setStatus={setCourseStatus}
          isActive={courseIsActive}
          setIsActive={setCourseIsActive}
          saving={saving}
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
          status={courseStatus}
          setStatus={setCourseStatus}
          isActive={courseIsActive}
          setIsActive={setCourseIsActive}
          onBack={() => setCurrentStep(2)}
          onPublish={() => handlePublishCourse("published", true)}
          onSaveDraft={handleSaveDraft}
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
        saving={isSavingModule}
      />

      {/* ================= MODAL: ADD / EDIT TOPIC (4-STEP FLOW) ================= */}
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
        onRemoveQuiz={async () => {
          const result = await Swal.fire({
            title: "Are you sure?",
            text: "Remove quiz from this topic?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Yes, remove it!"
          });
          if (result.isConfirmed) {
            setTopicQuiz(null);
            toast.success("Quiz detached from topic");
          }
        }}
        topicError={topicError}
        onClose={() => setShowTopicModal(false)}
        onSave={handleSaveTopic}
        onFileUpload={handleGenericFileUpload}
        isSavingTopic={isSavingTopic}
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
