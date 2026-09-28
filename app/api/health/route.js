import mongoose from "mongoose";
import { connectDB } from "@/server/db.js";
import { log } from "@/server/log.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await connectDB();
        await mongoose.connection.db.admin().command({ ping: 1 });
        return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
        log.error("health.db_unreachable", { err });
        return Response.json(
            { ok: false },
            { status: 503, headers: { "Cache-Control": "no-store" } },
        );
    }
}
