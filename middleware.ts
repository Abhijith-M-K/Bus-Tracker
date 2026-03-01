import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if it's the live tracking view route or the homepage
    if (pathname === '/' || pathname.startsWith('/view/')) {
        const passengerSession = request.cookies.get('passenger_session');
        if (!passengerSession || passengerSession.value !== 'authenticated') {
            const loginUrl = new URL('/passenger/login', request.url);
            // Optionally add a `next` query parameter if you want to redirect them back after logging in
            if (pathname !== '/') {
                loginUrl.searchParams.set('next', pathname);
            }
            return NextResponse.redirect(loginUrl);
        }
    }

    // You can also add other protect route logic here for admin/conductor if needed

    return NextResponse.next();
}

export const config = {
    matcher: ['/', '/view/:path*']
};
