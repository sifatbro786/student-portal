import "server-only";
import mongoose from "mongoose";
import { env } from "./env.js";

// SEC-04: reject operator injection in filters and unknown query paths.
mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);

/** @type {{ conn: typeof mongoose | null, promise: Promise<typeof mongoose> | null }} */
const cached = globalThis.__tmMongoose ?? (globalThis.__tmMongoose = { conn: null, promise: null });

/** Cached connection — survives dev HMR and is shared across requests. */
export async function connectDB() {
    if (cached.conn) return cached.conn;
    if (!cached.promise) {
        cached.promise = mongoose
            .connect(env().MONGODB_URI, {
                bufferCommands: false,
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 10,
            })
            .catch((err) => {
                cached.promise = null; // allow retry on next request
                throw err;
            });
    }
    cached.conn = await cached.promise;
    return cached.conn;
}

export async function disconnectDB() {
    if (cached.conn) await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
}
