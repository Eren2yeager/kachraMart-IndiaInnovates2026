import mongoose, { Schema, Model } from 'mongoose';
import { IHub } from '@/types';

const HubSchema = new Schema<IHub>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        location: {
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
        capacity: {
            type: Number,
            required: true,
            min: 1,
        },
        currentLoad: {
            type: Number,
            default: 0,
            min: 0,
        },
        managerId: {
            type: String,
        },
    },
    { timestamps: true }
);

HubSchema.index({ location: '2dsphere' });
HubSchema.index({ name: 'text' });

const Hub: Model<IHub> = mongoose.models.Hub || mongoose.model<IHub>('Hub', HubSchema);

export default Hub;
