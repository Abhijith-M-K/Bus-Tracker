import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IDepo extends Document {
    name: string;
    location: {
        lat: number;
        lng: number;
    };
}

const DepoSchema = new Schema<IDepo>({
    name: { type: String, required: true, unique: true },
    location: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
    },
}, { timestamps: true });

export const Depo = models.Depo || model<IDepo>('Depo', DepoSchema);
