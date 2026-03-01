import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
        response.cookies.delete('passenger_session');
        return response;
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
