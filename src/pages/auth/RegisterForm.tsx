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

      <div className="w-full rounded-[40px] bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <div className="px-10 pt-10 pb-2">
          <div className="text-center mb-10">
            <h2 className="text-[32px] font-bold text-[#1A1C1E] tracking-tight">{`Join as a ${watch('userType') === 'Student' ? 'Learner' : 'Participant'}`}</h2>
            <p className="mt-2 text-sm text-slate-500 max-w-[420px] mx-auto leading-relaxed font-medium">
              Register to access courses, track your progress and grow your skills.
            </p>
          </div>

          {serverError && (
            <div className="mb-6 p-3 bg-red-50 text-red-500 rounded-xl text-sm text-center font-bold border border-red-100">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Full Name */}
            <div className="flex flex-col space-y-1.5 items-start">
              <label className="text-[13px] font-bold text-slate-800 ml-1">Full Name</label>
              <div className="relative w-full">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.fullName ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  {...register("fullName")}
                  placeholder="Enter your full name"
                  className={`h-14 w-full rounded-xl border-2 pl-12 pr-4 outline-none transition-all font-medium text-slate-900 ${errors.fullName ? "border-red-400" : "border-transparent bg-[#F8F6FC] focus:border-[#3AADDD] focus:bg-white"
                    }`}
                />
              </div>
              <ErrorMsg message={errors.fullName?.message} />
            </div>

            {/* Email */}
            <div className="flex flex-col space-y-1.5 items-start">
              <label className="text-[13px] font-bold text-slate-800 ml-1">Email Address</label>
              <div className="relative w-full">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <input
                  {...register("email")}
                  type="email"
                  placeholder="Enter your email"
                  className={`h-14 w-full rounded-xl border-2 pl-12 pr-4 outline-none transition-all font-medium text-slate-900 ${errors.email ? "border-red-400" : "border-transparent bg-[#F8F6FC] focus:border-[#3AADDD] focus:bg-white"
                    }`}
                />
              </div>
              <ErrorMsg message={errors.email?.message} />
            </div>

            {/* Passwords Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1.5 items-start">
                <label className="text-[13px] font-bold text-slate-800 ml-1">Password</label>
                <div className="relative w-full">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                  <input
                    {...register("password")}
                    type={showPass ? "text" : "password"}
                    placeholder="Create password"
                    className={`h-14 w-full rounded-xl border-2 pl-11 pr-10 outline-none transition-all font-medium text-slate-900 text-sm ${errors.password ? "border-red-400" : "border-transparent bg-[#F8F6FC] focus:border-[#3AADDD] focus:bg-white"
                      }`}
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-1.5 items-start">
                <label className="text-[13px] font-bold text-slate-800 ml-1">Confirm Password</label>
                <div className="relative w-full">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                  <input
                    {...register("confirmPassword")}
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Confirm password"
                    className={`h-14 w-full rounded-xl border-2 pl-11 pr-10 outline-none transition-all font-medium text-slate-900 text-sm ${errors.confirmPassword ? "border-red-400" : "border-transparent bg-[#F8F6FC] focus:border-[#3AADDD] focus:bg-white"
                      }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <ErrorMsg message={errors.password?.message || errors.confirmPassword?.message} />
            </div>

            {/* Interest Dropdown */}
            {/* <div className="flex flex-col space-y-1.5 items-start">
              <label className="text-[13px] font-bold text-slate-800 ml-1">Learning Interest</label>
              <div className="relative w-full">
                <GraduationCap className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.interest ? 'text-red-400' : 'text-slate-400'}`} size={18} />
                <select
                  {...register("interest")}
                  className={`h-14 w-full appearance-none rounded-xl border-2 pl-12 pr-10 outline-none transition-all cursor-pointer font-bold text-slate-700 ${errors.interest ? "border-red-400" : "border-transparent bg-[#F8F6FC] focus:border-[#3AADDD] focus:bg-white"
                    }`}
                >
                  <option value="">Select your field</option>
                  <option value="tech">Technology</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
              </div>
              <ErrorMsg message={errors.interest?.message} />
            </div> */}

            {/* User Type Radio */}
            <div className="space-y-3 pt-2">
              <label className="text-[13px] font-bold text-slate-800 ml-1 block">I am a</label>
              <div className="flex flex-wrap gap-6 ml-1">
                {ROLE_OPTIONS.map((type) => (
                  <label key={type} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input
                        {...register("userType")}
                        type="radio"
                        value={type}
                        className="peer appearance-none h-6 w-6 rounded-full border-2 border-slate-300 checked:border-[#4F46E5] transition-all cursor-pointer"
                      />
                      <div className="absolute h-3 w-3 rounded-full bg-[#4F46E5] scale-0 peer-checked:scale-100 transition-all duration-200" />
                    </div>
                    <span className="text-[15px] font-semibold text-slate-600 group-hover:text-slate-900">{type}</span>
                  </label>
                ))}
              </div>
              <ErrorMsg message={errors.userType?.message} />
            </div>

            {/* Terms Checkbox */}
            <div className="flex flex-col items-center">
              <label className="flex items-start gap-3 pt-2 cursor-pointer group w-full text-left">
                <input
                  {...register("acceptTerms")}
                  type="checkbox"
                  className="mt-1 h-5 w-5 rounded border-2 border-slate-300 text-[#4F46E5] focus:ring-0 cursor-pointer"
                />
                <span className="text-[13px] leading-tight font-semibold text-slate-600 select-none">
                  I agree to the <span className="text-[#4F46E5] font-bold hover:underline">Terms of Service</span> and <span className="text-[#4F46E5] font-bold hover:underline">Privacy Policy</span>.
                </span>
              </label>
              <ErrorMsg message={errors.acceptTerms?.message} />
            </div>

            <button
              disabled={isLoading}
              type="submit"
              className="h-14 w-full rounded-xl bg-[#4F46E5] font-bold text-white flex items-center justify-center gap-2 hover:bg-[#4338CA] transition-all disabled:opacity-70 shadow-lg shadow-indigo-100 active:scale-[0.98] mt-4"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : "Complete Enrollment"}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-4 py-1">
              <div className="h-[1px] flex-1 bg-slate-100" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Or Join With</span>
              <div className="h-[1px] flex-1 bg-slate-100" />
            </div>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleSignup}
              className="h-14 w-full rounded-xl border-2 border-slate-100 bg-white flex items-center justify-center gap-3 font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-[0.98]"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              Sign up with Google
            </button>
          </form>
        </div>

        <div className="bg-[#F4F2FF] p-8 text-center border-t border-slate-100">
          <p className="text-[15px] font-bold text-slate-500">
            Already have an account? <button onClick={() => navigate('/login')} className="text-[#4F46E5] font-extrabold hover:underline">Sign In</button>
          </p>
        </div>
      </div>
    </div>
  );
}