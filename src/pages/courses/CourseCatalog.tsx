import React, { useEffect, useState } from 'react';
import { Book, Code, Layout, Database, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { Course, MyCourse } from '@/schemas/course.schema';

// 1. Icon Mapper for "Continue Learning" section
const iconMap: Record<string, React.ElementType> = {
  code: Code,
  layout: Layout,
  database: Database,
};

const iconColorMap: Record<string, string> = {
  code: "bg-blue-50 text-blue-500",
  layout: "bg-orange-50 text-orange-500",
  database: "bg-slate-100 text-slate-500",
};

const ContinueCard = ({ data }: { data: MyCourse }) => {
  const Icon = iconMap[data.category] || Book;
  const colors = iconColorMap[data.category] || "bg-slate-50 text-slate-500";

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group cursor-pointer text-left">
      <div className={`${colors} w-12 h-12 rounded-2xl flex items-center justify-center mb-6`}>
        <Icon size={24} />
      </div>
      <h4 className="font-bold text-slate-900 mb-4 leading-tight">{data.title}</h4>
      <div className="flex items-center justify-between mb-4">
        <div className="text-[11px] font-bold text-slate-400">{data.progress}% Complete</div>
        <div className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-md uppercase">{data.level}</div>
      </div>
      <div className="w-full h-1.5 bg-slate-100 rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-[#4F39F6] rounded-full transition-all duration-1000" 
          style={{ width: `${data.progress}%` }} 
        />
      </div>
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <Book size={14} /> {data.lessons}
      </div>
    </div>
  );
};

const CourseGridCard = ({ data }: { data: Course }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/courses/${data._id}`)}
      className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all group flex flex-col cursor-pointer text-left"
    >
      <div className="h-48 overflow-hidden relative">
        {data.badge && (
          <span className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg z-10">
            {data.badge}
          </span>
        )}
        <img src={data.image} alt={data.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="flex gap-2 mb-4">
          <span className="bg-indigo-50 text-[#4F39F6] text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">{data.tag}</span>
          <span className="bg-slate-50 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">{data.duration}</span>
        </div>
        <h3 className="font-bold text-slate-900 mb-3 group-hover:text-[#4F39F6] transition-colors">{data.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed font-medium mb-6 flex-1">{data.description}</p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
              <img src={`https://i.pravatar.cc/150?u=${data.instructor}`} alt="" />
            </div>
            <span className="text-[11px] font-bold text-slate-500">by {data.instructor}</span>
          </div>
          <button className="text-[11px] font-bold text-[#4F39F6] hover:underline">View Details →</button>
        </div>
      </div>
    </div>
  );
};

export default function CourseCatalog() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allRes, myRes] = await Promise.all([
          CourseService.getAllCourses(),
          CourseService.getMyCourses()
        ]);
        setCourses(allRes);
        setMyCourses(myRes);
      } catch (error) {
        console.error("Failed to load catalog", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#4F39F6]" />
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Loading Catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="text-left space-y-2">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Available Courses</h1>
        <p className="text-slate-500 text-sm font-medium">Explore and enroll in wide variety of courses designed for you.</p>
      </section>

      {myCourses.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#4F39F6] uppercase tracking-[0.2em]">Continue Learning</h2>
            <button className="text-[11px] font-bold text-[#4F39F6] hover:underline uppercase tracking-widest">My Dashboard →</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map(item => <ContinueCard key={item._id} data={item} />)}
          </div>
        </section>
      )}

      <section className="space-y-6 pb-20">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] text-left">All Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map(course => <CourseGridCard key={course._id} data={course} />)}
        </div>
      </section>
    </div>
  );
}