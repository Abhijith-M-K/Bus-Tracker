import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
    passengerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Passenger',
        required: true
    },
    pnr: {
        type: String,
        required: true
    },
    ticketNo: {
        type: String,
        required: true
    },
    pickup: {
        type: String,
        required: true
    },
    dropoff: {
        type: String,
        required: true
    },
    travelDate: {
        type: Date,
        required: true
    },
    startTime: String,
    endTime: String,
    busId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

if (mongoose.models.Ticket) {
    delete mongoose.models.Ticket;
}
export const Ticket = mongoose.model('Ticket', ticketSchema);
