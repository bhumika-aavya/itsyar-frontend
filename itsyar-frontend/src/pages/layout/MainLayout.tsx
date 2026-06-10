import React from 'react';
import { 
  LayoutDashboard, BookOpen, Zap, Trophy, ClipboardList, User, Search, Bell, ChevronDown 
} from 'lucide-react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-sm ${
      active 
      ? "bg-[#4F39F6] text-white shadow-lg shadow-indigo-100" 
      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }`}
  >
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    {label}
  </button>
);

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: BookOpen, label: 'Courses', path: '/courses' },
    { icon: Zap, label: 'Hackathons', path: '/hackathons' },
    { icon: Trophy, label: 'Leaderboard', path: '/leaderboard' },
    { icon: ClipboardList, label: 'Result', path: '/result' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex min-h-screen bg-[#F9FAFD]">
      <aside className="w-64 bg-white border-r border-slate-100 p-6 flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="bg-[#4F39F6] p-1.5 rounded-lg">
            <Zap className="text-white fill-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">ITSYAR</span>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <SidebarItem 
              key={item.label} 
              {...item} 
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            />
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-10 sticky top-0 z-10">
          <div className="relative w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search courses..."
              className="w-full h-11 bg-[#F5F6FA] border-none rounded-xl pl-12 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right">
                <div className="text-sm font-bold text-slate-900">John Doe</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Participant</div>
              </div>
              <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white overflow-hidden">
                <img src="https://i.pravatar.cc/150?u=john" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-10 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}