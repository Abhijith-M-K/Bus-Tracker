import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Conductor } from '@/models/Conductor';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        const conductor = await Conductor.findOne({ email });
        if (!conductor) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, conductor.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            conductor: {
                id: conductor._id,
                email: conductor.email,
                name: conductor.name,
                depo: conductor.depo
            }
        });

        // Set a session cookie
        response.cookies.set('conductor_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
