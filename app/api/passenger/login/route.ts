import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Passenger } from '@/models/Passenger';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ success: false, error: 'Please provide email and password' }, { status: 400 });
        }

        const passenger = await Passenger.findOne({ email }).select('+password');
        if (!passenger) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, passenger.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            passenger: {
                id: passenger._id,
                email: passenger.email,
                name: passenger.name,
                phone: passenger.phone
            }
        });

        // Set a session cookie
        response.cookies.set('passenger_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 days
        });

        return response;
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
