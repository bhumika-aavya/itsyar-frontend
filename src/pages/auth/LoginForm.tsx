import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setServerError("");
    try {
      const response = await api.post("/auth/login", {
        email: data.email,
        password: data.password,
        role: data.role // Added role to the payload
      });

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        navigate("/dashboard");
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 1. Logo Centered above the form */}
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full rounded-[32px] border border-slate-100 bg-white p-10 shadow-xl shadow-slate-200/40">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm font-medium text-slate-500">Sign in to continue learning.</p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Email Address */}
          <div className="flex flex-col space-y-2 items-start">
            <label className="text-sm font-bold text-slate-800 ml-1">Email Address</label>
            <div className="relative w-full">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400'}`} size={20} />
              <input
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                className={`h-14 w-full rounded-xl border-2 pl-12 bg-[#F8F6FC] outline-none transition-all ${
                  errors.email ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                }`}
              />
            </div>
            <ErrorMsg message={errors.email?.message} />
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-2 items-start">
            <label className="text-sm font-bold text-slate-800 ml-1">Password</label>
            <div className="relative w-full">
              <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400'}`} size={20} />
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className={`h-14 w-full rounded-xl border-2 pl-12 pr-12 bg-[#F8F6FC] outline-none transition-all ${
                  errors.password ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                }`}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <ErrorMsg message={errors.password?.message} />
          </div>

          {/* New Role Dropdown */}
          <div className="flex flex-col space-y-2 items-start">
            <label className="text-sm font-bold text-slate-800 ml-1">Sign in as</label>
            <div className="relative w-full">
              <UserCog className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.role ? 'text-red-400' : 'text-slate-400'}`} size={20} />
              <select
                {...register("role")}
                className={`h-14 w-full appearance-none rounded-xl border-2 pl-12 pr-10 bg-[#F8F6FC] outline-none transition-all cursor-pointer font-medium text-slate-700 ${
                  errors.role ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                }`}
              >
                <option value="student">Student</option>
                <option value="participant">Participant</option>
                <option value="organizer">Organizer</option>
                <option value="admin">Admin</option>
                <option value="mentor">Mentor</option>
                <option value="judge">Judge</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
            </div>
            <ErrorMsg message={errors.role?.message} />
          </div>

          <button
            disabled={isLoading}
            type="submit"
            className="h-14 w-full rounded-xl bg-[#4F39F6] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#3f2dd1] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : "Sign In"}
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