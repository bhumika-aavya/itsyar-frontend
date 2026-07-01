import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "@/pages/auth/Login";
import RegisterPage from "@/pages/auth/Register";
import LandingPage from "@/pages/home/LandingPage";
import CourseCatalog from "@/pages/courses/CourseCatalog";
import MainLayout from "@/pages/layout/MainLayout";
import { ProtectedRoute, PublicRoute } from "./RouteGuards"; // Fix import
import React from "react";
import CourseDetail from "@/pages/courses/CourseDetail";
import LessonView from "@/pages/courses/LessonView";
import HackathonListing from "@/pages/hackathon/HackathonListing";
import HackathonDetail from "@/pages/hackathon/HackathonDetail";
import CertificatePage from "@/pages/courses/CertificatePage";
import ResultsPage from "@/pages/courses/ResultsPage";
import MentorDashboard from "@/pages/mentor/MentorDashboard";
import SubmissionReview from "@/pages/mentor/SubmissionReview";
import HackathonSandboxPage from "@/pages/hackathon/HackathonSandboxPage";
import OrganizerDashboard from "@/pages/organizer/OrganizerDashboard";
import CreateHackathon from "@/pages/organizer/CreateHackathon";
import DashboardPage from "@/pages/dashboard/DashboardPage";
import LeaderboardPage from "@/pages/leaderboard/LeaderboardPage";
import ProfilePage from "@/pages/profile/ProfilePage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      {/* Fullscreen sandbox — no navbar/layout */}
      <Route path="/hackathons/:id/sandbox" element={<HackathonSandboxPage />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* <Route element={<ProtectedRoute />}> */}
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

        {/* Mentor routes */}
        <Route path="/mentor" element={<MentorDashboard />} />
        <Route path="/mentor/submissions/:submissionId" element={<SubmissionReview />} />

        {/* Organizer routes */}
        <Route path="/organizer" element={<OrganizerDashboard />} />
        <Route path="/organizer/hackathons/create" element={<CreateHackathon />} />
        <Route path="/organizer/hackathons/:id/edit" element={<CreateHackathon />} />
      </Route>
      {/* </Route> */}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}