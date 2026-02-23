import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Conductor } from '@/models/Conductor';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, depo, email, phone, password } = await req.json();

        const existingConductor = await Conductor.findOne({ email });
        if (existingConductor) {
            return NextResponse.json({ success: false, error: 'Conductor with this email already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const conductor = await Conductor.create({
            name,
            depo,
            email,
            phone,
            password: hashedPassword
        });

        return NextResponse.json({
            success: true,
            message: 'Conductor registered successfully',
            conductor: { id: conductor._id, name: conductor.name, email: conductor.email }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
