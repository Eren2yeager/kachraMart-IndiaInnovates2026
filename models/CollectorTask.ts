import mongoose, { Schema, Model } from 'mongoose';
import { ICollectorTask, CollectorTaskStatus } from '@/types';

const CollectorTaskSchema = new Schema<ICollectorTask>(
  {
    collectorId: {
      type: String,
      required: true,
      index: true,
    },
    wasteListingId: {
      type: String,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['assigned', 'accepted', 'on_the_way', 'picked', 'delivered'],
      default: 'assigned',
      required: true,
      index: true,
    },
    route: {
      distance: {
        type: Number,
        min: 0,
      },
      duration: {
        type: Number,
        min: 0,
      },
      polyline: {
        type: String,
      },
    },
    currentLocation: {
      type: [Number], // [longitude, latitude]
      validate: {
        validator: function(v: number[]) {
          return v.length === 2 && 
                 v[0] >= -180 && v[0] <= 180 && 
                 v[1] >= -90 && v[1] <= 90;
        },
        message: 'Invalid coordinates format. Must be [longitude, latitude]',
      },
    },
    locationHistory: [
      {
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create compound indexes for efficient queries
CollectorTaskSchema.index({ collectorId: 1, status: 1 });
CollectorTaskSchema.index({ wasteListingId: 1, status: 1 });
CollectorTaskSchema.index({ status: 1, createdAt: -1 });

// Create geospatial index for location-based queries
CollectorTaskSchema.index({ currentLocation: '2dsphere' });

const CollectorTask: Model<ICollectorTask> =
  mongoose.models.CollectorTask || mongoose.model<ICollectorTask>('CollectorTask', CollectorTaskSchema);

export default CollectorTask;
