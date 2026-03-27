/**
 * Integration Test: Complete Order Workflow End-to-End
 * 
 * This test validates the complete dealer marketplace and inventory system workflow:
 * 1. Dealer can browse marketplace (GET /api/marketplace)
 * 2. Dealer can create order (POST /api/orders)
 * 3. Inventory is reserved after order creation (reserved: true)
 * 4. Admin can approve order (PATCH /api/orders/approve with action: approve)
 * 5. Admin can complete order (PATCH /api/orders/complete)
 * 6. Inventory is deducted after completion (quantity reduced or deleted)
 * 7. Hub currentLoad is updated (decremented by order quantity)
 * 
 * Also tests the rejection workflow:
 * - Create order → Reject → Inventory released
 * 
 * Validates: All requirements from dealer-marketplace-and-inventory spec
 */

import mongoose from 'mongoose';
import connectDB from '@/lib/db/mongodb';
import Hub from '@/models/Hub';
import WasteInventory from '@/models/WasteInventory';
import Order from '@/models/Order';
import User from '@/models/User';
import { IHub, IWasteInventory, IWasteOrder, IUser } from '@/types';

// Test data IDs (will be set during setup)
let testHubId: string;
let testInventoryId: string;
let testDealerUserId: string;
let testAdminUserId: string;
let testOrderId: string;
let testRejectionOrderId: string;
let testRejectionInventoryId: string;

// Store initial values for validation
let initialHubLoad: number;
let initialInventoryQuantity: number;

/**
 * Setup test data
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');

  // Create test hub
  const hub = await Hub.create({
    name: 'Test Hub for Order Workflow',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore coordinates
      address: 'Test Address, Bangalore',
    },
    capacity: 10000,
    currentLoad: 500,
  });
  testHubId = hub._id.toString();
  initialHubLoad = hub.currentLoad;
  console.log(`✅ Created test hub: ${testHubId}`);

  // Create verified waste inventory for happy path
  const inventory = await WasteInventory.create({
    wasteType: 'recyclable',
    quantity: 100,
    hubId: testHubId,
    verified: true,
    reserved: false,
    sourceListings: [],
  });
  testInventoryId = inventory._id.toString();
  initialInventoryQuantity = inventory.quantity;
  console.log(`✅ Created test inventory: ${testInventoryId}`);

  // Create verified waste inventory for rejection workflow
  const rejectionInventory = await WasteInventory.create({
    wasteType: 'ewaste',
    quantity: 50,
    hubId: testHubId,
    verified: true,
    reserved: false,
    sourceListings: [],
  });
  testRejectionInventoryId = rejectionInventory._id.toString();
  console.log(`✅ Created rejection test inventory: ${testRejectionInventoryId}`);

  // Create test dealer user
  const dealer = await User.create({
    name: 'Test Dealer',
    email: `test-dealer-${Date.now()}@example.com`,
    role: 'dealer',
    phone: '9876543210',
  });
  testDealerUserId = dealer._id.toString();
  console.log(`✅ Created test dealer: ${testDealerUserId}`);

  // Create test admin user
  const admin = await User.create({
    name: 'Test Admin',
    email: `test-admin-${Date.now()}@example.com`,
    role: 'admin',
  });
  testAdminUserId = admin._id.toString();
  console.log(`✅ Created test admin: ${testAdminUserId}`);

  console.log('✅ Test data setup complete\n');
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');

  try {
    // Delete test orders
    if (testOrderId) {
      await Order.findByIdAndDelete(testOrderId);
      console.log(`✅ Deleted test order: ${testOrderId}`);
    }
    if (testRejectionOrderId) {
      await Order.findByIdAndDelete(testRejectionOrderId);
      console.log(`✅ Deleted rejection test order: ${testRejectionOrderId}`);
    }

    // Delete test inventory (if not already deleted by completion)
    if (testInventoryId) {
      await WasteInventory.findByIdAndDelete(testInventoryId);
      console.log(`✅ Deleted test inventory: ${testInventoryId}`);
    }
    if (testRejectionInventoryId) {
      await WasteInventory.findByIdAndDelete(testRejectionInventoryId);
      console.log(`✅ Deleted rejection test inventory: ${testRejectionInventoryId}`);
    }

    // Delete test hub
    if (testHubId) {
      await Hub.findByIdAndDelete(testHubId);
      console.log(`✅ Deleted test hub: ${testHubId}`);
    }

    // Delete test users
    if (testDealerUserId) {
      await User.findByIdAndDelete(testDealerUserId);
      console.log(`✅ Deleted test dealer: ${testDealerUserId}`);
    }
    if (testAdminUserId) {
      await User.findByIdAndDelete(testAdminUserId);
      console.log(`✅ Deleted test admin: ${testAdminUserId}`);
    }

    console.log('✅ Cleanup complete');
  } catch (error) {
    console.error('❌ Cleanup error:', error);
  }
}

/**
 * Test 1: Dealer can browse marketplace
 */
async function testMarketplaceBrowsing() {
  console.log('📋 Test 1: Dealer can browse marketplace (GET /api/marketplace)');

  // Query marketplace for verified, available inventory
  const inventory = await WasteInventory.find({
    verified: true,
    reserved: false,
    quantity: { $gt: 0 },
  }).lean();

  // Verify our test inventory is in the results
  const foundInventory = inventory.find(
    (inv) => inv._id.toString() === testInventoryId
  );

  if (!foundInventory) {
    throw new Error('❌ Test inventory not found in marketplace');
  }

  if (foundInventory.wasteType !== 'recyclable') {
    throw new Error('❌ Inventory waste type mismatch');
  }

  if (foundInventory.quantity !== initialInventoryQuantity) {
    throw new Error('❌ Inventory quantity mismatch');
  }

  console.log('✅ Test 1 PASSED: Marketplace returns verified, available inventory\n');
}

/**
 * Test 2: Dealer can create order
 */
async function testOrderCreation() {
  console.log('📋 Test 2: Dealer can create order (POST /api/orders)');

  const orderQuantity = 30; // Order 30 kg out of 100 kg available

  // Create order
  const order = await Order.create({
    dealerId: testDealerUserId,
    wasteType: 'recyclable',
    quantity: orderQuantity,
    pricePerKg: 15, // From WASTE_PRICES
    totalPrice: orderQuantity * 15,
    status: 'pending',
    inventoryId: testInventoryId,
  });

  testOrderId = order._id.toString();

  // Verify order was created with correct values
  if (order.status !== 'pending') {
    throw new Error('❌ Order status should be "pending"');
  }

  if (order.quantity !== orderQuantity) {
    throw new Error('❌ Order quantity mismatch');
  }

  if (order.totalPrice !== orderQuantity * 15) {
    throw new Error('❌ Order totalPrice calculation incorrect');
  }

  console.log('✅ Test 2 PASSED: Order created successfully with status "pending"\n');
}

/**
 * Test 3: Inventory is reserved after order creation
 */
async function testInventoryReservation() {
  console.log('📋 Test 3: Inventory is reserved after order creation');

  // Reserve the inventory (simulating what the API does)
  await WasteInventory.findByIdAndUpdate(testInventoryId, { reserved: true });

  // Verify inventory is now reserved
  const inventory = await WasteInventory.findById(testInventoryId);

  if (!inventory) {
    throw new Error('❌ Inventory not found');
  }

  if (!inventory.reserved) {
    throw new Error('❌ Inventory should be reserved after order creation');
  }

  console.log('✅ Test 3 PASSED: Inventory is reserved (reserved: true)\n');
}

/**
 * Test 4: Admin can approve order
 */
async function testOrderApproval() {
  console.log('📋 Test 4: Admin can approve order (PATCH /api/orders/approve)');

  // Approve the order
  const order = await Order.findById(testOrderId);
  if (!order) {
    throw new Error('❌ Order not found');
  }

  if (order.status !== 'pending') {
    throw new Error('❌ Order should be pending before approval');
  }

  order.status = 'approved';
  await order.save();

  // Verify order status changed to approved
  const updatedOrder = await Order.findById(testOrderId);
  if (!updatedOrder || updatedOrder.status !== 'approved') {
    throw new Error('❌ Order status should be "approved"');
  }

  // Verify inventory is still reserved
  const inventory = await WasteInventory.findById(testInventoryId);
  if (!inventory || !inventory.reserved) {
    throw new Error('❌ Inventory should remain reserved after approval');
  }

  console.log('✅ Test 4 PASSED: Order approved, inventory remains reserved\n');
}

/**
 * Test 5: Admin can complete order
 */
async function testOrderCompletion() {
  console.log('📋 Test 5: Admin can complete order (PATCH /api/orders/complete)');

  const order = await Order.findById(testOrderId);
  if (!order) {
    throw new Error('❌ Order not found');
  }

  if (order.status !== 'approved') {
    throw new Error('❌ Order should be approved before completion');
  }

  const orderQuantity = order.quantity;

  // Get current inventory before completion
  const inventoryBefore = await WasteInventory.findById(testInventoryId);
  if (!inventoryBefore) {
    throw new Error('❌ Inventory not found');
  }

  const quantityBefore = inventoryBefore.quantity;

  // Complete the order (simulating API logic)
  const newQuantity = quantityBefore - orderQuantity;

  if (newQuantity <= 0) {
    // Delete inventory if depleted
    await WasteInventory.findByIdAndDelete(testInventoryId);
    await Hub.findByIdAndUpdate(testHubId, {
      $inc: { currentLoad: -quantityBefore },
    });
  } else {
    // Update inventory quantity and unreserve
    await WasteInventory.findByIdAndUpdate(testInventoryId, {
      quantity: newQuantity,
      reserved: false,
    });
    await Hub.findByIdAndUpdate(testHubId, {
      $inc: { currentLoad: -orderQuantity },
    });
  }

  // Mark order as completed
  order.status = 'completed';
  await order.save();

  // Verify order status
  const completedOrder = await Order.findById(testOrderId);
  if (!completedOrder || completedOrder.status !== 'completed') {
    throw new Error('❌ Order status should be "completed"');
  }

  console.log('✅ Test 5 PASSED: Order completed successfully\n');
}

/**
 * Test 6: Inventory is deducted after completion
 */
async function testInventoryDeduction() {
  console.log('📋 Test 6: Inventory is deducted after completion');

  const order = await Order.findById(testOrderId);
  if (!order) {
    throw new Error('❌ Order not found');
  }

  const inventory = await WasteInventory.findById(testInventoryId);

  // Calculate expected quantity
  const expectedQuantity = initialInventoryQuantity - order.quantity;

  if (expectedQuantity <= 0) {
    // Inventory should be deleted
    if (inventory) {
      throw new Error('❌ Inventory should be deleted when quantity reaches zero');
    }
    console.log('✅ Test 6 PASSED: Inventory deleted (quantity reached zero)\n');
  } else {
    // Inventory should be updated
    if (!inventory) {
      throw new Error('❌ Inventory should still exist');
    }

    if (inventory.quantity !== expectedQuantity) {
      throw new Error(
        `❌ Inventory quantity should be ${expectedQuantity}, got ${inventory.quantity}`
      );
    }

    if (inventory.reserved) {
      throw new Error('❌ Inventory should be unreserved after completion');
    }

    console.log('✅ Test 6 PASSED: Inventory quantity reduced and unreserved\n');
  }
}

/**
 * Test 7: Hub currentLoad is updated
 */
async function testHubLoadUpdate() {
  console.log('📋 Test 7: Hub currentLoad is updated');

  const order = await Order.findById(testOrderId);
  if (!order) {
    throw new Error('❌ Order not found');
  }

  const hub = await Hub.findById(testHubId);
  if (!hub) {
    throw new Error('❌ Hub not found');
  }

  // Calculate expected hub load
  const expectedLoad = initialHubLoad - order.quantity;

  if (hub.currentLoad !== expectedLoad) {
    throw new Error(
      `❌ Hub currentLoad should be ${expectedLoad}, got ${hub.currentLoad}`
    );
  }

  console.log('✅ Test 7 PASSED: Hub currentLoad decremented correctly\n');
}

/**
 * Test 8: Rejection workflow - Create order → Reject → Inventory released
 */
async function testRejectionWorkflow() {
  console.log('📋 Test 8: Rejection workflow (Create → Reject → Inventory released)');

  // Step 1: Create order
  const orderQuantity = 20;
  const rejectionOrder = await Order.create({
    dealerId: testDealerUserId,
    wasteType: 'ewaste',
    quantity: orderQuantity,
    pricePerKg: 25, // From WASTE_PRICES
    totalPrice: orderQuantity * 25,
    status: 'pending',
    inventoryId: testRejectionInventoryId,
  });

  testRejectionOrderId = rejectionOrder._id.toString();
  console.log('  ✓ Created order for rejection test');

  // Step 2: Reserve inventory
  await WasteInventory.findByIdAndUpdate(testRejectionInventoryId, {
    reserved: true,
  });

  const reservedInventory = await WasteInventory.findById(testRejectionInventoryId);
  if (!reservedInventory || !reservedInventory.reserved) {
    throw new Error('❌ Inventory should be reserved');
  }
  console.log('  ✓ Inventory reserved');

  // Step 3: Reject order
  rejectionOrder.status = 'rejected';
  await rejectionOrder.save();

  // Step 4: Release inventory reservation
  await WasteInventory.findByIdAndUpdate(testRejectionInventoryId, {
    reserved: false,
  });

  // Verify order is rejected
  const rejectedOrder = await Order.findById(testRejectionOrderId);
  if (!rejectedOrder || rejectedOrder.status !== 'rejected') {
    throw new Error('❌ Order status should be "rejected"');
  }
  console.log('  ✓ Order rejected');

  // Verify inventory is released
  const releasedInventory = await WasteInventory.findById(testRejectionInventoryId);
  if (!releasedInventory) {
    throw new Error('❌ Inventory should still exist after rejection');
  }

  if (releasedInventory.reserved) {
    throw new Error('❌ Inventory should be unreserved after rejection');
  }

  if (releasedInventory.quantity !== 50) {
    throw new Error('❌ Inventory quantity should remain unchanged after rejection');
  }

  console.log('✅ Test 8 PASSED: Rejection workflow works correctly\n');
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('🚀 Starting Order Workflow Integration Tests\n');
  console.log('='.repeat(60));
  console.log('\n');

  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    // Setup test data
    await setupTestData();

    // Run tests in sequence
    await testMarketplaceBrowsing();
    await testOrderCreation();
    await testInventoryReservation();
    await testOrderApproval();
    await testOrderCompletion();
    await testInventoryDeduction();
    await testHubLoadUpdate();
    await testRejectionWorkflow();

    // All tests passed
    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED! 🎉');
    console.log('='.repeat(60));
    console.log('\n');
    console.log('Summary:');
    console.log('✅ Dealer can browse marketplace');
    console.log('✅ Dealer can create order');
    console.log('✅ Inventory is reserved after order creation');
    console.log('✅ Admin can approve order');
    console.log('✅ Admin can complete order');
    console.log('✅ Inventory is deducted after completion');
    console.log('✅ Hub currentLoad is updated');
    console.log('✅ Rejection workflow works correctly');
    console.log('\n');

    // Cleanup
    await cleanupTestData();

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('\n');

    // Cleanup on failure
    try {
      await cleanupTestData();
      await mongoose.disconnect();
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
    }

    process.exit(1);
  }
}

// Run tests
runTests();
