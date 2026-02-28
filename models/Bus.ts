import mongoose, { Schema, Document, model, models } from 'mongoose';
import './Depo';

export interface IBus extends Document {
    busId: string;
    busNumber: string;
    routeName: string;
    conductorName: string;
    mobileNo: string;
    stops: mongoose.Types.ObjectId[];
}

const BusSchema = new Schema<IBus>({
    busId: { type: String, required: true, unique: true },
    busNumber: { type: String, required: true },
    routeName: { type: String, required: true },
    conductorName: { type: String, required: true },
    mobileNo: { type: String, required: true },
    stops: [{ type: Schema.Types.ObjectId, ref: 'Depo' }],
}, { timestamps: true });

export interface IJourney extends Document {
    busId: string;
    status: 'active' | 'completed';
    direction: 'forward' | 'return';
    currentLocation: {
        lat: number;
        lng: number;
    };
    lastUpdated: Date;
    startTime: Date;
    endTime?: Date;
}

const JourneySchema = new Schema<IJourney>({
    busId: { type: String, required: true },
    status: { type: String, enum: ['active', 'completed'], default: 'active' },
    direction: { type: String, enum: ['forward', 'return'], default: 'forward' },
    currentLocation: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
    lastUpdated: { type: Date, default: Date.now },
    startTime: { type: Date, default: Date.now },
    endTime: { type: Date },
});

// Journey index for quick lookup of active journeys by busId
JourneySchema.index({ busId: 1, status: 1 });

// Clear model cache in development to reflect schema changes
if (process.env.NODE_ENV === 'development') {
    delete (mongoose.models as any).Bus;
}

export const Bus = models.Bus || model<IBus>('Bus', BusSchema);
export const Journey = models.Journey || model<IJourney>('Journey', JourneySchema);
