import Logo from "./Logo";
import LoginForm from "./LoginForm";
import React from "react";

export default function Login() {
  return (
    <div className="min-h-screen w-full bg-[#F0F2F5] dark:bg-[#111217] flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="w-full max-w-[500px]">
        <LoginForm />
      </div>
    </div>
  );
}