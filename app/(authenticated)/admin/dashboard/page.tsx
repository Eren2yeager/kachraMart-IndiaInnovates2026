"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Building2, Package, ShoppingCart, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { animations } from "@/lib/theme";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { useEffect, useState } from "react";
import { WASTE_TYPES } from "@/config/constants";
import { formatCurrency, formatWeight } from "@/lib/utils";

interface AdminStats {
  totalHubs: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalWasteCollected: number;
  totalRevenue: number;
}

interface RecentOrder {
  _id: string;
  dealerId: string;
  wasteType: string;
  quantity: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalHubs: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalUsers: 0,
    totalWasteCollected: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch admin analytics and recent orders
    Promise.all([
      fetch("/api/admin/analytics").then((r) => r.json()),
      fetch("/api/admin/orders").then((r) => r.json())
    ])
      .then(([analyticsData, ordersData]) => {
        if (analyticsData) {
          setStats({
            totalHubs: analyticsData.totalHubs || 0,
            totalOrders: analyticsData.totalOrders || 0,
            pendingOrders: analyticsData.pendingOrders || 0,
            totalUsers: analyticsData.totalUsers || 0,
            totalWasteCollected: analyticsData.totalWasteCollected || 0,
            totalRevenue: analyticsData.totalRevenue || 0,
          });
        }
        if (ordersData?.orders) {
          setRecentOrders(ordersData.orders.slice(0, 5));
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
              Admin Dashboard
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <motion.div {...animations.slideUp} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hubs</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHubs}</div>
              <p className="text-xs text-muted-foreground">Active collection hubs</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
              <p className="text-xs text-muted-foreground">All time orders</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <Package className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingOrders}</div>
              <p className="text-xs text-muted-foreground">Awaiting approval</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Waste Collected</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWasteCollected} kg</div>
              <p className="text-xs text-muted-foreground">Total collected</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From waste sales</p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div {...animations.slideUp} transition={{ delay: 0.1 }} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
          <Card className="bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-slate-800 dark:text-slate-300" />
                System Analytics
              </CardTitle>
              <CardDescription>View platform-wide metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-800/80 dark:text-slate-200/80">
                Track waste flow, collection rates, and system performance metrics.
              </p>
              <Button asChild className="w-full">
                <Link href="/admin/analytics">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Hub Management
              </CardTitle>
              <CardDescription>Manage collection hubs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-emerald-900/80 dark:text-emerald-200/80">
                View hub capacities, inventory levels, and create new hubs.
              </p>
              <Button asChild  className="w-full">
                <Link href="/admin/hubs">
                  <Building2 className="mr-2 h-4 w-4" />
                  Manage Hubs
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-sky-50/60 dark:bg-sky-950/30 border-sky-100 dark:border-sky-800 flex flex-col justify-between">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Order Management
              </CardTitle>
              <CardDescription>Review and approve orders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-sky-900/80 dark:text-sky-200/80">
                Approve or reject dealer orders and manage transactions.
              </p>
              <Button asChild  className="w-full">
                <Link href="/admin/orders">
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  View Orders
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div {...animations.slideUp} transition={{ delay: 0.2 }} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Loading...
                </div>
              ) : recentOrders.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No recent orders. System running smoothly.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${WASTE_TYPES[order.wasteType as keyof typeof WASTE_TYPES]?.color}20`,
                          }}
                        >
                          <Package
                            className="h-5 w-5"
                            style={{
                              color: WASTE_TYPES[order.wasteType as keyof typeof WASTE_TYPES]?.color,
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {WASTE_TYPES[order.wasteType as keyof typeof WASTE_TYPES]?.label || order.wasteType}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatWeight(order.quantity)} • {formatCurrency(order.totalPrice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {order.status === 'pending' && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {order.status === 'approved' && (
                          <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/30">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {order.status === 'completed' && (
                          <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                        {order.status === 'rejected' && (
                          <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30">
                            <XCircle className="h-3 w-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Button asChild variant="outline" className="w-full">
                      <Link href="/admin/orders">View All Orders</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
