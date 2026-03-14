import { Metadata } from "next";
import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";
import LightRays from "@/components/ui/LightRays";
import { APP_NAME } from "@/config/constants";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata(
  "Sign In",
  "Sign in to your KachraMart account to manage waste classification, pickups, and sustainability impact.",
  "/auth/signin"
);

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent">


      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center mb-2">
          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">
            {APP_NAME}
          </p>
          <p className="text-xs text-muted-foreground">
            Sign in to continue your waste intelligence journey.
          </p>
        </div>
        <SignInForm />
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-primary hover:underline font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
