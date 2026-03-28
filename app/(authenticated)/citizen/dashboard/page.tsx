"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Leaf, Truck, TrendingUp, Package, Award } from "lucide-react";
import { motion } from "framer-motion";
import { animations } from "@/lib/theme";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalPickups: number;
  pendingPickups: number;
  completedPickups: number;
  totalRewards: number;
}

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPickups: 0,
    pendingPickups: 0,
    completedPickups: 0,
    totalRewards: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch citizen stats
    fetch("/api/citizen/analytics")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStats({
            totalPickups: data.totalPickups || 0,
            pendingPickups: data.pendingPickups || 0,
            completedPickups: data.completedPickups || 0,
            totalRewards: data.totalRewards || 0,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <motion.div {...animations.fadeIn}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <UserAvatar
            name={user.name || "User"}
            image={user.image || undefined}
            role={user.role}
            size="lg"
          />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {user.name}!
            </h1>
            <p className="text-sm text-muted-foreground">
              Citizen Dashboard
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div {...animations.slideUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Pickups</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPickups}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Truck className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPickups}</div>
              <p className="text-xs text-muted-foreground">Awaiting collection</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedPickups}</div>
              <p className="text-xs text-muted-foreground">Successfully collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reward Points</CardTitle>
              <Award className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRewards}</div>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...animations.slideUp} transition={{ delay: 0.1 }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                AI Waste Classification
              </CardTitle>
              <CardDescription>Upload images to identify waste types</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                Use our AI-powered system to classify your waste and get instant recommendations.
              </p>
              <Button asChild className="w-full">
                <Link href="/citizen/classify">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Classify Waste
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-sky-50/60 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Pickup Requests
              </CardTitle>
              <CardDescription>Schedule and track collections</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-sky-900/80 dark:text-sky-200/80">
                Create pickup requests and track their status in real-time.
              </p>
              <Button asChild  className="w-full">
                <Link href="/citizen/pickups">
                  <Truck className="mr-2 h-4 w-4" />
                  View Pickups
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Leaf className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                Rewards & Impact
              </CardTitle>
              <CardDescription>Track your environmental contribution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-amber-900/80 dark:text-amber-200/80">
                View your reward points and environmental impact metrics.
              </p>
              <Button asChild  className="w-full">
                <Link href="/citizen/rewards">
                  <Award className="mr-2 h-4 w-4" />
                  View Rewards
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div {...animations.slideUp} transition={{ delay: 0.2 }} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest waste management activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                No recent activity. Start by classifying waste or creating a pickup request.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
