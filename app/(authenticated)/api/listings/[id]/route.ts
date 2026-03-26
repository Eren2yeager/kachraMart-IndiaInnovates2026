import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import WasteListing from '@/models/WasteListing';

// DELETE /api/listings/[id] — cancel a pending listing (citizen only)
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

        // Only the listing owner can cancel
        if (listing.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
        }

        // Only pending listings can be cancelled
        if (listing.status !== 'pending') {
            return NextResponse.json(
                { error: 'Only pending listings can be cancelled' },
                { status: 400 }
            );
        }

        listing.status = 'cancelled';
        await listing.save();

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Cancel listing error:', error);
        return NextResponse.json({ error: 'Failed to cancel listing' }, { status: 500 });
    }
}
