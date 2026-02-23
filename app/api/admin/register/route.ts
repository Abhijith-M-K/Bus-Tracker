import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { depoName, email, phone, password } = await req.json();

        // Check if admin already exists
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return NextResponse.json({ success: false, error: 'Admin with this email already exists' }, { status: 400 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            depoName,
            email,
            phone,
            password: hashedPassword
        });

        return NextResponse.json({ success: true, message: 'Admin registered successfully' });
    } catch (err: any) {
        console.error('Registration error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
