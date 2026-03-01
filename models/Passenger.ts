import mongoose from 'mongoose';

const passengerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email',
        ],
    },
    phone: {
        type: String,
        required: [true, 'Please provide a phone number'],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

export const Passenger = mongoose.models?.Passenger || mongoose.model('Passenger', passengerSchema);
