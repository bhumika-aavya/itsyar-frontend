import React from "react";
import {
  Plus, ArrowRight, Layers, Edit3, Trash2, BookOpen,
  PlayCircle, Video, FileText, HelpCircle, BrainCircuit, Check
} from "lucide-react";
import { CurriculumStepProps } from "./types";

export default function CurriculumStep({
  modules,
  selectedModuleId,
  setSelectedModuleId,
  onOpenCreateModule,
  onOpenEditModule,
  onDeleteModule,
  onOpenCreateTopic,
  onOpenEditTopic,
  onDeleteTopic,
  onOpenQuizBuilder,
  onContinueToReview,
}: CurriculumStepProps) {
  const selectedModule = modules.find((m) => m.id === selectedModuleId);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Top Bar for Step 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] p-5 rounded-[24px] shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
            Structure: Modules &amp; Topics
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-0.5">
            Organize learning chapters and attach the 4 topic assets (Video, Walkthrough, Docs, Interview Questions) plus topic quizzes.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCreateModule}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>Add Module</span>
          </button>
          <button
            type="button"
            onClick={onContinueToReview}
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
              onClick={onOpenCreateModule}
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
                onClick={onOpenCreateModule}
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
                          onClick={(e) => onOpenEditModule(m, e)}
                          className="p-1 text-slate-400 hover:text-[#4F46E5] transition-colors"
                          title="Edit module"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => onDeleteModule(m.id, e)}
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
                          onOpenCreateTopic(m.id);
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
                      ({selectedModule.topics?.length || 0} topics)
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
                  onClick={() => onOpenCreateTopic(selectedModule.id)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-[#4338CA] transition-all cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  <span>Add Topic</span>
                </button>
              </div>

              {/* Topics List */}
              {!selectedModule.topics || selectedModule.topics.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 dark:border-[#2e303a] rounded-2xl p-8 space-y-3">
                  <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto">
                    <BookOpen size={26} />
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                    No topics in this module yet
                  </h4>
                  <p className="text-xs font-medium text-slate-400 max-w-sm mx-auto">
                    Add topics containing videos, walkthroughs, documentation PDFs, interview questions, and quizzes.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenCreateTopic(selectedModule.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold hover:bg-[#4338CA] transition-all shadow-xs cursor-pointer"
                  >
                    <Plus size={14} /> Add Topic to Module
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedModule.topics.map((t, tIdx) => {
                    const hasDoc = t.assets?.some((a) => a.type === "documentation_pdf");
                    const hasInt = t.assets?.some((a) => a.type === "interview_pdf");
                    const hasVid = t.assets?.some((a) => a.type === "topic_video");
                    const hasPrac = t.assets?.some((a) => a.type === "practical_video");
                    const hasQuiz = Boolean(t.quiz && t.quiz.questions && t.quiz.questions.length > 0);

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
                              onClick={() => onOpenEditTopic(selectedModule.id, t)}
                              className="p-1.5 text-slate-400 hover:text-[#4F46E5] hover:bg-white dark:hover:bg-[#16171d] rounded-lg transition-all cursor-pointer"
                              title="Edit topic"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTopic(selectedModule.id, t.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-[#16171d] rounded-lg transition-all cursor-pointer"
                              title="Delete topic"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* 5 Asset & Quiz Badges Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-200/60 dark:border-[#2e303a]/60">
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

                          {/* 5. Topic Quiz (Disabled for now) */}
                          {/* <button
                            type="button"
                            onClick={() => onOpenQuizBuilder(selectedModule.id, t)}
                            className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer group/quiz ${
                              hasQuiz
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 hover:bg-amber-100/80 dark:hover:bg-amber-950/50 border border-amber-200/60 dark:border-amber-800/40"
                                : "bg-slate-100/70 dark:bg-[#16171d]/60 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 border border-transparent"
                            }`}
                            title={
                              hasQuiz
                                ? `Quiz: ${t.quiz?.questions.length} questions (${t.quiz?.title}). Click to edit.`
                                : "No quiz configured. Click to create quiz."
                            }
                          >
                            <BrainCircuit
                              size={15}
                              className={
                                hasQuiz ? "text-amber-600 dark:text-amber-400 shrink-0" : "text-slate-400 shrink-0"
                              }
                            />
                            <span className="truncate">
                              {hasQuiz ? `Quiz (${t.quiz?.questions.length} Qs)` : "+ Add Quiz"}
                            </span>
                            {hasQuiz ? (
                              <Check size={12} className="ml-auto shrink-0 text-amber-600 dark:text-amber-400" />
                            ) : (
                              <Plus size={12} className="ml-auto shrink-0 text-slate-400 group-hover/quiz:text-slate-600" />
                            )}
                          </button> */}
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
  );
}
