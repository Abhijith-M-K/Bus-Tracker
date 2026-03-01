import twilio from 'twilio';

/**
 * Sends a real SMS notification using Twilio.
 * Requires TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.
 */
export async function sendSMS(to: string, message: string): Promise<boolean> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
        console.warn('[SMS MOCK]: Twilio credentials missing. SMS would be sent to:', to);
        console.log(`[SMS CONTENT]: ${message}`);
        return false;
    }

    try {
        const client = twilio(accountSid, authToken);
        const response = await client.messages.create({
            body: message,
            from: fromPhone,
            to: to.startsWith('+') ? to : `+91${to}` // Default to Indian prefix if missing
        });
        console.log(`Twilio SMS Sent! SID: ${response.sid}`);
        return true;
    } catch (error) {
        console.error('Twilio SMS Error:', error);
        return false;
    }
}
