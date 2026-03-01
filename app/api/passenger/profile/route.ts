import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Ticket } from '@/models/Ticket';
import { Passenger } from '@/models/Passenger';

export async function GET(req: Request) {
    try {
        await connectDB();

        const url = new URL(req.url);
        const passengerId = url.searchParams.get('passengerId');

        if (!passengerId) {
            return NextResponse.json({ success: false, error: 'Passenger ID is required' }, { status: 400 });
        }

        const passenger = await Passenger.findById(passengerId);
        if (!passenger) {
            return NextResponse.json({ success: false, error: 'Passenger not found' }, { status: 404 });
        }

        const tickets = await Ticket.find({ passengerId }).sort({ travelDate: -1, createdAt: -1 });

        return NextResponse.json({
            success: true,
            passenger,
            tickets
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
