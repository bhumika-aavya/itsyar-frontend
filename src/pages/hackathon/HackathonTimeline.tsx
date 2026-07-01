import React from 'react';
import { Lightbulb } from 'lucide-react';

interface TimelineEvent {
    label: string;
    date: string;
    isActive?: boolean;
    type?: 'event' | 'phase';
    description?: string;
}

export default function Timeline({ timeline }: { timeline: TimelineEvent[] }) {
    return (
        <div className="text-left py-4 animate-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-2xl font-bold text-[#3215B1] mb-10">Timeline</h2>

            <div className="relative space-y-0 ml-1">
                {timeline?.map((item, idx) => {
                    const isPhase = item.type === 'phase';
                    const isLast = idx === timeline.length - 1;

                    if (isPhase) {
                        return (
                            <div key={idx} className="relative flex items-start gap-6 pb-12 last:pb-0">
                                {/* Dashed connector */}
                                {!isLast && (
                                    <div className="absolute left-[7px] top-6 w-0.5 h-full border-l-2 border-dashed border-slate-200" aria-hidden="true" />
                                )}

                                {/* Phase node */}
                                <div className="relative z-10 mt-1 w-4 h-4 rounded-full bg-[#4F39F6]/20 border-2 border-[#4F39F6] flex items-center justify-center shrink-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-[#4F39F6]" />
                                </div>

                                {/* Phase block */}
                                <div className="flex-1 bg-indigo-50/60 border border-indigo-100 rounded-2xl px-5 py-4 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <Lightbulb size={15} className="text-[#4F39F6]" />
                                        <span className="text-[13px] font-black text-[#4F39F6] uppercase tracking-wide">{item.label}</span>
                                    </div>
                                    <p className="text-[13px] font-bold text-slate-500">{item.date}</p>
                                    {item.description && (
                                        <p className="text-xs font-medium text-slate-400 pt-1 leading-relaxed">{item.description}</p>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={idx} className="relative flex items-start gap-6 pb-12 last:pb-0 group">
                            {/* Dashed connector */}
                            {!isLast && (
                                <div className="absolute left-[7px] top-6 w-0.5 h-full border-l-2 border-dashed border-slate-200" aria-hidden="true" />
                            )}

                            {/* Node */}
                            <div className="relative z-10 mt-1">
                                {item.isActive ? (
                                    <div className="w-4 h-4 rounded-full bg-[#4F39F6] ring-4 ring-indigo-50 border-2 border-white shadow-sm" />
                                ) : (
                                    <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />
                                )}
                            </div>

                            {/* Text */}
                            <div className="flex flex-col">
                                <span className={`text-[15px] font-bold leading-none ${item.isActive ? "text-slate-900" : "text-slate-800"}`}>
                                    {item.label}
                                </span>
                                <span className="text-[14px] font-bold text-slate-400 mt-2">{item.date}</span>
                                {item.description && (
                                    <span className="text-xs font-medium text-slate-400 mt-1">{item.description}</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
