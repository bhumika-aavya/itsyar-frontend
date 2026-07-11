import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import MainLayout from "@/pages/layout/MainLayout";
import AdminLayout from "@/pages/admin/AdminLayout";
import OrganizerLayout from "@/pages/organizer/OrganizerLayout";
import MentorLayout from "@/pages/mentor/MentorLayout";
import JudgeLayout from "@/pages/judge/JudgeLayout";
import { ProtectedRoute, PublicRoute, AdminRoute, RoleRoute } from "./RouteGuards";

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminUsersPage = lazy(() => import("@/pages/admin/AdminUsersPage"));
const AdminCoursesPage = lazy(() => import("@/pages/admin/AdminCoursesPage"));
const AdminCourseDetailPage = lazy(() => import("@/pages/admin/AdminCourseDetailPage"));
const AdminHackathonsPage = lazy(() => import("@/pages/admin/AdminHackathonsPage"));
const AdminTeamsPage = lazy(() => import("@/pages/admin/AdminTeamsPage"));
const AdminSettingsPage = lazy(() => import("@/pages/admin/AdminSettingsPage"));
const AdminSubmissionsPage = lazy(() => import("@/pages/admin/AdminSubmissionsPage"));
const AdminUserSubmissionsPage = lazy(() => import("@/pages/admin/AdminUserSubmissionsPage"));
const AdminSubmissionReviewPage = lazy(() => import("@/pages/admin/AdminSubmissionReviewPage"));

// Auth pages
const LandingPage = lazy(() => import("@/pages/home/LandingPage"));
const LoginPage = lazy(() => import("@/pages/auth/Login"));
const RegisterPage = lazy(() => import("@/pages/auth/Register"));
const ForgotPasswordPage = lazy(() => import("@/pages/auth/ForgotPassword"));
const AuthCallback = lazy(() => import("@/pages/auth/AuthCallback"));
const ResetPasswordPage = lazy(() => import("@/pages/auth/ResetPassword"));
const ChangePasswordPage = lazy(() => import("@/pages/auth/ChangePassword"));

// Student pages
const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const CourseCatalog = lazy(() => import("@/pages/courses/CourseCatalog"));
const CourseDetail = lazy(() => import("@/pages/courses/CourseDetail"));
const LessonView = lazy(() => import("@/pages/courses/LessonView"));
const CertificatePage = lazy(() => import("@/pages/courses/CertificatePage"));
const ResultsPage = lazy(() => import("@/pages/courses/ResultsPage"));
const HackathonListing = lazy(() => import("@/pages/hackathon/HackathonListing"));
const HackathonDetail = lazy(() => import("@/pages/hackathon/HackathonDetail"));
const HackathonSandboxPage = lazy(() => import("@/pages/hackathon/HackathonSandboxPage"));
const RegistrationSuccessPage = lazy(() => import("@/pages/hackathon/RegistrationSuccessPage"));
const TeamCollaborationPage = lazy(() => import("@/pages/teams/TeamCollaborationPage"));
const LeaderboardPage = lazy(() => import("@/pages/leaderboard/LeaderboardPage"));
const ProfilePage = lazy(() => import("@/pages/profile/ProfilePage"));

// Organizer pages (CreateHackathon is shared with the Admin hackathon-create/edit flow)
const OrganizerDashboard = lazy(() => import("@/pages/organizer/OrganizerDashboard"));
const OrganizerCoursesPage = lazy(() => import("@/pages/organizer/OrganizerCoursesPage"));
const CreateHackathon = lazy(() => import("@/pages/organizer/CreateHackathon"));

// Mentor pages
const MentorDashboard = lazy(() => import("@/pages/mentor/MentorDashboard"));
const MentorCoursesPage = lazy(() => import("@/pages/mentor/MentorCoursesPage"));
const SubmissionReview = lazy(() => import("@/pages/mentor/SubmissionReview"));

// Judge pages
const JudgeDashboard = lazy(() => import("@/pages/judge/JudgeDashboard"));
const JudgeHackathonsPage = lazy(() => import("@/pages/judge/JudgeHackathonsPage"));
const JudgeCriteriaPage = lazy(() => import("@/pages/judge/JudgeCriteriaPage"));

function PageLoader() {
  return (
    <div className="h-[60vh] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Fullscreen sandbox — no layout */}
        <Route path="/hackathons/:id/sandbox" element={<HackathonSandboxPage />} />

        {/* Google OAuth redirect target — must be reachable before auth state exists */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>

        {/* ── Student / participant shared layout ───────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/courses" element={<CourseCatalog />} />
            <Route path="/courses/:courseId" element={<CourseDetail />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />
            <Route path="/courses/:courseId/certificate" element={<CertificatePage />} />
            <Route path="/hackathons" element={<HackathonListing />} />
            <Route path="/hackathons/:id" element={<HackathonDetail />} />
            <Route path="/hackathons/:id/registration-success" element={<RegistrationSuccessPage />} />
            <Route path="/teams" element={<TeamCollaborationPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
          </Route>
        </Route>

        {/* ── Admin layout ─────────────────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/courses" element={<AdminCoursesPage />} />
              <Route path="/admin/courses/:id" element={<AdminCourseDetailPage />} />
              <Route path="/admin/hackathons" element={<AdminHackathonsPage />} />
              <Route path="/admin/hackathons/create" element={<CreateHackathon />} />
              <Route path="/admin/hackathons/:id/edit" element={<CreateHackathon />} />
              <Route path="/admin/teams" element={<AdminTeamsPage />} />
              <Route path="/admin/profile" element={<ProfilePage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
              <Route path="/admin/submissions" element={<AdminSubmissionsPage />} />
              <Route path="/admin/submissions/:userId" element={<AdminUserSubmissionsPage />} />
              <Route path="/admin/submissions/:userId/:hackathonId" element={<AdminSubmissionReviewPage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Organizer layout ─────────────────────────────────────────── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["organizer"]} />}>
            <Route element={<OrganizerLayout />}>
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route path="/organizer/courses" element={<OrganizerCoursesPage />} />
              <Route path="/organizer/hackathons/create" element={<CreateHackathon />} />
              <Route path="/organizer/hackathons/:id/edit" element={<CreateHackathon />} />
              <Route path="/organizer/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Mentor layout (Mentor and Judge are a single combined role) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["mentor/judge"]} />}>
            <Route element={<MentorLayout />}>
              <Route path="/mentor" element={<MentorDashboard />} />
              <Route path="/mentor/submissions/:submissionId" element={<SubmissionReview />} />
              <Route path="/mentor/courses" element={<MentorCoursesPage />} />
              <Route path="/mentor/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        {/* ── Judge layout (Mentor and Judge are a single combined role) ── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute roles={["mentor/judge"]} />}>
            <Route element={<JudgeLayout />}>
              <Route path="/judge" element={<JudgeDashboard />} />
              <Route path="/judge/hackathons" element={<JudgeHackathonsPage />} />
              <Route path="/judge/criteria" element={<JudgeCriteriaPage />} />
              <Route path="/judge/profile" element={<ProfilePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}
