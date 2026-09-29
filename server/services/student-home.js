import "server-only";
import { connectDB } from "../db.js";
import { Batch } from "../models/Batch.js";
import { listNoticesForStudent } from "./notices.js";
import { upcomingForStudent } from "./assignments.js";

/** Everything the student dashboard home needs, in one call. */
export async function studentHome(scope) {
    await connectDB();
    const [batch, notices, deadlines] = await Promise.all([
        Batch.findById(scope.batchId)
            .populate("class", "name")
            .select("name schedule room class")
            .lean(),
        listNoticesForStudent(scope, { page: 1, pageSize: 3 }),
        upcomingForStudent(scope, 3),
    ]);
    return { batch, notices: notices.rows, deadlines };
}
