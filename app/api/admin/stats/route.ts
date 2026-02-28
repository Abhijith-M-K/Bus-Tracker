import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Bus } from '@/models/Bus';
import { Depo } from '@/models/Depo';
import { Conductor } from '@/models/Conductor';
import { Route } from '@/models/Route';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const depo = searchParams.get('depo');

        const busQuery = depo ? { depo } : {};
        const conductorQuery = depo ? { depo } : {};
        const routeQuery = depo ? { depoName: depo } : {};

        const [busCount, depoCount, conductorCount, routeCount] = await Promise.all([
            Bus.countDocuments(busQuery),
            Depo.countDocuments(),
            Conductor.countDocuments(conductorQuery),
            Route.countDocuments(routeQuery)
        ]);

        return NextResponse.json({
            success: true,
            stats: {
                buses: busCount,
                depos: depoCount,
                conductors: conductorCount,
                routes: routeCount
            }
        });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
