import { isValidObjectId } from "mongoose";
import { getCurrentUser } from "@/server/auth/guards.js";
import { connectDB } from "@/server/db.js";
import { Admission } from "@/server/models/Admission.js";
import { Student } from "@/server/models/Student.js";
import { streamStored } from "@/server/storage/files.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const notFound = () =>
    new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
const isAdmin = (u) => u.role === "admin" || u.role === "super_admin";

/**
 * Private files are only ever served here, after auth + scope checks (PRD §8).
 * Anything the caller may not see is a 404 — never reveal that it exists (SEC-10).
 * More kinds (materials, submissions…) are added in P4/P5.
 */
export async function GET(_request, { params }) {
    const { kind, id } = await params;
    if (!isValidObjectId(id) || !/^[a-f\d]{24}$/i.test(id)) return notFound();
    const user = await getCurrentUser();
    if (!user) return notFound();
    await connectDB();

    let ref = null;
    if (kind === "admission-photo" && isAdmin(user)) {
        ref = (await Admission.findById(id).select("photo").lean())?.photo;
    } else if (kind === "student-photo") {
        const filter = isAdmin(user) ? { _id: id } : { _id: id, user: user.id, status: "active" };
        ref = (await Student.findOne(filter).select("photo").lean())?.photo;
    }
    if (!ref?.key) return notFound();
    return streamStored(ref);
}
