import React, { useEffect, useState } from 'react';
import { Mail, Calendar, Pencil, Loader2, CheckCircle2, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ProfileService } from '@/services/profile.service';

const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function StreakCalendar({ activeCalendarDays, today }: { activeCalendarDays: number[]; today: number }) {
  const totalCells = 35;
  const activeSet = new Set(activeCalendarDays);
  return (
    <div>
      {/* Header row */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] font-extrabold text-slate-400">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: totalCells }, (_, i) => {
          const dayNum = i + 1;
          const isActive = activeSet.has(dayNum);
          const isToday = dayNum === today;
          return (
            <div
              key={i}
              className={`aspect-square flex items-center justify-center rounded-full text-sm transition-all ${
                isToday
                  ? 'ring-2 ring-[#4F46E5] ring-offset-1'
                  : ''
              } ${isActive ? '' : 'opacity-30'}`}
            >
              {isActive ? (
                <span className="text-base">🔥</span>
              ) : (
                <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProfileService.getProfile()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
    </div>
  );

  const displayName = user?.fullName || profile?.name || 'Student';
  const displayEmail = user?.email || profile?.email;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Profile</h1>
        <p className="text-slate-400 font-medium mt-1">Your learning identity and achievements.</p>
      </div>

      {/* Profile Header Card */}
      <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100/40 p-8">
        <div className="flex items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-white shadow-lg flex items-center justify-center">
              <span className="text-4xl font-extrabold text-[#4F46E5] uppercase">{displayName.charAt(0)}</span>
            </div>
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-[#4F46E5] rounded-full flex items-center justify-center border-2 border-white shadow">
              <Pencil size={12} className="text-white" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900">{displayName}</h2>
            <p className="text-[#4F46E5] font-bold text-sm">{user?.role || profile?.role || 'Student'}</p>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                <Calendar size={12} /> Member Since: {profile?.memberSince}
              </span>
              {displayEmail && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                  <Mail size={12} /> {displayEmail}
                </span>
              )}
            </div>
          </div>

          {/* Streak + Edit */}
          <div className="flex items-center gap-4">
            <div className="text-center px-5 py-3 bg-amber-50 rounded-2xl">
              <p className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest">Current Streak</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">🔥 {profile?.streak} <span className="text-sm font-extrabold text-slate-500">Days</span></p>
            </div>
            <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              <Pencil size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Lower Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Completed Courses */}
        <div className="col-span-2 bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100/40 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-extrabold text-slate-900">Completed Courses</h2>
            <button
              onClick={() => navigate('/results')}
              className="text-[13px] font-bold text-[#4F46E5] hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {profile?.completedCourses?.map((course: any) => (
              <div key={course.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                      <span className="text-lg">📘</span>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-900">{course.title}</p>
                      <p className="text-[11px] font-medium text-slate-400">{course.progress}% Complete</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 size={13} className="text-emerald-500" /> Verified Complete
                    </span>
                    <button
                      onClick={() => navigate(`/courses/${course.courseId}/certificate`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <Download size={11} /> Certificate
                    </button>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Day Streak */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100/40 p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-1">Day Streak &amp; Learning Habit</h2>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔥</span>
            <div>
              <p className="text-[11px] font-extrabold text-amber-500 uppercase tracking-widest">Consistency &amp; learning habit</p>
              <p className="text-2xl font-extrabold text-slate-900">{profile?.streak} <span className="text-sm font-bold text-slate-400">Day Streak</span></p>
            </div>
          </div>
          <StreakCalendar
            activeCalendarDays={profile?.activeCalendarDays || []}
            today={profile?.activeCalendarDays?.at(-1) || 30}
          />
          <p className="text-[11px] font-medium text-slate-400 mt-4 text-center">
            Keep it up! You're in the top{' '}
            <span className="text-[#4F46E5] font-bold">{profile?.topPercentile}% of consistent learners</span> this month.
          </p>
        </div>
      </div>
    </div>
  );
}
