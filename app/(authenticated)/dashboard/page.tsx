'use client';

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOut } from "next-auth/react";
import {
  LogOut,
  User,
  Mail,
  Shield,
  Sparkles,
  Leaf,
  Recycle,
  Truck,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { animations } from "@/lib/theme";
import { USER_ROLES } from "@/config/constants";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const roleConfig = USER_ROLES[user.role];

  return (
    <div className="space-y-8">
      <motion.div {...animations.fadeIn} className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user.name}!
            </h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re signed in as a {roleConfig.label}. Phase 1–2 features
              are live; the rest of the circular flow is visible as{" "}
              <span className="font-medium">Coming soon</span> screens.
            </p>
          </div>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: '/' })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-sm text-muted-foreground">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
              </div>
            </div>

            {user.verified && (
              <div className="flex items-center gap-2 text-green-600">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">Verified Account</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role-specific metrics & actions */}
        <motion.div
          {...animations.slideUp}
          transition={{ duration: 0.3 }}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {user.role === "citizen" && (
            <>
              <Card className="bg-emerald-50/60 border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    AI classifications
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Try the computer-vision flow now.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-emerald-900/80">
                    Upload an image and get a breakdown of detected items and
                    waste category.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/citizen/classify">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Classify waste with AI
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-sky-50/60 border-sky-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sky-600" />
                    Pickup requests
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 3
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-sky-900/80">
                  <p>
                    Create pickup requests from AI results and track status
                    end-to-end.
                  </p>
                  <p className="font-medium text-sky-700">
                    Visible now as a &quot;Coming soon&quot; page in the app
                    shell.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-amber-50/60 border-amber-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-amber-600" />
                    Rewards & impact
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 3–4
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-amber-900/80">
                  <p>
                    You&apos;ll soon see reward points and CO₂ savings driven by
                    your pickups.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === "collector" && (
            <>
              <Card className="bg-sky-50/60 border-sky-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sky-600" />
                    Assigned pickups
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 3
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-sky-900/80">
                  <p>
                    A dedicated dashboard for your upcoming, in-progress, and
                    completed tasks.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50/60 border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600" />
                    Route optimization
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 3–4
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-emerald-900/80">
                  <p>
                    Map-backed routes that minimize distance and maximize
                    recovery.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === "dealer" && (
            <>
              <Card className="bg-violet-50/60 border-violet-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-violet-600" />
                    Marketplace
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 5
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-violet-900/80">
                  <p>
                    Browse, filter, and buy verified waste inventory from city
                    hubs.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-50/60 border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-700" />
                    Order management
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 5
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-800/80">
                  <p>
                    See active, completed, and historical orders with pricing
                    and invoices.
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {user.role === "admin" && (
            <>
              <Card className="bg-slate-50/60 border-slate-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-800" />
                    Waste flow analytics
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 6
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-800/80">
                  <p>
                    Track how much waste is collected, stored, and sold across
                    types and hubs.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-emerald-50/60 border-emerald-100">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    Hubs & inventory
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Roadmap: Phase 4
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-emerald-900/80">
                  <p>
                    See hub capacities, current load, and how inventory links to
                    dealer orders.
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
