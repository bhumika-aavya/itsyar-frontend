import React, { useState } from "react";
import {
  User, Mail, Lock, Eye, EyeOff, GraduationCap, ChevronDown, Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/schemas/register.schema";
import { ErrorMsg } from "@/components/ui/error";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";
import Logo from "./Logo";

export default function RegisterForm() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: undefined,
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setServerError("");
    try {
      const response = await api.post("/auth/register", {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        interest: data.interest,
        userType: data.userType
      });

      if (response.data.success) {
        navigate("/login"); 
      }
    } catch (error: any) {
      setServerError(error.response?.data?.message || "Registration failed. Try again.");
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

      <div className="w-full rounded-[40px] bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-10">
          {/* Header Section Centered */}
          <div className="text-center mb-10">
            <h2 className="text-[32px] font-bold text-[#1A1C1E] tracking-tight">Join as a Learner</h2>
            <p className="mt-2 text-[15px] text-slate-500 max-w-[420px] mx-auto leading-relaxed">
              Register to access courses, track your progress and grow your skills.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name */}
            <div className="flex flex-col space-y-2 items-start">
              <label className="text-sm font-bold text-slate-800 ml-1">Full Name</label>
              <div className="relative w-full">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.fullName ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                <input
                  {...register("fullName")}
                  placeholder="Enter your full name"
                  className={`h-14 w-full rounded-xl border-2 transition-all pl-12 pr-4 outline-none ${
                    errors.fullName ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                  } bg-[#F8F6FC] text-slate-900 placeholder:text-slate-400`}
                />
              </div>
              <ErrorMsg message={errors.fullName?.message} />
            </div>

            {/* Email */}
            <div className="flex flex-col space-y-2 items-start">
              <label className="text-sm font-bold text-slate-800 ml-1">Email Address</label>
              <div className="relative w-full">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  className={`h-14 w-full rounded-xl border-2 transition-all pl-12 pr-4 outline-none ${
                    errors.email ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                  } bg-[#F8F6FC] text-slate-900 placeholder:text-slate-400`}
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
                  type={showPass ? "text" : "password"}
                  placeholder="Create a strong password"
                  className={`h-14 w-full rounded-xl border-2 transition-all pl-12 pr-12 outline-none ${
                    errors.password ? "border-red-400" : "border-[#4F39F6]"
                  } bg-[#F8F6FC] text-slate-900 placeholder:text-slate-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <ErrorMsg message={errors.password?.message} />
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col space-y-2 items-start">
              <label className="text-sm font-bold text-slate-800 ml-1">Confirm Password</label>
              <div className="relative w-full">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Confirm your password"
                  className={`h-14 w-full rounded-xl border-2 transition-all pl-12 pr-12 outline-none ${
                    errors.confirmPassword ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                  } bg-[#F8F6FC] text-slate-900 placeholder:text-slate-400`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPass(!showConfirmPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPass ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              <ErrorMsg message={errors.confirmPassword?.message} />
            </div>

            {/* Learning Interest */}
            <div className="flex flex-col space-y-2 items-start">
              <label className="text-sm font-bold text-slate-800 ml-1">Learning Interest</label>
              <div className="relative w-full">
                <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.interest ? 'text-red-400' : 'text-slate-400'}`} size={20} />
                <select
                  {...register("interest")}
                  className={`h-14 w-full appearance-none rounded-xl border-2 transition-all pl-12 pr-10 outline-none cursor-pointer ${
                    errors.interest ? "border-red-400" : "border-slate-50 focus:border-[#4F39F6]"
                  } bg-[#F8F6FC] text-slate-600 font-medium`}
                >
                  <option value="">Select your field</option>
                  <option value="tech">Technology</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
              </div>
              <ErrorMsg message={errors.interest?.message} />
            </div>

            {/* User Type Radio */}
            <div className="space-y-3 pt-2">
              <label className="text-sm font-bold text-slate-800 ml-1 block">I am a</label>
              <div className="flex flex-wrap gap-6 ml-1">
                {['Student', 'Working Professional', 'Other'].map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        {...register("userType")}
                        type="radio"
                        value={type}
                        className="peer appearance-none h-6 w-6 rounded-full border-2 border-slate-300 checked:border-[#4F39F6] transition-all cursor-pointer"
                      />
                      <div className="absolute h-3 w-3 rounded-full bg-[#4F39F6] scale-0 peer-checked:scale-100 transition-all duration-200" />
                    </div>
                    <span className="text-[15px] font-semibold text-slate-600 group-hover:text-slate-900">{type}</span>
                  </label>
                ))}
              </div>
              <ErrorMsg message={errors.userType?.message} />
            </div>

            {/* Terms Checkbox */}
            <div className="flex flex-col items-center">
              <label className="flex items-start gap-3 pt-4 cursor-pointer group w-full text-left">
                <input
                  {...register("acceptTerms")}
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-2 border-slate-300 text-[#4F39F6] focus:ring-0 cursor-pointer"
                />
                <span className="text-[14px] leading-tight font-semibold text-slate-600 select-none">
                  I agree to the <span className="text-[#4F39F6] font-bold">Terms of Service</span> and <span className="text-[#4F39F6] font-bold">Privacy Policy</span>.
                </span>
              </label>
              <ErrorMsg message={errors.acceptTerms?.message} />
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="h-14 w-full rounded-xl bg-[#4F39F6] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#3f2dd1] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Complete Enrollment"}
            </button>
          </form>
        </div>

        {/* Footer Section */}
        <div className="bg-[#F4F2FF] p-8 text-center border-t border-slate-100">
          <p className="text-[15px] font-bold text-slate-500">
            Already have an account?{" "}
            <button 
              onClick={() => navigate('/login')}
              className="text-[#4F39F6] hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}