import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Route } from '@/models/Route';
import { Depo } from '@/models/Depo'; // Ensure Depo is registered

export async function POST(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { name, depoName, location } = body;

        if (!name || !depoName || !location) {
            return NextResponse.json({ success: false, error: 'Name, Depo, and Location are required' }, { status: 400 });
        }

        const route = await Route.create({ name, depoName, location });
        return NextResponse.json({ success: true, route }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const depo = searchParams.get('depo');

        const query = depo ? { depoName: depo } : {};
        const routes = await Route.find(query).sort({ name: 1 });
        return NextResponse.json({ success: true, routes });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const body = await req.json();
        const { _id, name, depoName, location } = body;

        if (!_id) {
            return NextResponse.json({ success: false, error: 'Route ID is required' }, { status: 400 });
        }

        const updatedRoute = await Route.findByIdAndUpdate(
            _id,
            { name, depoName, location },
            { new: true }
        );

        if (!updatedRoute) {
            return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, route: updatedRoute });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ success: false, error: 'Route ID is required' }, { status: 400 });
        }

        const deletedRoute = await Route.findByIdAndDelete(id);

        if (!deletedRoute) {
            return NextResponse.json({ success: false, error: 'Route not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Route deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
