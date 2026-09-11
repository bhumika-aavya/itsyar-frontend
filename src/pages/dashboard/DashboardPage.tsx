import React, { useEffect, useState } from 'react';
import {
  Code2, Globe, Trophy, ChevronRight, Loader2, CalendarDays, Clock,
  BrainCircuit, Award, BarChart3, TrendingUp, Sparkles, BookOpen,
  ArrowUpRight, CheckCircle2, PlayCircle, Flame, Target, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { DashboardService } from '@/services/dashboard.service';
import { CourseService } from '@/services/course.service';
import { PaymentService } from '@/services/payment.service';
import { getCurrentStreak } from '@/lib/streakStore';
import { capitalizeTitle } from '@/lib/utils';
import { Course, MyCourse } from '@/schemas/course.schema';

interface StudyDay {
  day: string;
  hours: number;
}

interface UpcomingItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  date: string;
  urgent?: boolean;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [myLearnings, setMyLearnings] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [overview, allCourses, myCourses] = await Promise.all([
          DashboardService.getOverview().catch(() => null),
          CourseService.getAllCourses().catch(() => []),
          CourseService.getMyCourses().catch(() => []),
        ]);
        setData(overview);
        setRealCourses(allCourses || []);
        setMyLearnings(myCourses || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-[#4F46E5]" size={36} />
        <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Loading your learning hub...</p>
      </div>
    );
  }

  const firstName = (user?.fullName || 'there').split(' ')[0];
  const streak = getCurrentStreak(user?.id) || data?.streak || 1;
  const totalXP = data?.totalXP ?? 4850;
  const weeklyGoalPct = data?.weeklyGoalPct ?? 75;

  // Prepare top 5 courses from the API (with fallback if API returns empty)
  const defaultFallbackCourses = [
    {
      id: '1',
      title: 'Palantir Foundry Fundamentals',
      tag: 'Palantir Core',
      category: 'Data Engineering',
      level: 'Beginner',
      lessonCount: 12,
      imageUrl: '',
      instructor: 'Palantir Architect',
    },
    {
      id: '2',
      title: 'Software Development Life Cycle & AI',
      tag: 'Architecture',
      category: 'System Design',
      level: 'Intermediate',
      lessonCount: 8,
      imageUrl: '',
      instructor: 'Senior Lead',
    },
    {
      id: '3',
      title: 'AIP Logic & Prompt Engineering',
      tag: 'AI Core',
      category: 'Artificial Intelligence',
      level: 'Advanced',
      lessonCount: 14,
      imageUrl: '',
      instructor: 'AI Research Team',
    },
    {
      id: '4',
      title: 'Fullstack Microservices with Go & React',
      tag: 'Web Dev',
      category: 'Full Stack',
      level: 'Intermediate',
      lessonCount: 16,
      imageUrl: '',
      instructor: 'Core Engineering',
    },
    {
      id: '5',
      title: 'Cloud DevOps & CI/CD Pipelines',
      tag: 'DevOps',
      category: 'Cloud Architecture',
      level: 'All Levels',
      lessonCount: 10,
      imageUrl: '',
      instructor: 'DevOps Master',
    }
  ];

  const sourceCourses = realCourses.length > 0 ? realCourses : defaultFallbackCourses;
  const topCourses = sourceCourses.slice(0, 5).map((course, idx) => {
    const isEnrolled = PaymentService.isCoursePurchased(course.id) ||
      myLearnings.some(m => String(m.id) === String(course.id) || String(m.courseId) === String(course.id));

    const matchedMyCourse = myLearnings.find(m => String(m.id) === String(course.id) || String(m.courseId) === String(course.id));

    // Progress calculation
    const progress = matchedMyCourse?.courseCompletionPercentage ??
      (isEnrolled ? (idx === 0 ? 68 : idx === 1 ? 40 : 15) : (idx === 0 ? 35 : 0));

    return {
      ...course,
      isEnrolled,
      progress,
      tag: course.tag || course.category || 'Core Track',
      displayTitle: capitalizeTitle(course.title),
      lessonsLabel: course.lessonCount ? `${course.lessonCount} Lessons` : course.duration || 'Self-paced',
    };
  });

  // Study hours data
  const studyActivity: StudyDay[] = data?.studyActivity || [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.2 },
    { day: 'Wed', hours: 1.8 },
    { day: 'Thu', hours: 4.6 },
    { day: 'Fri', hours: 2.0 },
    { day: 'Sat', hours: 5.2 },
    { day: 'Sun', hours: 2.5 },
  ];

  const currentDayName = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const maxHours = Math.max(...studyActivity.map(d => d.hours), 6);
  const totalWeeklyHours = studyActivity.reduce((acc, curr) => acc + curr.hours, 0).toFixed(1);

  // Upcoming items
  const upcomingList: UpcomingItem[] = data?.upcoming || [
    { id: '1', type: 'quiz', title: 'Palantir Architecture Quiz', subtitle: 'Module 2 Assessment', date: 'Due Today, 6:00 PM', urgent: true },
    { id: '2', type: 'project', title: 'Data Pipeline Submission', subtitle: 'Foundry Core Project', date: 'Tomorrow, 11:59 PM', urgent: false },
    { id: '3', type: 'meeting', title: 'AI Engineering Milestone 2', subtitle: 'Track Progress', date: 'Dec 18, 10:00 AM', urgent: false },
  ];

  // Badges
  const badgesList = [
    { key: 'speed', label: 'Speed Coder', date: 'Unlocked', icon: '⚡', color: 'from-amber-400 to-orange-500' },
    { key: 'logic', label: 'Logic Master', date: 'Unlocked', icon: '🧠', color: 'from-purple-500 to-indigo-600' },
    { key: 'streak', label: '7-Day Streak', date: 'In Progress', icon: '🔥', color: 'from-rose-500 to-amber-500' },
    { key: 'finisher', label: 'Course Finisher', date: 'Locked', icon: '🏆', color: 'from-slate-400 to-slate-500', locked: true },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Welcome & Live Stats Banner */}
      <div className="bg-gradient-to-r from-[#4F46E5] via-[#5B50EE] to-[#7C3AED] text-white rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-hidden relative shadow-xl shadow-indigo-500/10">
        {/* Decorative background glow circles */}
        <div className="absolute -right-10 -top-10 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-indigo-900/30 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-xl text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-extrabold uppercase tracking-widest text-white/90 mb-3 border border-white/10">
            <Sparkles size={12} className="text-amber-300" />
            <span>Learner Overview</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Welcome back, {firstName.charAt(0).toUpperCase() + firstName.slice(1)}! 👋
          </h1>
          <p className="text-white/85 text-sm font-medium mt-1.5 leading-relaxed">
            You're on fire! You've achieved <span className="font-extrabold text-white">{weeklyGoalPct}%</span> of your weekly target. Keep advancing to unlock your next certificate!
          </p>
        </div>

        {/* Live metric pill badges */}
        <div className="flex flex-wrap sm:flex-nowrap gap-3.5 relative z-10 shrink-0 w-full md:w-auto">
          <div className="bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3.5 text-center flex-1 md:min-w-[125px] shadow-sm">
            <p className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Flame size={12} className="text-amber-300" /> Streak
            </p>
            <p className="text-white font-black text-xl leading-none">
              {streak} <span className="text-xs font-bold text-white/80">Days</span>
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3.5 text-center flex-1 md:min-w-[125px] shadow-sm">
            <p className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Trophy size={12} className="text-yellow-300" /> Total XP
            </p>
            <p className="text-white font-black text-xl leading-none">
              {totalXP.toLocaleString()} <span className="text-xs font-bold text-white/80">XP</span>
            </p>
          </div>

          <div className="bg-white/15 backdrop-blur-md border border-white/15 rounded-2xl px-5 py-3.5 text-center flex-1 md:min-w-[125px] shadow-sm">
            <p className="text-[10px] font-extrabold text-white/70 uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
              <Target size={12} className="text-emerald-300" /> Goal
            </p>
            <p className="text-white font-black text-xl leading-none">
              {weeklyGoalPct}%
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Dashboard 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">

        {/* ================= LEFT COLUMN: TOP 5 COURSES & CONTINUE LEARNING (5 cols) ================= */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-[#4F46E5] dark:text-indigo-400" />
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Top Courses
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-[10px] font-black uppercase">
                {topCourses.length} Tracks
              </span>
            </div>
            <button
              onClick={() => navigate('/courses')}
              className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              Explore All ({realCourses.length || 5}) <ChevronRight size={14} />
            </button>
          </div>

          <div className="space-y-3.5">
            {topCourses.map((course, idx) => (
              <div
                key={course.id || idx}
                onClick={() => navigate(`/courses/${course.id}`)}
                className="bg-white dark:bg-[#16171d] rounded-2xl border border-slate-100 dark:border-[#2e303a] p-4.5 shadow-xs hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-800/60 transition-all group flex flex-col justify-between relative overflow-hidden cursor-pointer"
              >
                {/* Course Header Info */}
                <div className="flex items-start gap-3.5">
                  <div className="w-13 h-13 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center shrink-0 overflow-hidden mt-0.5">
                    {course.imageUrl ? (
                      <img
                        src={`${import.meta.env.VITE_IMAGE_URL || ''}${course.imageUrl}`}
                        alt={course.title}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <Code2 size={22} className="text-[#4F46E5] dark:text-indigo-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider">
                        {course.tag}
                      </span>
                      {course.level && (
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                          {course.level}
                        </span>
                      )}
                      {course.instructor && (
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 truncate hidden sm:inline">
                          by {course.instructor}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-[14px] leading-snug group-hover:text-[#4F46E5] dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {course.displayTitle}
                    </h3>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                      {course.lessonsLabel} • {course.isEnrolled ? 'Enrolled' : 'Ready to Start'}
                    </p>
                  </div>
                </div>

                {/* Progress Bar & Actions */}
                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-[#20222a] flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mb-1">
                      <span>Progress</span>
                      <span className="text-[#4F46E5] dark:text-indigo-400 font-extrabold">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-[#252630] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 rounded-full"
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/courses/${course.id}`);
                    }}
                    className={`shrink-0 px-3.5 py-1.5 text-[11px] font-extrabold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${course.isEnrolled || idx === 0
                      ? "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-xs"
                      : "bg-slate-100 dark:bg-[#22242e] hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-[#4F46E5] dark:hover:text-indigo-400"
                      }`}
                  >
                    <PlayCircle size={13} />
                    <span>{course.isEnrolled ? 'Resume' : 'View Course'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ================= MIDDLE COLUMN: STUDY ACTIVITY & QUIZ RESULTS (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-6">

          {/* 1. Weekly Study Activity Chart */}
          <div className="bg-white dark:bg-[#16171d] rounded-2xl border border-slate-100 dark:border-[#2e303a] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-[#4F46E5] dark:text-indigo-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Weekly Study Hours
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Total: {totalWeeklyHours}h</span>
            </div>

            {/* Vertical Bars */}
            <div className="flex items-end justify-between gap-2 h-36 pt-4 pb-1">
              {studyActivity.map((item) => {
                const isToday = item.day.toLowerCase() === currentDayName.toLowerCase();
                const heightPct = Math.max((item.hours / maxHours) * 100, 10);
                return (
                  <div key={item.day} className="flex flex-col items-center gap-1.5 flex-1 group relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-10">
                      {item.hours} hrs
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {item.hours}h
                    </span>
                    <div className="w-full flex items-end justify-center h-24">
                      <div
                        className={`w-full max-w-[28px] rounded-t-lg transition-all duration-500 ${isToday
                          ? "bg-gradient-to-t from-indigo-600 to-[#4F46E5] shadow-md shadow-indigo-500/20"
                          : "bg-slate-100 dark:bg-[#252630] hover:bg-indigo-100 dark:hover:bg-indigo-950/40"
                          }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className={`text-[11px] font-bold ${isToday ? 'text-[#4F46E5] dark:text-indigo-400' : 'text-slate-400'}`}>
                      {item.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-3 mt-2 border-t border-slate-100 dark:border-[#2e303a] text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <TrendingUp size={14} /> +18% study velocity
              </span>
              <span className="text-slate-400">Target: 20h/wk</span>
            </div>
          </div>

          {/* 2. Recent AI Quiz Assessment */}
          {/* <div className="bg-white dark:bg-[#16171d] rounded-2xl border border-slate-100 dark:border-[#2e303a] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BrainCircuit size={18} className="text-purple-600 dark:text-purple-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Recent AI Assessment
                </h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold">
                Passed
              </span>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-[#1c1d24] p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
              <div className="w-12 h-12 rounded-full border-4 border-emerald-500 bg-white dark:bg-[#16171d] flex items-center justify-center shrink-0 shadow-sm">
                <span className="text-sm font-black text-slate-900 dark:text-slate-100">95%</span>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                  Palantir Architecture & AIP
                </h4>
                <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-0.5">
                  19/20 Correct • Top 5% Rank
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/courses')}
              className="mt-3.5 w-full py-2.5 text-xs font-bold text-[#4F46E5] dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Practice Today's Topic Quiz</span>
              <ArrowUpRight size={14} />
            </button>
          </div> */}

        </div>

        {/* ================= RIGHT COLUMN: UPCOMING TASKS & ACHIEVEMENTS (3 cols) ================= */}
        <div className="lg:col-span-3 space-y-6">

          {/* 2. Achievements & Badges */}
          <div className="bg-white dark:bg-[#16171d] rounded-2xl border border-slate-100 dark:border-[#2e303a] p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <Award size={18} className="text-amber-500" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                  Badges Earned
                </h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">3/4</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {badgesList.map((badge) => (
                <div
                  key={badge.key}
                  className={`p-3 rounded-xl border text-center transition-all ${badge.locked
                    ? "bg-slate-50/50 dark:bg-[#1c1d24]/50 border-dashed border-slate-200 dark:border-slate-800 opacity-60"
                    : "bg-slate-50 dark:bg-[#1c1d24] border-slate-100 dark:border-white/5 hover:border-indigo-200"
                    }`}
                >
                  <div className="text-2xl mb-1">{badge.icon}</div>
                  <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{badge.label}</p>
                  <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{badge.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Quick Shortcuts */}
          <div className="bg-slate-50 dark:bg-[#16171d] rounded-2xl border border-slate-100 dark:border-[#2e303a] p-4 flex flex-col gap-2">
            <button
              onClick={() => navigate('/courses/certificate')}
              className="w-full py-2.5 px-3 bg-white dark:bg-[#1c1d24] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-[#2e303a] rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">🎓 Certificates</span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="w-full py-2.5 px-3 bg-white dark:bg-[#1c1d24] hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 border border-slate-100 dark:border-[#2e303a] rounded-xl text-xs font-extrabold text-slate-700 dark:text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">👤 Profile Settings</span>
              <ChevronRight size={14} className="text-slate-400" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
