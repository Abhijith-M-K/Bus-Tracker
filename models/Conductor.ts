import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IConductor extends Document {
    conductorId: string;
    name: string;
    depo: string;
    email: string;
    phone: string;
    password: string;
}

const ConductorSchema = new Schema<IConductor>({
    conductorId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    depo: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
}, { timestamps: true });

// Avoid model recompilation error in Next.js and ensure schema updates are applied
if (models.Conductor) {
    delete (models as any).Conductor;
}
export const Conductor = model<IConductor>('Conductor', ConductorSchema);
