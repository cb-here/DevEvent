import mongoose from "mongoose";

/**
 * MongoDB Connection URI
 * This should be stored in your .env file as MONGODB_URI
 */
const MONGODB_URI = process.env.MONGODB_URI;

/**
 * Validate that MONGODB_URI environment variable is defined
 * This prevents the application from running without a proper database connection string
 */
if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env"
  );
}

/**
 * Type definition for the cached connection
 * mongoose.Connection | null: stores the active database connection
 * Promise<mongoose.Connection> | null: stores the pending connection promise
 */
interface MongooseCache {
  conn: mongoose.Connection | null;
  promise: Promise<mongoose.Connection> | null;
}

/**
 * Extend the global namespace to include our mongoose cache
 * This is necessary because in development, Next.js hot reloads can create multiple connections
 * By storing the connection in the global scope, we ensure it persists across hot reloads
 */
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseCache | undefined;
}

/**
 * Initialize or retrieve the cached connection
 * In development: global.mongoose persists across hot reloads
 * In production: this object is created once when the module loads
 */
let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

/**
 * If not already cached globally, assign it to the global object
 * This ensures the cache survives Next.js hot module replacement in development
 */
if (!global.mongoose) {
  global.mongoose = cached;
}

/**
 * Establishes and returns a MongoDB connection using Mongoose
 *
 * HOW THIS WORKS:
 * 1. First call: Creates a new connection and caches both the promise and connection
 * 2. Subsequent calls: Returns the cached connection (no new connection created)
 *
 * WHY CACHING IS IMPORTANT:
 * - In development, Next.js uses hot module replacement which can cause modules to reload
 * - Without caching, each reload would create a new database connection
 * - MongoDB has a connection limit; too many connections can cause errors
 * - Caching ensures we reuse the same connection across reloads
 *
 * @returns {Promise<mongoose.Connection>} The active MongoDB connection
 */
async function connectDB(): Promise<mongoose.Connection> {
  /**
   * If we already have an active connection, return it immediately
   * This is the fastest path - no need to create or wait for a new connection
   */
  if (cached.conn) {
    return cached.conn;
  }

  /**
   * If we don't have a connection but have a pending promise, wait for it
   * This handles the case where multiple calls happen simultaneously
   * before the first connection completes
   */
  if (!cached.promise) {
    /**
     * Mongoose connection options for optimal performance and reliability
     */
    const opts = {
      bufferCommands: false, // Disable mongoose buffering (we handle connection state ourselves)
    };

    /**
     * Create a new connection promise
     * mongoose.connect returns a Mongoose instance, so we chain .connection to get the Connection object
     */
    cached.promise = mongoose
      .connect(MONGODB_URI as string, opts)
      .then((mongooseInstance) => {
        console.log("✅ MongoDB connected successfully");
        return mongooseInstance.connection;
      })
      .catch((error) => {
        console.error("❌ MongoDB connection error:", error);
        // Clear the cached promise on error so next call will retry
        cached.promise = null;
        throw error;
      });
  }

  /**
   * Wait for the connection promise to resolve
   * This ensures the connection is fully established before we use it
   */
  cached.conn = await cached.promise;

  return cached.conn;
}

/**
 * Export the connection function as default
 * Usage in your application:
 *
 * import connectDB from '@/lib/mongodb';
 *
 * export async function GET() {
 *   await connectDB();
 *   // Now you can use your Mongoose models
 *   const users = await User.find({});
 *   return Response.json(users);
 * }
 */
export default connectDB;
