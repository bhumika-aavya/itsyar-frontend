import React from 'react';

interface TimelineEvent {
    label: string;
    date: string;
    isActive?: boolean;
}

export default function Timeline({ timeline }: { timeline: TimelineEvent[] }) {
    return (
        <div className="text-left py-4">
            {/* Heading */}
            <h2 className="text-2xl font-bold text-[#3215B1] mb-10">Timeline</h2>

            <div className="relative space-y-0 ml-1">
                {timeline?.map((item, idx) => (
                    <div key={idx} className="relative flex items-start gap-6 pb-12 last:pb-0 group">

                        {/* 1. Vertical Dashed Line */}
                        {idx !== timeline.length - 1 && (
                            <div
                                className="absolute left-[7px] top-6 w-0.5 h-full border-l-2 border-dashed border-slate-200"
                                aria-hidden="true"
                            />
                        )}
                        {/* 2. The Circle (Node) */}
                        <div className="relative z-10 mt-1">
                            {item.isActive ? (
                                // Active State (Solid Circle)
                                <div className="w-4 h-4 rounded-full bg-[#4F39F6] ring-4 ring-indigo-50 border-2 border-white shadow-sm" />
                            ) : (
                                // Standard State (Hollow Circle)
                                <div className="w-4 h-4 rounded-full border-2 border-slate-300 bg-white" />
                            )}
                        </div>

                        {/* 3. Text Content */}
                        <div className="flex flex-col">
                            <span className={`text-[15px] font-bold leading-none ${item.isActive ? "text-slate-900" : "text-slate-800"
                                }`}>
                                {item.label}
                            </span>
                            <span className="text-[14px] font-bold text-slate-400 mt-2">
                                {item.date}
                            </span>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}