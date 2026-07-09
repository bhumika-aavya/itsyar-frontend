import React, { useEffect, useState } from "react";
import { Search, BookOpen, Loader2, ExternalLink } from "lucide-react";
import { CourseService } from "@/services/course.service";
import { useNavigate } from "react-router-dom";

export default function MentorCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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

  const LEVEL_COLOR: Record<string, string> = {
    Beginner: "bg-emerald-50 text-emerald-600",
    Intermediate: "bg-amber-50 text-amber-600",
    Advanced: "bg-red-50 text-red-500",
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">My Courses</h1>
        <p className="text-sm font-medium text-slate-400 mt-0.5">Courses you are currently mentoring</p>
      </div>

      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search courses..."
          className="w-full h-10 pl-9 pr-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#4F39F6]"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-[24px]">
          <div className="w-14 h-14 bg-sky-50 rounded-2xl flex items-center justify-center mb-4">
            <BookOpen size={26} className="text-sky-300" />
          </div>
          <p className="text-sm font-bold text-slate-400">No courses assigned yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course: any) => {
            const level = course.level ?? course.difficulty ?? "All levels";
            const levelCls = LEVEL_COLOR[level] ?? "bg-slate-50 text-slate-500";
            return (
              <div key={course.id} className="bg-white border border-slate-100 rounded-[20px] overflow-hidden shadow-sm hover:shadow-md transition-all">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt={course.title} className="w-full h-36 object-cover" />
                ) : (
                  <div className="w-full h-36 bg-sky-50 flex items-center justify-center">
                    <BookOpen size={32} className="text-sky-300" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div>
                    <p className="font-black text-slate-900 leading-snug">{course.title}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{course.instructor ?? course.author ?? "—"}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${levelCls}`}>{level}</span>
                    <span className="text-xs font-bold text-slate-400">{course.enrolledCount ?? 0} students</span>
                  </div>
                  <button
                    onClick={() => navigate(`/courses/${course.id}`)}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-black hover:bg-sky-50 hover:text-sky-600 transition-all"
                  >
                    <ExternalLink size={13} /> View Course
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
