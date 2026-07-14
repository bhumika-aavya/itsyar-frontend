import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, GraduationCap, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/axios";
import { getAuthHeaders } from "@/services/auth";

const routeByRole = (navigate: ReturnType<typeof useNavigate>, roleRaw: string) => {
  const role = roleRaw.toLowerCase();
  if (role === "admin" || role === "superadmin") navigate("/admin", { replace: true });
  else if (role === "organizer") navigate("/organizer", { replace: true });
  else if (role === "mentor/judge") navigate("/mentor", { replace: true });
  else navigate("/dashboard", { replace: true });
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const { login, updateUser } = useAuth();
  const handled = useRef(false);
  const [needsRole, setNeedsRole] = useState(false);
  const [savingRole, setSavingRole] = useState(false);

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

    if (!user.role.trim()) {
      // Brand-new Google sign-up — the backend hasn't assigned a role yet,
      // so ask before routing anywhere. Returning users always arrive with
      // their existing role already set, so they skip this entirely.
      setNeedsRole(true);
      return;
    }

    routeByRole(navigate, user.role);
  }, [login, navigate]);

  const handleChooseRole = async (role: "student" | "participant") => {
    setSavingRole(true);
    try {
      await api.put("/auth/role", { role }, getAuthHeaders());
    } catch {
      // Best effort — the choice still applies locally for this session even
      // if the backend call fails.
    }
    updateUser({ role });
    routeByRole(navigate, role);
  };

  if (needsRole) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFD] p-6">
        <div className="w-full max-w-md bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 p-10 text-center space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">One last thing</h2>
            <p className="text-sm font-medium text-slate-500 mt-2">How will you be using ForgeInsight?</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              disabled={savingRole}
              onClick={() => handleChooseRole('student')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-[#4F46E5] hover:bg-indigo-50/50 transition-all disabled:opacity-60"
            >
              <GraduationCap size={28} className="text-[#4F46E5]" />
              <span className="font-extrabold text-slate-800 text-sm">Student</span>
            </button>
            <button
              type="button"
              disabled={savingRole}
              onClick={() => handleChooseRole('participant')}
              className="flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-slate-100 hover:border-[#4F46E5] hover:bg-indigo-50/50 transition-all disabled:opacity-60"
            >
              <Trophy size={28} className="text-[#4F46E5]" />
              <span className="font-extrabold text-slate-800 text-sm">Participant</span>
            </button>
          </div>
          {savingRole && (
            <div className="flex items-center justify-center gap-2 text-sm font-bold text-slate-400">
              <Loader2 size={15} className="animate-spin" /> Setting up your account…
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F9FAFD]">
      <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
    </div>
  );
}
