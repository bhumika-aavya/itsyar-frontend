import React, { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, Loader2, BookOpen, X, Save } from "lucide-react";
import { AdminService } from "@/services/admin.service";
import { CourseService } from "@/services/course.service";

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
const EMPTY_FORM: CourseForm = { title: "", description: "", instructor: "", level: "Beginner", category: "Programming", thumbnail: "", duration: "" };
const INPUT_CLS = "w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all";

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

export default function OrganizerCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    CourseService.getAllCourses()
      .then(data => setCourses(Array.isArray(data) ? data : (data as any)?.courses ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(c =>
    (c.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (c.instructor ?? c.author ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingId(null); setForm(EMPTY_FORM); setFormError(""); setShowModal(true); };
  const openEdit = (course: any) => {
    setEditingId(course.id);
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
    if (!form.title.trim()) { setFormError("Course title is required"); return; }
    if (!form.instructor.trim()) { setFormError("Instructor name is required"); return; }
    setFormError("");
    setSaving(true);
    if (editingId) {
      const updated = await AdminService.updateCourse(editingId, form as unknown as Record<string, string>);
      setCourses(prev => prev.map(c => c.id === editingId ? { ...c, ...updated } : c));
    } else {
      const created = await AdminService.createCourse(form as unknown as Record<string, string>);
      setCourses(prev => [created, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this course?")) return;
    setDeletingId(id);
    await AdminService.deleteCourse(id);
    setCourses(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Courses</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">{courses.length} courses managed by you</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
        >
          <Plus size={16} /> Add Course
        </button>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[24px]">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={26} className="text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-400">No courses yet</p>
          <button onClick={openAdd} className="mt-4 px-4 py-2 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold hover:bg-[#4338CA] transition-all">
            Add your first course
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course: any) => (
            <div key={course.id} className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all group">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="w-full h-36 object-cover" />
              ) : (
                <div className="w-full h-36 bg-indigo-50 flex items-center justify-center">
                  <BookOpen size={32} className="text-[#4F46E5]/30" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div>
                  <p className="font-extrabold text-slate-900 leading-snug">{course.title}</p>
                  <p className="text-xs font-bold text-slate-400 mt-1">{course.instructor ?? course.author ?? "—"}</p>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#4F46E5] bg-indigo-50 px-2.5 py-1 rounded-lg">
                    {course.level ?? course.difficulty ?? "All levels"}
                  </span>
                  <span className="text-xs font-bold text-slate-400">{course.enrolledCount ?? 0} enrolled</span>
                </div>
                <div className="flex gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(course)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-extrabold hover:bg-indigo-50 hover:text-[#4F46E5] transition-all"
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    disabled={deletingId === course.id}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-red-400 rounded-xl text-xs font-extrabold hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    {deletingId === course.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">{editingId ? "Edit Course" : "Add Course"}</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">
                  {editingId ? "Update course details" : "Create a new course"}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              <Field label="Course Title" required>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. React for Beginners" className={INPUT_CLS} />
              </Field>
              <Field label="Description">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief course description..." rows={3} className={INPUT_CLS + " resize-none"} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Instructor" required>
                  <input value={form.instructor} onChange={e => setForm(f => ({ ...f, instructor: e.target.value }))} placeholder="Instructor name" className={INPUT_CLS} />
                </Field>
                <Field label="Duration">
                  <input value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} placeholder="e.g. 12 hours" className={INPUT_CLS} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Level">
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className={INPUT_CLS + " cursor-pointer"}>
                    {LEVELS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </Field>
                <Field label="Category">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={INPUT_CLS + " cursor-pointer"}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Thumbnail URL">
                <input value={form.thumbnail} onChange={e => setForm(f => ({ ...f, thumbnail: e.target.value }))} placeholder="https://..." className={INPUT_CLS} />
              </Field>
              {formError && <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{formError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all">Cancel</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? "Saving…" : editingId ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
