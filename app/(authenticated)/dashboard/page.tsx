"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Edit2,
  Check,
  X,
  MapPin,
  Navigation,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { animations } from "@/lib/theme";
import { USER_ROLES } from "@/config/constants";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";

interface LocationState {
  coordinates: [number, number];
  address: string;
}

function LocationBanner({ onSetLocation }: { onSetLocation: () => void }) {
  return (
    <motion.div {...animations.slideUp}>
      <Alert className="border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span className="text-amber-800 dark:text-amber-200 text-sm">
            Your location is not set. Collectors need your location to be assigned to pickup requests.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="border-amber-400 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900 shrink-0"
            onClick={onSetLocation}
          >
            <MapPin className="mr-2 h-3.5 w-3.5" />
            Set My Location
          </Button>
        </AlertDescription>
      </Alert>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(user?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  // Location state
  const [locationData, setLocationData] = useState<LocationState | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationSet, setLocationSet] = useState(false);
  const [showLocationBanner, setShowLocationBanner] = useState(false);

  // Check if user has a real location set
  useEffect(() => {
    if (!user) return;
    // Fetch current location from DB to check if it's [0,0]
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const coords = data?.location?.coordinates;
        const isDefault =
          !coords ||
          (coords[0] === 0 && coords[1] === 0);
        setShowLocationBanner(isDefault);
        if (!isDefault) {
          setLocationData({
            coordinates: coords,
            address: data?.location?.address || "",
          });
        }
      })
      .catch(() => { });
  }, [user]);

  if (!user) return null;

  const roleConfig = USER_ROLES[user.role];

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await res.json();
          const address = data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          setLocationData({ coordinates: [longitude, latitude], address });
        } catch {
          setLocationData({
            coordinates: [longitude, latitude],
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
          });
        }
        setLocating(false);
      },
      () => {
        setError("Could not get your location. Please allow location access.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleSave = async () => {
    setError("");
    setIsSaving(true);
    try {
      let imageUrl = user?.image;
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });
        if (!uploadResponse.ok) throw new Error("Failed to upload image");
        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const body: any = {
        name: formData.name,
        phone: formData.phone,
        image: imageUrl,
      };

      if (locationData) {
        body.location = {
          coordinates: locationData.coordinates,
          address: locationData.address,
        };
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      if (locationData) {
        setLocationSet(true);
        setShowLocationBanner(false);
      }

      setIsEditing(false);
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({ name: user?.name || "", phone: user?.phone || "" });
    setImagePreview(user?.image || null);
    setImageFile(null);
    setLocationData(null);
    setIsEditing(false);
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image size must be less than 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError("");
  };

  return (
    <div className="space-y-6">
      <motion.div {...animations.fadeIn} className="space-y-6">

        {/* Location banner */}
        <AnimatePresence>
          {showLocationBanner && !isEditing && (
            <LocationBanner onSetLocation={() => setIsEditing(true)} />
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
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
                {roleConfig.label} workspace
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            {!isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <div className="space-y-4">
                <Badge
                  variant="outline"
                  className="text-[10px] md:text-xs border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-200"
                >
                  You will need to sign in again for changes to take effect.
                </Badge>

                {/* Profile Picture */}
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      name={formData.name || user.name || "User"}
                      image={imagePreview || undefined}
                      role={user.role}
                      size="lg"
                    />
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                          file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 dark:file:bg-blue-950 file:text-blue-700 dark:file:text-blue-200
                          hover:file:bg-blue-100 dark:hover:file:bg-blue-900"
                      />
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Your phone number"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    Your Location
                    <span className="text-xs text-muted-foreground font-normal">(required for collector assignment)</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleGetLocation}
                    disabled={locating}
                  >
                    {locating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Navigation className="mr-2 h-4 w-4" />
                    )}
                    {locating ? "Getting location..." : "Use My Current Location"}
                  </Button>
                  {locationData && (
                    <div className="flex items-start gap-2 p-2.5 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300">
                      <Navigation className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{locationData.address}</span>
                    </div>
                  )}
                  <Input
                    placeholder="Or type your address manually..."
                    value={locationData?.address || ""}
                    onChange={(e) =>
                      setLocationData((prev) => ({
                        coordinates: prev?.coordinates ?? [0, 0],
                        address: e.target.value,
                      }))
                    }
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                    <Check className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isSaving} className="flex-1">
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
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
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
                  </div>
                </div>
                {/* Location display */}
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    {locationData?.address && !showLocationBanner ? (
                      <p className="text-sm text-muted-foreground line-clamp-2">{locationData.address}</p>
                    ) : (
                      <p className="text-sm text-amber-600 dark:text-amber-400">Not set — click Edit to add your location</p>
                    )}
                  </div>
                </div>
                {user.verified && (
                  <div className="flex items-center gap-2 text-green-600">
                    <svg className="h-5 w-5" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium">Verified Account</span>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Role-specific cards */}
        <motion.div {...animations.slideUp} transition={{ duration: 0.3 }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {user.role === "citizen" && (
            <>
              <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    AI classifications
                  </CardTitle>
                  <CardDescription className="text-xs">Try the computer-vision flow now.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
                    Upload an image and get a breakdown of detected items and waste category.
                  </p>
                  <Button asChild size="sm" className="w-full">
                    <Link href="/citizen/classify">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Classify waste with AI
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-sky-50/60 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    Pickup requests
                  </CardTitle>
                  <CardDescription className="text-xs">Phase 3 · Live</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-sky-900/80 dark:text-sky-200/80">
                    Create pickup requests from AI results and track status end-to-end.
                  </p>
                  <Button asChild size="sm" className="w-full" variant="outline">
                    <Link href="/citizen/pickups">
                      <Truck className="mr-2 h-4 w-4" />
                      View Pickup Requests
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-amber-50/60 dark:bg-amber-950/30 border-amber-100 dark:border-amber-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Leaf className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    Rewards & impact
                  </CardTitle>
                  <CardDescription className="text-xs">Roadmap: Phase 3–4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-amber-900/80 dark:text-amber-200/80">
                  <p>You'll soon see reward points and CO₂ savings driven by your pickups.</p>
                </CardContent>
              </Card>
            </>
          )}
          {user.role === "collector" && (
            <>
              <Card className="bg-sky-50/60 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                    Assigned pickups
                  </CardTitle>
                  <CardDescription className="text-xs">Phase 3 · Live</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-sky-900/80 dark:text-sky-200/80">
                    A dedicated dashboard for your upcoming, in-progress, and completed tasks.
                  </p>
                  <Button asChild size="sm" className="w-full" variant="outline">
                    <Link href="/collector/pickups">
                      <Truck className="mr-2 h-4 w-4" />
                      View Assigned Pickups
                    </Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Route optimization
                  </CardTitle>
                  <CardDescription className="text-xs">Phase 3 · Live</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
                    Map-backed routes that minimize distance and maximize recovery.
                  </p>
                  <Button asChild size="sm" className="w-full" variant="outline">
                    <Link href="/collector/routes">
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Optimized Route
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
          {user.role === "dealer" && (
            <>
              <Card className="bg-violet-50/60 dark:bg-violet-950/30 border-violet-100 dark:border-violet-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Recycle className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                    Marketplace
                  </CardTitle>
                  <CardDescription className="text-xs">Roadmap: Phase 5</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-violet-900/80 dark:text-violet-200/80">
                  <p>Browse, filter, and buy verified waste inventory from city hubs.</p>
                </CardContent>
              </Card>
              <Card className="bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-700 dark:text-slate-300" />
                    Order management
                  </CardTitle>
                  <CardDescription className="text-xs">Roadmap: Phase 5</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-800/80 dark:text-slate-200/80">
                  <p>See active, completed, and historical orders with pricing and invoices.</p>
                </CardContent>
              </Card>
            </>
          )}
          {user.role === "admin" && (
            <>
              <Card className="bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-slate-800 dark:text-slate-300" />
                    Waste flow analytics
                  </CardTitle>
                  <CardDescription className="text-xs">Roadmap: Phase 6</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-800/80 dark:text-slate-200/80">
                  <p>Track how much waste is collected, stored, and sold across types and hubs.</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    Hubs & inventory
                  </CardTitle>
                  <CardDescription className="text-xs">Roadmap: Phase 4</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-emerald-900/80 dark:text-emerald-200/80">
                  <p>See hub capacities, current load, and how inventory links to dealer orders.</p>
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
