import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  let MONGODB_URI = process.env.MONGODB_URI?.trim();

  if (MONGODB_URI && (MONGODB_URI.startsWith('"') || MONGODB_URI.startsWith("'"))) {
    MONGODB_URI = MONGODB_URI.substring(1, MONGODB_URI.length - 1);
  }

  if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is missing or empty in production environment');
    throw new Error('MONGODB_URI environment variable is not defined. Please check your hosting provider settings.');
  }

  // Safe Debug Logging
  if (process.env.NODE_ENV === 'production') {
    const hasScheme = MONGODB_URI.startsWith('mongodb://') || MONGODB_URI.startsWith('mongodb+srv://');
    console.log(`[DB Debug] URI Length: ${MONGODB_URI.length}, Standard Scheme: ${hasScheme}`);
    if (!hasScheme) {
      console.error(`[DB Error] URI identifies as: "${MONGODB_URI.substring(0, 15)}..."`);
    }
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
