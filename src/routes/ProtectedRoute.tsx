import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // Using access_token as per your logic
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Outlet renders the child routes defined in AppRoutes
  return <Outlet />;
}