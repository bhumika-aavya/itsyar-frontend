import React, { useRef } from "react";
import { ArrowRight, Upload, X, Sparkles } from "lucide-react";
import { CourseInfoStepProps, CATEGORIES, LEVELS } from "./types";
import { toast } from "sonner";

export default function CourseInfoStep({
  title,
  setTitle,
  description,
  setDescription,
  instructor,
  setInstructor,
  category,
  setCategory,
  level,
  setLevel,
  duration,
  setDuration,
  thumbnail,
  setThumbnail,
  errors,
  onNext,
  modulesCount,
  totalTopicsCount,
  totalAssetsCount,
  totalQuizzesCount,
  onThumbnailFileSelected,
  status = "published",
  setStatus = () => {},
  isActive = true,
  setIsActive = () => {},
}: CourseInfoStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    onThumbnailFileSelected(file);
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

  return (
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
              Category <span className="text-xs font-normal text-slate-400">(Python, Palantir, React)</span>
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

        {/* Status Control */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#2e303a]">
          <div className="space-y-2 max-w-sm">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Course Status
            </label>
            <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-[#1c1d24] rounded-xl border border-slate-200 dark:border-[#2e303a]">
              <button
                type="button"
                onClick={() => setStatus("published")}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  status === "published"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Published
              </button>
              <button
                type="button"
                onClick={() => setStatus("draft")}
                className={`flex-1 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  status === "draft"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Draft
              </button>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              {status === "published"
                ? "Published courses are visible to learners on the platform."
                : "Draft courses are saved privately and hidden from the catalog."}
            </p>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={onNext}
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
              accept="image/png,image/jpeg,image/webp"
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
            Courses are organized in a 3-tier hierarchy: Course &rarr; Modules &rarr; Topics with 4 structured assets and topic-specific quizzes.
          </p>
          <div className="grid grid-cols-4 gap-2 pt-2 text-center">
            <div className="bg-white dark:bg-[#16171d] p-2 rounded-xl border border-slate-100 dark:border-[#2e303a]">
              <p className="text-[10px] font-extrabold text-slate-400">Modules</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{modulesCount}</p>
            </div>
            <div className="bg-white dark:bg-[#16171d] p-2 rounded-xl border border-slate-100 dark:border-[#2e303a]">
              <p className="text-[10px] font-extrabold text-slate-400">Topics</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{totalTopicsCount}</p>
            </div>
            <div className="bg-white dark:bg-[#16171d] p-2 rounded-xl border border-slate-100 dark:border-[#2e303a]">
              <p className="text-[10px] font-extrabold text-slate-400">Assets</p>
              <p className="text-sm font-black text-slate-900 dark:text-slate-100">{totalAssetsCount}</p>
            </div>
            <div className="bg-white dark:bg-[#16171d] p-2 rounded-xl border border-slate-100 dark:border-[#2e303a]">
              <p className="text-[10px] font-extrabold text-slate-400">Quizzes</p>
              <p className="text-sm font-black text-amber-600 dark:text-amber-400">{totalQuizzesCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
