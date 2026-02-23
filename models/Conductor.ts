import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IConductor extends Document {
    name: string;
    depo: string;
    email: string;
    phone: string;
    password: string;
}

const ConductorSchema = new Schema<IConductor>({
    name: { type: String, required: true },
    depo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
}, { timestamps: true });

export const Conductor = models.Conductor || model<IConductor>('Conductor', ConductorSchema);
