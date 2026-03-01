import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Ticket } from '@/models/Ticket';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { passengerId, pnr, ticketNo, pickup, dropoff, travelDate, startTime, endTime, busId } = await req.json();

        const missingFields = [];
        if (!passengerId) missingFields.push('passengerId');
        if (!pnr) missingFields.push('pnr');
        if (!ticketNo) missingFields.push('ticketNo');
        if (!pickup) missingFields.push('pickup');
        if (!dropoff) missingFields.push('dropoff');
        if (!travelDate) missingFields.push('travelDate');

        if (missingFields.length > 0) {
            console.error('Missing fields in ticket save:', missingFields);
            return NextResponse.json({
                success: false,
                error: `Missing required fields: ${missingFields.join(', ')}`
            }, { status: 400 });
        }

        const ticket = await Ticket.create({
            passengerId,
            pnr,
            ticketNo,
            pickup,
            dropoff,
            travelDate,
            startTime,
            endTime,
            busId
        });

        return NextResponse.json({ success: true, ticket });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
