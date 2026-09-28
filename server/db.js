import "server-only";
import mongoose from "mongoose";
import { env, isProd } from "./env.js";
import { log } from "./log.js";

// SEC-04: reject operator injection in filters and unknown query paths.
mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);

/**
 * sanitizeFilter wraps EVERY `{ $op: … }` object in a filter with $eq — including
 * our own. Operators written by server code must be wrapped: `{ status: trusted({ $in: [...] }) }`.
 * Never wrap anything that contains user input without validating it first.
 */
export const trusted = mongoose.trusted;

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

const TXN_UNSUPPORTED = /replica set|Transaction numbers|transactions are not supported/i;

/**
 * Run `fn(session)` in a transaction (PRD §6 — needs the rs0 replica set).
 * DEV ONLY: on a standalone mongod (or MONGO_TRANSACTIONS=off) it runs without a
 * session and logs a warning. Production never falls back.
 * @template T
 * @param {(session: import('mongoose').ClientSession | undefined) => Promise<T>} fn
 * @returns {Promise<T>}
 */
export async function withTransaction(fn) {
    await connectDB();
    // Dev convenience for a standalone local mongod: MONGO_TRANSACTIONS=off
    if (!isProd() && process.env.MONGO_TRANSACTIONS === "off") return fn(undefined);
    const session = await mongoose.startSession();
    try {
        return await session.withTransaction(() => fn(session));
    } catch (err) {
        if (!isProd() && (err?.code === 20 || TXN_UNSUPPORTED.test(err?.message ?? ""))) {
            log.warn("db.transaction_fallback", { reason: "standalone mongod (dev only)" });
            return fn(undefined);
        }
        throw err;
    } finally {
        await session.endSession();
    }
}
