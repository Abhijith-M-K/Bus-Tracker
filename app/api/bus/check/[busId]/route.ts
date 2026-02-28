export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Bus } from '@/models/Bus';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ busId: string }> }
) {
    try {
        await connectDB();
        const { busId: searchTermRaw } = await params;
        const searchTerm = searchTermRaw.trim();

        const bus = await Bus.findOne({
            $or: [
                { busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') } },
                { mobileNo: searchTerm }
            ]
        });

        if (!bus) {
            return NextResponse.json({ error: 'Bus not registered' }, { status: 404 });
        }

        // NEW: Fetch today's allocation for this bus to populate conductor details
        let processedBus = JSON.parse(JSON.stringify(bus));
        try {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Use a wider range to account for potential UTC/Local timezone shifts (±12h)
            const searchStart = new Date(today.getTime() - 12 * 60 * 60 * 1000);
            const searchEnd = new Date(today.getTime() + 36 * 60 * 60 * 1000);

            const { Allocation } = await import('@/models/Allocation');
            const { Conductor } = await import('@/models/Conductor');

            const allocation = await Allocation.findOne({
                busId: bus._id,
                date: {
                    $gte: searchStart,
                    $lt: searchEnd
                }
            }).populate('conductorId');

            if (allocation && allocation.conductorId) {
                processedBus.conductorName = allocation.conductorId.name;
                processedBus.mobileNo = allocation.conductorId.phone;
                processedBus.conductorIdString = allocation.conductorId.conductorId;
            }
        } catch (allocError) {
            console.error('Error fetching allocation for conductor view:', allocError);
        }

        return NextResponse.json({ success: true, bus: processedBus });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
