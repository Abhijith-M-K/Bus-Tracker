import { NextResponse } from 'next/server';

export async function GET() {
    const mongodbUri = process.env.MONGODB_URI || 'MISSING';
    const emailUser = process.env.EMAIL_USER || 'MISSING';
    const emailPass = process.env.EMAIL_PASS || 'MISSING';

    return NextResponse.json({
        env: {
            MONGODB_URI: {
                present: mongodbUri !== 'MISSING',
                length: mongodbUri.length,
                prefix: mongodbUri.substring(0, 10) + '...',
                suffix: '...' + mongodbUri.substring(mongodbUri.length - 5)
            },
            EMAIL_USER: {
                present: emailUser !== 'MISSING',
                value: emailUser.substring(0, 3) + '***'
            },
            EMAIL_PASS: {
                present: emailPass !== 'MISSING',
                length: emailPass.length
            }
        },
        message: "If MONGODB_URI does not start with 'mongodb://' or 'mongodb+srv://', it will fail."
    });
}
