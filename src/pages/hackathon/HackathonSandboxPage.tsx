import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import HackathonCodeSandbox from './HackathonCodeSandbox';
import { HackathonService } from '@/services/hackathon.service';

export default function HackathonSandboxPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as { hackathonStatus?: string; hackathonEndDate?: string } | null;
    const hackathonStatus = state?.hackathonStatus ?? 'Running';
    const hackathonEndDate = state?.hackathonEndDate;

    const [checking, setChecking] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        const check = async () => {
            if (!id) return;
            const registered = await HackathonService.checkRegistration(id);
            setIsRegistered(registered);
            setChecking(false);
        };
        check();
    }, [id]);

    if (!id) return null;

    if (checking) return (
        <div className="h-screen flex items-center justify-center bg-[#F8F9FC]">
            <Loader2 className="animate-spin text-[#4F39F6]" size={36} />
        </div>
    );

    if (!isRegistered) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#F8F9FC] gap-6 p-8 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
                <Lock size={28} className="text-red-400" />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-900">Registration Required</h2>
                <p className="text-sm font-medium text-slate-400 mt-2 max-w-sm leading-relaxed">
                    You must register for this hackathon before accessing the code sandbox. Please go back and complete registration.
                </p>
            </div>
            <button
                onClick={() => navigate(`/hackathons/${id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:bg-[#3f2dd1] transition-all"
            >
                <ArrowLeft size={15} /> Back to Hackathon
            </button>
        </div>
    );

    return (
        <HackathonCodeSandbox
            hackathonId={id}
            hackathonStatus={hackathonStatus}
            hackathonEndDate={hackathonEndDate}
            initialFullscreen={true}
            onClose={() => navigate(`/hackathons/${id}`, { replace: true })}
        />
    );
}
