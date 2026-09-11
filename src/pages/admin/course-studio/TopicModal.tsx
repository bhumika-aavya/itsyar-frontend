import React from "react";
import {
  X, FileText, HelpCircle, PlayCircle, Video,
  BrainCircuit, Edit3, Trash2, Clock, Award, Plus, Loader2, ExternalLink
} from "lucide-react";
import { TopicModalProps } from "./types";

export default function TopicModal({
  isOpen,
  isEditing,
  moduleTitle,
  topicNumber,
  setTopicNumber,
  topicTitle,
  setTopicTitle,
  topicSummary,
  setTopicSummary,
  topicDocPdf,
  setTopicDocPdf,
  interviewPdf,
  setInterviewPdf,
  topicVideo,
  setTopicVideo,
  practicalVideo,
  setPracticalVideo,
  topicQuiz,
  onOpenQuizBuilder,
  onRemoveQuiz,
  topicError,
  onClose,
  onSave,
  onFileUpload,
  isSavingTopic = false,
}: TopicModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16171d] rounded-[28px] border border-slate-100 dark:border-[#2e303a] shadow-2xl w-full max-w-2xl p-6 sm:p-8 space-y-5 my-8 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e303a] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                {isEditing ? "Edit Topic" : "Add New Topic"}
              </h3>
              <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                {moduleTitle || "Module"}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Belongs to Module: {moduleTitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg cursor-pointer"
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

          {/* ================= 4 STRUCTURED ASSET CARDS ================= */}
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
                    onChange={(e) => onFileUpload(e, setTopicDocPdf, "pdf")}
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
                  onChange={(e) =>
                    setTopicDocPdf({ name: e.target.value ? "Document Link" : "", url: e.target.value })
                  }
                  placeholder="Or paste direct document link..."
                  className="w-full h-8 px-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                />
                {topicDocPdf.url && (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({
                        url: topicDocPdf.url,
                        title: 'Topic Documentation',
                        subtitle: moduleTitle || 'Topic',
                        type: 'documentation',
                      });
                      window.open(`/pdf-viewer?${params.toString()}`, '_blank');
                    }}
                    className="flex items-center justify-center gap-1.5 w-full h-8 px-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 transition-all cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    Preview PDF
                  </button>
                )}
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
                    onChange={(e) => onFileUpload(e, setInterviewPdf, "pdf")}
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
                  onChange={(e) =>
                    setInterviewPdf({ name: e.target.value ? "Questions Link" : "", url: e.target.value })
                  }
                  placeholder="Or paste interview PDF link..."
                  className="w-full h-8 px-2.5 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 outline-none"
                />
                {interviewPdf.url && (
                  <button
                    type="button"
                    onClick={() => {
                      const params = new URLSearchParams({
                        url: interviewPdf.url,
                        title: 'Interview Questions',
                        subtitle: moduleTitle || 'Topic',
                        type: 'interview',
                      });
                      window.open(`/pdf-viewer?${params.toString()}`, '_blank');
                    }}
                    className="flex items-center justify-center gap-1.5 w-full h-8 px-3 bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/50 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-950/60 transition-all cursor-pointer"
                  >
                    <ExternalLink size={12} />
                    Preview PDF
                  </button>
                )}

                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-950/40 px-2 py-1 rounded-md border border-purple-100 dark:border-purple-900/30">
                  <BrainCircuit size={12} className="shrink-0" />
                  <span>AI automatically extracts and generates topic quiz questions from this PDF in the background.</span>
                </div>
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
                    onChange={(e) => onFileUpload(e, setTopicVideo, "video")}
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
                    onChange={(e) =>
                      setTopicVideo((v) => ({
                        ...v,
                        url: e.target.value,
                        name: e.target.value ? "Video Stream" : v.name,
                      }))
                    }
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
                    onChange={(e) => onFileUpload(e, setPracticalVideo, "video")}
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
                    onChange={(e) =>
                      setPracticalVideo((v) => ({
                        ...v,
                        url: e.target.value,
                        name: e.target.value ? "Walkthrough Link" : v.name,
                      }))
                    }
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

          {/* ================= 5. TOPIC QUIZ & ASSESSMENT SECTION (Disabled for now) ================= */}
          {/* <div className="pt-3 border-t border-slate-200/60 dark:border-[#2e303a]/60">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <BrainCircuit size={16} className="text-amber-500" />
                  Topic Assessment / Quiz
                </span>
                <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                  Topic-specific quiz supporting MCQ, Question &amp; Answer, True/False, and Code Challenges.
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-md">
                  Interactive Quiz
                </span>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-[#2e303a] rounded-2xl p-4 bg-slate-50/50 dark:bg-[#1c1d24]/50">
              {topicQuiz && topicQuiz.questions?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h5 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{topicQuiz.title}</span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                          {topicQuiz.questions.length} {topicQuiz.questions.length === 1 ? "Question" : "Questions"}
                        </span>
                      </h5>
                      {topicQuiz.description && (
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">
                          {topicQuiz.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={onOpenQuizBuilder}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold hover:bg-[#4338CA] transition-all cursor-pointer shadow-xs"
                      >
                        <Edit3 size={13} />
                        <span>Edit Quiz ({topicQuiz.questions.length} Qs)</span>
                      </button>
                      <button
                        type="button"
                        onClick={onRemoveQuiz}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-[#16171d] rounded-lg transition-all cursor-pointer"
                        title="Remove Quiz"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-[#2e303a]/60 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#16171d] border border-slate-200/70 dark:border-[#2e303a]">
                      <Clock size={12} className="text-slate-400" />
                      {topicQuiz.timeLimitMinutes || 15} Mins
                    </span>
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#16171d] border border-slate-200/70 dark:border-[#2e303a]">
                      <Award size={12} className="text-amber-500" />
                      Pass Score: {topicQuiz.passingScorePercentage || 70}%
                    </span>
                    <span className="text-slate-400">
                      Breakdown:{" "}
                      {topicQuiz.questions.filter((q) => q.type === "mcq").length > 0 &&
                        `${topicQuiz.questions.filter((q) => q.type === "mcq").length} MCQ `}
                      {topicQuiz.questions.filter((q) => q.type === "question_answer").length > 0 &&
                        `${topicQuiz.questions.filter((q) => q.type === "question_answer").length} Q&A `}
                      {topicQuiz.questions.filter((q) => q.type === "true_false").length > 0 &&
                        `${topicQuiz.questions.filter((q) => q.type === "true_false").length} T/F `}
                      {topicQuiz.questions.filter((q) => q.type === "code_challenge").length > 0 &&
                        `${topicQuiz.questions.filter((q) => q.type === "code_challenge").length} Code`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      No quiz configured for this topic
                    </p>
                    <p className="text-[11px] font-medium text-slate-400">
                      Create MCQs, Question &amp; Answer, True/False, or Code exercises to evaluate learners on this topic.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onOpenQuizBuilder}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>Create Topic Quiz</span>
                  </button>
                </div>
              )}
            </div>
          </div> */}

          {topicError && <p className="text-xs font-bold text-red-500">{topicError}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2e303a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSavingTopic}
            onClick={onSave}
            className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-10 dark:shadow-none0 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {isSavingTopic ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>{isEditing ? "Saving Topic..." : "Creating Topic..."}</span>
              </>
            ) : (
              isEditing ? "Save Topic" : "Create Topic"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
