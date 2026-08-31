import RegisterForm from "./RegisterForm";
import React from "react";

export default function Register() {
  return (
    <div className="min-h-screen w-full bg-[#F0F2F5] dark:bg-[#111217] flex flex-col items-center justify-center p-6 transition-colors duration-300">
      <div className="w-full max-w-[540px]">
        <RegisterForm />
      </div>
    </div>
  );
}