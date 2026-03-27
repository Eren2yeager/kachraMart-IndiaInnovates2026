import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import WasteInventory from '@/models/WasteInventory';
import { WASTE_PRICES } from '@/config/constants';
import { WasteType } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validate user role is "dealer"
    if (session.user.role !== 'dealer') {
      return NextResponse.json(
        { error: 'Only dealers can create orders' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const { inventoryId, quantity } = body;

    if (!inventoryId || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields: inventoryId, quantity' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check inventory exists and is available
    const inventory = await WasteInventory.findById(inventoryId);

    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventory not found' },
        { status: 404 }
      );
    }

    // Check if inventory is already reserved
    if (inventory.reserved) {
      return NextResponse.json(
        { error: 'Inventory already reserved' },
        { status: 400 }
      );
    }

    // Check sufficient quantity
    if (inventory.quantity < quantity) {
      return NextResponse.json(
        { error: 'Insufficient inventory quantity' },
        { status: 400 }
      );
    }

    // Calculate pricePerKg from WASTE_PRICES
    const pricePerKg = WASTE_PRICES[inventory.wasteType as WasteType] || 0;

    // Calculate totalPrice
    const totalPrice = parseFloat((quantity * pricePerKg).toFixed(2));

    // Create Order record with status "pending"
    const order = await Order.create({
      dealerId: session.user.id,
      wasteType: inventory.wasteType,
      quantity,
      pricePerKg,
      totalPrice,
      status: 'pending',
      inventoryId: inventory._id.toString(),
    });

    // Reserve inventory by setting reserved: true
    inventory.reserved = true;
    await inventory.save();

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
