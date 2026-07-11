import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("accessToken");
    const refreshToken = params.get("refreshToken");
    const user = {
      id: params.get("userId"),
      email: params.get("email"),
      fullName: params.get("fullName"),
      role: params.get("role") ?? "",
    };

    if (!accessToken || !user.id) {
      navigate("/login", { replace: true });
      return;
    }

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    login(accessToken, user);

    const role = user.role.toLowerCase();
    if (role === "admin" || role === "superadmin") navigate("/admin", { replace: true });
    else if (role === "organizer") navigate("/organizer", { replace: true });
    else if (role === "mentor/judge") navigate("/mentor", { replace: true });
    else navigate("/dashboard", { replace: true });
  }, [login, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFD]">
      <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
    </div>
  );
}
