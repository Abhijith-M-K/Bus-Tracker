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

        return NextResponse.json({ success: true, bus });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
