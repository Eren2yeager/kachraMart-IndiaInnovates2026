import mongoose, { Schema, Model } from 'mongoose';
import { IWasteOrder } from '@/types';

const OrderSchema = new Schema<IWasteOrder>(
  {
    dealerId: {
      type: String,
      required: true,
      index: true,
    },
    wasteType: {
      type: String,
      enum: ['biodegradable', 'recyclable', 'hazardous', 'ewaste', 'construction'],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01,
    },
    pricePerKg: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending',
      required: true,
      index: true,
    },
    inventoryId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index for dealer order queries (sorted by creation date)
OrderSchema.index({ dealerId: 1, createdAt: -1 });

// Compound index for admin filtering by status (sorted by creation date)
OrderSchema.index({ status: 1, createdAt: -1 });

const Order: Model<IWasteOrder> =
  mongoose.models.Order || mongoose.model<IWasteOrder>('Order', OrderSchema);

export default Order;
