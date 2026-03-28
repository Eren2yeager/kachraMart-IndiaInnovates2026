"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Truck, MapPin, CheckCircle, Clock, Navigation, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { animations } from "@/lib/theme";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useEffect, useState } from "react";

interface CollectorStats {
  assignedPickups: number;
  completedToday: number;
  totalCompleted: number;
  pendingPickups: number;
}

export default function CollectorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<CollectorStats>({
    assignedPickups: 0,
    completedToday: 0,
    totalCompleted: 0,
    pendingPickups: 0,
  });
  const [locationSet, setLocationSet] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if location is set
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const coords = data?.location?.coordinates;
        const isDefault = !coords || (coords[0] === 0 && coords[1] === 0);
        setLocationSet(!isDefault);
      })
      .catch(() => {});

    // Fetch collector stats
    fetch("/api/collector/analytics")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setStats({
            assignedPickups: data.assignedPickups || 0,
            completedToday: data.completedToday || 0,
            totalCompleted: data.totalCompleted || 0,
            pendingPickups: data.pendingPickups || 0,
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
        {/* Location Warning */}
        <AnimatePresence>
          {!locationSet && (
            <motion.div {...animations.slideUp}>
              <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <span className="text-amber-800 dark:text-amber-200 text-sm">
                    Your location is not set. Update your profile to receive pickup assignments.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 shrink-0"
                    asChild
                  >
                    <Link href="/me/profile">
                      <MapPin className="mr-2 h-3.5 w-3.5" />
                      Set Location
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

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
              Collector Dashboard
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div {...animations.slideUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned Pickups</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.assignedPickups}</div>
              <p className="text-xs text-muted-foreground">Active assignments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingPickups}</div>
              <p className="text-xs text-muted-foreground">Awaiting pickup</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedToday}</div>
              <p className="text-xs text-muted-foreground">Today's collections</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCompleted}</div>
              <p className="text-xs text-muted-foreground">All time</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...animations.slideUp} transition={{ delay: 0.1 }} className="grid gap-4 md:grid-cols-2 mt-6">
          <Card className="bg-sky-50/60 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Truck className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Assigned Pickups
              </CardTitle>
              <CardDescription>View and manage your pickup tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-sky-900/80 dark:text-sky-200/80">
                Access your assigned pickups with details, locations, and status updates.
              </p>
              <Button asChild className="w-full">
                <Link href="/collector/pickups">
                  <Truck className="mr-2 h-4 w-4" />
                  View Pickups
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Navigation className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Optimized Routes
              </CardTitle>
              <CardDescription>Navigate efficiently to pickup locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                View map-based routes optimized for minimal distance and maximum efficiency.
              </p>
              <Button asChild  className="w-full">
                <Link href="/collector/routes">
                  <Navigation className="mr-2 h-4 w-4" />
                  View Routes
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div {...animations.slideUp} transition={{ delay: 0.2 }} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>Your pickup assignments for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground text-center py-8">
                No pickups scheduled for today. Check back later for new assignments.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
