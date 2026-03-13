"use client";

import { useState } from "react";
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
} from "lucide-react";
import { motion } from "framer-motion";
import { animations } from "@/lib/theme";
import { USER_ROLES } from "@/config/constants";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";

export default function DashboardPage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
  });
  const [imagePreview, setImagePreview] = useState<string | null>(
    user?.image || null,
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  if (!user) return null;

  const roleConfig = USER_ROLES[user.role];

  const handleSave = async () => {
    setError("");
    setIsSaving(true);

    try {
      let imageUrl = user?.image;

      // Upload image if a new one was selected
      if (imageFile) {
        const imageFormData = new FormData();
        imageFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: imageFormData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload image");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      }

      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          image: imageUrl,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setIsEditing(false);
      // Optionally refresh the page or update local state
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      phone: user?.phone || "",
    });
    setImagePreview(user?.image || null);
    setImageFile(null);
    setIsEditing(false);
    setError("");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
    }
  };

  return (
    <div className="space-y-8">
      <motion.div {...animations.fadeIn} className="space-y-6">
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
                You&apos;re signed in as a {roleConfig.label}. Phase 1–2
                features are live; the rest of the circular flow is visible as{" "}
                <span className="font-medium">Coming soon</span> screens.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        {/* Profile */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
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
                  className="text-[10px] md:text-xs border-amber-300 bg-amber-50 text-amber-700"
                >
                 You will need to signin again for changes to take effect.
                </Badge>
                <div className="space-y-2">
                  <Label>Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <UserAvatar
                        name={formData.name || user.name || "User"}
                        image={imagePreview || undefined}
                        role={user.role}
                        size="lg"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Your name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Your phone number"
                  />
                </div>

                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="flex-1"
                  >
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
                    <p className="text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                {user.phone && (
                  <div className="flex items-center gap-3">
                    <svg
                      className="h-5 w-5 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium">Phone</p>
                      <p className="text-sm text-muted-foreground">
                        {user.phone}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {user.role}
                    </p>
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
                    <span className="text-sm font-medium">
                      Verified Account
                    </span>
                  </div>
                )}
              </>
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
