import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft, ArrowRight, Save, Plus, Trash2, Edit3, X,
  BookOpen, Layers, CheckCircle2, Video, FileText, HelpCircle,
  PlayCircle, Upload, Sparkles, AlertCircle, Clock, Check
} from "lucide-react";
import {
  AdminService, CourseModuleData, CourseTopicData, CourseAssetData
} from "@/services/admin.service";
import { toast } from "sonner";

const CATEGORIES = [
  "Programming",
  "Web Development",
  "Data Science",
  "AI / ML",
  "Cloud Architecture",
  "DevOps",
  "Cybersecurity",
  "Design",
  "Other"
];

const LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

export default function AdminCreateCoursePage() {
  const navigate = useNavigate();
  const { id: editCourseId } = useParams<{ id: string }>();
  const isEditing = Boolean(editCourseId);

  // Stepper State: 1 = Details, 2 = Curriculum (Modules & Topics), 3 = Review
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState<boolean>(isEditing);
  const [saving, setSaving] = useState<boolean>(false);

  // Step 1: Course Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [instructor, setInstructor] = useState("");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState("");
  const [thumbnail, setThumbnail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 2: Modules & Topics
  const [modules, setModules] = useState<CourseModuleData[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

  // Module Modal State (SS 3)
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleSummary, setModuleSummary] = useState("");
  const [moduleError, setModuleError] = useState("");

  // Topic Modal State (SS 4)
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing course if in edit mode
  useEffect(() => {
    if (!editCourseId) return;
    setLoading(true);
    AdminService.getCourseDetail(editCourseId)
      .then((c) => {
        if (!c) {
          toast.error("Course not found");
          navigate("/admin/courses");
          return;
        }
        setTitle(c.title || "");
        setDescription(c.description || "");
        setInstructor(c.instructor || "");
        setCategory(c.category || c.tag || "Programming");
        setLevel(c.level || "Beginner");
        setDuration(c.duration || "");
        setThumbnail(c.thumbnail || "");
        if (c.modules && c.modules.length > 0) {
          setModules(c.modules);
          setSelectedModuleId(c.modules[0].id);
        }
      })
      .catch(() => {
        toast.error("Failed to load course details");
      })
      .finally(() => setLoading(false));
  }, [editCourseId, navigate]);

  // Thumbnail upload handler
  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setThumbnail(reader.result as string);
      toast.success("Thumbnail image attached");
    };
    reader.onerror = () => {
      toast.error("Failed to read image file");
    };
    reader.readAsDataURL(file);
  };

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

  // ================= MODULE ACTIONS (SS 3) =================
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

  const handleSaveModule = (andAddTopic = false) => {
    if (!moduleTitle.trim()) {
      setModuleError("Module title is required");
      return;
    }
    setModuleError("");

    let activeId = selectedModuleId;

    if (editingModuleId) {
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
      const newModId = `mod_${Date.now()}`;
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

  const handleDeleteModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this module and all its topics?")) return;
    const remaining = modules.filter((m) => m.id !== moduleId);
    setModules(remaining);
    if (selectedModuleId === moduleId) {
      setSelectedModuleId(remaining[0]?.id || null);
    }
    toast.success("Module removed");
  };

  // ================= TOPIC ACTIONS (SS 4) =================
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
    setTopicError("");
    setShowTopicModal(true);
  };

  const openEditTopic = (modId: string, topic: CourseTopicData) => {
    setEditingTopicId(topic.id);
    setTopicTargetModuleId(modId);
    setTopicNumber(topic.topicNumber || 1);
    setTopicTitle(topic.title);
    setTopicSummary(topic.summary || "");

    const docAsset = topic.assets.find((a) => a.type === "documentation_pdf");
    const intAsset = topic.assets.find((a) => a.type === "interview_pdf");
    const vidAsset = topic.assets.find((a) => a.type === "topic_video");
    const pracAsset = topic.assets.find((a) => a.type === "practical_video");

    setTopicDocPdf({ name: docAsset?.fileName || docAsset?.title || "", url: docAsset?.url || "" });
    setInterviewPdf({ name: intAsset?.fileName || intAsset?.title || "", url: intAsset?.url || "" });
    setTopicVideo({ name: vidAsset?.fileName || vidAsset?.title || "", url: vidAsset?.url || "", duration: vidAsset?.duration || "" });
    setPracticalVideo({ name: pracAsset?.fileName || pracAsset?.title || "", url: pracAsset?.url || "", duration: pracAsset?.duration || "" });

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
    };

    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== topicTargetModuleId) return m;
        const exists = m.topics.some((t) => t.id === topicPayload.id);
        const updatedTopics = exists
          ? m.topics.map((t) => (t.id === topicPayload.id ? topicPayload : t))
          : [...m.topics, topicPayload];
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

  const handlePublishCourse = async () => {
    if (!title.trim() || !instructor.trim()) {
      setCurrentStep(1);
      toast.error("Please fill in course title and instructor name");
      return;
    }

    setSaving(true);
    try {
      if (isEditing && editCourseId) {
        await AdminService.updateCourse(editCourseId, {
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

  const selectedModule = modules.find((m) => m.id === selectedModuleId);
  const totalTopicsCount = modules.reduce((acc, m) => acc + (m.topics?.length || 0), 0);
  const totalAssetsCount = modules.reduce(
    (acc, m) => acc + m.topics.reduce((tAcc, t) => tAcc + (t.assets?.length || 0), 0),
    0
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2e303a] pb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/courses")}
            className="p-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] text-slate-500 dark:text-slate-400 hover:text-[#4F46E5] dark:hover:text-indigo-400 rounded-xl transition-all shadow-xs"
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
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
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

      {/* ================= STEP 1: COURSE DETAILS (SS 2 REFERENCE) ================= */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in-50 duration-200">
          {/* Main Course Form Card */}
          <div className="lg:col-span-2 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Course Information</h2>
              <p className="text-sm font-medium text-slate-400 mt-1">
                Provide core details and metadata for learners to discover this course.
              </p>
            </div>

            {/* Course Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. React for Beginners"
                className={`w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border ${
                  errors.title ? "border-red-500" : "border-slate-200 dark:border-[#2e303a]"
                } rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] dark:focus:border-indigo-400 transition-all`}
              />
              {errors.title && <p className="text-xs font-bold text-red-500">{errors.title}</p>}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief course description and outcomes..."
                rows={4}
                className="w-full p-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] dark:focus:border-indigo-400 transition-all resize-none"
              />
            </div>

            {/* Instructor & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Instructor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  placeholder="e.g. Harshpreet Kaur Arora"
                  className={`w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border ${
                    errors.instructor ? "border-red-500" : "border-slate-200 dark:border-[#2e303a]"
                  } rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] dark:focus:border-indigo-400 transition-all`}
                />
                {errors.instructor && (
                  <p className="text-xs font-bold text-red-500">{errors.instructor}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Estimated Duration
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 12 hours (optional)"
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] dark:focus:border-indigo-400 transition-all"
                />
              </div>
            </div>

            {/* Category & Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5] dark:focus:border-indigo-400 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Difficulty Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5] dark:focus:border-indigo-400 transition-all cursor-pointer"
                >
                  {LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bottom Action */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleNextToModules}
                className="flex items-center gap-2 px-8 py-3.5 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer"
              >
                <span>Next: Create Modules</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right Column: Thumbnail & Preview Card */}
          <div className="space-y-5">
            <div className="bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[28px] p-6 shadow-xs space-y-4">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Course Thumbnail</h3>
              <p className="text-xs font-medium text-slate-400">
                Upload a cover banner or paste a direct image URL.
              </p>

              {/* Upload Box */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  thumbnail
                    ? "border-emerald-500/40 bg-emerald-50/20 dark:bg-emerald-950/10"
                    : "border-slate-200 dark:border-[#2e303a] hover:border-[#4F46E5] bg-slate-50/50 dark:bg-[#1c1d24]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 flex items-center justify-center mb-3">
                  <Upload size={22} />
                </div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                  Click or Drag to Upload
                </p>
                <p className="text-xs font-medium text-slate-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              </div>

              {/* URL input fallback */}
              <div className="space-y-1.5 pt-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                  Or Image URL
                </label>
                <input
                  type="text"
                  value={thumbnail}
                  onChange={(e) => setThumbnail(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
                />
              </div>

              {/* Thumbnail Live Card Preview */}
              {thumbnail && (
                <div className="relative rounded-2xl overflow-hidden border border-slate-100 dark:border-[#2e303a] shadow-xs group">
                  <img src={thumbnail} alt="Thumbnail preview" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setThumbnail("")}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                  <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold rounded-md">
                    Cover Preview
                  </div>
                </div>
              )}
            </div>

            {/* Quick Metrics Card */}
            <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[28px] p-6 space-y-3">
              <div className="flex items-center gap-2 text-[#4F46E5] dark:text-indigo-400">
                <Sparkles size={18} />
                <h4 className="text-sm font-black">Curriculum Structure</h4>
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-relaxed">
                Courses are organized in a 3-tier hierarchy: Course &rarr; Modules &rarr; Topics with 4 structured assets.
              </p>
              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div className="bg-white dark:bg-[#16171d] p-2.5 rounded-xl border border-slate-100 dark:border-[#2e303a]">
                  <p className="text-xs font-extrabold text-slate-400">Modules</p>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100">{modules.length}</p>
                </div>
                <div className="bg-white dark:bg-[#16171d] p-2.5 rounded-xl border border-slate-100 dark:border-[#2e303a]">
                  <p className="text-xs font-extrabold text-slate-400">Topics</p>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100">{totalTopicsCount}</p>
                </div>
                <div className="bg-white dark:bg-[#16171d] p-2.5 rounded-xl border border-slate-100 dark:border-[#2e303a]">
                  <p className="text-xs font-extrabold text-slate-400">Assets</p>
                  <p className="text-base font-black text-slate-900 dark:text-slate-100">{totalAssetsCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 2: MODULES & TOPICS BUILDER (SS 3 & SS 4 REFERENCE) ================= */}
      {currentStep === 2 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200">
          {/* Top Bar for Step 2 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] p-5 rounded-[24px] shadow-xs">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Structure: Modules &amp; Topics
              </h2>
              <p className="text-xs font-bold text-slate-400 mt-0.5">
                Organize learning chapters and attach the 4 topic assets (Video, Walkthrough, Docs, Interview Questions).
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={openCreateModule}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Module</span>
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-extrabold hover:bg-slate-800 transition-all cursor-pointer"
              >
                <span>Continue to Review</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Studio Workspace: Split Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Modules Navigation (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[28px] p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#2e303a]">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Course Outline ({modules.length})
                </span>
                <button
                  type="button"
                  onClick={openCreateModule}
                  className="text-xs font-extrabold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} /> Add
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-[#1c1d24] text-slate-300 dark:text-slate-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Layers size={24} />
                  </div>
                  <p className="text-xs font-bold text-slate-400">No modules created yet.</p>
                  <button
                    type="button"
                    onClick={openCreateModule}
                    className="text-xs font-extrabold text-[#4F46E5] hover:underline cursor-pointer"
                  >
                    + Create First Module
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {modules.map((m, idx) => {
                    const isSelected = m.id === selectedModuleId;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setSelectedModuleId(m.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer group relative ${
                          isSelected
                            ? "bg-indigo-50/50 dark:bg-indigo-950/20 border-[#4F46E5] dark:border-indigo-500 shadow-xs"
                            : "bg-slate-50/60 dark:bg-[#1c1d24]/60 border-slate-200/70 dark:border-[#2e303a] hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded-lg text-[11px] font-black flex items-center justify-center ${
                                isSelected
                                  ? "bg-[#4F46E5] text-white"
                                  : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                              {m.title}
                            </h4>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => openEditModule(m, e)}
                              className="p-1 text-slate-400 hover:text-[#4F46E5] transition-colors"
                              title="Edit module"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteModule(m.id, e)}
                              className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                              title="Delete module"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>

                        {m.summary && (
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 mt-2 ml-8">
                            {m.summary}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-3 ml-8 text-[11px] font-bold text-slate-400">
                          <span>{m.topics?.length || 0} topics</span>
                          <span>&bull;</span>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              openCreateTopic(m.id);
                            }}
                            className="text-[#4F46E5] dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            + Add Topic
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Topics Inside Selected Module (8 cols) */}
            <div className="lg:col-span-8 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[28px] p-6 sm:p-8 shadow-xs space-y-6">
              {selectedModule ? (
                <>
                  {/* Selected Module Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-[#2e303a]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold uppercase text-[#4F46E5] dark:text-indigo-400 tracking-wider">
                          Module {modules.findIndex((m) => m.id === selectedModule.id) + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-400">
                          ({selectedModule.topics.length} topics)
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mt-0.5">
                        {selectedModule.title}
                      </h3>
                      {selectedModule.summary && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                          {selectedModule.summary}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => openCreateTopic(selectedModule.id)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#4338CA] transition-all cursor-pointer shrink-0"
                    >
                      <Plus size={15} />
                      <span>Add Topic</span>
                    </button>
                  </div>

                  {/* Topics List */}
                  {selectedModule.topics.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-slate-200 dark:border-[#2e303a] rounded-2xl p-8 space-y-3">
                      <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                        <BookOpen size={26} />
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                        No topics in this module yet
                      </h4>
                      <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                        Add topics containing videos, walkthroughs, documentation PDFs, and interview questions.
                      </p>
                      <button
                        type="button"
                        onClick={() => openCreateTopic(selectedModule.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold hover:bg-[#4338CA] transition-all shadow-xs cursor-pointer"
                      >
                        <Plus size={14} /> Add Topic to Module
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedModule.topics.map((t, tIdx) => {
                        const hasDoc = t.assets.some((a) => a.type === "documentation_pdf");
                        const hasInt = t.assets.some((a) => a.type === "interview_pdf");
                        const hasVid = t.assets.some((a) => a.type === "topic_video");
                        const hasPrac = t.assets.some((a) => a.type === "practical_video");

                        return (
                          <div
                            key={t.id}
                            className="bg-slate-50/70 dark:bg-[#1c1d24]/70 border border-slate-200/80 dark:border-[#2e303a] rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] flex items-center justify-center text-xs font-black text-[#4F46E5] dark:text-indigo-400 shadow-2xs">
                                  {t.topicNumber || tIdx + 1}
                                </div>
                                <div>
                                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                                    {t.title}
                                  </h4>
                                  {t.summary && (
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                                      {t.summary}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => openEditTopic(selectedModule.id, t)}
                                  className="p-1.5 text-slate-400 hover:text-[#4F46E5] hover:bg-white dark:hover:bg-[#16171d] rounded-lg transition-all cursor-pointer"
                                  title="Edit topic"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTopic(selectedModule.id, t.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-[#16171d] rounded-lg transition-all cursor-pointer"
                                  title="Delete topic"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>

                            {/* 4 Asset Badges Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60 dark:border-[#2e303a]/60">
                              {/* 1. Topic Video */}
                              <div
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold ${
                                  hasVid
                                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-[#4F46E5] dark:text-indigo-300"
                                    : "bg-slate-100/70 dark:bg-[#16171d]/60 text-slate-400"
                                }`}
                              >
                                <PlayCircle size={15} />
                                <span className="truncate">Topic Video</span>
                                {hasVid && <Check size={12} className="ml-auto shrink-0" />}
                              </div>

                              {/* 2. Walkthrough Video */}
                              <div
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold ${
                                  hasPrac
                                    ? "bg-indigo-50 dark:bg-indigo-950/30 text-[#4F46E5] dark:text-indigo-300"
                                    : "bg-slate-100/70 dark:bg-[#16171d]/60 text-slate-400"
                                }`}
                              >
                                <Video size={15} />
                                <span className="truncate">Walkthrough</span>
                                {hasPrac && <Check size={12} className="ml-auto shrink-0" />}
                              </div>

                              {/* 3. Topic Docs */}
                              <div
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold ${
                                  hasDoc
                                    ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-300"
                                    : "bg-slate-100/70 dark:bg-[#16171d]/60 text-slate-400"
                                }`}
                              >
                                <FileText size={15} />
                                <span className="truncate">Documentation</span>
                                {hasDoc && <Check size={12} className="ml-auto shrink-0" />}
                              </div>

                              {/* 4. Interview PDF */}
                              <div
                                className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold ${
                                  hasInt
                                    ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-300"
                                    : "bg-slate-100/70 dark:bg-[#16171d]/60 text-slate-400"
                                }`}
                              >
                                <HelpCircle size={15} />
                                <span className="truncate">Interview PDF</span>
                                {hasInt && <Check size={12} className="ml-auto shrink-0" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-20 text-center space-y-3">
                  <Layers size={32} className="text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-400">
                    Select a module on the left to view and add topics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= STEP 3: REVIEW & PUBLISH ================= */}
      {currentStep === 3 && (
        <div className="space-y-6 animate-in fade-in-50 duration-200 max-w-4xl mx-auto">
          <div className="bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[28px] p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e303a] pb-6">
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Review Curriculum</h2>
                <p className="text-sm font-medium text-slate-400 mt-1">
                  Verify course information and structure before publishing to the platform.
                </p>
              </div>
              <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold uppercase tracking-wide">
                Ready to Publish
              </span>
            </div>

            {/* Course Summary Banner */}
            <div className="flex flex-col sm:flex-row items-center gap-6 bg-slate-50 dark:bg-[#1c1d24] p-5 rounded-2xl border border-slate-200/60 dark:border-[#2e303a]">
              {thumbnail ? (
                <img
                  src={thumbnail}
                  alt={title}
                  className="w-full sm:w-44 h-28 object-cover rounded-xl border border-slate-200 dark:border-[#2e303a]"
                />
              ) : (
                <div className="w-full sm:w-44 h-28 bg-indigo-50 dark:bg-indigo-950/50 rounded-xl flex items-center justify-center text-[#4F46E5]">
                  <BookOpen size={36} />
                </div>
              )}

              <div className="space-y-2 w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#4F46E5] text-white text-[11px] font-extrabold">
                    {category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold">
                    {level}
                  </span>
                  {duration && (
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock size={12} /> {duration}
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">{title}</h3>
                <p className="text-xs font-bold text-slate-400">By {instructor}</p>
                {description && (
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2">
                    {description}
                  </p>
                )}
              </div>
            </div>

            {/* Curriculum Breakdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                Modules Breakdown ({modules.length} Modules &bull; {totalTopicsCount} Topics)
              </h4>

              {modules.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200/60">
                  <AlertCircle size={18} className="mx-auto mb-1" />
                  No modules added. Learners will see an empty syllabus. You can still publish and add modules later.
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((m, mIdx) => (
                    <div
                      key={m.id}
                      className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 space-y-2 bg-white dark:bg-[#16171d]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                          Module {mIdx + 1}: {m.title}
                        </span>
                        <span className="text-xs font-bold text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                          {m.topics.length} topics
                        </span>
                      </div>
                      {m.topics.length > 0 && (
                        <div className="pl-4 border-l-2 border-slate-200 dark:border-[#2e303a] space-y-1.5 pt-1">
                          {m.topics.map((t, tIdx) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400"
                            >
                              <span>
                                {tIdx + 1}. {t.title}
                              </span>
                              <span className="text-[11px] font-bold text-slate-400">
                                {t.assets.length} assets
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-6 border-t border-slate-100 dark:border-[#2e303a] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-3 bg-slate-100 dark:bg-[#1c1d24] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-slate-200 transition-all cursor-pointer"
              >
                Back to Curriculum
              </button>

              <button
                type="button"
                onClick={handlePublishCourse}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all disabled:opacity-60 cursor-pointer"
              >
                <Save size={15} />
                <span>{saving ? "Publishing..." : isEditing ? "Save & Update Course" : "Publish Course"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: CREATE / EDIT MODULE (SS 3 REFERENCE) ================= */}
      {showModuleModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16171d] rounded-[28px] border border-slate-100 dark:border-[#2e303a] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e303a] pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {editingModuleId ? "Edit Module" : "Create New Module"}
                </h3>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  Specify the module name and learning objective summary.
                </p>
              </div>
              <button
                onClick={() => setShowModuleModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Module Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Module Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={moduleTitle}
                  onChange={(e) => setModuleTitle(e.target.value)}
                  placeholder="e.g. Module 2: Palantir Architecture"
                  className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
                />
              </div>

              {/* Module Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Module Summary
                </label>
                <textarea
                  value={moduleSummary}
                  onChange={(e) => setModuleSummary(e.target.value)}
                  placeholder="Enter a brief summary of this module's learning objectives"
                  rows={4}
                  className="w-full p-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] resize-none"
                />
              </div>

              {moduleError && <p className="text-xs font-bold text-red-500">{moduleError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2e303a]">
              <button
                type="button"
                onClick={() => setShowModuleModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveModule(true)}
                className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer"
              >
                Continue to Add Topics
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT TOPIC WITH 4 ASSETS (SS 4 REFERENCE) ================= */}
      {showTopicModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16171d] rounded-[28px] border border-slate-100 dark:border-[#2e303a] shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-5 my-8 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e303a] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {editingTopicId ? "Edit Topic" : "Add New Topic"}
                  </h3>
                  <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                    {modules.find((m) => m.id === topicTargetModuleId)?.title || "Module"}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-400 mt-0.5">
                  Belongs to Module: {modules.find((m) => m.id === topicTargetModuleId)?.title}
                </p>
              </div>
              <button
                onClick={() => setShowTopicModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {/* Topic Number & Sequence */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Topic Number
                </label>
                <select
                  value={topicNumber}
                  onChange={(e) => setTopicNumber(Number(e.target.value))}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-[#4F46E5]"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <option key={num} value={num}>
                      Topic {num}
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Topic Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="e.g. Introduction to Variables & Objects"
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5]"
                />
              </div>

              {/* Topic Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Topic Summary
                </label>
                <textarea
                  value={topicSummary}
                  onChange={(e) => setTopicSummary(e.target.value)}
                  placeholder="Description of what learners will study in this topic..."
                  rows={2}
                  className="w-full p-3 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] resize-none"
                />
              </div>

              {/* ================= 4 STRUCTURED ASSET CARDS (SS 4) ================= */}
              <div className="pt-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 block mb-3">
                  Topic Learning Assets (4 Types)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Topic Documentation PDF */}
                  <div className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 bg-slate-50/50 dark:bg-[#1c1d24]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText size={15} className="text-emerald-500" />
                        Topic Documentation
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-md">
                        PDF
                      </span>
                    </div>

                    <label className="border-2 border-dashed border-slate-200 dark:border-[#2e303a] hover:border-emerald-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-[#16171d]">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleGenericFileUpload(e, setTopicDocPdf, "pdf")}
                        className="hidden"
                      />
                      <FileText size={20} className="text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {topicDocPdf.name ? topicDocPdf.name : "drag or click to upload PDF"}
                      </span>
                    </label>

                    <input
                      type="text"
                      value={topicDocPdf.url}
                      onChange={(e) => setTopicDocPdf({ name: e.target.value ? "Document Link" : "", url: e.target.value })}
                      placeholder="Or paste direct document link..."
                      className="w-full h-8 px-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                    />
                  </div>

                  {/* 2. Interview Question PDF */}
                  <div className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 bg-slate-50/50 dark:bg-[#1c1d24]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <HelpCircle size={15} className="text-purple-500" />
                        Interview Questions
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 rounded-md">
                        PDF
                      </span>
                    </div>

                    <label className="border-2 border-dashed border-slate-200 dark:border-[#2e303a] hover:border-purple-500 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-[#16171d]">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => handleGenericFileUpload(e, setInterviewPdf, "pdf")}
                        className="hidden"
                      />
                      <HelpCircle size={20} className="text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {interviewPdf.name ? interviewPdf.name : "drag or click to upload PDF"}
                      </span>
                    </label>

                    <input
                      type="text"
                      value={interviewPdf.url}
                      onChange={(e) => setInterviewPdf({ name: e.target.value ? "Questions Link" : "", url: e.target.value })}
                      placeholder="Or paste interview PDF link..."
                      className="w-full h-8 px-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                    />
                  </div>

                  {/* 3. Topic Video */}
                  <div className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 bg-slate-50/50 dark:bg-[#1c1d24]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <PlayCircle size={15} className="text-[#4F46E5]" />
                        Topic Video
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] rounded-md">
                        MP4
                      </span>
                    </div>

                    <label className="border-2 border-dashed border-slate-200 dark:border-[#2e303a] hover:border-[#4F46E5] rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-[#16171d]">
                      <input
                        type="file"
                        accept="video/mp4,video/*"
                        onChange={(e) => handleGenericFileUpload(e, setTopicVideo, "video")}
                        className="hidden"
                      />
                      <PlayCircle size={20} className="text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {topicVideo.name ? topicVideo.name : "drag or click to upload MP4"}
                      </span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={topicVideo.url}
                        onChange={(e) => setTopicVideo((v) => ({ ...v, url: e.target.value, name: e.target.value ? "Video Stream" : v.name }))}
                        placeholder="Or video link..."
                        className="col-span-2 h-8 px-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                      />
                      <input
                        type="text"
                        value={topicVideo.duration || ""}
                        onChange={(e) => setTopicVideo((v) => ({ ...v, duration: e.target.value }))}
                        placeholder="12:30"
                        className="h-8 px-2 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 text-center outline-none"
                        title="Duration (mm:ss)"
                      />
                    </div>
                  </div>

                  {/* 4. Practical Walkthrough Video */}
                  <div className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 bg-slate-50/50 dark:bg-[#1c1d24]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Video size={15} className="text-indigo-600" />
                        Practical Walkthrough
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-md">
                        MP4
                      </span>
                    </div>

                    <label className="border-2 border-dashed border-slate-200 dark:border-[#2e303a] hover:border-indigo-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-white dark:bg-[#16171d]">
                      <input
                        type="file"
                        accept="video/mp4,video/*"
                        onChange={(e) => handleGenericFileUpload(e, setPracticalVideo, "video")}
                        className="hidden"
                      />
                      <Video size={20} className="text-slate-400 mb-1" />
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {practicalVideo.name ? practicalVideo.name : "drag or click to upload MP4"}
                      </span>
                    </label>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={practicalVideo.url}
                        onChange={(e) => setPracticalVideo((v) => ({ ...v, url: e.target.value, name: e.target.value ? "Walkthrough Link" : v.name }))}
                        placeholder="Or video link..."
                        className="col-span-2 h-8 px-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                      />
                      <input
                        type="text"
                        value={practicalVideo.duration || ""}
                        onChange={(e) => setPracticalVideo((v) => ({ ...v, duration: e.target.value }))}
                        placeholder="24:00"
                        className="h-8 px-2 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-bold text-slate-700 dark:text-slate-300 text-center outline-none"
                        title="Duration (mm:ss)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {topicError && <p className="text-xs font-bold text-red-500">{topicError}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2e303a]">
              <button
                type="button"
                onClick={() => setShowTopicModal(false)}
                className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTopic}
                className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer"
              >
                {editingTopicId ? "Save Topic" : "Create Topic"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
