import React, { useEffect, useState } from 'react';
import { Code2, Globe, Trophy, ChevronRight, Loader2, CalendarDays, Clock, ChevronDown, Star, Zap, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardService } from '@/services/dashboard.service';
import { getCurrentStreak } from '@/lib/streakStore';

const COURSE_ICONS: Record<string, React.ReactNode> = {
  'Python Core': <Code2 size={18} className="text-slate-500" />,
  'Frontend': <Globe size={18} className="text-slate-500" />,
};

function CourseCard({ course, primary }: { course: any; primary: boolean }) {
  const navigate = useNavigate();
  const icon = COURSE_ICONS[course.tag] || <Code2 size={18} className="text-slate-500" />;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md transition-shadow flex flex-col">
      {/* Icon + Tag row */}
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-extrabold rounded-lg uppercase tracking-wide">
          {course.tag}
        </span>
      </div>
      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{course.title}</h3>
      <p className="text-[11px] font-medium text-slate-400 mt-1">Current: {course.currentLesson}</p>
      <div className="mt-3 mb-4">
        <div className="flex justify-between text-[10px] font-extrabold text-slate-500 mb-1.5">
          <span>Progress</span>
          <span className="text-[#4F46E5]">{course.progress}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${course.progress}%`, background: primary ? '#4F46E5' : '#94a3b8' }}
          />
        </div>
      </div>
      <button
        onClick={() => navigate(`/courses/${course.id}`)}
        className={`mt-auto w-full py-2.5 text-xs font-extrabold rounded-xl transition-colors ${primary
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
      >
        Resume
      </button>
    </div>
  );
}

function StudyBar({ hours, maxHours, day, isToday }: { hours: number; maxHours: number; day: string; isToday: boolean }) {
  const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <span className="text-[11px] font-bold text-slate-500">{hours}h</span>
      <div className="w-full flex items-end justify-center" style={{ height: 100 }}>
        <div
          className={`w-7 rounded-t-lg transition-all ${isToday ? 'bg-[#4F46E5]' : 'bg-slate-100'}`}
          style={{ height: `${pct}%`, minHeight: 6 }}
        />
      </div>
      <span className={`text-[10px] font-bold ${isToday ? 'text-[#4F46E5]' : 'text-slate-400'}`}>{day}</span>
    </div>
  );
}

const UPCOMING_ICONS: Record<string, React.ReactNode> = {
  quiz: <Clock size={11} />,
  project: <CalendarDays size={11} />,
  meeting: <CalendarDays size={11} />,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardService.getOverview()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
    </div>
  );

  const firstName = (user?.fullName || 'there').split(' ')[0];
  const maxHours = Math.max(...(data?.studyActivity?.map((d: any) => d.hours) || [1]));
  const todayDay = 'Thu';
  const streak = getCurrentStreak(user?.id);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#6063EE] text-white rounded-[28px] p-8 flex items-center justify-between overflow-hidden relative">
        <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -right-4 -bottom-12 w-32 h-32 rounded-full bg-white/5" />
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold text-white">Welcome back, {firstName}! 👋</h1>
          <p className="text-white/80 text-sm font-medium mt-1 max-w-sm leading-relaxed">
            You're on fire! You've completed {data?.weeklyGoalPct}% of your weekly goal.{' '}
            Keep pushing to unlock the "Master Architect" badge.
          </p>
        </div>
        <div className="flex gap-4 relative z-10 shrink-0">
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3.5 text-center min-w-[120px]">
            <p className="text-[9px] font-extrabold text-white/70 uppercase tracking-widest mb-1">Learning Streak</p>
            <p className="text-white font-extrabold text-xl leading-none">🔥 {streak} <span className="text-sm font-extrabold">Days</span></p>
          </div>
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl px-5 py-3.5 text-center min-w-[120px]">
            <p className="text-[9px] font-extrabold text-white/70 uppercase tracking-widest mb-1">Total Points</p>
            <p className="text-white font-extrabold text-xl leading-none">🏆 {data?.totalXP?.toLocaleString()}<span className="text-sm font-extrabold">XP</span></p>
          </div>
        </div>
      </div>

      {/* Main Grid */}

    </div>
  );
}
