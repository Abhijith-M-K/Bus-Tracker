export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey } from '@/models/Bus';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { busId: searchTermRaw, lat, lng } = await req.json();
        const searchTerm = searchTermRaw?.trim();

        if (!searchTerm || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const journey = await Journey.findOneAndUpdate(
            { busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') }, status: 'active' },
            {
                $set: {
                    currentLocation: { lat, lng },
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        if (!journey) {
            return NextResponse.json({
                error: 'No active journey found for this bus',
                details: "Make sure you started the journey first."
            }, { status: 404 });
        }

        return NextResponse.json({ success: true, journey });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
