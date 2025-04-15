"use client";
import dynamic from "next/dynamic";

const SignIn = dynamic(() => import("../auth/auth-stacks"), {
  ssr: false,
});

export default function AuthButton({ redirectUrl }: { redirectUrl?: string }) {
  return (
    <div>
      {/* Sign In Section */}
      <div className="space-y-6">
        <SignIn redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
