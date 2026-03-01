import { NextResponse } from 'next/server';

export async function GET() {
    const rawUri = process.env.MONGODB_URI || 'MISSING';
    const trimmedUri = rawUri.trim();
    const hasQuotes = trimmedUri.startsWith('"') || trimmedUri.startsWith("'");
    const hasCorrectScheme = trimmedUri.startsWith('mongodb://') || trimmedUri.startsWith('mongodb+srv://');

    return NextResponse.json({
        diagnostics: {
            MONGODB_URI: {
                present: rawUri !== 'MISSING',
                rawLength: rawUri.length,
                hasLeadingTrailingSpaces: rawUri !== rawUri.trim(),
                hasAccidentalQuotes: hasQuotes,
                hasCorrectScheme: hasCorrectScheme,
                prefix: rawUri.substring(0, 15) + '...',
            },
            tips: [
                "In Vercel settings, DO NOT use quotes around the MONGODB_URI.",
                "Ensure there are no spaces at the beginning of the URI.",
                "Make sure you clicked 'Save' and RE-DEPLOYED the application."
            ]
        }
    });
}
