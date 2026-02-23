import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');

    if (!q) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        // Servers-side fetch bypasses CORS and often handles 425 errors better than browser TLS 1.3 0-RTT
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, {
            headers: {
                'User-Agent': 'BusTrackingSystem_Admin_ServerProxy/1.0',
                'Accept-Language': 'en-US,en;q=0.5'
            }
        });

        if (response.status === 429 || response.status === 425) {
            return NextResponse.json({ error: 'Too many requests. Please wait a moment.' }, { status: response.status });
        }

        if (!response.ok) {
            return NextResponse.json({ error: `Geocoding service error: ${response.status}` }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Search Proxy Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
