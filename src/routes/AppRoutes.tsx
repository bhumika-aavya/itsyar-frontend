import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import MainLayout from "@/pages/layout/MainLayout";
import { ProtectedRoute, PublicRoute, AdminRoute } from "./RouteGuards";

const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));

const LandingPage         = lazy(() => import("@/pages/home/LandingPage"));
const LoginPage           = lazy(() => import("@/pages/auth/Login"));
const RegisterPage        = lazy(() => import("@/pages/auth/Register"));
const ForgotPasswordPage  = lazy(() => import("@/pages/auth/ForgotPassword"));
const ResetPasswordPage   = lazy(() => import("@/pages/auth/ResetPassword"));
const AuthCallbackPage    = lazy(() => import("@/pages/auth/AuthCallback"));
const ChangePasswordPage  = lazy(() => import("@/pages/auth/ChangePassword"));
const DashboardPage       = lazy(() => import("@/pages/dashboard/DashboardPage"));
const CourseCatalog       = lazy(() => import("@/pages/courses/CourseCatalog"));
const CourseDetail        = lazy(() => import("@/pages/courses/CourseDetail"));
const LessonView          = lazy(() => import("@/pages/courses/LessonView"));
const CertificatePage     = lazy(() => import("@/pages/courses/CertificatePage"));
const ResultsPage         = lazy(() => import("@/pages/courses/ResultsPage"));
const HackathonListing    = lazy(() => import("@/pages/hackathon/HackathonListing"));
const HackathonDetail     = lazy(() => import("@/pages/hackathon/HackathonDetail"));
const HackathonSandboxPage = lazy(() => import("@/pages/hackathon/HackathonSandboxPage"));
const LeaderboardPage     = lazy(() => import("@/pages/leaderboard/LeaderboardPage"));
const ProfilePage         = lazy(() => import("@/pages/profile/ProfilePage"));
const MentorDashboard     = lazy(() => import("@/pages/mentor/MentorDashboard"));
const SubmissionReview    = lazy(() => import("@/pages/mentor/SubmissionReview"));
const OrganizerDashboard  = lazy(() => import("@/pages/organizer/OrganizerDashboard"));
const CreateHackathon     = lazy(() => import("@/pages/organizer/CreateHackathon"));

function PageLoader() {
  return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Fullscreen sandbox — no navbar/layout */}
        <Route path="/hackathons/:id/sandbox" element={<HackathonSandboxPage />} />

        {/* OAuth callback — no layout, no auth guard */}
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />

            <Route path="/hackathons" element={<HackathonListing />} />
            <Route path="/hackathons/:id" element={<HackathonDetail />} />
            <Route path="/courses/:courseId/certificate" element={<CertificatePage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />

            {/* Mentor routes */}
            <Route path="/mentor" element={<MentorDashboard />} />
            <Route path="/mentor/submissions/:submissionId" element={<SubmissionReview />} />

            {/* Organizer routes */}
            <Route path="/organizer" element={<OrganizerDashboard />} />
            <Route path="/organizer/hackathons/create" element={<CreateHackathon />} />
            <Route path="/organizer/hackathons/:id/edit" element={<CreateHackathon />} />

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}