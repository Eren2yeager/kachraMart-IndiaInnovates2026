import mongoose, { Schema, Model } from 'mongoose';
import { IWasteListing, WasteType, WasteStatus } from '@/types';

const WasteListingSchema = new Schema<IWasteListing>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    wasteType: {
      type: String,
      enum: ['biodegradable', 'recyclable', 'hazardous', 'ewaste', 'construction'],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'collector_assigned', 'picked_up', 'stored_in_hub', 'sold_to_dealer', 'cancelled'],
      default: 'pending',
      index: true,
    },
    collectorId: {
      type: String,
      index: true,
    },
    assignedHubId: {
      type: String,
      index: true,
    },
    aiConfidence: {
      type: Number,
      min: 0,
      max: 1,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    estimatedValue: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create geospatial index for location-based queries
WasteListingSchema.index({ 'pickupLocation': '2dsphere' });

// Create compound index for efficient queries
WasteListingSchema.index({ userId: 1, status: 1 });
WasteListingSchema.index({ collectorId: 1, status: 1 });
WasteListingSchema.index({ wasteType: 1, status: 1 });

const WasteListing: Model<IWasteListing> =
  mongoose.models.WasteListing || mongoose.model<IWasteListing>('WasteListing', WasteListingSchema);

export default WasteListing;
