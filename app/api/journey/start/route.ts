export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey, Bus } from '@/models/Bus';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { busId: searchTermRaw, lat, lng, direction, conductorName, conductorPhone } = await req.json();
        const searchTerm = searchTermRaw?.trim();

        if (!searchTerm || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Find the actual bus to get the canonical Bus ID
        console.log('Journey Start Search Term:', searchTerm);
        const bus = await Bus.findOne({
            $or: [
                { busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') } },
                { busNumber: { $regex: new RegExp(`^${searchTerm}$`, 'i') } },
                { mobileNo: searchTerm }
            ]
        });
        console.log('Bus Found:', bus ? `${bus.busId} (${bus.busNumber})` : 'NOT FOUND');

        const canonicalBusId = bus ? bus.busId : searchTerm;

        // Mark any existing active journeys for this bus as completed (we delete them to keep DB clean)
        // Skip deleting journeys created in the last 10 seconds to avoid race condition impact
        const tenSecondsAgo = new Date(Date.now() - 10000);
        await Journey.deleteMany({
            busId: { $regex: new RegExp(`^${canonicalBusId}$`, 'i') },
            status: 'active',
            startTime: { $lt: tenSecondsAgo }
        });

        const journey = await Journey.create({
            busId: canonicalBusId,
            currentLocation: { lat, lng },
            direction: direction || 'forward',
            status: 'active',
            startTime: new Date(),
            conductorName,
            conductorPhone,
            notifications: []
        });

        // RETURN RESPONSE IMMEDIATELY to avoid latency and frontend timeouts
        const response = NextResponse.json({ success: true, journey }, { status: 201 });

        // PROCESS NOTIFICATIONS IN BACKGROUND
        (async () => {
            try {
                // Wait a tiny bit to ensure DB document is fully committed/available
                await new Promise(resolve => setTimeout(resolve, 500));

                const { Ticket } = await import('@/models/Ticket');
                const { Passenger } = await import('@/models/Passenger');
                const { Route } = await import('@/models/Route');
                const { sendEmail } = await import('@/lib/mail');

                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const searchStart = new Date(today.getTime() - 12 * 60 * 60 * 1000);
                const searchEnd = new Date(today.getTime() + 36 * 60 * 60 * 1000);

                const busNumber = bus?.busNumber;
                const tickets = await Ticket.find({
                    $or: [
                        { busId: { $regex: new RegExp(`^${canonicalBusId}$`, 'i') } },
                        { busId: { $regex: new RegExp(`^${busNumber}$`, 'i') } }
                    ],
                    travelDate: { $gte: searchStart, $lt: searchEnd }
                }).populate('passengerId');

                if (tickets.length === 0) return;

                const notifications = [];
                for (const ticket of tickets) {
                    const passenger = ticket.passengerId as any;
                    if (!passenger || !passenger.email) continue;

                    const routeStop = await Route.findOne({
                        name: { $regex: new RegExp(`^${ticket.dropoff}$`, 'i') }
                    });
                    if (!routeStop) continue;

                    notifications.push({
                        passengerId: passenger._id.toString(),
                        phoneNumber: passenger.phone,
                        dropoffLocation: ticket.dropoff,
                        dropoffCoords: {
                            lat: routeStop.location.lat,
                            lng: routeStop.location.lng
                        },
                        lastNotified: new Date(Date.now() - 16 * 60 * 1000), // 16 mins ago to trigger immediate update
                        reached: false
                    });

                    // Send initial Rich HTML Email
                    const busName = bus?.busNumber || canonicalBusId;
                    const plainMessage = `Journey Started! Your bus (${busName}) has started its journey. We will update you every 15 mins.`;

                    const html = `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                            <div style="text-align: center; margin-bottom: 25px;">
                                <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Yathra Bus Tracking</h1>
                            </div>
                            <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 20px;">Journey Started! 🚌</h2>
                            <p style="color: #475569; line-height: 1.6;">Hello,</p>
                            <p style="color: #475569; line-height: 1.6;">We're pleased to inform you that your bus (<strong>${busName}</strong>) has successfully started its official journey.</p>
                            <div style="background: #eff6ff; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #2563eb;">
                                <p style="margin: 0; color: #1e3a8a; font-weight: 500;">🔔 Live Tracking: You will receive detailed updates every 15 minutes with current location and ETA until you reach your stop at ${ticket.dropoff}.</p>
                            </div>
                            <p style="color: #475569; line-height: 1.6;">Sit back and relax. We'll keep you informed every step of the way!</p>
                            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
                            <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated tracking update. No reply is necessary.</p>
                        </div>
                    `;

                    await sendEmail(passenger.email, `Journey Started: Bus ${busName}`, plainMessage, html);
                }

                if (notifications.length > 0) {
                    // USE ATOMIC UPDATE to avoid VersionError
                    await Journey.findByIdAndUpdate(journey._id, {
                        $set: { notifications }
                    });
                    console.log(`Background notifications initialized for journey ${journey._id}`);
                }
            } catch (bgError) {
                console.error('Background Notification Error:', bgError);
            }
        })();

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
