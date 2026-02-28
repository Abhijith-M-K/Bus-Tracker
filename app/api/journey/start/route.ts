export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey, Bus } from '@/models/Bus';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { busId: searchTermRaw, lat, lng, direction } = await req.json();
        const searchTerm = searchTermRaw?.trim();

        if (!searchTerm || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find the actual bus to get the canonical Bus ID
        const bus = await Bus.findOne({
            $or: [
                { busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') } },
                { mobileNo: searchTerm }
            ]
        });

        const canonicalBusId = bus ? bus.busId : searchTerm;

        // Mark any existing active journeys for this bus as completed (we delete them to keep DB clean)
        await Journey.deleteMany(
            { busId: { $regex: new RegExp(`^${canonicalBusId}$`, 'i') }, status: 'active' }
        );

        const journey = await Journey.create({
            busId: canonicalBusId,
            currentLocation: { lat, lng },
            direction: direction || 'forward',
            status: 'active',
            startTime: new Date(),
        });

        return NextResponse.json({ success: true, journey }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
