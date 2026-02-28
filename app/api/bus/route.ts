import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Bus } from '@/models/Bus';
import { Route } from '@/models/Route';
import { Depo } from '@/models/Depo'; // Ensure Depo is registered

// Create a new bus
export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        console.log('API POST /api/bus:', body);
        const { busId, busNumber, routeName, depo, route } = body;

        if (!busId || !busNumber || !routeName || !depo || !route) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        const bus = await Bus.create({
            busId,
            busNumber,
            routeName,
            depo,
            route
        });

        console.log('Bus created:', bus);
        return NextResponse.json({ success: true, bus }, { status: 201 });
    } catch (error: any) {
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Bus ID already exists' }, { status: 400 });
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Get all buses (with optional depo filtering)
export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const depo = searchParams.get('depo');

        const query = depo ? { depo } : {};
        const buses = await Bus.find(query)
            .populate('route')
            .sort({ createdAt: -1 });
        return NextResponse.json({ success: true, buses });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Update a bus
export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { _id, busId, busNumber, routeName, depo, route } = body;

        if (!_id) {
            return NextResponse.json({ error: 'Bus internal ID is required for update' }, { status: 400 });
        }

        const updatedBus = await Bus.findByIdAndUpdate(
            _id,
            { busId, busNumber, routeName, depo, route },
            { new: true }
        ).populate('route');

        if (!updatedBus) {
            return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, bus: updatedBus });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Delete a bus
export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Bus ID is required' }, { status: 400 });
        }

        const deletedBus = await Bus.findByIdAndDelete(id);

        if (!deletedBus) {
            return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Bus deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
