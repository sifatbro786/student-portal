import "server-only";
import { connectDB } from "../db.js";
import { Batch } from "../models/Batch.js";
import { listNoticesForStudent } from "./notices.js";
import { upcomingForStudent } from "./assignments.js";
import { listResultsForStudent } from "./results.js";

/** Everything the student dashboard home needs, in one call. */
export async function studentHome(scope) {
    await connectDB();
    const [batch, notices, deadlines, results] = await Promise.all([
        Batch.findById(scope.batchId)
            .populate("class", "name")
            .select("name schedule room class")
            .lean(),
        listNoticesForStudent(scope, { page: 1, pageSize: 3 }),
        upcomingForStudent(scope, 3),
        listResultsForStudent(scope, { limit: 1 }),
    ]);
    return { batch, notices: notices.rows, deadlines, latestResult: results[0] ?? null };
}
