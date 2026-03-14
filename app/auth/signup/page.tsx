import { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { APP_NAME } from "@/config/constants";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata(
  "Sign Up",
  "Create your KachraMart account as a citizen, collector, dealer, or admin. Join the circular waste management revolution.",
  "/auth/signup"
);

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent p-4">



      <div className="relative z-10 w-full max-w-md space-y-4">
        <div className="text-center mb-2">
          <p className="text-xs uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold">
            {APP_NAME}
          </p>
          <p className="text-xs text-muted-foreground">
            Create your role-based workspace in the circular waste network.
          </p>
        </div>
        <SignUpForm />
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="text-primary hover:underline font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
