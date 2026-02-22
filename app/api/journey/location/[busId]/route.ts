export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey, Bus } from '@/models/Bus';

async function getAddress(lat: number, lng: number) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                'User-Agent': 'BusTrackerApp/1.0'
            }
        });
        const data = await res.json();
        return data.display_name || 'Unknown Location';
    } catch (error) {
        return 'Location name unavailable';
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ busId: string }> }
) {
    try {
        await connectDB();
        const { busId: searchTermRaw } = await params;
        const searchTerm = searchTermRaw.trim();

        // Case-insensitive search for Bus ID or Mobile Number
        const bus = await Bus.findOne({
            $or: [
                { busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') } },
                { mobileNo: searchTerm }
            ]
        });

        const queryBusId = bus ? bus.busId : searchTerm;

        const journey = await Journey.findOne({
            busId: queryBusId,
            status: 'active'
        }).sort({ lastUpdated: -1 });

        if (!journey) {
            return NextResponse.json({
                error: 'No active journey found',
                details: bus ? `Bus ${bus.busNumber} is registered but not active.` : 'Bus not found.'
            }, { status: 404 });
        }

        const address = await getAddress(journey.currentLocation.lat, journey.currentLocation.lng);

        return NextResponse.json({
            success: true,
            journey,
            busDetails: bus || null,
            address
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
