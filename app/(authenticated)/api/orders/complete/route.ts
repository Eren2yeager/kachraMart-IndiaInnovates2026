import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import WasteInventory from '@/models/WasteInventory';
import Hub from '@/models/Hub';

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
    const { orderId } = body;

    // Validate required field
    if (!orderId) {
      return NextResponse.json(
        { error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    await connectDB();

    // Validate order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate order status is "approved"
    if (order.status !== 'approved') {
      return NextResponse.json(
        { error: 'Only approved orders can be completed' },
        { status: 400 }
      );
    }

    // Fetch associated inventory record
    if (order.inventoryId) {
      const inventory = await WasteInventory.findById(order.inventoryId);
      
      if (inventory) {
        // Calculate new inventory quantity
        const newQuantity = inventory.quantity - order.quantity;

        if (newQuantity <= 0) {
          // Delete inventory if depleted
          await WasteInventory.findByIdAndDelete(order.inventoryId);
          
          // Update hub currentLoad by decrementing the full inventory quantity
          await Hub.findByIdAndUpdate(inventory.hubId, {
            $inc: { currentLoad: -inventory.quantity },
          });
        } else {
          // Update inventory quantity and unreserve
          await WasteInventory.findByIdAndUpdate(order.inventoryId, {
            quantity: newQuantity,
            reserved: false,
          });
          
          // Update hub currentLoad by decrementing order quantity
          await Hub.findByIdAndUpdate(inventory.hubId, {
            $inc: { currentLoad: -order.quantity },
          });
        }
      }
    }

    // Update order status to "completed"
    order.status = 'completed';
    await order.save();

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order completion error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
