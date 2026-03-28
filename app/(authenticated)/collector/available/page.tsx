"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Package, MapPin, IndianRupee, CheckCircle2, Loader2,
  AlertCircle, RefreshCw, Navigation, Building2, Sparkles,
} from "lucide-react";
import { animations } from "@/lib/theme";
import { WASTE_TYPES, REWARD_POINTS } from "@/config/constants";
import { formatWeight, formatCurrency, calculateDistance } from "@/lib/utils";
import { IWasteListing, IHub, WasteType } from "@/types";

interface PickupWithHub extends IWasteListing {
  nearestHub: IHub | null;
}

function AvailablePickupCard({
  pickup,
  collectorCoords,
  onAccept,
  accepting,
}: {
  pickup: PickupWithHub;
  collectorCoords: [number, number] | null;
  onAccept: (pickupId: string, hubId?: string) => Promise<void>;
  accepting: boolean;
}) {
  const wasteConfig = WASTE_TYPES[pickup.wasteType as WasteType];
  const rewardPoints = (REWARD_POINTS[pickup.wasteType as WasteType] ?? 0) * Math.ceil(pickup.quantity);

  const distance =
    collectorCoords && pickup.pickupLocation?.coordinates
      ? calculateDistance(
          collectorCoords[1],
          collectorCoords[0],
          pickup.pickupLocation.coordinates[1],
          pickup.pickupLocation.coordinates[0]
        ).toFixed(1)
      : null;

  const mapsUrl = pickup.pickupLocation?.coordinates
    ? `/map?pickupId=${pickup._id}&mode=navigate`
    : null;

  return (
    <motion.div layout {...animations.slideUp}>
      <Card className="overflow-hidden">
        <div className="h-1 w-full" style={{ backgroundColor: wasteConfig.color }} />

        <CardHeader className="pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="rounded-full p-2 shrink-0"
                style={{ backgroundColor: `${wasteConfig.color}20` }}
              >
                <Package className="h-4 w-4" style={{ color: wasteConfig.color }} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{wasteConfig.label}</p>
                <p className="text-xs text-muted-foreground">{formatWeight(pickup.quantity)}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              {pickup.estimatedValue !== undefined && (
                <Badge variant="outline" className="text-xs gap-1">
                  <IndianRupee className="h-3 w-3" />
                  {formatCurrency(pickup.estimatedValue)}
                </Badge>
              )}
              {distance && (
                <span className="text-xs text-muted-foreground">{distance} km away</span>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-2">{pickup.pickupLocation?.address ?? "No address"}</span>
            </div>

            {pickup.nearestHub && (
              <div className="flex items-start gap-1.5 text-green-600 dark:text-green-400">
                <Building2 className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span className="line-clamp-2">
                  Deliver to: {pickup.nearestHub.name}
                </span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400">
                Citizen earns +{rewardPoints} pts on pickup
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {mapsUrl && (
              <Button variant="outline" size="sm" className="flex-1" asChild>
                <a href={mapsUrl}>
                  <Navigation className="mr-1.5 h-3.5 w-3.5" />
                  View Location
                </a>
              </Button>
            )}

            <Button
              size="sm"
              className="flex-1"
              onClick={() => onAccept(pickup._id, pickup.nearestHub?._id)}
              disabled={accepting}
            >
              {accepting ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              )}
              Accept Pickup
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CollectorAvailablePickupsContent() {
  const [pickups, setPickups] = useState<PickupWithHub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collectorCoords, setCollectorCoords] = useState<[number, number] | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [phoneRequired, setPhoneRequired] = useState(false);

  const fetchPickups = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/collector/available-pickups");
      if (!res.ok) throw new Error("Failed to fetch available pickups");

      const data = await res.json();
      setPickups(data.pickups ?? []);
      if (data.collectorLocation) {
        setCollectorCoords(data.collectorLocation);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPickups();
  }, [fetchPickups]);

  const handleAccept = async (pickupId: string, hubId?: string) => {
    setAcceptingId(pickupId);
    setError(null);
    setPhoneRequired(false);

    try {
      const res = await fetch("/api/collector/available-pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupId, hubId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Check if error is due to missing phone number
        if (data.error === 'Phone number required') {
          setPhoneRequired(true);
          setError(data.message || "Please add your phone number in your profile");
        } else {
          throw new Error(data.error || "Failed to accept pickup");
        }
        return;
      }

      // Remove from available list
      setPickups((prev) => prev.filter((p) => p._id !== pickupId));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        {...animations.fadeIn}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Package className="h-7 w-7 text-primary" />
            Available Pickups
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Accept pickup requests near you and start collecting
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPickups} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </motion.div>

      {!collectorCoords && !loading && (
        <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
            Set your location in your profile to see available pickups near you.
          </AlertDescription>
        </Alert>
      )}

      {phoneRequired && !loading && (
        <Alert className="border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950">
          <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200 text-sm flex items-center justify-between">
            <span>Phone number required to accept pickups. Citizens need to contact you for coordination.</span>
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-4 shrink-0"
              onClick={() => window.location.href = '/me/profile'}
            >
              Go to Profile
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && !loading && !phoneRequired && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && pickups.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No available pickups</p>
              <p className="text-sm text-muted-foreground">
                Check back later for new pickup requests in your area.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {!loading && pickups.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {pickups.length} Pickup{pickups.length !== 1 ? "s" : ""} Available
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {pickups.map((pickup) => (
                <AvailablePickupCard
                  key={pickup._id}
                  pickup={pickup}
                  collectorCoords={collectorCoords}
                  onAccept={handleAccept}
                  accepting={acceptingId === pickup._id}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CollectorAvailablePickupsPage() {
  return (
    <ProtectedRoute allowedRoles={["collector"]}>
      <CollectorAvailablePickupsContent />
    </ProtectedRoute>
  );
}
