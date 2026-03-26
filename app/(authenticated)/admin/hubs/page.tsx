'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, RefreshCw, Loader2, AlertCircle, Navigation,
  CheckCircle2, XCircle, BarChart3, Edit2, Trash2, Package,
  MapPin, Gauge, Layers, ShieldCheck,
} from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { IHub, IWasteInventory, WasteType } from '@/types';
import { WASTE_TYPES } from '@/config/constants';
import { formatWeight } from '@/lib/utils';
import { animations } from '@/lib/theme';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HubWithSummary extends IHub {
  inventorySummary: { _id: string; wasteType: WasteType; quantity: number; verified: boolean }[];
  utilizationPct: number;
}

interface HubAnalytics {
  wasteByType: Record<string, number>;
  totalVerified: number;
  totalUnverified: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function utilizationColor(pct: number) {
  if (pct >= 85) return 'bg-red-500';
  if (pct >= 60) return 'bg-amber-500';
  return 'bg-green-500';
}

function utilizationBadgeVariant(pct: number): 'success' | 'warning' | 'error' {
  if (pct >= 85) return 'error';
  if (pct >= 60) return 'warning';
  return 'success';
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon, label, value, color, loading,
}: {
  icon: React.ComponentType<any>; label: string; value: string | number; color: string; loading: boolean;
}) {
  return (
    <Card className={`border-l-4`} style={{ borderLeftColor: color }}>
      <CardContent className="pt-4 pb-3 flex items-center gap-3">
        <div className="rounded-full p-2.5" style={{ backgroundColor: `${color}20` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          {loading ? <Skeleton className="h-6 w-16 mb-1" /> : (
            <p className="text-xl font-bold">{value}</p>
          )}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Hub Card ────────────────────────────────────────────────────────────────

function HubCard({
  hub,
  onViewDetails,
  onDelete,
}: {
  hub: HubWithSummary;
  onViewDetails: (hub: HubWithSummary) => void;
  onDelete: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete hub "${hub.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/hubs/${hub._id}`, { method: 'DELETE' });
      if (res.ok) onDelete(hub._id);
      else {
        const d = await res.json();
        alert(d.error ?? 'Failed to delete hub');
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div layout {...animations.slideUp}>
      <Card className="overflow-hidden h-full flex flex-col">
        <div className="h-1 w-full" style={{ backgroundColor: hub.utilizationPct >= 85 ? '#ef4444' : hub.utilizationPct >= 60 ? '#f59e0b' : '#22c55e' }} />
        <CardHeader className="pb-2 pt-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{hub.name}</CardTitle>
              <CardDescription className="text-xs flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{hub.location.address}</span>
              </CardDescription>
            </div>
            <Badge variant={utilizationBadgeVariant(hub.utilizationPct)} className="shrink-0 text-xs">
              {hub.utilizationPct}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1 space-y-3">
          {/* Capacity bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatWeight(hub.currentLoad)} used</span>
              <span>{formatWeight(hub.capacity)} cap</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={`h-full rounded-full transition-all ${utilizationColor(hub.utilizationPct)}`}
                style={{ width: `${hub.utilizationPct}%` }}
              />
            </div>
          </div>

          {/* Waste type badges */}
          {hub.inventorySummary.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {hub.inventorySummary.map((inv) => (
                <TooltipProvider key={inv.wasteType}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border"
                        style={{
                          backgroundColor: `${WASTE_TYPES[inv.wasteType]?.color}20`,
                          borderColor: `${WASTE_TYPES[inv.wasteType]?.color}40`,
                          color: WASTE_TYPES[inv.wasteType]?.color,
                        }}
                      >
                        {WASTE_TYPES[inv.wasteType]?.label ?? inv.wasteType}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {formatWeight(inv.quantity)} · {inv.verified ? 'Verified' : 'Unverified'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">No inventory yet</p>
          )}

          <Separator />

          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onViewDetails(hub)}>
              <Layers className="mr-1.5 h-3.5 w-3.5" />
              View Details
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                    onClick={handleDelete}
                    disabled={deleting || hub.currentLoad > 0}
                  >
                    {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {hub.currentLoad > 0 ? 'Cannot delete hub with active inventory' : 'Delete hub'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Create Hub Sheet ─────────────────────────────────────────────────────────

function CreateHubSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (hub: HubWithSummary) => void;
}) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [capacity, setCapacity] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords([longitude, latitude]);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          setAddress(data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } catch {
          setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }
        setLocating(false);
      },
      () => { setError('Could not get location'); setLocating(false); },
      { timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    setError(null);
    if (!name.trim()) { setError('Hub name is required'); return; }
    if (!address.trim()) { setError('Address is required'); return; }
    if (!capacity || parseFloat(capacity) <= 0) { setError('Capacity must be greater than 0'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/hubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          location: { type: 'Point', coordinates: coords ?? [0, 0], address: address.trim() },
          capacity: parseFloat(capacity),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create hub');
      onCreated({ ...data.hub, inventorySummary: [], utilizationPct: 0 });
      onOpenChange(false);
      setName(''); setAddress(''); setCoords(null); setCapacity('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Create New Hub
          </SheetTitle>
          <SheetDescription>Add a new waste collection hub to the network.</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="hub-name">Hub Name</Label>
            <Input id="hub-name" placeholder="e.g. North Delhi Hub" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleGetLocation} disabled={locating}>
              {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
              {locating ? 'Getting location...' : 'Use Current GPS Location'}
            </Button>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Or type address..." value={address} onChange={(e) => { setAddress(e.target.value); if (coords) setCoords(null); }} />
            </div>
            {coords && (
              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <Navigation className="h-3 w-3" /> GPS coordinates captured
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="hub-capacity">Capacity (kg)</Label>
            <Input id="hub-capacity" type="number" min="1" placeholder="e.g. 5000" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <SheetFooter>
          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {submitting ? 'Creating...' : 'Create Hub'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ─── Hub Detail Sheet ─────────────────────────────────────────────────────────

function HubDetailSheet({
  hub,
  open,
  onOpenChange,
  onUpdated,
}: {
  hub: HubWithSummary | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onUpdated: (hub: HubWithSummary) => void;
}) {
  const [inventory, setInventory] = useState<IWasteInventory[]>([]);
  const [analytics, setAnalytics] = useState<HubAnalytics | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [newCapacity, setNewCapacity] = useState('');
  const [savingCapacity, setSavingCapacity] = useState(false);

  useEffect(() => {
    if (!hub || !open) return;
    setLoadingDetail(true);
    setNewCapacity(String(hub.capacity));
    Promise.all([
      fetch(`/api/hubs/${hub._id}`).then((r) => r.json()),
      fetch(`/api/hubs/${hub._id}/analytics`).then((r) => r.json()),
    ]).then(([detail, anal]) => {
      setInventory(detail.inventory ?? []);
      setAnalytics(anal);
    }).finally(() => setLoadingDetail(false));
  }, [hub, open]);

  const handleVerifyToggle = async (inv: IWasteInventory) => {
    // Optimistic update
    setInventory((prev) => prev.map((i) => i._id === inv._id ? { ...i, verified: !i.verified } : i));
    const res = await fetch(`/api/inventory/${inv._id}/verify`, { method: 'PATCH' });
    if (!res.ok) {
      // Revert on failure
      setInventory((prev) => prev.map((i) => i._id === inv._id ? { ...i, verified: inv.verified } : i));
    }
  };

  const handleSaveCapacity = async () => {
    if (!hub) return;
    const cap = parseFloat(newCapacity);
    if (!cap || cap <= 0) return;
    setSavingCapacity(true);
    try {
      const res = await fetch(`/api/hubs/${hub._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capacity: cap }),
      });
      if (res.ok) {
        const data = await res.json();
        const utilizationPct = cap > 0 ? Math.min(100, Math.round((data.hub.currentLoad / cap) * 1000) / 10) : 0;
        onUpdated({ ...hub, ...data.hub, utilizationPct, inventorySummary: hub.inventorySummary });
      }
    } finally {
      setSavingCapacity(false);
    }
  };

  const chartData = analytics
    ? Object.entries(analytics.wasteByType).map(([type, qty]) => ({
      name: WASTE_TYPES[type as WasteType]?.label ?? type,
      quantity: qty,
      fill: WASTE_TYPES[type as WasteType]?.color ?? '#6b7280',
    }))
    : [];

  if (!hub) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            {hub.name}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {hub.location.address}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 py-4">
          {/* Utilization summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-bold">{hub.utilizationPct}%</p>
              <p className="text-[10px] text-muted-foreground">Utilization</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-bold">{formatWeight(hub.currentLoad)}</p>
              <p className="text-[10px] text-muted-foreground">Current Load</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <p className="text-lg font-bold">{formatWeight(hub.capacity)}</p>
              <p className="text-[10px] text-muted-foreground">Capacity</p>
            </div>
          </div>

          <Separator />

          {/* Inventory table */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Package className="h-4 w-4" /> Inventory by Waste Type
            </h3>
            {loadingDetail ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : inventory.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No inventory records yet.</p>
            ) : (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Type</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Qty</th>
                      <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground">Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((inv, i) => (
                      <tr key={inv._id} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                        <td className="px-3 py-2">
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${WASTE_TYPES[inv.wasteType]?.color}20`,
                              color: WASTE_TYPES[inv.wasteType]?.color,
                            }}
                          >
                            {WASTE_TYPES[inv.wasteType]?.label ?? inv.wasteType}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right text-xs">{formatWeight(inv.quantity)}</td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Switch
                              size="sm"
                              checked={inv.verified}
                              onCheckedChange={() => handleVerifyToggle(inv)}
                            />
                            {inv.verified
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                              : <XCircle className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <Separator />

          {/* Analytics chart */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Waste by Type
            </h3>
            {loadingDetail ? (
              <Skeleton className="h-40 w-full" />
            ) : chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No data to display.</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    formatter={(v: number) => [`${v} kg`, 'Quantity']}
                    contentStyle={{ fontSize: 12 }}
                  />
                  <Bar dataKey="quantity" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
            {analytics && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800 p-2 text-center">
                  <p className="text-sm font-bold text-green-700 dark:text-green-300">{formatWeight(analytics.totalVerified)}</p>
                  <p className="text-[10px] text-green-600 dark:text-green-400">Verified</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 p-2 text-center">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{formatWeight(analytics.totalUnverified)}</p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400">Unverified</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Edit capacity */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Edit2 className="h-4 w-4" /> Edit Capacity
            </h3>
            <div className="flex gap-2">
              <Input
                type="number"
                min="1"
                value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)}
                className="flex-1"
              />
              <Button size="sm" onClick={handleSaveCapacity} disabled={savingCapacity}>
                {savingCapacity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

function AdminHubsContent() {
  const [hubs, setHubs] = useState<HubWithSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailHub, setDetailHub] = useState<HubWithSummary | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchHubs = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/hubs');
      if (!res.ok) throw new Error('Failed to fetch hubs');
      const data = await res.json();
      setHubs(data.hubs ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHubs(); }, [fetchHubs]);

  const totalCapacity = hubs.reduce((s, h) => s + h.capacity, 0);
  const totalLoad = hubs.reduce((s, h) => s + h.currentLoad, 0);
  const overallUtilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

  const handleViewDetails = (hub: HubWithSummary) => {
    setDetailHub(hub);
    setDetailOpen(true);
  };

  const handleHubDeleted = (id: string) => {
    setHubs((prev) => prev.filter((h) => h._id !== id));
  };

  const handleHubCreated = (hub: HubWithSummary) => {
    setHubs((prev) => [hub, ...prev]);
  };

  const handleHubUpdated = (updated: HubWithSummary) => {
    setHubs((prev) => prev.map((h) => h._id === updated._id ? updated : h));
    setDetailHub(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...animations.fadeIn} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-7 w-7 text-primary" />
            Hubs & Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage waste collection hubs, capacities, and verified inventory.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchHubs} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Hub
          </Button>
        </div>
      </motion.div>

      {/* Overview stats */}
      <motion.div {...animations.slideUp} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Building2} label="Total Hubs" value={loading ? '—' : hubs.length} color="#3b82f6" loading={loading} />
        <StatCard icon={Gauge} label="Total Capacity" value={loading ? '—' : formatWeight(totalCapacity)} color="#8b5cf6" loading={loading} />
        <StatCard icon={Package} label="Total Load" value={loading ? '—' : formatWeight(totalLoad)} color="#f59e0b" loading={loading} />
        <StatCard icon={ShieldCheck} label="Utilization" value={loading ? '—' : `${overallUtilization}%`} color={overallUtilization >= 85 ? '#ef4444' : overallUtilization >= 60 ? '#f59e0b' : '#22c55e'} loading={loading} />
      </motion.div>

      {/* Error */}
      {error && !loading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && hubs.length === 0 && (
        <motion.div {...animations.fadeIn}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-3">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-lg">No hubs yet</p>
              <p className="text-sm text-muted-foreground">Create your first waste hub to start tracking inventory.</p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Hub
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Hub grid */}
      {!loading && hubs.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {hubs.map((hub) => (
              <HubCard
                key={hub._id}
                hub={hub}
                onViewDetails={handleViewDetails}
                onDelete={handleHubDeleted}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Sheets */}
      <CreateHubSheet open={createOpen} onOpenChange={setCreateOpen} onCreated={handleHubCreated} />
      <HubDetailSheet
        hub={detailHub}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={handleHubUpdated}
      />
    </div>
  );
}

export default function AdminHubsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <AdminHubsContent />
    </ProtectedRoute>
  );
}
