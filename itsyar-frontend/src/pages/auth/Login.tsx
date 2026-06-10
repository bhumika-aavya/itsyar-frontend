import Logo from "./Logo";
import LoginForm from "./LoginForm";
import React from "react";

export default function Login() {
  return (
    <div className="min-h-screen w-full bg-[#F0F2F5] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[500px]">
        <LoginForm />
      </div>
    </div>
  );
}