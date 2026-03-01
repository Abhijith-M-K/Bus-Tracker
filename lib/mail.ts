import nodemailer from 'nodemailer';

/**
 * Sends an email to a passenger.
 * Requires EMAIL_USER and EMAIL_PASS environment variables.
 */
export async function sendEmail(to: string, subject: string, body: string, html?: string): Promise<boolean> {
    try {
        let user = process.env.EMAIL_USER?.trim();
        let pass = process.env.EMAIL_PASS?.trim();

        // Handle accidental quotes
        if (user && (user.startsWith('"') || user.startsWith("'"))) user = user.substring(1, user.length - 1);
        if (pass && (pass.startsWith('"') || pass.startsWith("'"))) pass = pass.substring(1, pass.length - 1);

        if (!user || !pass) {
            console.warn('[EMAIL MOCK]: Credentials missing. Email would be sent to:', to);
            console.log(`[EMAIL CONTENT]: Subject: ${subject}\nBody: ${body}\n`);
            return false;
        }

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: user,
                pass: pass,
            },
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 10000,
            socketTimeout: 10000,
        });

        const mailOptions = {
            from: user,
            to,
            subject,
            text: body,
            html: html || body,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        return false;
    }
}
