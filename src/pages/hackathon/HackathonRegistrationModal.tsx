import React from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, ChevronLeft, Users, Loader2, ChevronDown } from 'lucide-react';
import {
    HackathonRegistrationSchema,
    HackathonRegistrationValues
} from '@/schemas/hackathon.schema';
import { ErrorMsg } from '@/components/ui/error';
import { useNavigate } from 'react-router-dom';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    hackathonData: any;
}

export default function HackathonRegistrationModal({ isOpen, onClose, hackathonData }: Props) {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<HackathonRegistrationValues>({
        resolver: zodResolver(HackathonRegistrationSchema),
        defaultValues: { role: 'Participant', agreeToRules: undefined }
    });

    const onSubmit = async (data: HackathonRegistrationValues) => {
        // API logic here
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 text-left">
            <div className="bg-white w-full max-w-[1200px] h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">

                {/* Fixed Header */}
                <div className="px-10 py-5 border-b border-slate-50 flex justify-between items-center bg-white">
                    <button onClick={onClose} className="flex items-center gap-2 text-[#4F39F6] font-bold text-xs uppercase tracking-wider">
                        <ChevronLeft size={18} /> Back to {hackathonData.title}
                    </button>
                    <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row bg-white">

                    {/* Left: Form Content */}
                    <div className="flex-1 p-10 space-y-10">
                        <div className="space-y-2">
                            <h2 className="text-[42px] font-black text-slate-900 tracking-tight leading-[1.1]">
                                Register for {hackathonData.title}
                            </h2>
                            <p className="text-[15px] font-medium text-slate-500">
                                You're almost there! Review your details and confirm your registration.
                            </p>
                        </div>

                        {/* Team Info Section */}
                        <div className="space-y-4">
                            <h3 className="text-base font-bold text-slate-800">Team Information</h3>
                            <div className="bg-white border-2 border-[#4F39F6]/40 p-6 rounded-[24px] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-[#4F39F6]">
                                        <Users size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[17px] font-black text-slate-900">Team Neural Ninjas V2</p>
                                        <p className="text-sm font-bold text-slate-400">4 members</p>
                                    </div>
                                </div>
                                <span className="px-4 py-1.5 bg-[#4F39F6] text-white text-[10px] font-black uppercase tracking-widest rounded-lg">Team Lead</span>
                            </div>
                            <button type="button" className="text-xs font-bold text-slate-500 hover:text-[#4F39F6] underline ml-1">Change Team</button>
                        </div>

                        {/* Participant Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-slate-800">Participant Details</h3>
                            <div className="grid gap-5">
                                {/* Full Name */}
                                <div className="flex flex-col">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1 mb-1.5">Full Name</label>
                                    <input
                                        {...register("fullName")}
                                        className={`h-14 w-full bg-slate-50/50 border rounded-xl px-5 text-sm font-medium outline-none transition-all ${errors.fullName ? "border-red-400 focus:border-red-400" : "border-slate-100 focus:border-[#4F39F6]"
                                            }`}
                                        placeholder="John Doe"
                                    />
                                    {errors.fullName && (
                                        <p className="text-[12px] font-bold text-red-500 ml-1 mt-1.5 text-left">
                                            {errors.fullName.message}
                                        </p>
                                    )}
                                </div>

                                {/* Email Address */}
                                <div className="flex flex-col">
                                    <label className="text-[13px] font-bold text-slate-700 ml-1 mb-1.5">Email Address</label>
                                    <input
                                        {...register("email")}
                                        className={`h-14 w-full bg-slate-50/50 border rounded-xl px-5 text-sm font-medium outline-none transition-all ${errors.email ? "border-red-400 focus:border-red-400" : "border-slate-100 focus:border-[#4F39F6]"
                                            }`}
                                        placeholder="john.doe@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-[12px] font-bold text-red-500 ml-1 mt-1.5 text-left">
                                            {errors.email.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* Agreements */}
                        <div className="space-y-4 pt-4">
                            <div className="flex flex-col gap-3">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        {...register("agreeToRules")}
                                        className="w-5 h-5 rounded border-slate-300 text-[#4F39F6] focus:ring-0 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        I agree to the hackathon rules and code of conduct
                                    </span>
                                </label>
                                {/* Error message specifically for the checkbox, left-aligned */}
                                {errors.agreeToRules && (
                                    <p className="text-[12px] font-bold text-red-500 ml-8 text-left -mt-1">
                                        {errors.agreeToRules.message}
                                    </p>
                                )}

                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded border-slate-300 text-[#4F39F6] focus:ring-0 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                        I consent to my team details being visible to organizers
                                    </span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Right: Summary Sidebar */}
                    <div className="w-full lg:w-[400px] p-10 bg-white lg:border-l border-slate-50">
                        <div className="bg-[#F8F9FD] rounded-[32px] p-8 space-y-8">
                            <h3 className="text-lg font-bold text-slate-800">Registration Summary</h3>
                            <div className="space-y-5">
                                <SummaryRow label="Hackathon" value={hackathonData.title} />
                                <SummaryRow label="Date" value={hackathonData.startDate} />
                                <SummaryRow label="Mode" value={hackathonData.mode} />
                                <SummaryRow label="Team" value="Neural Ninjas V2" />
                                <SummaryRow label="Members" value="4" />
                            </div>
                            <div className="h-px bg-slate-200" />
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-slate-800">Total Cost</span>
                                <span className="text-[32px] font-black text-[#10B981] tracking-tighter">Free</span>
                            </div>
                        </div>

                        <div className="mt-10">
                            <button
                                type="button"
                                onClick={handleSubmit(onSubmit)}
                                className="w-full py-4 bg-[#4F39F6] text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Registration"}
                            </button>
                            <p className="text-[11px] text-center font-bold text-slate-400">By confirming, you agree to the terms.</p>
                        </div>
                    </div>
                </div>

                {/* Fixed Footer */}
                <div className="bg-white border-t border-slate-50 px-10 py-6 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900">Team Neural Ninjas V2 (You)</span>
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-50">Cancel</button>
                        <button type="button" onClick={handleSubmit(onSubmit)} className="px-10 py-3 bg-[#4F39F6] text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-100">Confirm Registration</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

const SummaryRow = ({ label, value }: { label: string, value: string }) => (
    <div className="flex justify-between items-center">
        <span className="text-[13px] font-bold text-slate-400">{label}</span>
        <span className="text-[13px] font-black text-slate-700">{value}</span>
    </div>
);