import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Conductor } from '@/models/Conductor';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { conductorId, name, depo, email, phone, password } = await req.json();

        if (!conductorId) {
            return NextResponse.json({ success: false, error: 'Conductor ID is required' }, { status: 400 });
        }

        const existingConductor = await Conductor.findOne({ $or: [{ email }, { conductorId }] });
        if (existingConductor) {
            const field = existingConductor.email === email ? 'email' : 'conductor ID';
            return NextResponse.json({ success: false, error: `Conductor with this ${field} already exists` }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const conductor = new Conductor();
        conductor.conductorId = conductorId.toString().trim();
        conductor.name = name;
        conductor.depo = depo;
        conductor.email = email;
        conductor.phone = phone;
        conductor.password = hashedPassword;

        await conductor.save();

        return NextResponse.json({
            success: true,
            message: 'Conductor registered successfully',
            conductor: {
                id: conductor._id,
                name: conductor.name,
                email: conductor.email,
                conductorId: conductor.conductorId
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
