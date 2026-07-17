import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Zap, Users, User, Settings,
  ChevronDown, LogOut, Shield, Users2, Scale, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const NavItem = ({
  icon: Icon, label, active, onClick, collapsed,
}: { icon: React.ElementType; label: string; active: boolean; onClick: () => void; collapsed: boolean }) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${collapsed ? 'justify-center' : ''} ${active
      ? 'bg-[#4F46E5] text-white shadow-lg shadow-indigo-100'
      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    {!collapsed && label}
  </button>
);

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: BookOpen, label: 'Courses', path: '/admin/courses' },
  { icon: Zap, label: 'Hackathons', path: '/admin/hackathons' },
  { icon: Users2, label: 'Teams', path: '/admin/teams' },
  { icon: User, label: 'Profile', path: '/admin/profile' },
  // { icon: Settings, label: 'Settings', path: '/admin/settings' },
  { icon: Scale, label: 'Submissions', path: '/admin/submissions' }
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (path: string) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const activeLabel = NAV_ITEMS.find(n => isActive(n.path))?.label ?? 'Overview';

  return (
    <div className="flex min-h-screen bg-[#F9FAFD]">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-100 p-6 flex flex-col sticky top-0 h-screen transition-all duration-200 relative`}>
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#4F46E5] hover:border-[#4F46E5] shadow-sm transition-all z-10"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* Brand */}
        <div
          className={`flex items-center gap-2 mb-2 px-2 cursor-pointer ${collapsed ? 'justify-center' : ''}`}
          onClick={() => navigate('/admin')}
        >
          <div className="bg-[#4F46E5] p-1.5 rounded-lg shrink-0">
            <Zap className="text-white fill-white" size={20} />
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight">ForgeInsight</span>}
        </div>

        {/* Admin badge */}
        <div className={`mx-2 mb-8 ${collapsed ? 'flex justify-center' : ''}`}>
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#4F46E5]/10 rounded-lg ${collapsed ? 'px-2' : ''}`}>
            <Shield size={11} className="text-[#4F46E5]" />
            {!collapsed && <span className="text-[11px] font-extrabold text-[#4F46E5] uppercase tracking-widest">Admin Panel</span>}
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavItem
              key={item.path}
              icon={item.icon}
              label={item.label}
              active={isActive(item.path)}
              onClick={() => navigate(item.path)}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </aside>

      {/* Main area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Admin</p>
            <p className="text-sm font-extrabold text-slate-900 leading-none">{activeLabel}</p>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(v => !v)}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
              <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                <span className="text-[#4F46E5] font-extrabold text-sm uppercase">
                  {user?.fullName?.charAt(0) || 'A'}
                </span>
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-sm font-bold text-slate-900 leading-tight">{user?.fullName || 'Admin'}</div>
                <div className="text-[10px] font-extrabold text-[#4F46E5] uppercase tracking-widest">{user?.role}</div>
              </div>
              <ChevronDown
                size={15}
                className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-3 border-b border-slate-50 mb-1">
                  <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">Account</p>
                  <p className="text-sm font-bold text-slate-700 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { navigate('/admin/profile'); setDropdownOpen(false); }}
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
