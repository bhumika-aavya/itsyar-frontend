import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plus, Edit2, Eye, Trash2, Loader2, Calendar, Users,
    Globe, ChevronRight, Trophy, Clock, CheckCircle2, Zap,
    DollarSign, Send
} from 'lucide-react';
import { OrganizerService, OrganizerHackathon } from '@/services/organizer.service';
import { PaymentService } from '@/services/payment.service';
import SubscriptionStatus from '@/components/payments/SubscriptionStatus';
import { PaymentStatus } from '@/types/payment.types';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    Open: { label: 'Open', color: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-400' },
    Running: { label: 'Running', color: 'bg-blue-50 text-blue-600', dot: 'bg-blue-400' },
    UpComing: { label: 'Upcoming', color: 'bg-amber-50 text-amber-600', dot: 'bg-amber-400' },
    COMPLETED: { label: 'Completed', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
    Draft: { label: 'Draft', color: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
    'Approved': { label: 'Payment Required', color: 'bg-red-50 text-red-600', dot: 'bg-red-400' },
    Paid: { label: 'Paid', color: 'bg-indigo-50 text-[#4F46E5]', dot: 'bg-indigo-400' },
};

const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/** Extended hackathon type with payment info for the dashboard display. */
interface HackathonWithPayment extends OrganizerHackathon {
    paymentStatus?: PaymentStatus;
    isPublished?: boolean;
    publishLoading?: boolean;
    purchaseLoading?: boolean;
}

export default function OrganizerDashboard() {
    const navigate = useNavigate();
    const [hackathons, setHackathons] = useState<HackathonWithPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [publishingId, setPublishingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        const data = await OrganizerService.getMyHackathons();

        // Enrich with payment info from the PaymentService
        const enriched: HackathonWithPayment[] = data.map((h) => {
            const isPaid = PaymentService.isHackathonPaid(h.id) || h.status === 'Paid' || h.status === 'Open' || h.status === 'Running' || h.status === 'UpComing' || h.status === 'COMPLETED';
            return {
                ...h,
                paymentStatus: isPaid ? 'completed' : undefined,
                isPublished: h.status === 'Open' || h.status === 'Running' || h.status === 'UpComing' || h.status === 'COMPLETED',
            };
        });

        setHackathons(enriched);
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
        setDeletingId(id);
        await OrganizerService.deleteHackathon(id);
        setHackathons(prev => prev.filter(h => h.id !== id));
        setDeletingId(null);
    };

    const handlePurchase = (hackathonId: string) => {
        navigate(`/payments/hackathon/${hackathonId}`);
    };

    const handlePublish = async (hackathonId: string) => {
        setPublishingId(hackathonId);
        try {
            const success = await PaymentService.publishHackathon(hackathonId);
            if (success) {
                setHackathons(prev =>
                    prev.map(h =>
                        h.id === hackathonId
                            ? { ...h, isPublished: true, paymentStatus: 'completed', status: 'Open' }
                            : h
                    )
                );
                toast.success("Hackathon published successfully!");
            }
        } catch (err) {
            console.error('Failed to publish hackathon', err);
        } finally {
            setPublishingId(null);
        }
    };

    const counts = {
        total: hackathons.length,
        active: hackathons.filter(h => h.status === 'Running' || h.status === 'Open').length,
        upcoming: hackathons.filter(h => h.status === 'UpComing').length,
        completed: hackathons.filter(h => h.status === 'COMPLETED').length,
    };

    const stats = [
        { label: 'Total', value: counts.total, Icon: Trophy, bg: 'bg-indigo-50', color: 'text-[#4F46E5]' },
        { label: 'Active', value: counts.active, Icon: Zap, bg: 'bg-emerald-50', color: 'text-emerald-600' },
        { label: 'Upcoming', value: counts.upcoming, Icon: Clock, bg: 'bg-amber-50', color: 'text-amber-600' },
        { label: 'Completed', value: counts.completed, Icon: CheckCircle2, bg: 'bg-slate-50', color: 'text-slate-500' },
    ];

    return (
        <div className="max-w-6xl mx-auto p-6 md:px-10 md:py-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-start justify-between gap-6 flex-wrap">
                <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest text-[#4F46E5] mb-1">Organizer Portal</p>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Manage Hackathons</h1>
                    <p className="text-slate-500 font-medium mt-1">Create, edit, and oversee all your hackathon events.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate('/organizer/hackathons/create')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm shadow-xl shadow-indigo-100 hover:bg-[#4338CA] transition-all active:scale-95"
                    >
                        <Plus size={16} /> Create Hackathon
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map(({ label, value, Icon, bg, color }) => (
                    <div key={label} className="bg-white border border-slate-100 rounded-2xl p-5">
                        <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                            <Icon size={18} className={color} />
                        </div>
                        <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                        <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
                    </div>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-[#4F46E5]" size={32} />
                </div>
            ) : hackathons.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-slate-100 rounded-3xl">
                    <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                        <Trophy size={28} className="text-[#4F46E5]" />
                    </div>
                    <p className="font-extrabold text-slate-700 text-lg">No hackathons yet</p>
                    <p className="text-sm text-slate-400 font-medium mt-1 mb-6">Create your first hackathon to get started.</p>
                    <button
                        onClick={() => navigate('/organizer/hackathons/create')}
                        className="flex items-center gap-2 px-6 py-3 bg-[#4F46E5] text-white rounded-2xl font-extrabold text-sm hover:bg-[#4338CA] transition-all"
                    >
                        <Plus size={15} /> Create Hackathon
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {hackathons.map(h => {
                        const cfg = STATUS_CONFIG[h.status] ?? STATUS_CONFIG['Open'];
                        const isDeleting = deletingId === h.id;
                        const isPublishing = publishingId === h.id;
                        const canPublish = (h.status === 'Paid' || h.paymentStatus === 'completed') && !h.isPublished;
                        const needsPayment = h.status === 'Approved';
                        return (
                            <div
                                key={h.id}
                                className="bg-white border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-5 hover:border-slate-200 transition-all"
                            >
                                {/* Icon */}
                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                                    <Trophy size={22} className="text-[#4F46E5]" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-extrabold text-slate-900 text-lg truncate">{h.title}</h3>
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold shrink-0 ${cfg.color}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                                            {cfg.label}
                                        </span>
                                        {/* Payment status badge */}
                                        {/* <SubscriptionStatus
                                            paymentStatus={h.paymentStatus}
                                            isPublished={h.isPublished}
                                            isDraft={h.status === 'Draft' || h.status === 'Draft'}
                                        /> */}
                                    </div>
                                    <p className="text-sm font-medium text-slate-500 line-clamp-1 mb-3">{h.description}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar size={13} /> {formatDate(h.startDate)} – {formatDate(h.endDate)}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Users size={13} /> {h.participantCount} participants
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <Globe size={13} /> {h.mode}
                                        </span>
                                        {h.pricing && h.pricing !== '0' && (
                                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-extrabold">
                                                Price: ${h.pricing}
                                            </span>
                                        )}
                                        <span className={`px-2 py-0.5 rounded-md font-extrabold ${h.problemCount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                            {h.problemCount > 0 ? `${h.problemCount} Problem` : 'No Problem Set'}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => navigate(`/hackathons/${h.id}`)}
                                        className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
                                    >
                                        <Eye size={13} /> View
                                    </button>

                                    {(h.status === 'Draft' || h.status === 'Draft') && (
                                        <button
                                            onClick={() => navigate(`/organizer/hackathons/${h.id}/edit`)}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-xs text-[#4F46E5] hover:bg-indigo-100 transition-all"
                                        >
                                            <Edit2 size={13} /> Edit
                                        </button>
                                    )}

                                    {/* Purchase Subscription — shown when hackathon is approved and needs payment */}
                                    {needsPayment && (
                                        <button
                                            onClick={() => handlePurchase(h.id)}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-50 border border-amber-100 rounded-xl font-bold text-xs text-amber-700 hover:bg-amber-100 transition-all shadow-sm"
                                        >
                                            <DollarSign size={13} />
                                            Pay & Publish
                                        </button>
                                    )}

                                    {/* Publish — shown only when payment is completed but not yet published */}
                                    {canPublish && (
                                        <button
                                            onClick={() => handlePublish(h.id)}
                                            disabled={isPublishing}
                                            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl font-bold text-xs text-emerald-700 hover:bg-emerald-100 transition-all disabled:opacity-50"
                                        >
                                            {isPublishing ? (
                                                <Loader2 size={13} className="animate-spin" />
                                            ) : (
                                                <Send size={13} />
                                            )}
                                            Publish Live
                                        </button>
                                    )}

                                    <button
                                        onClick={() => handleDelete(h.id, h.title)}
                                        disabled={isDeleting}
                                        className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl font-bold text-xs text-red-500 hover:bg-red-100 transition-all disabled:opacity-50"
                                    >
                                        {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                        Delete
                                    </button>
                                    <ChevronRight size={16} className="text-slate-300 ml-1" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
