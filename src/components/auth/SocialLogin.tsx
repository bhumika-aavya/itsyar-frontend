import {
  Linkedin,
  Github,
} from "lucide-react";
import React from "react";

export default function SocialLogin() {
  const googleLogin = () => {
    window.location.href =
      "http://localhost:8000/auth/google";
  };

  const linkedinLogin = () => {
    window.location.href =
      "http://localhost:8000/auth/linkedin";
  };

  return (
    <div className="space-y-4">

      <div className="text-center text-sm text-gray-500">
        or continue with
      </div>

      <div className="grid grid-cols-2 gap-3">

        <button
          type="button"
          onClick={googleLogin}
          className="border rounded-lg p-3"
        >
          Google
        </button>

        <button
          type="button"
          onClick={linkedinLogin}
          className="border rounded-lg p-3"
        >
          <Linkedin className="mx-auto" />
        </button>

      </div>
    </div>
  );
}