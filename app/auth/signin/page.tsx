import Link from "next/link";
import { SignInForm } from "@/components/auth/SignInForm";
import LightRays from "@/components/ui/LightRays";
import { APP_NAME } from "@/config/constants";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-4">
      <div className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-40">
        <LightRays
          className="w-full h-full"
          raysOrigin="top-center"
          raysColor="#22c55e"
          raysSpeed={0.5}
          lightSpread={1.1}
          rayLength={1.6}
          fadeDistance={1.2}
          saturation={1.05}
          followMouse={false}
          mouseInfluence={0}
          noiseAmount={0.03}
          distortion={0.08}
        />
      </div>


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
