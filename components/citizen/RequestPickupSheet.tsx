'use client';

import { useState } from 'react';
import { MapPin, Loader2, Sparkles, Package, IndianRupee, Navigation } from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { ClassificationResult } from '@/lib/roboflow';
import { IWasteListing, WasteType } from '@/types';
import { WASTE_TYPES, WASTE_PRICES, REWARD_POINTS } from '@/config/constants';
import { formatCurrency, formatWeight } from '@/lib/utils';

interface RequestPickupSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classificationResult: ClassificationResult | null;
    imageUrl: string | null;
    onSuccess: (listing: IWasteListing) => void;
}

export function RequestPickupSheet({
    open,
    onOpenChange,
    classificationResult,
    imageUrl,
    onSuccess,
}: RequestPickupSheetProps) {
    const [quantity, setQuantity] = useState('1');
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState<[number, number] | null>(null);
    const [description, setDescription] = useState('');
    const [locating, setLocating] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wasteType = classificationResult?.wasteType ?? 'recyclable';
    const wasteConfig = WASTE_TYPES[wasteType as WasteType];
    const qty = parseFloat(quantity) || 0;
    const estimatedValue = qty * (WASTE_PRICES[wasteType as WasteType] ?? 0);
    const rewardPoints = (REWARD_POINTS[wasteType as WasteType] ?? 0) * Math.ceil(qty);

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }
        setLocating(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCoordinates([longitude, latitude]);
                // Reverse geocode using a free API
                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                    );
                    const data = await res.json();
                    setAddress(data.display_name ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                } catch {
                    setAddress(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
                }
                setLocating(false);
            },
            (err) => {
                setError('Could not get your location. Please enter address manually.');
                setLocating(false);
            },
            { timeout: 10000 }
        );
    };

    const handleSubmit = async () => {
        setError(null);

        if (!classificationResult || !imageUrl) {
            setError('Classification data is missing');
            return;
        }
        if (qty <= 0) {
            setError('Please enter a valid quantity');
            return;
        }
        if (!address.trim()) {
            setError('Please provide a pickup address');
            return;
        }

        // Use coordinates from geolocation or default to [0,0] with address
        const coords: [number, number] = coordinates ?? [0, 0];

        setSubmitting(true);
        try {
            const res = await fetch('/api/listings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl,
                    wasteType: classificationResult.wasteType,
                    quantity: qty,
                    pickupLocation: { coordinates: coords, address: address.trim() },
                    aiConfidence: classificationResult.confidence,
                    description: description.trim() || undefined,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? 'Failed to create listing');

            onSuccess(data.listing);
            onOpenChange(false);
            // Reset form
            setQuantity('1');
            setAddress('');
            setCoordinates(null);
            setDescription('');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="pb-2">
                    <SheetTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Request Pickup
                    </SheetTitle>
                    <SheetDescription>
                        Create a pickup request from your AI classification result.
                    </SheetDescription>
                </SheetHeader>

                <div className="flex flex-col gap-5 py-4">
                    {/* AI Classification Summary */}
                    {classificationResult && (
                        <Card className="border-2" style={{ borderColor: wasteConfig.color }}>
                            <CardContent className="pt-4 pb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="rounded-full p-2"
                                        style={{ backgroundColor: `${wasteConfig.color}20` }}
                                    >
                                        <Sparkles className="h-4 w-4" style={{ color: wasteConfig.color }} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold">{wasteConfig.label}</p>
                                        <p className="text-xs text-muted-foreground">
                                            AI confidence: {Math.round(classificationResult.confidence * 100)}%
                                        </p>
                                    </div>
                                    <Badge variant="outline" className="text-xs shrink-0">
                                        {classificationResult.primaryItem}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quantity */}
                    <div className="space-y-1.5">
                        <Label htmlFor="quantity">Estimated Quantity (kg)</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="e.g. 2.5"
                        />
                    </div>

                    {/* Estimated Value & Points Preview */}
                    {qty > 0 && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-100 dark:border-green-800 p-3">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <IndianRupee className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                                    <span className="text-xs text-green-700 dark:text-green-300 font-medium">Est. Value</span>
                                </div>
                                <p className="text-base font-bold text-green-800 dark:text-green-200">
                                    {formatCurrency(estimatedValue)}
                                </p>
                            </div>
                            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-800 p-3">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                    <Sparkles className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Reward Pts</span>
                                </div>
                                <p className="text-base font-bold text-amber-800 dark:text-amber-200">
                                    +{rewardPoints} pts
                                </p>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Pickup Location */}
                    <div className="space-y-2">
                        <Label>Pickup Location</Label>
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
                            {locating ? 'Getting location...' : 'Use My Current Location'}
                        </Button>

                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="Or type your address..."
                                value={address}
                                onChange={(e) => {
                                    setAddress(e.target.value);
                                    // Clear coordinates if user types manually
                                    if (coordinates) setCoordinates(null);
                                }}
                            />
                        </div>
                        {coordinates && (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                <Navigation className="h-3 w-3" />
                                GPS coordinates captured
                            </p>
                        )}
                    </div>

                    {/* Optional Description */}
                    <div className="space-y-1.5">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                            id="description"
                            placeholder="Any additional details about the waste..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={500}
                        />
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md">
                            {error}
                        </div>
                    )}
                </div>

                <SheetFooter className="pt-2">
                    <Button
                        className="w-full"
                        onClick={handleSubmit}
                        disabled={submitting || !address.trim() || qty <= 0}
                    >
                        {submitting ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Package className="mr-2 h-4 w-4" />
                        )}
                        {submitting ? 'Creating Request...' : 'Submit Pickup Request'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
