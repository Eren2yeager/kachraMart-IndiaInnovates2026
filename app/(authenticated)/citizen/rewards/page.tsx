"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Award, Leaf, TrendingUp, Recycle, Package, Trophy,
  AlertCircle, RefreshCw, Sparkles, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { animations } from "@/lib/theme";
import { WASTE_TYPES, REWARD_POINTS } from "@/config/constants";
import { formatWeight } from "@/lib/utils";
import { WasteType } from "@/types";

interface RewardStats {
  totalPoints: number;
  totalWasteCollected: number;
  co2Saved: number;
  landfillDiverted: number;
  completedPickups: number;
  wasteByType: Record<WasteType, number>;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  loading,
}: {
  icon: React.ComponentType<any>;
  label: string;
  value: string | number;
  unit?: string;
  color: string;
  loading: boolean;
}) {
  return (
    <Card className="border-l-4" style={{ borderLeftColor: color }}>
      <CardContent className="pt-4 pb-3 flex items-center gap-3">
        <div className="rounded-full p-2.5" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex-1">
          {loading ? (
            <Skeleton className="h-6 w-16 mb-1" />
          ) : (
            <p className="text-xl font-bold">
              {value}
              {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={achievement.unlocked ? "border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/30" : "opacity-60"}>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`text-3xl ${achievement.unlocked ? "grayscale-0" : "grayscale"}`}>
            {achievement.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-sm">{achievement.title}</h4>
              {achievement.unlocked && (
                <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 border-amber-300 dark:border-amber-700">
                  Unlocked
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{achievement.description}</p>
            {!achievement.unlocked && achievement.progress !== undefined && achievement.target && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{achievement.progress} / {achievement.target}</span>
                  <span>{Math.round((achievement.progress / achievement.target) * 100)}%</span>
                </div>
                <Progress value={(achievement.progress / achievement.target) * 100} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CitizenRewardsContent() {
  const [stats, setStats] = useState<RewardStats>({
    totalPoints: 0,
    totalWasteCollected: 0,
    co2Saved: 0,
    landfillDiverted: 0,
    completedPickups: 0,
    wasteByType: {} as Record<WasteType, number>,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRewards = async () => {
    setError(null);
    setLoading(true);

    try {
      // Fetch user's pickups to calculate rewards
      const res = await fetch("/api/listings?status=picked_up,stored_in_hub,sold_to_dealer");
      if (!res.ok) throw new Error("Failed to fetch rewards data");

      const data = await res.json();
      const pickups = data.listings || [];

      // Calculate stats
      let totalPoints = 0;
      let totalWaste = 0;
      const wasteByType: Record<string, number> = {};

      pickups.forEach((pickup: any) => {
        const wasteType = pickup.wasteType as WasteType;
        const quantity = pickup.quantity || 0;

        // Calculate points
        const pointsPerKg = REWARD_POINTS[wasteType] || 5;
        totalPoints += quantity * pointsPerKg;

        // Track waste
        totalWaste += quantity;
        wasteByType[wasteType] = (wasteByType[wasteType] || 0) + quantity;
      });

      // Calculate environmental impact
      // Rough estimates: 1kg waste = 0.5kg CO2 saved, 90% diverted from landfill
      const co2Saved = totalWaste * 0.5;
      const landfillDiverted = totalWaste * 0.9;

      setStats({
        totalPoints,
        totalWasteCollected: totalWaste,
        co2Saved,
        landfillDiverted,
        completedPickups: pickups.length,
        wasteByType: wasteByType as Record<WasteType, number>,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  // Calculate achievements
  const achievements: Achievement[] = [
    {
      id: "first-pickup",
      title: "First Steps",
      description: "Complete your first waste pickup",
      icon: "🌱",
      unlocked: stats.completedPickups >= 1,
      progress: Math.min(stats.completedPickups, 1),
      target: 1,
    },
    {
      id: "eco-warrior",
      title: "Eco Warrior",
      description: "Collect 50kg of waste",
      icon: "♻️",
      unlocked: stats.totalWasteCollected >= 50,
      progress: Math.min(stats.totalWasteCollected, 50),
      target: 50,
    },
    {
      id: "point-collector",
      title: "Point Collector",
      description: "Earn 500 reward points",
      icon: "⭐",
      unlocked: stats.totalPoints >= 500,
      progress: Math.min(stats.totalPoints, 500),
      target: 500,
    },
    {
      id: "consistent",
      title: "Consistency Champion",
      description: "Complete 10 pickups",
      icon: "🏆",
      unlocked: stats.completedPickups >= 10,
      progress: Math.min(stats.completedPickups, 10),
      target: 10,
    },
    {
      id: "climate-hero",
      title: "Climate Hero",
      description: "Save 25kg of CO₂ emissions",
      icon: "🌍",
      unlocked: stats.co2Saved >= 25,
      progress: Math.min(stats.co2Saved, 25),
      target: 25,
    },
    {
      id: "waste-master",
      title: "Waste Master",
      description: "Collect 100kg of waste",
      icon: "💪",
      unlocked: stats.totalWasteCollected >= 100,
      progress: Math.min(stats.totalWasteCollected, 100),
      target: 100,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...animations.fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Award className="h-7 w-7 text-amber-500" />
            Rewards & Impact
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your environmental contribution and earn rewards
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchRewards} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {/* Error */}
      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <motion.div {...animations.slideUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={Award}
          label="Reward Points"
          value={loading ? "—" : stats.totalPoints.toLocaleString()}
          color="#f59e0b"
          loading={loading}
        />
        <StatCard
          icon={Package}
          label="Waste Collected"
          value={loading ? "—" : formatWeight(stats.totalWasteCollected)}
          color="#3b82f6"
          loading={loading}
        />
        <StatCard
          icon={Leaf}
          label="CO₂ Saved"
          value={loading ? "—" : stats.co2Saved.toFixed(1)}
          unit="kg"
          color="#22c55e"
          loading={loading}
        />
        <StatCard
          icon={Recycle}
          label="Landfill Diverted"
          value={loading ? "—" : formatWeight(stats.landfillDiverted)}
          color="#8b5cf6"
          loading={loading}
        />
      </motion.div>

      {/* Impact Summary */}
      <motion.div {...animations.slideUp} transition={{ delay: 0.1 }}>
        <Card className="bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-950/30 dark:via-emerald-950/30 dark:to-teal-950/30 border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              Your Environmental Impact
            </CardTitle>
            <CardDescription>Making a difference, one pickup at a time</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.completedPickups}
                </p>
                <p className="text-xs text-muted-foreground">Completed Pickups</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.landfillDiverted > 0 ? ((stats.landfillDiverted / stats.totalWasteCollected) * 100).toFixed(0) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Diversion Rate</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/50 dark:bg-slate-900/50">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Object.keys(stats.wasteByType).length}
                </p>
                <p className="text-xs text-muted-foreground">Waste Types</p>
              </div>
            </div>

            {Object.keys(stats.wasteByType).length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-3">Waste Collection Breakdown</p>
                  <div className="space-y-2">
                    {Object.entries(stats.wasteByType).map(([type, quantity]) => {
                      const wasteConfig = WASTE_TYPES[type as WasteType];
                      const percentage = (quantity / stats.totalWasteCollected) * 100;
                      return (
                        <div key={type} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `${wasteConfig?.color}20`,
                                color: wasteConfig?.color,
                              }}
                            >
                              {wasteConfig?.label || type}
                            </span>
                            <span className="text-muted-foreground">
                              {formatWeight(quantity)} ({percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className="h-1.5"
                            style={{ backgroundColor: `${wasteConfig?.color}20` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements */}
      <motion.div {...animations.slideUp} transition={{ delay: 0.2 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Achievements
                </CardTitle>
                <CardDescription>
                  {unlockedCount} of {achievements.length} unlocked
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                <Sparkles className="mr-1 h-3 w-3" />
                {unlockedCount}/{achievements.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Empty State */}
      {!loading && stats.completedPickups === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Target className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <p className="font-semibold text-lg">Start Your Journey</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Complete your first waste pickup to start earning rewards and making an environmental impact!
              </p>
              <Button asChild>
                <a href="/citizen/classify">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Classify Waste Now
                </a>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default function CitizenRewardsPage() {
  return (
    <ProtectedRoute allowedRoles={["citizen"]}>
      <CitizenRewardsContent />
    </ProtectedRoute>
  );
}

