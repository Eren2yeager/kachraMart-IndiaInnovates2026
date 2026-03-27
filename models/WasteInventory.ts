import mongoose, { Schema, Model } from 'mongoose';
import { IWasteInventory } from '@/types';

const WasteInventorySchema = new Schema<IWasteInventory>(
    {
        wasteType: {
            type: String,
            enum: ['biodegradable', 'recyclable', 'hazardous', 'ewaste', 'construction'],
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 0,
        },
        hubId: {
            type: String,
            required: true,
            index: true,
        },
        verified: {
            type: Boolean,
            default: false,
        },
        reserved: {
            type: Boolean,
            default: false,
            index: true,
        },
        sourceListings: [{ type: String }],
    },
    { timestamps: true }
);

// One record per (hub, wasteType) pair
WasteInventorySchema.index({ hubId: 1, wasteType: 1 }, { unique: true });

const WasteInventory: Model<IWasteInventory> =
    mongoose.models.WasteInventory ||
    mongoose.model<IWasteInventory>('WasteInventory', WasteInventorySchema);

export default WasteInventory;
