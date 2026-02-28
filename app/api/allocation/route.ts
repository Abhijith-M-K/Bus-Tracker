import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Allocation } from '@/models/Allocation';
import '@/models/Bus';
import '@/models/Conductor';

export async function GET(req: Request) {
    try {
        await connectDB();
        const allocations = await Allocation.find()
            .populate('busId')
            .populate('conductorId')
            .sort({ date: -1 });
        return NextResponse.json({ success: true, allocations });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { busId, conductorId, date } = await req.json();

        if (!busId || !conductorId || !date) {
            return NextResponse.json({ success: false, error: 'Bus, Conductor and Date are required' }, { status: 400 });
        }

        // Check for existing allocations for this bus on this date
        const existingBusAllocation = await Allocation.findOne({ busId, date: new Date(date) });
        if (existingBusAllocation) {
            return NextResponse.json({ success: false, error: 'This bus is already allocated on this date' }, { status: 400 });
        }

        // Check for existing allocations for this conductor on this date
        const existingConductorAllocation = await Allocation.findOne({ conductorId, date: new Date(date) });
        if (existingConductorAllocation) {
            return NextResponse.json({ success: false, error: 'This conductor is already allocated on this date' }, { status: 400 });
        }

        const allocation = await Allocation.create({
            busId,
            conductorId,
            date: new Date(date)
        });

        return NextResponse.json({ success: true, allocation });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
        }

        await Allocation.findByIdAndDelete(id);
        return NextResponse.json({ success: true, message: 'Allocation deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
