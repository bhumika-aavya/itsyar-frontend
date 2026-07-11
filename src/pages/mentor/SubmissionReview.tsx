import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    ChevronLeft, Code2, FileCode, CheckCircle2, XCircle,
    Loader2, Clock, Send, User, Mail, Calendar
} from 'lucide-react';
import { HackathonService } from '@/services/hackathon.service';
import { MentorSubmission, MentorReviewSchema, MentorReviewValues } from '@/schemas/hackathon.schema';

const FILE_EXT_MAP: Record<string, string> = {
    javascript: 'js', typescript: 'ts', python: 'py', java: 'java',
    'c++': 'cpp', go: 'go', rust: 'rs', ruby: 'rb',
};

const STATUS_CONFIG = {
    PENDING:  { label: 'Pending Review', color: 'bg-amber-50 text-amber-600' },
    ACCEPTED: { label: 'Accepted',       color: 'bg-emerald-50 text-emerald-600' },
    REJECTED: { label: 'Rejected',       color: 'bg-red-50 text-red-500' },
};

const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export default function SubmissionReview() {
    const { submissionId } = useParams<{ submissionId: string }>();
    const navigate = useNavigate();
    const [submission, setSubmission] = useState<MentorSubmission | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<MentorReviewValues>({
        resolver: zodResolver(MentorReviewSchema),
    });

    const selectedStatus = watch('status');

    useEffect(() => {
        const load = async () => {
            if (!submissionId) return;
            setLoading(true);
            const data = await HackathonService.getSubmissionById(submissionId);
            setSubmission(data);
            setLoading(false);
        };
        load();
    }, [submissionId]);

    const onSubmit = async (data: MentorReviewValues) => {
        if (!submissionId) return;
        setSubmitting(true);
        await HackathonService.reviewSubmission(submissionId, data);
        setSubmitting(false);
        setDone(true);
    };

    if (loading) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
        </div>
    );

    if (!submission) return (
        <div className="h-screen flex items-center justify-center text-slate-400 font-bold">
            Submission not found.
        </div>
    );

    const fileExt = FILE_EXT_MAP[submission.language.toLowerCase()] ?? submission.language.toLowerCase();
    const statusCfg = STATUS_CONFIG[submission.status];

    if (done) return (
        <div className="max-w-xl mx-auto py-32 text-center space-y-6 px-6">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Review Submitted</h2>
                <p className="text-slate-500 font-medium mt-2">
                    {submission.participantName}'s submission has been marked as{' '}
                    <span className={`font-extrabold ${selectedStatus === 'ACCEPTED' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {selectedStatus}
                    </span>.
                </p>
            </div>
            <button
                onClick={() => navigate('/mentor')}
                className="px-8 py-3 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] transition-all"
            >
                Back to Dashboard
            </button>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-6 md:px-10 md:py-8 animate-in fade-in duration-500">
            {/* Back + header */}
            <button
                onClick={() => navigate('/mentor')}
                className="flex items-center gap-2 text-[#4F46E5] font-bold text-sm mb-6 hover:opacity-80 transition-all"
            >
                <ChevronLeft size={18} /> Back to Dashboard
            </button>

            <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#4F46E5] mb-1">Mentor Review</p>
                    <h1 className="text-3xl font-extrabold text-slate-900">{submission.hackathonTitle}</h1>
                </div>
                <span className={`px-4 py-2 rounded-xl text-sm font-extrabold ${statusCfg.color}`}>
                    {statusCfg.label}
                </span>
            </div>

            <div className="grid lg:grid-cols-5 gap-8 items-start">
                {/* LEFT — Code viewer (3/5) */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Participant meta */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <User size={16} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400">Participant</p>
                                <p className="text-sm font-extrabold text-slate-900">{submission.participantName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Mail size={16} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400">Email</p>
                                <p className="text-sm font-extrabold text-slate-900 truncate">{submission.participantEmail}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Code2 size={16} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400">Language</p>
                                <p className="text-sm font-extrabold text-slate-900">{submission.language}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <Calendar size={16} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-400">Submitted</p>
                                <p className="text-sm font-extrabold text-slate-900">{formatDateTime(submission.submittedAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Code block */}
                    <div className="bg-[#1E1E2E] rounded-[24px] overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-2 px-5 py-3 border-b border-white/5">
                            <div className="w-3 h-3 rounded-full bg-red-500/70" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
                            <div className="flex items-center gap-1.5 ml-3">
                                <FileCode size={13} className="text-white/40" />
                                <span className="text-xs font-bold text-white/40">solution.{fileExt}</span>
                            </div>
                        </div>
                        <pre className="text-[#CDD6F4] font-mono text-[13px] leading-relaxed p-5 overflow-x-auto whitespace-pre-wrap">
                            {submission.code}
                        </pre>
                    </div>

                    {/* Participant notes */}
                    {submission.notes && (
                        <div className="bg-white border border-slate-100 rounded-2xl p-5">
                            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">Participant Notes</p>
                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{submission.notes}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT — Review form (2/5) */}
                <div className="lg:col-span-2 space-y-4">
                    {submission.status !== 'PENDING' ? (
                        /* Already reviewed — show read-only verdict */
                        <div className="bg-white border border-slate-100 rounded-3xl p-7 space-y-5">
                            <h2 className="text-lg font-extrabold text-slate-900">Review Complete</h2>
                            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl font-extrabold text-sm ${statusCfg.color}`}>
                                {submission.status === 'ACCEPTED'
                                    ? <CheckCircle2 size={16} />
                                    : <XCircle size={16} />}
                                {statusCfg.label}
                            </div>
                            {submission.reviewNotes && (
                                <div>
                                    <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400 mb-2">Mentor Feedback</p>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed">{submission.reviewNotes}</p>
                                </div>
                            )}
                            {submission.reviewedAt && (
                                <p className="text-xs font-bold text-slate-400">
                                    Reviewed on {formatDateTime(submission.reviewedAt)}
                                </p>
                            )}
                        </div>
                    ) : (
                        /* Pending — show review form */
                        <form onSubmit={handleSubmit(onSubmit)} className="bg-white border border-slate-100 rounded-3xl p-7 space-y-6">
                            <div>
                                <h2 className="text-lg font-extrabold text-slate-900 mb-1">Submit Your Review</h2>
                                <p className="text-sm font-medium text-slate-400">
                                    Evaluate this submission and provide feedback to the participant.
                                </p>
                            </div>

                            {/* Status picker */}
                            <div className="space-y-2">
                                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-600">Decision</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setValue('status', 'ACCEPTED', { shouldValidate: true })}
                                        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-extrabold text-sm border-2 transition-all ${selectedStatus === 'ACCEPTED'
                                            ? 'border-emerald-400 bg-emerald-50 text-emerald-600'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <CheckCircle2 size={16} /> Accept
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setValue('status', 'REJECTED', { shouldValidate: true })}
                                        className={`flex items-center justify-center gap-2 py-3.5 rounded-xl font-extrabold text-sm border-2 transition-all ${selectedStatus === 'REJECTED'
                                            ? 'border-red-400 bg-red-50 text-red-500'
                                            : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        <XCircle size={16} /> Reject
                                    </button>
                                </div>
                                {errors.status && (
                                    <p className="text-xs font-bold text-red-500">{errors.status.message}</p>
                                )}
                                {/* hidden input to register status with react-hook-form */}
                                <input type="hidden" {...register('status')} />
                            </div>

                            {/* Feedback textarea */}
                            <div className="space-y-2">
                                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-600">
                                    Feedback <span className="font-bold text-slate-400 normal-case tracking-normal">(required, min 10 chars)</span>
                                </label>
                                <textarea
                                    {...register('reviewNotes')}
                                    rows={6}
                                    placeholder="Describe what was done well, what could be improved, correctness of the solution, efficiency considerations..."
                                    className={`w-full bg-slate-50 border rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#3AADDD] transition-all resize-none ${errors.reviewNotes ? 'border-red-300' : 'border-slate-100'}`}
                                />
                                {errors.reviewNotes && (
                                    <p className="text-xs font-bold text-red-500">{errors.reviewNotes.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedStatus}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-lg shadow-indigo-100 hover:bg-[#4338CA] disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95"
                            >
                                {submitting
                                    ? <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                                    : <><Send size={15} /> Submit Review</>}
                            </button>
                        </form>
                    )}

                    {/* Quick timeline */}
                    <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
                        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">Activity</p>
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                                <Clock size={13} className="text-[#4F46E5]" />
                            </div>
                            <div>
                                <p className="text-xs font-extrabold text-slate-700">Solution submitted</p>
                                <p className="text-xs font-bold text-slate-400 mt-0.5">{formatDateTime(submission.submittedAt)}</p>
                            </div>
                        </div>
                        {submission.reviewedAt && (
                            <div className="flex items-start gap-3">
                                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${submission.status === 'ACCEPTED' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                                    {submission.status === 'ACCEPTED'
                                        ? <CheckCircle2 size={13} className="text-emerald-500" />
                                        : <XCircle size={13} className="text-red-500" />}
                                </div>
                                <div>
                                    <p className="text-xs font-extrabold text-slate-700">Review completed — {submission.status}</p>
                                    <p className="text-xs font-bold text-slate-400 mt-0.5">{formatDateTime(submission.reviewedAt)}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
