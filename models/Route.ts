import mongoose, { Schema, Document, model, models } from 'mongoose';
import './Depo';

export interface IRoute extends Document {
    name: string;
    depoName: string; // The depo this route belongs to
    location: {
        lat: number;
        lng: number;
    };
}

const RouteSchema = new Schema<IRoute>({
    name: { type: String, required: true },
    depoName: { type: String, required: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
}, { timestamps: true });

// Clear model cache in development
if (process.env.NODE_ENV === 'development') {
    delete (mongoose.models as any).Route;
}

export const Route = models.Route || model<IRoute>('Route', RouteSchema);
