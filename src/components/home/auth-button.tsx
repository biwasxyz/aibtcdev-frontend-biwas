"use client";

import React from "react";
import dynamic from "next/dynamic";

const SignIn = dynamic(() => import("../auth/auth-stacks"), {
  ssr: false,
});

export default function AuthButton() {
  return (
    <div>
      {/* Sign In Section */}
      <div className="space-y-6">
        <SignIn />
      </div>
    </div>
  );
}
