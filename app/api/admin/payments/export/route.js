import { getCurrentUser } from "@/server/auth/guards.js";
import { feeListQuery } from "@/server/validators/payments.js";
import { exportFeeRows } from "@/server/services/payments.js";
import { log } from "@/server/log.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADER = [
    "studentId",
    "name",
    "batch",
    "batchTime",
    "month",
    "status",
    "paidAt",
    "note",
    "studentStatus",
];

/** CSV cell: quoted, and formula-leading values neutralised (CSV injection in Excel). */
function cell(v) {
    let s = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
}

/** FR-PAY-06 / PRD §14 CSV export — streamed in pages of 500, admins only. */
export async function GET(request) {
    const user = await getCurrentUser();
    if (!user || !["admin", "super_admin"].includes(user.role) || user.mustChangePassword)
        return new Response("Not found", { status: 404 });
    const sp = Object.fromEntries(new URL(request.url).searchParams);
    const f = feeListQuery.parse(sp);
    const query = {
        period: f.period,
        status: f.status,
        classId: f.class,
        batchId: f.batch,
        q: f.q,
    };
    const rows = exportFeeRows(query);
    const enc = new TextEncoder();
    const stream = new ReadableStream({
        async start(controller) {
            controller.enqueue(enc.encode(`﻿${HEADER.join(",")}\r\n`)); // BOM → Excel reads UTF-8
        },
        async pull(controller) {
            try {
                const { value, done } = await rows.next();
                if (done) return controller.close();
                controller.enqueue(enc.encode(`${value.map(cell).join(",")}\r\n`));
            } catch (err) {
                log.error("fees.export_failed", { err });
                controller.error(err);
            }
        },
        cancel() {
            rows.return?.();
        },
    });
    const name = `fees-${f.period ?? "all"}-${f.status}.csv`;
    return new Response(stream, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${name}"`,
            "Cache-Control": "private, no-store",
            "X-Content-Type-Options": "nosniff",
        },
    });
}
