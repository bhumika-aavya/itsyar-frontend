import React from "react";
import { X } from "lucide-react";
import { ModuleModalProps } from "./types";

export default function ModuleModal({
  isOpen,
  isEditing,
  moduleTitle,
  setModuleTitle,
  moduleSummary,
  setModuleSummary,
  moduleError,
  onClose,
  onSave,
  saving = false,
}: ModuleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#16171d] rounded-[28px] border border-slate-100 dark:border-[#2e303a] shadow-2xl w-full max-w-lg p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#2e303a] pb-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
              {isEditing ? "Edit Module" : "Create New Module"}
            </h3>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Specify the module name and learning objective summary.
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
              disabled={saving}
              className="w-full h-12 px-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] disabled:opacity-50"
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
              disabled={saving}
              className="w-full p-4 bg-slate-50 dark:bg-[#1c1d24] border border-slate-200 dark:border-[#2e303a] rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] resize-none disabled:opacity-50"
            />
          </div>

          {moduleError && <p className="text-xs font-bold text-red-500">{moduleError}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#2e303a]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          {!isEditing && (
            <button
              type="button"
              disabled={saving}
              onClick={() => onSave(true)}
              className="px-6 py-2.5 bg-[#4F46E5] text-white rounded-xl text-xs font-extrabold shadow-md shadow-indigo-10 dark:shadow-none0 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : "Continue to Add Topics"}
            </button>
          )}
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(false)}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-extrabold hover:bg-slate-800 dark:hover:bg-white transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : (isEditing ? "Save Changes" : "Save Module")}
          </button>
        </div>
      </div>
    </div>
  );
}
