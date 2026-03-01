import mongoose from 'mongoose';

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('CRITICAL: MONGODB_URI is missing in production environment');
    throw new Error('MONGODB_URI environment variable is not defined. Please check your hosting provider settings.');
  }

  // Safe Debug Logging (does not expose full URI)
  if (process.env.NODE_ENV === 'production') {
    const uriStart = MONGODB_URI.substring(0, 10);
    const uriEnd = MONGODB_URI.substring(MONGODB_URI.length - 5);
    console.log(`[DB Debug] Length: ${MONGODB_URI.length}, Starts with: "${uriStart}...", Ends with: "...${uriEnd}"`);
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
