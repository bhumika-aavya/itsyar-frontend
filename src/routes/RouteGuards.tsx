import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import React from 'react';

const normalizeRole = (role?: string) => (role ?? '').toLowerCase();

const LoadingScreen = () => (
  <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFD]">
    <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
  </div>
);

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export const PublicRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Outlet />;
  const role = normalizeRole(user?.role);
  if (role === 'admin' || role === 'superadmin') return <Navigate to="/admin" replace />;
  if (role === 'mentor/judge') return <Navigate to="/mentor" replace />;
  if (role === 'organizer') return <Navigate to="/organizer" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const AdminRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = normalizeRole(user?.role);
  if (role !== 'admin' && role !== 'superadmin') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export const RoleRoute = ({ roles }: { roles: string[] }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  const role = normalizeRole(user?.role);
  if (!roles.includes(role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};
