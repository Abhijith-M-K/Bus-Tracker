import mongoose, { Schema, Document, model, models } from 'mongoose';

export interface IAllocation extends Document {
    busId: mongoose.Types.ObjectId;
    conductorId: mongoose.Types.ObjectId;
    date: Date;
}

const AllocationSchema = new Schema<IAllocation>({
    busId: { type: Schema.Types.ObjectId, ref: 'Bus', required: true },
    conductorId: { type: Schema.Types.ObjectId, ref: 'Conductor', required: true },
    date: { type: Date, required: true },
}, { timestamps: true });

// Ensure a bus is only assigned to one conductor on a specific date (and vice-versa)
AllocationSchema.index({ busId: 1, date: 1 }, { unique: true });
AllocationSchema.index({ conductorId: 1, date: 1 }, { unique: true });

export const Allocation = models.Allocation || model<IAllocation>('Allocation', AllocationSchema);
