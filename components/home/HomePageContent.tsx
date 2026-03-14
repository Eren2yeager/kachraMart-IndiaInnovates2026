"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Recycle, Leaf, TrendingUp, Users } from "lucide-react";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";
import { UserAvatar } from "@/components/shared/UserAvatar";
import PixelBlast from "@/components/ui/PixelBlast";

export default function HomePageContent() {
  const { data: session } = useSession();
  const bgRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 md:px-10 md:pt-10">
      
      {/* PixelBlast Background */}
      <div
        ref={bgRef}
        className="fixed inset-0 z-1 opacity-30 dark:opacity-40"
        style={{ pointerEvents: 'auto'}}
      >
        <PixelBlast
          variant="square"
          pixelSize={5}
          color="#07752c"
          patternScale={2}
          patternDensity={1}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.5}
          rippleThickness={0.15}
          rippleIntensityScale={2}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.25}
          transparent
        />
      </div>

      {/* Content Layer */}
      <div className="relative container mx-auto px-4 py-10 md:py-16" style={{  pointerEvents: 'auto' }}>

        {/* Hero Section */}
        <div className="grid gap-10 md:grid-cols-2  items-center mb-16">
          <div className="space-y-6">
            <Badge
              variant={"secondary"}
              className="bg-emerald-100 relative z-2 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 text-sm"
            >
              Phase 1–2 live · AI classification ready
            </Badge>

            <h1 className="relative z-2 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-blue-600 dark:from-green-400 dark:via-emerald-400 dark:to-blue-400 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
              <span className="mt-2 block text-slate-900 dark:text-slate-100">
                {APP_DESCRIPTION}
              </span>
            </h1>

            <p className="text-base relative z-2 md:text-lg dark:text-white/60 text-black/60 max-w-xl">
              Use computer vision and optimized logistics to turn city waste
              into a transparent, trackable resource stream for citizens,
              collectors, recyclers, and administrators.
            </p>

            <div className="flex relative z-2 flex-wrap gap-3 pt-2">
              {session ? (
                <>
                  <Button asChild size="lg">
                    <Link
                      href="/dashboard"
                      className="flex justify-start items-center gap-2"
                    >
                      <UserAvatar
                        name={session.user?.name}
                        image={session.user?.image}
                        size="sm"
                      />
                      <div>Go to Dashboard</div>
                    </Link>
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  >
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg">
                    <Link href="/auth/signup">Get started for free</Link>
                  </Button>

                  <Button asChild size="lg" variant="outline">
                    <Link href="/auth/signin">Sign in</Link>
                  </Button>
                </>
              )}
            </div>

            <div className="flex relative z-2  flex-wrap gap-4 pt-4 text-xs md:text-sm dark:text-white/60 text-black/60">
              <div className="flex items-center gap-2">
                <span className=" h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                AI waste classification (Phase 2)
              </div>

              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                Pickups, marketplace & analytics coming soon
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="relative z-2">
            <Card className="backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 shadow-xl border-emerald-100 dark:border-emerald-900">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Lightbulb className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
                  Smart circular waste flows
                </CardTitle>

                <CardDescription>
                  One platform for citizens, collectors, dealers, and admins.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">

                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 p-3 space-y-1">
                    <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                      Citizens
                    </p>
                    <p className="text-emerald-900/80 dark:text-emerald-200/80">
                      Classify waste with AI and request doorstep pickups with rewards.
                    </p>
                  </div>

                  <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-800 p-3 space-y-1">
                    <p className="font-semibold text-sky-700 dark:text-sky-300">
                      Collectors
                    </p>
                    <p className="text-sky-900/80 dark:text-sky-200/80">
                      Get optimized pickup routes and live task dashboards.
                    </p>
                  </div>

                  <div className="rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800 p-3 space-y-1">
                    <p className="font-semibold text-violet-700 dark:text-violet-300">
                      Dealers
                    </p>
                    <p className="text-violet-900/80 dark:text-violet-200/80">
                      Browse verified inventory and manage purchase orders.
                    </p>
                  </div>

                  <div className="rounded-lg bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 p-3 space-y-1">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      Admins
                    </p>
                    <p className="text-slate-700/80 dark:text-slate-300/80">
                      Monitor hubs, waste flow, and sustainability impact.
                    </p>
                  </div>

                </div>

                <p className="text-xs text-muted-foreground">
                  Current demo flow: sign up → choose role → dashboard → citizen
                  AI classification.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature Section */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          <Card className=" relative z-2 bg-white/70 dark:bg-slate-900/70 border-emerald-100 dark:border-emerald-900 shadow-sm backdrop-blur-xs">
            <CardHeader>
              <Recycle className="h-8 w-8 text-blue-600 dark:text-blue-400 mb-1" />
              <CardTitle className="text-base">AI classification</CardTitle>
              <CardDescription>
                Roboflow-powered waste detection.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative z-2 bg-white/70 dark:bg-slate-900/70 border-emerald-100 dark:border-emerald-900 shadow-sm backdrop-blur-xs">
            <CardHeader>
              <TrendingUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-1" />
              <CardTitle className="text-base">Smart logistics</CardTitle>
              <CardDescription>
                Pickup assignment and route optimization.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative z-2 bg-white/70 dark:bg-slate-900/70 border-emerald-100 dark:border-emerald-900 shadow-sm backdrop-blur-xs">
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 dark:text-purple-400 mb-1" />
              <CardTitle className="text-base">Circular marketplace</CardTitle>
              <CardDescription>
                Dealers buy verified inventory from hubs.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="relative z-2 bg-white/70 dark:bg-slate-900/70 border-emerald-100 dark:border-emerald-900 shadow-sm backdrop-blur-xs">
            <CardHeader>
              <Leaf className="h-8 w-8 text-emerald-500 dark:text-emerald-400 mb-1" />
              <CardTitle className="text-base">Impact analytics</CardTitle>
              <CardDescription>
                Track CO₂ reduction and waste diversion.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4 ">
          <h2 className="text-2xl md:text-3xl font-bold relative z-2">
            {session
              ? "Welcome back to KachraMart!"
              : "Ready to test the AI flow?"}
          </h2>

          <p className=" relative z-2 text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            {session
              ? "Continue managing your sustainability impact."
              : "Upload a waste image and see AI classify it instantly."}
          </p>

          <Button asChild size="lg" className="relative z-2">
            <Link href={session ? "/dashboard" : "/auth/signup"}>
              {session ? "Go to Dashboard" : "Create your account"}
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}