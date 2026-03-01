import { NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('ticket') as File | null;

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        let text = '';
        try {
            const parser = new PDFParse({ data: new Uint8Array(buffer) });
            const data = await parser.getText();
            text = data.text;
        } catch (pdfErr) {
            console.error('PDF parsing error', pdfErr);
            return NextResponse.json({ success: false, error: 'Unreadable PDF format' }, { status: 400 });
        }

        // Basic Regex matching strategy. Real-world apps need robust matching per-operator.
        const pnrMatch = text.match(/PNR\s*(?:NO|Number)?\s*[:\-]?\s*([A-Z0-9]+)/i);
        const ticketMatch = text.match(/Ticket\s*(?:NO|Number)?\s*[:\-]?\s*([A-Z0-9]+)/i);
        const dateMatch = text.match(/Date\s*(?:Of\s*Journey)?\s*[:\-]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/i);

        const pickupRegex = text.match(/Pickup\s*at\s*(.+?)\s*on\s*(\d{2}:\d{2})(?:,\s*(.+?))?(?:\n|$)/i);
        const dropoffRegex = text.match(/Dropoff\s*at\s*(.+?)\s*on\s*(?:est\.?\s*)?(\d{2}:\d{2})(?:,\s*(.+?))?(?:\n|$)/i);

        const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        let travelDateStr = formatDate(new Date());

        if (dateMatch) {
            travelDateStr = formatDate(new Date(dateMatch[1]));
        } else if (pickupRegex && pickupRegex[3]) {
            const d = new Date(`${pickupRegex[3]} ${new Date().getFullYear()}`);
            if (!isNaN(d.getTime())) travelDateStr = formatDate(d);
        }

        const extractedData = {
            pnr: pnrMatch ? pnrMatch[1].trim() : 'UNKNOWN',
            ticketNo: ticketMatch ? ticketMatch[1].trim() : `TK-${Math.floor(Math.random() * 100000)}`,
            pickup: 'Unknown Pickup',
            dropoff: 'Unknown Dropoff',
            travelDate: travelDateStr,
            startTime: '',
            endTime: '',
            busId: ''
        };

        if (pickupRegex) {
            extractedData.pickup = pickupRegex[1].trim();
            extractedData.startTime = pickupRegex[2].trim();
        }

        if (dropoffRegex) {
            extractedData.dropoff = dropoffRegex[1].trim();
            extractedData.endTime = dropoffRegex[2].trim();
        }

        // Try to guess pickup / dropoff using fallback if still unknown
        const routingMatch = text.match(/([A-Za-z\s]+)\s*(?:to|->|-)\s*([A-Za-z\s]+)/i);
        if (routingMatch && extractedData.pickup === 'Unknown Pickup') {
            extractedData.pickup = routingMatch[1].trim();
            extractedData.dropoff = routingMatch[2].trim();
        }

        return NextResponse.json({
            success: true,
            data: extractedData
        });
    } catch (err: any) {
        console.error('Ticket upload error', err);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
