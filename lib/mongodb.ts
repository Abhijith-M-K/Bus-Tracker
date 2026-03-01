import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  let MONGODB_URI = process.env.MONGODB_URI;

  if (MONGODB_URI) {
    MONGODB_URI = MONGODB_URI.trim();

    // Remove BOM and other non-printing characters
    MONGODB_URI = MONGODB_URI.replace(/^[\uFEFF\u200B\u00A0]+/, '');

    // Remove accidental "MONGODB_URI=" prefix if pasted into Vercel value field
    if (MONGODB_URI.startsWith('MONGODB_URI=')) {
      MONGODB_URI = MONGODB_URI.substring('MONGODB_URI='.length).trim();
    }

    // Remove accidental quotes
    if (MONGODB_URI.startsWith('"') || MONGODB_URI.startsWith("'")) {
      MONGODB_URI = MONGODB_URI.substring(1);
      if (MONGODB_URI.endsWith('"') || MONGODB_URI.endsWith("'")) {
        MONGODB_URI = MONGODB_URI.substring(0, MONGODB_URI.length - 1);
      }
    }
  }

  if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is missing or empty');
    throw new Error('MONGODB_URI environment variable is not defined.');
  }

  // Final check for valid scheme
  const hasValidScheme = MONGODB_URI.startsWith('mongodb://') || MONGODB_URI.startsWith('mongodb+srv://');
  if (!hasValidScheme) {
    console.error(`[DB Error] Invalid URI Scheme. Starts with: "${MONGODB_URI.substring(0, 15)}..."`);
    throw new Error('Invalid MONGODB_URI scheme. Must start with "mongodb://" or "mongodb+srv://".');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
