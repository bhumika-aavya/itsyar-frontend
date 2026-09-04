import React, { useEffect, useState } from "react";
import {
  Search, Plus, Edit2, Trash2, Loader2, BookOpen, Clock, CheckCircle2,
  FileEdit
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminService, AdminCourse } from "@/services/admin.service";
import { toast } from "sonner";
import Swal from "sweetalert2";

type FilterTab = "all" | "published" | "draft";

export default function AdminCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCourses = () => {
    AdminService.getCourses()
      .then(setCourses)
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter calculations
  const totalCount = courses.length;
  const draftCount = courses.filter((c) => c.status === "draft").length;
  const publishedCount = courses.filter((c) => c.status !== "draft").length;

  const filtered = courses.filter((c) => {
    const titleMatch = (c.title ?? "").toLowerCase().includes(search.toLowerCase());
    const instructorMatch = (c.instructor ?? (c as any).author ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesSearch = titleMatch || instructorMatch;
    if (!matchesSearch) return false;

    const isCourseDraft = c.status === "draft";

    if (activeTab === "published") return !isCourseDraft;
    if (activeTab === "draft") return isCourseDraft;
    return true;
  });

  const openAdd = () => {
    navigate("/admin/courses/create");
  };

  const openEdit = (course: AdminCourse) => {
    navigate(`/admin/courses/${course.id}/edit`);
  };

  const handleToggleStatus = async (course: AdminCourse, e: React.MouseEvent) => {
    e.stopPropagation();
    const isDraft = course.status === "draft";
    const nextStatus: "published" | "draft" = isDraft ? "published" : "draft";
    setTogglingId(course.id);

    try {
      await AdminService.toggleCourseStatus(course.id, nextStatus);
      setCourses((prev) =>
        prev.map((c) =>
          c.id === course.id
            ? {
              ...c,
              status: nextStatus,
              isActive: nextStatus === "published",
            }
            : c
        )
      );
      toast.success(
        nextStatus === "published"
          ? `"${course.title}" is now Published`
          : `"${course.title}" saved as Draft`
      );
    } catch (err) {
      toast.error("Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Permanently delete this course and all its curriculum?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!"
    });
    if (!result.isConfirmed) return;
    setDeletingId(id);
    try {
      await AdminService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      toast.success("Course deleted successfully");
    } catch (err) {
      toast.error("Failed to delete course");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="animate-spin text-[#4F46E5]" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-[#2e303a] pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Courses</h1>
          <p className="text-sm font-medium text-slate-400 mt-0.5">
            Manage course curriculum, drafts, and published content.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 dark:shadow-none hover:bg-[#4338CA] transition-all cursor-pointer shrink-0"
        >
          <Plus size={16} />
          <span>Add Course</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#1c1d24] rounded-2xl border border-slate-200/60 dark:border-[#2e303a] overflow-x-auto">
          {[
            { key: "all", label: "All", count: totalCount },
            { key: "published", label: "Published", count: publishedCount },
            { key: "draft", label: "Draft", count: draftCount },
          ].map((tab) => {
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as FilterTab)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${active
                  ? "bg-white dark:bg-[#2e303a] text-[#4F46E5] dark:text-indigo-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-black ${active
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#4F46E5] dark:text-indigo-400"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                    }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses or instructors..."
            className="w-full h-10 pl-10 pr-4 bg-white dark:bg-[#16171d] border border-slate-200 dark:border-[#2e303a] rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-[#4F46E5] transition-all"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[24px]">
          <div className="w-14 h-14 bg-slate-50 dark:bg-[#1c1d24] rounded-2xl flex items-center justify-center mb-3 text-slate-400">
            <BookOpen size={26} />
          </div>
          <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">No courses found</p>
          <p className="text-xs font-medium text-slate-400 mt-1">
            {search ? "Try adjusting your search query or filters" : "Click 'Add Course' above to create your first course"}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((course) => {
            const isDraft = course.status === "draft";
            const isBusy = togglingId === course.id;
            { console.log(' course?.imageUrl', `${import.meta.env.VITE_IMAGE_URL}${course.imageUrl}`) }
            return (
              <div
                key={course.id}
                onClick={() => navigate(`/admin/courses/${course.id}`)}
                className="bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[24px] overflow-hidden shadow-xs hover:shadow-md transition-all group cursor-pointer flex flex-col justify-between"
              >
                {/* Image Container with Status Badge */}
                <div className="relative w-full h-44 overflow-hidden bg-slate-100 dark:bg-[#1c1d24]">
                  <img
                    src={
                      course?.imageUrl
                        ? `${import.meta.env.VITE_IMAGE_URL}${course.imageUrl}`
                        : "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop"
                    }
                    alt={course.title}
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?q=80&w=800&auto=format&fit=crop";
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/30 pointer-events-none" />

                  {/* Top-Right: Clickable Draft / Published Status Switch */}
                  <div className="absolute top-3 right-3 z-10">
                    <button
                      type="button"
                      onClick={(e) => handleToggleStatus(course, e)}
                      disabled={isBusy}
                      title={isDraft ? "Click to Publish course" : "Click to set as Draft"}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider backdrop-blur-md shadow-md transition-all cursor-pointer ${isDraft
                        ? "bg-amber-500/90 hover:bg-amber-600 text-white"
                        : "bg-emerald-600/90 hover:bg-emerald-700 text-white"
                        }`}
                    >
                      {isBusy ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : isDraft ? (
                        <Clock size={12} />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      <span>{isDraft ? "Draft" : "Published"}</span>
                    </button>
                  </div>

                  {/* Bottom Image Overlay Tag */}
                  {course.category && (
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-black/60 text-white backdrop-blur-md">
                        {course.category || course.tag}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-black text-base text-slate-900 dark:text-slate-100 group-hover:text-[#4F46E5] dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs font-bold text-slate-400">
                      Instructor: {course.instructor ?? (course as any).author ?? "—"}
                    </p>
                    {course.description && (
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-2 pt-0.5">
                        {course.description}
                      </p>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#2e303a]">
                    <span className="text-xs font-extrabold text-[#4F46E5] dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-lg">
                      {course.level || "Beginner"}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {course.enrolled ?? 0} enrolled
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEdit(course);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-[#1c1d24] text-slate-700 dark:text-slate-300 rounded-xl text-xs font-extrabold hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-[#4F46E5] dark:hover:text-indigo-400 transition-all cursor-pointer"
                    >
                      <Edit2 size={13} />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleDelete(course.id, e)}
                      disabled={deletingId === course.id}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-50 dark:bg-[#1c1d24] text-red-500 dark:text-red-400 rounded-xl text-xs font-extrabold hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {deletingId === course.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
