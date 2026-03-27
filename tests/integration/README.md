# Integration Tests

This directory contains end-to-end integration tests for the KachraMart application.

## Order Workflow Integration Test

**File:** `order-workflow.test.ts`

**Purpose:** Tests the complete dealer marketplace and inventory system workflow from order creation through completion.

### What It Tests

1. **Marketplace Browsing** - Dealer can browse verified, available inventory
2. **Order Creation** - Dealer can create orders with proper validation
3. **Inventory Reservation** - Inventory is reserved when order is created
4. **Order Approval** - Admin can approve pending orders
5. **Order Completion** - Admin can complete approved orders
6. **Inventory Deduction** - Inventory quantity is reduced after completion
7. **Hub Load Update** - Hub currentLoad is decremented correctly
8. **Rejection Workflow** - Orders can be rejected and inventory is released

### Running the Test

```bash
npm run test:integration
```

### Prerequisites

- MongoDB must be running locally on `mongodb://127.0.0.1:27017/kachramart`
- Environment variables must be configured in `.env.local`

### Test Flow

#### Happy Path (Order Completion)
```
1. Create test data (hub, inventory, dealer, admin)
2. Browse marketplace → Verify inventory is visible
3. Create order → Verify order status is "pending"
4. Reserve inventory → Verify inventory.reserved = true
5. Approve order → Verify order status is "approved"
6. Complete order → Verify order status is "completed"
7. Check inventory → Verify quantity reduced and unreserved
8. Check hub → Verify currentLoad decremented
9. Cleanup test data
```

#### Rejection Path
```
1. Create order → Reserve inventory
2. Reject order → Verify order status is "rejected"
3. Check inventory → Verify inventory.reserved = false
4. Verify quantity unchanged
```

### Test Data

The test creates temporary test data:
- 1 test hub with 500 kg currentLoad
- 2 inventory records (100 kg recyclable, 50 kg ewaste)
- 1 dealer user
- 1 admin user
- 2 orders (one for completion, one for rejection)

All test data is automatically cleaned up after the test completes.

### Expected Output

```
🚀 Starting Order Workflow Integration Tests
============================================================

✅ Connected to MongoDB

🔧 Setting up test data...
✅ Created test hub
✅ Created test inventory
...

📋 Test 1: Dealer can browse marketplace
✅ Test 1 PASSED: Marketplace returns verified, available inventory

...

============================================================
🎉 ALL TESTS PASSED! 🎉
============================================================

Summary:
✅ Dealer can browse marketplace
✅ Dealer can create order
✅ Inventory is reserved after order creation
✅ Admin can approve order
✅ Admin can complete order
✅ Inventory is deducted after completion
✅ Hub currentLoad is updated
✅ Rejection workflow works correctly

🧹 Cleaning up test data...
✅ Cleanup complete
✅ Disconnected from MongoDB
```

### Troubleshooting

**Error: "Please define the MONGODB_URI environment variable"**
- Ensure `.env.local` exists with `MONGODB_URI` set
- The test uses `tsx --env-file=.env.local` to load environment variables

**Error: "Connection refused"**
- Ensure MongoDB is running locally
- Check that MongoDB is accessible at the URI specified in `.env.local`

**Test failures**
- Check that all API routes are implemented correctly
- Verify database models have the correct schema
- Ensure the database is in a clean state before running tests

### Validating Requirements

This integration test validates all requirements from the dealer-marketplace-and-inventory spec:

- **Requirements 1.1-1.5**: Marketplace inventory listing
- **Requirements 2.1-2.5**: Inventory filtering (tested via database queries)
- **Requirements 5.1-5.6**: Order creation system
- **Requirements 7.1-7.5**: Inventory reservation system
- **Requirements 8.1-8.6**: Order approval workflow
- **Requirements 9.1-9.6**: Order completion system

### Notes

- This is a database-level integration test, not an HTTP API test
- It directly tests the database operations that the API routes perform
- For HTTP-level testing, consider adding API integration tests using supertest or similar
