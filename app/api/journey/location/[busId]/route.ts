export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey, Bus } from '@/models/Bus';
import { Depo } from '@/models/Depo'; // Ensure Depo is registered

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
        }).populate('route');

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

        // Ensure we have the full bus document for the journey
        let currentBus = bus;
        if (!currentBus) {
            currentBus = await Bus.findOne({ busId: journey.busId }).populate('route');
        }

        const address = await getAddress(journey.currentLocation.lat, journey.currentLocation.lng);

        // Handle Directional Route Reversal
        let processedBus = currentBus ? JSON.parse(JSON.stringify(currentBus)) : null;
        if (processedBus && journey.direction === 'return') {
            // Reverse Route IDs/Stops
            if (processedBus.route && Array.isArray(processedBus.route)) {
                processedBus.route.reverse();
            }
            // Reverse Route Name (Source - Destination -> Destination - Source)
            if (processedBus.routeName && processedBus.routeName.includes(' - ')) {
                processedBus.routeName = processedBus.routeName.split(' - ').reverse().join(' - ');
            }
        }

        // Map 'route' to 'stops' for frontend compatibility
        if (processedBus) {
            processedBus.stops = processedBus.route;

            // NEW: Fetch today's allocation for this bus
            try {
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Use a wider range to account for potential UTC/Local timezone shifts (±12h)
                const searchStart = new Date(today.getTime() - 12 * 60 * 60 * 1000);
                const searchEnd = new Date(today.getTime() + 36 * 60 * 60 * 1000);

                const { Allocation } = await import('@/models/Allocation');
                const { Conductor } = await import('@/models/Conductor');

                console.log(`Searching allocation for bus: ${currentBus._id}, range: ${searchStart.toISOString()} - ${searchEnd.toISOString()}`);

                const allocation = await Allocation.findOne({
                    busId: currentBus._id,
                    date: {
                        $gte: searchStart,
                        $lt: searchEnd
                    }
                }).populate('conductorId');

                if (allocation && allocation.conductorId && processedBus) {
                    console.log(`Found allocation: ${allocation._id} with conductor: ${allocation.conductorId.name}`);
                    processedBus.conductorName = allocation.conductorId.name;
                    processedBus.conductorId = allocation.conductorId.conductorId;
                    processedBus.mobileNo = allocation.conductorId.phone;
                } else {
                    console.log('No allocation found in range, conductorId missing, or processedBus is null');
                }
            } catch (allocError) {
                console.error('Error fetching allocation for passenger view:', allocError);
            }
        }

        return NextResponse.json({
            success: true,
            journey,
            busDetails: processedBus,
            address
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
