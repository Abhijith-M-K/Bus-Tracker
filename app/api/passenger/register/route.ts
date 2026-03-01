import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Passenger } from '@/models/Passenger';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { name, email, phone, password } = await req.json();

        if (!name || !email || !phone || !password) {
            return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
        }

        // Check if passenger already exists
        const existingPassenger = await Passenger.findOne({ email });
        if (existingPassenger) {
            return NextResponse.json({ success: false, error: 'Passenger with this email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        await Passenger.create({
            name,
            email,
            phone,
            password: hashedPassword
        });

        return NextResponse.json({ success: true, message: 'Registration successful' });
    } catch (err: any) {
        console.error('Registration error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
