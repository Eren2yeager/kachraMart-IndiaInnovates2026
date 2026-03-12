import Link from "next/link";
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
import LightRays from "@/components/ui/LightRays";
import { APP_NAME, APP_DESCRIPTION } from "@/config/constants";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Light rays background */}
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <LightRays
          className="w-full h-full"
          raysOrigin="top-center"
          raysColor="#22c55e"
          raysSpeed={0.6}
          lightSpread={1.2}
          rayLength={1.8}
          pulsating
          fadeDistance={1.2}
          saturation={1.1}
          followMouse
          mouseInfluence={0.2}
          noiseAmount={0.05}
          distortion={0.15}
        />
      </div>

      {/* Top and bottom blur to soften edges */}


      <div className="relative z-10 container mx-auto px-4 py-10 md:py-16">
        {/* Hero Section */}
        <div className="grid gap-10 md:grid-cols-2 items-center mb-16">
          <div className="space-y-6">
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs">
              Phase 1–2 live · AI classification ready
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              <span className="block bg-gradient-to-r from-green-600 via-emerald-500 to-blue-600 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
              <span className="mt-2 block text-slate-900">
                {APP_DESCRIPTION}
              </span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-xl">
              Use computer vision and optimized logistics to turn city waste into
              a transparent, trackable resource stream for citizens, collectors,
              recyclers, and administrators.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/auth/signup">Get started for free</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/auth/signin">Sign in to your workspace</Link>
              </Button>
            </div>
            <div className="flex flex-wrap gap-4 pt-4 text-xs md:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                AI waste classification (Phase 2)
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Pickups, marketplace & analytics coming soon
              </div>
            </div>
          </div>

          <div className="relative">
            <Card className="backdrop-blur bg-white/70 shadow-xl border-emerald-100">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <Lightbulb className="h-5 w-5 text-emerald-500" />
                  Smart circular waste flows
                </CardTitle>
                <CardDescription>
                  One platform for citizens, collectors, dealers, and admins.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-xs md:text-sm">
                  <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 space-y-1">
                    <p className="font-semibold text-emerald-700">
                      Citizens
                    </p>
                    <p className="text-emerald-900/80">
                      Classify waste with AI and (soon) request doorstep
                      pickups with reward points.
                    </p>
                  </div>
                  <div className="rounded-lg bg-sky-50 border border-sky-100 p-3 space-y-1">
                    <p className="font-semibold text-sky-700">
                      Collectors
                    </p>
                    <p className="text-sky-900/80">
                      Get optimized pickup routes and live task dashboards.
                    </p>
                  </div>
                  <div className="rounded-lg bg-violet-50 border border-violet-100 p-3 space-y-1">
                    <p className="font-semibold text-violet-700">
                      Dealers
                    </p>
                    <p className="text-violet-900/80">
                      Browse verified inventory and manage purchase orders.
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
                    <p className="font-semibold text-slate-800">
                      Admins
                    </p>
                    <p className="text-slate-700/80">
                      Monitor hubs, waste flow, and sustainability impact.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Current demo flow: sign up → choose role → dashboard →
                  citizen AI classification. Remaining roadmap surfaces are
                  visible in the app as &quot;Coming soon&quot; screens.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature strip */}
        <div className="grid md:grid-cols-4 gap-4 mb-16">
          <Card className="bg-white/70 border-none shadow-sm">
            <CardHeader className="pb-3">
              <Recycle className="h-8 w-8 text-blue-600 mb-1" />
              <CardTitle className="text-base">AI classification</CardTitle>
              <CardDescription>
                Roboflow-powered detection of waste type and items.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/70 border-none shadow-sm">
            <CardHeader className="pb-3">
              <TrendingUp className="h-8 w-8 text-emerald-600 mb-1" />
              <CardTitle className="text-base">Smart logistics</CardTitle>
              <CardDescription>
                Planned pickup assignment and route optimization.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/70 border-none shadow-sm">
            <CardHeader className="pb-3">
              <Users className="h-8 w-8 text-purple-600 mb-1" />
              <CardTitle className="text-base">Circular marketplace</CardTitle>
              <CardDescription>
                Dealers buy verified inventory from hubs (Phase 5).
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="bg-white/70 border-none shadow-sm">
            <CardHeader className="pb-3">
              <Leaf className="h-8 w-8 text-emerald-500 mb-1" />
              <CardTitle className="text-base">Impact analytics</CardTitle>
              <CardDescription>
                City-level dashboards for diversion and CO₂ saved.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl md:text-3xl font-bold">
            Ready to test the AI flow?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
            Create a citizen account, upload a waste image, and see how the
            platform classifies and explains your waste category.
          </p>
          <Button asChild size="lg">
            <Link href="/auth/signup">Create your KachraMart account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
