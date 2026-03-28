import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';
import User from '@/models/User';

// GET /api/listings/[id] — get a single listing with populated user and collector
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const listing = await WasteListing.findById(id).lean();
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Check authorization
        const isOwner = listing.userId === session.user.id;
        const isCollector = listing.collectorId === session.user.id;
        const isAdmin = session.user.role === 'admin';
        
        if (!isOwner && !isCollector && !isAdmin) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Populate user (citizen) details
        let user = null;
        if (listing.userId) {
            const userDoc = await User.findById(listing.userId).select('name email phone image').lean();
            if (userDoc) {
                user = {
                    _id: userDoc._id.toString(),
                    name: userDoc.name,
                    email: userDoc.email,
                    phone: userDoc.phone,
                    image: userDoc.image,
                };
            }
        }

        // Populate collector details
        let collector = null;
        if (listing.collectorId) {
            const collectorDoc = await User.findById(listing.collectorId).select('name email phone image').lean();
            if (collectorDoc) {
                collector = {
                    _id: collectorDoc._id.toString(),
                    name: collectorDoc.name,
                    email: collectorDoc.email,
                    phone: collectorDoc.phone,
                    image: collectorDoc.image,
                };
            }
        }

        return NextResponse.json({
            ...listing,
            _id: listing._id.toString(),
            user,
            collector,
        });
    } catch (error: any) {
        console.error('Get listing error:', error);
        return NextResponse.json({ error: 'Failed to fetch listing' }, { status: 500 });
    }
}

// DELETE /api/listings/[id] — cancel a pending listing or delete completed/cancelled listing
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();

        const listing = await WasteListing.findById(id);
        if (!listing) {
            return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
        }

        // Check authorization based on role
        const isOwner = listing.userId === session.user.id;
        const isCollector = listing.collectorId === session.user.id && session.user.role === 'collector';
        
        if (!isOwner && !isCollector) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Handle different scenarios
        if (listing.status === 'pending') {
            // Only owner can cancel pending listings
            if (!isOwner) {
                return NextResponse.json({ error: 'Only the owner can cancel pending listings' }, { status: 403 });
            }
            listing.status = 'cancelled';
            await listing.save();
            return NextResponse.json({ success: true, action: 'cancelled' });
        } else if (['cancelled', 'picked_up', 'stored_in_hub'].includes(listing.status)) {
            // Owner or collector can delete completed/cancelled listings
            await WasteListing.findByIdAndDelete(id);
            return NextResponse.json({ success: true, action: 'deleted' });
        } else {
            return NextResponse.json(
                { error: 'Cannot delete listing in current status' },
                { status: 400 }
            );
        }
    } catch (error: any) {
        console.error('Delete listing error:', error);
        return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }
}
