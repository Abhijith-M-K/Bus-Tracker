import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Conductor } from '@/models/Conductor';
import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const depo = searchParams.get('depo');

        const query = depo ? { depo } : {};
        const conductors = await Conductor.find(query).select('-password');
        return NextResponse.json({ success: true, conductors });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const { _id, ...updateData } = await req.json();

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const conductor = await Conductor.findByIdAndUpdate(_id, updateData, { new: true }).select('-password');

        if (!conductor) {
            return NextResponse.json({ success: false, error: 'Conductor not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, conductor });
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

        const conductor = await Conductor.findByIdAndDelete(id);

        if (!conductor) {
            return NextResponse.json({ success: false, error: 'Conductor not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Conductor deleted successfully' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
