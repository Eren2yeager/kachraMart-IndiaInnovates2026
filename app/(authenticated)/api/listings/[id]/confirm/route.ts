import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import WasteInventory from '@/models/WasteInventory';
import Hub from '@/models/Hub';
import User from '@/models/User';
import { REWARD_POINTS } from '@/config/constants';
import { WasteStatus, WasteType, IWasteListing } from '@/types';

const ALLOWED_TRANSITIONS: Record<WasteStatus, WasteStatus[]> = {
    pending: ['collector_assigned', 'cancelled'],
    collector_assigned: ['picked_up', 'cancelled'],
    picked_up: ['stored_in_hub'],
    stored_in_hub: ['sold_to_dealer'],
    sold_to_dealer: [],
    cancelled: [],
};

const ACTION_TO_STATUS: Record<string, WasteStatus> = {
    picked_up: 'picked_up',
    stored_in_hub: 'stored_in_hub',
};

async function aggregateInventory(listing: IWasteListing, hubId: string): Promise<void> {
    const hub = await Hub.findById(hubId);
    if (!hub) throw Object.assign(new Error('Hub not found'), { status: 404 });

    if (hub.currentLoad + listing.quantity > hub.capacity) {
        throw Object.assign(new Error('Hub capacity exceeded'), { status: 400 });
    }

    // Create or update inventory with verified=true (collector delivered it)
    await WasteInventory.findOneAndUpdate(
        { hubId, wasteType: listing.wasteType },
        {
            $inc: { quantity: listing.quantity },
            $addToSet: { sourceListings: listing._id },
            $set: { verified: true }, // Auto-verify when collector delivers
        },
        { upsert: true, new: true }
    );

    await Hub.findByIdAndUpdate(hubId, { $inc: { currentLoad: listing.quantity } });
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const { action, hubId } = body;

        const targetStatus = ACTION_TO_STATUS[action];
        if (!targetStatus) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await connectDB();

        const listing = await WasteListing.findById(id);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        if (listing.collectorId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized to update this listing' }, { status: 403 });
        }

        const allowed = ALLOWED_TRANSITIONS[listing.status as WasteStatus] ?? [];
        if (!allowed.includes(targetStatus)) {
            return NextResponse.json(
                { error: `Invalid status transition from ${listing.status} to ${targetStatus}` },
                { status: 400 }
            );
        }

        // If storing in hub, use assigned hub or provided hubId
        if (targetStatus === 'stored_in_hub') {
            const finalHubId = hubId || listing.assignedHubId;
            
            if (!finalHubId) {
                return NextResponse.json(
                    { error: 'Hub ID is required to store waste' },
                    { status: 400 }
                );
            }

            try {
                await aggregateInventory(listing.toObject() as IWasteListing, finalHubId);
            } catch (err: any) {
                return NextResponse.json(
                    { error: err.message ?? 'Failed to store in hub' },
                    { status: err.status ?? 500 }
                );
            }
        }

        listing.status = targetStatus;
        await listing.save();

        let pointsAwarded = 0;

        if (targetStatus === 'picked_up') {
            const pointsPerUnit = REWARD_POINTS[listing.wasteType as WasteType] ?? 0;
            pointsAwarded = pointsPerUnit * Math.ceil(listing.quantity);

            if (pointsAwarded > 0) {
                await User.findByIdAndUpdate(listing.userId, {
                    $inc: { rewardPoints: pointsAwarded },
                });
            }
        }

        return NextResponse.json({
            success: true,
            listing: { ...listing.toObject(), _id: listing._id.toString() },
            pointsAwarded,
        });
    } catch (error: any) {
        console.error('Confirm pickup error:', error);
        return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }
}
