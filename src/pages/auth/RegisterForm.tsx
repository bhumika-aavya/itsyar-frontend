import React, { useEffect, useState } from "react";
import {
  User, Mail, Lock, Eye, EyeOff, GraduationCap, ChevronDown, Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormValues } from "@/schemas/register.schema";
import { ErrorMsg } from "@/components/ui/error";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "@/lib/axios";
import { getApiErrorMessage } from "@/lib/getApiErrorMessage";
import Logo from "./Logo";
import { useAuth } from "@/context/AuthContext";

interface RegisterResponse {
  success: boolean;
  message: string;
}

const ROLE_OPTIONS = ["Student", "Participant"] as const;

export default function RegisterForm() {
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: "Student",
      acceptTerms: false,
    },
  });

  const passwordValue = watch("password");
  const confirmPasswordValue = watch("confirmPassword");

  // Landing page CTAs deep-link here with ?role=student / ?role=participant
  useEffect(() => {
    const roleParam = (searchParams.get("role") ?? "").toLowerCase();
    const matched = ROLE_OPTIONS.find(r => r.toLowerCase() === roleParam);
    if (matched) setValue("userType", matched);
  }, [searchParams, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    setServerError("");
    try {
      const response = await api.post<RegisterResponse>("/auth/signup", {
        ...data,
        role: data.userType,
      });

      if (response.data.success) {
        const loginResponse = await api.post("/auth/login", {
          email: data.email,
          password: data.password,
          role: data.userType,
        });
        const { accessToken, user } = loginResponse.data;
        login(accessToken, user);
        navigate("/dashboard", { replace: true });
      }
    } catch (error: unknown) {
      setServerError(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = import.meta.env.VITE_GOOGLE_AUTH_URL;
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full rounded-[32px] border border-slate-100 dark:border-[#2e303a] bg-white dark:bg-[#16171d] p-8 sm:p-10 shadow-xl shadow-slate-200/50 dark:shadow-none">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Join as a Member</h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[380px] mx-auto leading-relaxed">
            Register to access courses, track your progress, and grow your skills.
          </p>
        </div>

        {serverError && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 rounded-xl text-sm text-center font-bold border border-red-100 dark:border-red-900/50">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4.5">
          {/* Full Name */}
          <div className="flex flex-col space-y-1.5 items-start">
            <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 ml-1">
              Full Name <span className="text-red-400">*</span>
            </label>
            <div className="relative w-full">
              <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.fullName ? 'text-red-400' : 'text-slate-400'}`} size={18} />
              <input
                {...register("fullName")}
                placeholder="Enter your full name"
                className={`h-13 w-full rounded-xl border-2 pl-12 pr-4 bg-[#F8F6FC] dark:bg-[#1c1d24] outline-none transition-all font-medium text-slate-900 dark:text-slate-100 ${errors.fullName
                  ? "border-red-400"
                  : "border-transparent focus:border-[#4F46E5] dark:focus:border-[#6366F1] focus:bg-white dark:focus:bg-[#252630]"
                  }`}
              />
            </div>
            <ErrorMsg message={errors.fullName?.message} />
          </div>

          {/* Email */}
          <div className="flex flex-col space-y-1.5 items-start">
            <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 ml-1">
              Email Address <span className="text-red-400">*</span>
            </label>
            <div className="relative w-full">
              <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400'}`} size={18} />
              <input
                {...register("email")}
                type="email"
                placeholder="Enter your email"
                className={`h-13 w-full rounded-xl border-2 pl-12 pr-4 bg-[#F8F6FC] dark:bg-[#1c1d24] outline-none transition-all font-medium text-slate-900 dark:text-slate-100 ${errors.email
                  ? "border-red-400"
                  : "border-transparent focus:border-[#4F46E5] dark:focus:border-[#6366F1] focus:bg-white dark:focus:bg-[#252630]"
                  }`}
              />
            </div>
            <ErrorMsg message={errors.email?.message} />
          </div>

          {/* Passwords Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="flex flex-col space-y-1.5 items-start">
              <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 ml-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative w-full">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Create password"
                  className={`h-13 w-full rounded-xl border-2 pl-11 pr-11 bg-[#F8F6FC] dark:bg-[#1c1d24] outline-none transition-all font-medium text-slate-900 dark:text-slate-100 text-sm ${errors.password
                    ? "border-red-400"
                    : "border-transparent focus:border-[#4F46E5] dark:focus:border-[#6366F1] focus:bg-white dark:focus:bg-[#252630]"
                    }`}
                />
                {passwordValue && (
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
              <ErrorMsg message={errors.password?.message} />
            </div>

            <div className="flex flex-col space-y-1.5 items-start">
              <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 ml-1">
                Confirm Password <span className="text-red-400">*</span>
              </label>
              <div className="relative w-full">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  {...register("confirmPassword")}
                  type={showConfirmPass ? "text" : "password"}
                  placeholder="Confirm password"
                  className={`h-13 w-full rounded-xl border-2 pl-11 pr-11 bg-[#F8F6FC] dark:bg-[#1c1d24] outline-none transition-all font-medium text-slate-900 dark:text-slate-100 text-sm ${errors.confirmPassword
                    ? "border-red-400"
                    : "border-transparent focus:border-[#4F46E5] dark:focus:border-[#6366F1] focus:bg-white dark:focus:bg-[#252630]"
                    }`}
                />
                {confirmPasswordValue && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
              <ErrorMsg message={errors.confirmPassword?.message} />
            </div>
          </div>

          {/* User Type Radio / Pills */}
          {/* <div className="flex flex-col space-y-2 items-start pt-1">
            <label className="text-[13px] font-bold text-slate-800 dark:text-slate-200 ml-1">
              I am a <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3 w-full">
              {ROLE_OPTIONS.map((type) => {
                const label = type === "Student" ? "Learner" : type;
                const isSelected = watch("userType") === type;
                return (
                  <label
                    key={type}
                    onClick={() => setValue("userType", type)}
                    className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border-2 cursor-pointer transition-all duration-200 select-none ${
                      isSelected
                        ? "border-[#4F46E5] bg-indigo-50/70 dark:bg-indigo-950/40 text-[#4F46E5] dark:text-indigo-400 font-bold shadow-xs shadow-indigo-100 dark:shadow-none"
                        : "border-slate-100 dark:border-[#2e303a] bg-[#F8F6FC] dark:bg-[#1c1d24] text-slate-600 dark:text-slate-400 font-semibold hover:border-slate-200 dark:hover:border-slate-700"
                    }`}
                  >
                    <input
                      {...register("userType")}
                      type="radio"
                      value={type}
                      className="sr-only"
                    />
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${
                        isSelected
                          ? "border-[#4F46E5] dark:border-indigo-400"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-[#4F46E5] dark:bg-indigo-400" />
                      )}
                    </div>
                    <span className="text-sm">{label}</span>
                  </label>
                );
              })}
            </div>
            <ErrorMsg message={errors.userType?.message} />
          </div> */}

          {/* Terms Checkbox */}
          <div className="pt-0.5">
            <label className="flex items-start gap-3 cursor-pointer group select-none">
              <input
                {...register("acceptTerms")}
                type="checkbox"
                className="mt-0.5 h-4.5 w-4.5 rounded-md border-2 border-slate-300 dark:border-slate-600 text-[#4F46E5] focus:ring-indigo-500/20 cursor-pointer transition-all accent-[#4F46E5]"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug text-left">
                I agree to the <span className="text-[#4F46E5] dark:text-indigo-400 font-bold hover:underline">Terms of Service</span> and <span className="text-[#4F46E5] dark:text-indigo-400 font-bold hover:underline">Privacy Policy</span>.
              </span>
            </label>
            <ErrorMsg message={errors.acceptTerms?.message} />
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading}
            type="submit"
            className="h-13 w-full rounded-xl bg-[#4F46E5] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#4338CA] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98] cursor-pointer mt-2"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Complete Enrollment"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-0.5">
            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-[#2e303a]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Or Join With</span>
            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-[#2e303a]" />
          </div>

          {/* Google Signup */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            className="h-13 w-full rounded-xl border-2 border-slate-100 dark:border-[#2e303a] bg-white dark:bg-[#16171d] flex items-center justify-center gap-3 font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1c1d24] transition-all active:scale-[0.98] cursor-pointer"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Sign up with Google
          </button>
        </form>

        <p className="mt-8 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-[#4F46E5] dark:text-indigo-400 font-extrabold hover:underline ml-1 cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}