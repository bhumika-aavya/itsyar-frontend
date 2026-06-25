import RegisterForm from "@/components/auth/RegisterForm";
import SocialLogin from "@/components/auth/SocialLogin";
import React from "react";

export default function RegisterPage() {

  return (
    <div className="min-h-screen bg-white">

      <div className="max-w-lg mx-auto py-10">

        <div className="mb-8">

          <h1 className="text-3xl font-bold">
            Create your account
          </h1>

          <p className="text-gray-500">
            Join ForgeInsight to learn,
            build and compete.
          </p>

        </div>

        <div className="border rounded-2xl p-8">

          <h2 className="font-semibold text-xl mb-2">
            Start Learning
          </h2>

          <p className="text-sm text-gray-500 mb-6">
            Register to access courses.
          </p>

          <RegisterForm />

          <div className="mt-6">
            <SocialLogin />
          </div>

        </div>

      </div>

    </div>
  );
}