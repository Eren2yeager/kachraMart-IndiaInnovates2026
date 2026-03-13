"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useAuth } from "@/hooks/useAuth";
import { APP_NAME, USER_ROLES } from "@/config/constants";
import {
  BarChart3,
  Leaf,
  MapPin,
  Recycle,
  Shield,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface AppShellProps {
  children: React.ReactNode;
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  comingSoon?: boolean;
};

const roleNavConfig: Record<string, NavItem[]> = {
  citizen: [
    { label: "Dashboard", href: "/dashboard", icon: Shield },
    { label: "AI Classification", href: "/citizen/classify", icon: Recycle },
    {
      label: "Pickup Requests",
      href: "/citizen/pickups",
      icon: Truck,
      comingSoon: true,
    },
    {
      label: "Rewards & Impact",
      href: "/citizen/rewards",
      icon: Leaf,
      comingSoon: true,
    },
  ],
  collector: [
    { label: "Dashboard", href: "/dashboard", icon: Shield },
    {
      label: "Assigned Pickups",
      href: "/collector/pickups",
      icon: Truck,
      comingSoon: true,
    },
    {
      label: "Routes & Navigation",
      href: "/collector/routes",
      icon: MapPin,
      comingSoon: true,
    },
  ],
  dealer: [
    { label: "Dashboard", href: "/dashboard", icon: Shield },
    {
      label: "Waste Marketplace",
      href: "/dealer/marketplace",
      icon: ShoppingBag,
      comingSoon: true,
    },
    {
      label: "Orders",
      href: "/dealer/orders",
      icon: Recycle,
      comingSoon: true,
    },
  ],
  admin: [
    { label: "Dashboard", href: "/dashboard", icon: Shield },
    {
      label: "Waste Flow Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      comingSoon: true,
    },
    {
      label: "Hubs & Inventory",
      href: "/admin/hubs",
      icon: Truck,
      comingSoon: true,
    },
  ],
};

export function AppShell({ children }: AppShellProps) {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const roleConfig = USER_ROLES[user.role];
  const navItems = roleNavConfig[user.role] ?? roleNavConfig.citizen;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader>
          <div className="flex items-center gap-2 ">
            <div className="h-8 min-w-8 rounded-full bg-background flex items-center justify-center overflow-hidden border border-border">
              <img
                src="/favicon.svg"
                alt={APP_NAME}
                className="h-6 w-6"
              />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold leading-tight">
                {APP_NAME}
              </span>
              <span className="text-[10px] text-muted-foreground leading-tight">
                {roleConfig.label} workspace
              </span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <Link href={item.href} className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="flex-1 flex items-center justify-between gap-2">
                            <span>{item.label}</span>
                            {item.comingSoon && (
                              <span className="text-[10px] rounded-full px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200">
                                Coming soon
                              </span>
                            )}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center gap-2 px-2 py-1">
            <UserAvatar
              name={user.name || "User"}
              image={user.image || undefined}
              role={user.role}
              size="sm"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">
                {user.name || "User"}
              </span>
              <span
                className="text-[10px] truncate"
                style={{ color: roleConfig.color }}
              >
                {roleConfig.label}
              </span>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 relative">
          <header className="border-b bg-background/80 backdrop-blur flex items-center justify-between px-4 py-3 md:px-6 sticky top-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="flex flex-col">
                <span className="text-sm font-semibold">
                  {APP_NAME} Dashboard
                </span>
                <span className="text-xs text-muted-foreground">
                  Data-driven circular waste management
                </span>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border",
                  "bg-white/50 backdrop-blur"
                )}
              >
                <span
                  className="mr-1 inline-block h-2 w-2 rounded-full border border-white"
                  style={{ backgroundColor: roleConfig.color }}
                />
                {roleConfig.label}
              </span>
              <Button asChild size="sm" variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </header>
          <main className="flex-1 px-4 py-4 md:px-8 md:py-8">
            {children}
          </main>
          {/* <footer className="border-t bg-background/80 backdrop-blur px-4 py-3 md:px-6 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-2">
            <span>© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</span>
            <span>Phases 1–2 live · Phases 3–6 coming soon.</span>
          </footer> */}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

