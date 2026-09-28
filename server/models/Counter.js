import "server-only";
import { Schema, model } from "./_shared.js";

// _id examples: 'student:2026', 'admission:2026'
const CounterSchema = new Schema(
    { _id: String, seq: { type: Number, default: 0 } },
    { versionKey: false },
);

export const Counter = model("Counter", CounterSchema, "counters");

/**
 * Atomically increments and returns the next sequence number for `key`.
 * @param {string} key
 * @param {import('mongoose').ClientSession} [session]
 */
export async function nextSeq(key, session) {
    const doc = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after", session },
    ).lean();
    return doc.seq;
}
