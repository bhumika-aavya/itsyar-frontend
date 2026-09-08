import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard, BookOpen, Zap, Trophy, ClipboardList,
  User, Search, ChevronDown, LogOut, Settings, Users, Shield, Mail,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { TeamService } from '@/services/team.service';
import ThemeToggle from '@/components/ThemeToggle';

const SidebarItem = ({ icon: Icon, label, active, onClick, badge, collapsed }: any) => (
  <button
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={`w-full flex items-center gap-3 py-3 rounded-xl transition-all font-semibold text-sm cursor-pointer ${collapsed ? 'justify-center px-0' : 'px-4'} ${active
      ? "bg-[#4F46E5] text-white shadow-lg shadow-indigo-100 dark:shadow-none"
      : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1f2028] hover:text-slate-900 dark:hover:text-slate-100"
      }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} className="shrink-0" />
    {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
    {!!badge && !collapsed && (
      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${active ? "bg-white/20 text-white" : "bg-red-500 text-white"
        }`}>
        {badge}
      </span>
    )}
  </button>
);

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Accessing dynamic auth state

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pendingInvites, setPendingInvites] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const role = (user?.role ?? '').toLowerCase();

  // Surface a pending-invite count badge for participants only.
  useEffect(() => {
    if (role !== 'participant') return;
    TeamService.getMyInvites()
      .then(invites => setPendingInvites(invites.filter(i => i.status === 'PENDING').length))
      .catch(() => setPendingInvites(0));
  }, [role, location.pathname]);

  const allMenuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Courses', path: '/courses', roles: ['student'] },
    // { icon: Zap, label: 'Hackathons', path: '/hackathons' },
    { icon: Users, label: 'Team', path: '/teams', roles: ['participant'] },
    { icon: Mail, label: 'Team Invites', path: '/team-invites', roles: ['participant'], badge: pendingInvites },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard', roles: ['participant'] },
    // { icon: ClipboardList, label: 'Result', path: '/results', roles: ['student'] },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const menuItems = allMenuItems.filter(item => !item.roles || item.roles.includes(role));

  return (
    <div className="flex min-h-screen bg-[#F9FAFD] dark:bg-[#111217] transition-colors duration-300">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-[88px] px-4 py-6' : 'w-64 p-6'} bg-white dark:bg-[#16171d] border-r border-slate-100 dark:border-[#2e303a] flex flex-col sticky top-0 h-screen transition-all duration-300 relative z-50`}>
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="absolute -right-3 top-8 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 hover:text-[#4F46E5] hover:border-[#4F46E5] shadow-sm transition-all z-50 cursor-pointer"
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        <div className={`flex items-center gap-2 mb-10 cursor-pointer ${collapsed ? 'justify-center' : 'px-2'}`} onClick={() => navigate('/dashboard')}>
          <div className="bg-[#4F46E5] p-1.5 rounded-lg shrink-0">
            <Zap className="text-white fill-white" size={20} />
          </div>
          {!collapsed && <span className="text-xl font-bold tracking-tight truncate">ForgeInsight</span>}
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.label}
              {...item}
              collapsed={collapsed}
              active={location.pathname === item.path || location.pathname.startsWith(item.path + '/') || (item.path === '/courses' && location.pathname.startsWith('/course/'))}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>

        {(['admin', 'superadmin'].includes((user?.role ?? '').toLowerCase())) && (
          <div className="pt-3 pb-3 border-t border-slate-100 dark:border-[#2e303a]">
            <button
              onClick={() => navigate('/admin')}
              title={collapsed ? 'Admin Panel' : undefined}
              className={`w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold text-[#4F46E5] hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all cursor-pointer ${collapsed ? 'justify-center px-0' : 'px-4'}`}
            >
              <Shield size={16} className="shrink-0" />
              {!collapsed && <span className="truncate">Admin Panel</span>}
            </button>
          </div>
        )}

        {/* Bottom User & Preferences Section */}
        {!collapsed ? (
          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-[#2e303a] space-y-3">
            <div className="flex items-center justify-between gap-2 p-2 rounded-2xl bg-slate-50/80 dark:bg-[#1C1D24]/80 border border-slate-100 dark:border-white/5">
              <div
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer hover:opacity-80 transition-opacity"
                title="View Profile"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 shrink-0 flex items-center justify-center overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user?.fullName ?? "User"} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#4F46E5] dark:text-[#818cf8] font-extrabold text-xs uppercase">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                    {user?.fullName || "Guest User"}
                  </p>
                  <p className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {(user?.role?.toLowerCase() === 'student' ? 'Learner' : user?.role) || "Member"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 shrink-0">
                <ThemeToggle />
                <button
                  onClick={() => logout()}
                  title="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="pt-4 mt-auto border-t border-slate-100 dark:border-[#2e303a] flex flex-col items-center gap-3">
            <ThemeToggle />
            <div
              onClick={() => navigate('/profile')}
              className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center cursor-pointer hover:scale-105 transition-all overflow-hidden"
              title={`${user?.fullName || 'User'} (${user?.role || 'Member'})`}
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user?.fullName ?? "User"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[#4F46E5] dark:text-[#818cf8] font-extrabold text-sm uppercase">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Area */}
      <main className="flex-1 flex flex-col min-w-0">
        <div className="p-6 md:p-10 flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}