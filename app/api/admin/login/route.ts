import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Admin } from '@/models/Admin';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { email, password } = await req.json();

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
        }

        // Create the response
        const response = NextResponse.json({
            success: true,
            message: 'Login successful',
            admin: {
                id: admin._id,
                email: admin.email,
                depoName: admin.depoName
            }
        });

        // Set a cookie (simple version for now)
        response.cookies.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 // 1 day
        });

        return response;
    } catch (err: any) {
        console.error('Login error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
