import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  UserCog,
  ChevronDown
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormValues } from "@/schemas/login.schema";
import { ErrorMsg } from "@/components/ui/error";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Logo from "./Logo";

// Define the API response structure
interface LoginResponse {
  success: boolean;
  accessToken: string;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  };
  message?: string;
}

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [searchParams] = useSearchParams(); // Read URL params
  const navigate = useNavigate();
  const { login } = useAuth(); // Using the auth context we built earlier

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError("");
    try {
      const response = await api.post<LoginResponse>("/auth/login", data);
      console.log("Login response:", response); // Debugging log
      if (response.data.success) {
        login(response.data.accessToken, response.data.user);
        const role = (response.data.user.role ?? '').toLowerCase();
        if (role === 'admin' || role === 'superadmin') navigate('/admin');
        else if (role === 'organizer') navigate('/organizer');
        else if (role === 'mentor') navigate('/mentor');
        else if (role === 'judge') navigate('/judge');
        else navigate('/dashboard');
      }
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Usually redirects to your backend's Google Auth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const validRoles = ["student", "participant", "organizer", "admin", "mentor", "judge"];

    if (roleParam && validRoles.includes(roleParam)) {
      // @ts-ignore - bypassing strict string literal check for the dynamic param
      setValue('role', roleParam);
    }
  }, [searchParams, setValue]);
  console.log("Current role value:", serverError); // Debugging log

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full rounded-[32px] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/40">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome back</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Sign in to your ForgeInsight account.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Address */}
          <div className="flex flex-col space-y-1.5 items-start">
            <label className="text-[13px] font-bold text-slate-800 ml-1">Email Address</label>
            <div className="relative w-full">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400'}`} size={18} />
              <input
                {...register("email")}
                type="email"
                placeholder="name@company.com"
                className={`h-14 w-full rounded-xl border-2 pl-12 pr-4 bg-[#F8F6FC] outline-none transition-all font-medium text-slate-900 ${errors.email ? "border-red-400" : "border-transparent focus:border-[#4F39F6] focus:bg-white"
                  }`}
              />
            </div>
            <ErrorMsg message={errors.email?.message} />
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5 items-start">
            <div className="flex justify-between items-center w-full px-1">
              <label className="text-[13px] font-bold text-slate-800">Password</label>
              <button type="button" className="text-[12px] font-bold text-[#4F39F6] hover:underline">Forgot password?</button>
            </div>
            <div className="relative w-full">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400'}`} size={18} />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`h-14 w-full rounded-xl border-2 pl-12 pr-12 bg-[#F8F6FC] outline-none transition-all font-medium text-slate-900 ${errors.password ? "border-red-400" : "border-transparent focus:border-[#4F39F6] focus:bg-white"
                  }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <ErrorMsg message={errors.password?.message} />
          </div>

          {/* Role Dropdown */}
          <div className="flex flex-col space-y-1.5 items-start pb-2">
            <label className="text-[13px] font-bold text-slate-800 ml-1">Sign in as</label>
            <div className="relative w-full">
              <UserCog className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.role ? 'text-red-400' : 'text-slate-400'}`} size={18} />
              <select
                {...register("role")}
                className={`h-14 w-full appearance-none rounded-xl border-2 pl-12 pr-10 bg-[#F8F6FC] outline-none transition-all cursor-pointer font-bold text-slate-700 ${errors.role ? "border-red-400" : "border-transparent focus:border-[#4F39F6] focus:bg-white"
                  }`}
              >
                <option value="">Select your role</option>
                <option value="student">Student</option>
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
                <option value="mentor">Mentor</option>
                <option value="judge">Judge</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
            </div>
            <ErrorMsg message={errors.role?.message} />
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="h-14 w-full rounded-xl bg-[#4F39F6] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#3f2dd1] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100 active:scale-[0.98]"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-slate-100" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Or Continue With</span>
            <div className="h-[1px] flex-1 bg-slate-100" />
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-bold text-slate-500">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-[#4F39F6] hover:underline"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}