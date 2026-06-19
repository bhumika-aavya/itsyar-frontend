import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // Using accessToken as per your logic
  const token = localStorage.getItem("accessToken");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Outlet renders the child routes defined in AppRoutes
  return <Outlet />;
}