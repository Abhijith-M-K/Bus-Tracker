export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey } from '@/models/Bus';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { busId: searchTermRaw } = await req.json();
        const searchTerm = searchTermRaw?.trim();

        if (!searchTerm) {
            return NextResponse.json({ error: 'Missing Bus ID' }, { status: 400 });
        }

        const result = await Journey.deleteMany(
            { busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') }, status: 'active' }
        );

        return NextResponse.json({ success: true, message: 'Journey stopped', deletedCount: result.deletedCount });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
