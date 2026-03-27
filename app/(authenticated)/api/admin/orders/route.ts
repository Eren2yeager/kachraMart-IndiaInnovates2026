import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import connectDB from '@/lib/db/mongodb';
import Order from '@/models/Order';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const searchQuery = searchParams.get('search');

    // Build filter query
    const filter: any = {};
    
    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      filter.status = statusFilter;
    }

    // Fetch all orders (no dealerId filter for admin)
    let orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Populate dealer information from User model
    const dealerIds = [...new Set(orders.map((order) => order.dealerId))];
    const dealers = await User.find({ _id: { $in: dealerIds } }).lean();
    const dealerMap = new Map(dealers.map((dealer) => [dealer._id.toString(), dealer]));

    // Attach dealer info to orders
    const ordersWithDealers = orders.map((order) => ({
      ...order,
      dealer: dealerMap.get(order.dealerId),
    }));

    // Apply search filter if provided (dealer name or order ID)
    let filteredOrders = ordersWithDealers;
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredOrders = ordersWithDealers.filter((order) => {
        const dealerName = order.dealer?.name?.toLowerCase() || '';
        const orderId = order._id.toString().toLowerCase();
        return dealerName.includes(searchLower) || orderId.includes(searchLower);
      });
    }

    // Calculate pending and approved order counts
    const pendingCount = ordersWithDealers.filter((o) => o.status === 'pending').length;
    const approvedCount = ordersWithDealers.filter((o) => o.status === 'approved').length;

    return NextResponse.json({
      orders: filteredOrders,
      metadata: {
        pendingCount,
        approvedCount,
      },
    });
  } catch (error) {
    console.error('Admin orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
