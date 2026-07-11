import React, { useState, useRef, useEffect } from 'react';
import { Zap, BookOpen, User, LogOut, ChevronDown, Building2, Plus, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const NavItem = ({
  icon: Icon, label, active, onClick,
}: { icon: React.ElementType; label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
      active
        ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-100'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    {label}
  </button>
);

const NAV_ITEMS = [
  { icon: Zap, label: 'My Hackathons', path: '/organizer' },
  { icon: BookOpen, label: 'Courses', path: '/organizer/courses' },
  { icon: User, label: 'Profile', path: '/organizer/profile' },
];

export default function OrganizerLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (path: string) => {
    if (path === '/organizer')
      return location.pathname === '/organizer' || location.pathname.startsWith('/organizer/hackathons');
    return location.pathname.startsWith(path);
  };

  const activeLabel = NAV_ITEMS.find(n => isActive(n.path))?.label ?? 'Organizer';

  return (
    <div className="flex min-h-screen bg-[#F9FAFD]">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-2 px-2 cursor-pointer" onClick={() => navigate('/organizer')}>
          <div className="bg-[#4F46E5] p-1.5 rounded-lg">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">ForgeInsight</span>
        </div>

        <div className="mx-2 mb-5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg">
            <Building2 size={11} className="text-emerald-600" />
            <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest">Organizer Portal</span>
          </span>
        </div>

        <button
          onClick={() => navigate('/organizer/hackathons/create')}
          className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 bg-[#4F46E5] text-white rounded-xl text-sm font-extrabold shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
        >
          <Plus size={15} /> Create Hackathon
        </button>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        <div className="pt-4 border-t border-slate-100 space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <LayoutDashboard size={16} /> Student Dashboard
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50 transition-all"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Organizer</p>
            <p className="text-sm font-extrabold text-slate-900 leading-none">{activeLabel}</p>
          </div>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center">
                <span className="text-emerald-600 font-extrabold text-sm uppercase">
                  {user?.fullName?.charAt(0) || 'O'}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-900 leading-tight">{user?.fullName || 'Organizer'}</div>
                <div className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-widest">Organizer</div>
              </div>
              <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Account</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/organizer/profile'); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-[#4F46E5] transition-colors"
                >
                  <User size={15} /> My Profile
                </button>
                <div className="h-px bg-slate-50 my-1 mx-2" />
                <button
                  onClick={() => { logout(); setDropdownOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="p-8 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
