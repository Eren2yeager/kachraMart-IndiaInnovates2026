"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) return;

    // Redirect to role-specific dashboard
    const roleRoutes = {
      citizen: "/citizen/dashboard",
      collector: "/collector/dashboard",
      dealer: "/dealer/dashboard",
      admin: "/admin/dashboard",
    };

    const targetRoute = roleRoutes[user.role as keyof typeof roleRoutes];
    if (targetRoute) {
      router.replace(targetRoute);
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
