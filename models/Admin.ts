import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IAdmin extends Document {
    depoName: string;
    email: string;
    phone: string;
    password: string;
}

const AdminSchema = new Schema<IAdmin>({
    depoName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
}, { timestamps: true });

// Clear model cache in development
if (process.env.NODE_ENV === 'development') {
    delete (mongoose.models as any).Admin;
}

export const Admin = models.Admin || model<IAdmin>('Admin', AdminSchema);
