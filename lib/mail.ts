import nodemailer from 'nodemailer';

/**
 * Sends an email to a passenger.
 * Requires EMAIL_USER and EMAIL_PASS environment variables.
 */
export async function sendEmail(to: string, subject: string, body: string, html?: string): Promise<boolean> {
    try {
        const user = process.env.EMAIL_USER;
        const pass = process.env.EMAIL_PASS;

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
