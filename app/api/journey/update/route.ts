export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Journey } from '@/models/Bus';

export async function POST(req: Request) {
    try {
        await connectDB();
        const { busId: searchTermRaw, lat, lng } = await req.json();
        const searchTerm = searchTermRaw?.trim();

        if (!searchTerm || lat === undefined || lng === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const journey = await Journey.findOne({
            busId: { $regex: new RegExp(`^${searchTerm}$`, 'i') },
            status: 'active'
        });

        if (!journey) {
            return NextResponse.json({
                error: 'No active journey found for this bus',
                details: "Make sure you started the journey first."
            }, { status: 404 });
        }

        // Update location
        journey.currentLocation = { lat, lng };
        journey.lastUpdated = new Date();

        // Process Notifications
        try {
            const { calculateDistance, estimateETA } = await import('@/lib/location');
            const { sendEmail } = await import('@/lib/mail');
            const { Bus } = await import('@/models/Bus');
            const { Passenger } = await import('@/models/Passenger');

            const busData = await Bus.findOne({ busId: journey.busId });
            const busNumber = busData?.busNumber || journey.busId;

            if (journey.notifications && journey.notifications.length > 0) {
                const now = new Date();
                let updated = false;

                for (const notif of journey.notifications) {
                    if (notif.reached) continue;

                    const distance = calculateDistance(lat, lng, notif.dropoffCoords.lat, notif.dropoffCoords.lng);

                    // Check if reached (within 500 meters)
                    if (distance < 0.5) {
                        notif.reached = true;
                        notif.lastNotified = now;
                        updated = true;

                        const reachMsg = `You have reached your destination: ${notif.dropoffLocation}. Thank you for traveling with us!`;
                        const passenger = await Passenger.findById(notif.passengerId);

                        if (passenger?.email) {
                            const html = `
                                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                                    <div style="text-align: center; margin-bottom: 25px;">
                                        <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Yathra Bus Tracking</h1>
                                    </div>
                                    <h2 style="color: #059669; border-bottom: 2px solid #10b981; padding-bottom: 10px; font-size: 20px;">Destination Reached! 🏁</h2>
                                    <p style="color: #475569; line-height: 1.6;">Hello,</p>
                                    <p style="color: #475569; line-height: 1.6;">Your bus has arrived at your destination: <strong>${notif.dropoffLocation}</strong>.</p>
                                    <div style="background: #ecfdf5; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 5px solid #10b981;">
                                        <p style="margin: 0; color: #065f46; font-weight: 500;">Thank you for choosing Yathra. We hope you had a pleasant journey!</p>
                                    </div>
                                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
                                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Yathra Automated Arrival Notification</p>
                                </div>
                            `;
                            await sendEmail(passenger.email, `Arrived at ${notif.dropoffLocation}`, reachMsg, html);
                        }
                        continue;
                    }

                    // Periodic update (every 15 minutes)
                    const lastNotified = notif.lastNotified ? new Date(notif.lastNotified) : new Date(0);
                    const diffMs = now.getTime() - lastNotified.getTime();
                    const diffMins = diffMs / (1000 * 60);

                    if (diffMins >= 15) {
                        const eta = estimateETA(distance);
                        const message = `Bus ${busNumber} Update: Current Location - Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}. Estimated time to reach ${notif.dropoffLocation}: ${eta} mins (${distance.toFixed(1)} km away).`;

                        const passenger = await Passenger.findById(notif.passengerId);
                        if (passenger?.email) {
                            const mapLink = `https://www.google.com/maps?q=${lat},${lng}`;
                            const html = `
                                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
                                    <div style="text-align: center; margin-bottom: 25px;">
                                        <h1 style="color: #2563eb; margin: 0; font-size: 24px;">Yathra Bus Tracking</h1>
                                    </div>
                                    <h2 style="color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; font-size: 20px;">Tracking Update 🚌</h2>
                                    <p style="color: #475569; line-height: 1.6;">Your bus (<strong>${busNumber}</strong>) is currently on its way to <strong>${notif.dropoffLocation}</strong>.</p>
                                    
                                    <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 25px 0; border: 1px solid #e2e8f0;">
                                        <p style="margin: 8px 0; color: #334155;">📍 <strong>Distance remaining:</strong> ${distance.toFixed(1)} km</p>
                                        <p style="margin: 8px 0; color: #334155;">⏱️ <strong>Estimated arrival:</strong> ${eta} minutes</p>
                                        <div style="margin-top: 15px; text-align: center;">
                                            <a href="${mapLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Live Location on Maps</a>
                                        </div>
                                    </div>
                                    
                                    <p style="color: #475569; line-height: 1.6;">Next update will be sent in 15 minutes.</p>
                                    <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 30px 0;">
                                    <p style="font-size: 12px; color: #94a3b8; text-align: center;">Yathra Tracking System</p>
                                </div>
                            `;
                            await sendEmail(passenger.email, `Live Update: Bus ${busNumber} Tracking`, message, html);
                        }

                        notif.lastNotified = now;
                        updated = true;
                    }
                }

                if (updated) {
                    journey.markModified('notifications');
                }
            }
        } catch (notifError) {
            console.error('Error processing notifications in update:', notifError);
        }

        await journey.save();

        return NextResponse.json({ success: true, journey });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
