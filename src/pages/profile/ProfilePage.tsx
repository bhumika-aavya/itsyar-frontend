import React, { useEffect, useRef, useState } from 'react';
import { Mail, Pencil, Loader2, CheckCircle2, Download, X, Save, Camera, ShieldCheck, IdCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { CourseService } from '@/services/course.service';
import { MyCourse } from '@/schemas/course.schema';
import { ProfileService } from '@/services/profile.service';
import { fileToResizedDataUrl } from '@/lib/imageUtils';

const roleLabel = (r: string) =>
  r.split('/').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('/');

function DetailRow({ icon: Icon, label, value, valueClassName = 'text-slate-900' }: {
  icon: React.ElementType; label: string; value: React.ReactNode; valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-slate-50/60 rounded-2xl">
      <div className="w-9 h-9 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-[#4F46E5] shrink-0">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{label}</p>
        <p className={`text-sm font-extrabold truncate ${valueClassName}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const role = (user?.role ?? '').toLowerCase();
  const isStudent = role === 'student';
  const [completedCourses, setCompletedCourses] = useState<MyCourse[]>([]);
  const [loading, setLoading] = useState(isStudent);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', avatarUrl: '' });
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const openEditModal = () => {
    setEditForm({ fullName: user?.fullName ?? '', email: user?.email ?? '', avatarUrl: user?.avatarUrl ?? '' });
    setEditError('');
    setShowEditModal(true);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setEditError('Please choose an image file'); return; }
    setEditError('');
    setUploadingAvatar(true);
    try {
      const dataUrl = await fileToResizedDataUrl(file);
      setEditForm(f => ({ ...f, avatarUrl: dataUrl }));
    } catch {
      setEditError('Could not process that image');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName.trim()) { setEditError('Full name is required'); return; }
    if (!editForm.email.trim() || !editForm.email.includes('@')) { setEditError('Valid email is required'); return; }
    setEditError('');
    setSaving(true);
    await ProfileService.updateProfile(editForm);
    updateUser(editForm);
    setSaving(false);
    setShowEditModal(false);
  };

  useEffect(() => {
    if (!isStudent) return;
    CourseService.getMyCourses()
      .then(courses => setCompletedCourses(courses.filter(c => c.courseCompletionPercentage >= 100)))
      .catch(() => setCompletedCourses([]))
      .finally(() => setLoading(false));
  }, [isStudent]);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
    </div>
  );

  const displayName = user?.fullName || 'Student';
  const displayEmail = user?.email;

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
            <div className="w-24 h-24 rounded-full bg-indigo-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-extrabold text-[#4F46E5] uppercase">{displayName.charAt(0)}</span>
              )}
            </div>
            <button
              onClick={openEditModal}
              className="absolute bottom-0 right-0 w-7 h-7 bg-[#4F46E5] rounded-full flex items-center justify-center border-2 border-white shadow hover:bg-[#4338CA] transition-colors"
            >
              <Pencil size={12} className="text-white" />
            </button>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-extrabold text-slate-900">{displayName}</h2>
            <p className="text-[#4F46E5] font-bold text-sm">{roleLabel(role || 'student')}</p>
            <div className="flex items-center gap-4 mt-2">
              {displayEmail && (
                <span className="flex items-center gap-1.5 text-[12px] font-medium text-slate-500">
                  <Mail size={12} /> {displayEmail}
                </span>
              )}
            </div>
          </div>

          {/* Edit */}
          <div className="flex items-center gap-4">
            <button
              onClick={openEditModal}
              className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} /> Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Lower Grid */}
      <div className={isStudent ? "grid grid-cols-3 gap-6" : "grid grid-cols-1 gap-6"}>
        {/* Completed Courses — student only, backend 403s course endpoints for other roles */}
        {isStudent && (
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
              {completedCourses.length === 0 && (
                <p className="text-sm font-medium text-slate-400">No completed courses yet.</p>
              )}
              {completedCourses.map((course) => (
                <div key={course.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <span className="text-lg">📘</span>
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-slate-900">{course.title}</p>
                        <p className="text-[11px] font-medium text-slate-400">{course.courseCompletionPercentage}% Complete</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                        <CheckCircle2 size={13} className="text-emerald-500" /> Verified Complete
                      </span>
                      <button
                        onClick={() => navigate(`/courses/${course.id}/certificate`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <Download size={11} /> Certificate
                      </button>
                    </div>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${course.courseCompletionPercentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Details */}
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100/40 p-6">
          <h2 className="text-base font-extrabold text-slate-900 mb-4">Account Details</h2>
          <div className="space-y-2.5">
            <DetailRow icon={IdCard} label="Role" value={roleLabel(role || 'student')} />
            {displayEmail && <DetailRow icon={Mail} label="Email" value={displayEmail} />}
            <DetailRow icon={ShieldCheck} label="Account Status" value="Active" valueClassName="text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Edit Profile</h2>
                <p className="text-sm font-medium text-slate-400 mt-0.5">Update your name and email</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 border-2 border-white shadow flex items-center justify-center overflow-hidden shrink-0">
                  {editForm.avatarUrl ? (
                    <img src={editForm.avatarUrl} alt="Avatar preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl font-extrabold text-[#4F46E5] uppercase">{(editForm.fullName || 'S').charAt(0)}</span>
                  )}
                </div>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-colors"
                  >
                    {uploadingAvatar ? <Loader2 size={13} className="animate-spin" /> : <Camera size={13} />}
                    {uploadingAvatar ? 'Processing…' : 'Change Photo'}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Full Name</label>
                <input
                  value={editForm.fullName}
                  onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1.5 block">Email</label>
                <input
                  value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  type="email"
                  className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-[#3AADDD] focus:bg-white transition-all"
                />
              </div>
              {editError && (
                <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-xl">{editError}</p>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-3 bg-slate-50 text-slate-700 rounded-xl font-extrabold text-sm hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 py-3 bg-[#4F46E5] text-white rounded-xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
