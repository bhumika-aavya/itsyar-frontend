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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* <Route element={<ProtectedRoute />}> */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<div>Dashboard Home</div>} />
        <Route path="/courses" element={<CourseCatalog />} />
        <Route path="/courses/:courseId" element={<CourseDetail />} />
        <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonView />} />

      </Route>
      {/* </Route> */}

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}