import { Zap } from "lucide-react";
import React from "react";

export default function Logo() {
  return (
    <div className="flex flex-col items-center">
      <div className="flex h-[88px] w-[88px] items-center justify-center rounded-[28px] bg-[#4F46E5] shadow-xl shadow-indigo-200">
        <Zap
          className="h-11 w-11 text-white fill-white"
          strokeWidth={2.5}
        />
      </div>

      <h4 className="mt-5 text-2xl font-extrabold tracking-tight text-[#1A1C1E]">
        ForgeInsight
      </h4>
    </div>
  );
}