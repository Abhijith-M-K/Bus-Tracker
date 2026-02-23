import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Depo } from '@/models/Depo';

export async function GET() {
    try {
        await connectDB();
        const depos = await Depo.find({}).sort({ name: 1 });
        return NextResponse.json({ success: true, depos });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const data = await req.json();
        const depo = await Depo.create(data);
        return NextResponse.json({ success: true, depo });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        await connectDB();
        const { _id, ...data } = await req.json();
        const depo = await Depo.findByIdAndUpdate(_id, data, { new: true });
        if (!depo) return NextResponse.json({ success: false, error: 'Depo not found' }, { status: 404 });
        return NextResponse.json({ success: true, depo });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ success: false, error: 'ID required' }, { status: 400 });
        await Depo.findByIdAndDelete(id);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
