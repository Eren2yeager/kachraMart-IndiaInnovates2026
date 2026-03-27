import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import WasteInventory from '@/models/WasteInventory';

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate user role is "admin"
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { orderId, action } = body;

    // Validate required fields and action value
    if (!orderId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, action' },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order status is "pending"
    if (order.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only pending orders can be approved or rejected' },
        { status: 400 }
      );
    }

    // Update order status
    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    order.status = newStatus;
    await order.save();

    // If rejected, release inventory reservation
    if (action === 'reject' && order.inventoryId) {
      await WasteInventory.findByIdAndUpdate(order.inventoryId, {
        reserved: false,
      });
    }

    // If approved, maintain reservation (no action needed)

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order approval error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
