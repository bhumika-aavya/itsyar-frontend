import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Edit2, Trash2, Loader2, Save, X, Users } from "lucide-react";
import { AdminService } from "@/services/admin.service";

interface CourseForm {
  title: string;
  description: string;
  instructor: string;
  level: string;
  category: string;
  thumbnail: string;
  duration: string;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const CATEGORIES = ["Programming", "Data Science", "Web Development", "AI / ML", "DevOps", "Design", "Other"];

export default function AdminCourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<CourseForm | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    AdminService.getCourses()
      .then(courses => {
        const found = courses.find((c: any) => String(c.id) === String(id));
        if (found) setCourse(found);
        else setNotFound(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const openEdit = () => {
    if (!course) return;
    setForm({
      title: course.title ?? "",
      description: course.description ?? "",
      instructor: course.instructor ?? course.author ?? "",
      level: course.level ?? course.difficulty ?? "Beginner",
      category: course.category ?? "Programming",
      thumbnail: course.thumbnail ?? "",
      duration: course.duration ?? "",
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form || !course) return;
    if (!form.title.trim()) { setFormError("Course title is required"); return; }
    if (!form.instructor.trim()) { setFormError("Instructor name is required"); return; }
    setFormError("");
    setSaving(true);
    const updated = await AdminService.updateCourse(course.id, form as unknown as Record<string, string>);
    setCourse((prev: any) => ({ ...prev, ...updated }));
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async () => {
    if (!course) return;
    if (!confirm("Permanently delete this course?")) return;
    setDeleting(true);
    await AdminService.deleteCourse(course.id);
    navigate("/admin/courses");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="max-w-6xl space-y-5">
        <button
          onClick={() => navigate("/admin/courses")}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors"
        >
          <ArrowLeft size={15} /> Back to Courses
        </button>
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[24px]">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={26} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-5">
      <button
        onClick={() => navigate("/admin/courses")}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#4F46E5] transition-colors"
      >
        <ArrowLeft size={15} /> Back to Courses
      </button>

      <div className="bg-white border border-slate-100 rounded-[24px] overflow-hidden shadow-sm">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-indigo-50 flex items-center justify-center">
            <BookOpen size={48} className="text-[#4F46E5]/30" />
          </div>
        )}

        <div className="p-8 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">{course.title}</h1>
              <p className="text-sm font-bold text-slate-400 mt-1">
                {course.instructor ?? course.author ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={openEdit}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 text-[#4F46E5] rounded-xl text-sm font-extrabold hover:bg-indigo-100 transition-all"
              >
                <Edit2 size={15} /> Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-extrabold hover:bg-red-100 transition-all disabled:opacity-50"
              >
                {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />} Delete
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 px-2.5 py-1.5 rounded-lg">
              {course.level ?? course.difficulty ?? "All levels"}
            </span>
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
              <Users size={13} /> {course.enrolled ?? 0} enrolled
            </span>
            {course.modulesCount != null && (
              <span className="text-xs font-bold text-slate-400">{course.modulesCount} modules</span>
            )}
          </div>

          {course.description && (
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-2">Description</p>
              <p className="text-sm font-medium text-slate-600 leading-relaxed">{course.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showModal && form && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Edit Course</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">Update course details</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <Field label="Course Title" required>
                <input
                  value={form.title}
                  onChange={e => setForm(f => f && ({ ...f, title: e.target.value }))}
                  className={INPUT_CLS}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => f && ({ ...f, description: e.target.value }))}
                  rows={3}
                  className={INPUT_CLS + " resize-none"}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Instructor" required>
                  <input
                    value={form.instructor}
                    onChange={e => setForm(f => f && ({ ...f, instructor: e.target.value }))}
                    className={INPUT_CLS}
                  />
                </Field>
                <Field label="Duration">
                  <input
                    value={form.duration}
                    onChange={e => setForm(f => f && ({ ...f, duration: e.target.value }))}
                    placeholder="e.g. 12 hours"
                    className={INPUT_CLS}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Level">
                  <select
                    value={form.level}
                    onChange={e => setForm(f => f && ({ ...f, level: e.target.value }))}
                    className={INPUT_CLS + " cursor-pointer"}
                  >
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Category">
                  <select
                    value={form.category}
                    onChange={e => setForm(f => f && ({ ...f, category: e.target.value }))}
                    className={INPUT_CLS + " cursor-pointer"}
                  >
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>

              <Field label="Thumbnail URL">
                <input
                  value={form.thumbnail}
                  onChange={e => setForm(f => f && ({ ...f, thumbnail: e.target.value }))}
                  placeholder="https://..."
                  className={INPUT_CLS}
                />
              </Field>

              {formError && (
                <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const INPUT_CLS =
  "w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
