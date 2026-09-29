"use server";

import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import { feeBulkSchema, feeStatusSchema } from "@/server/validators/payments.js";
import { bulkSetFeeStatus, generateFeeRecords, setFeeStatus } from "@/server/services/payments.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });
const LABEL = { paid: "Paid", due: "Due", waived: "Waived" };

/** FR-PAY-05/07: one cell, after the confirm popover. */
export async function setFeeStatusAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["status", "note"]);
    const { data, state } = parseOrState(feeStatusSchema, raw);
    if (state) return state;
    try {
        await setFeeStatus(objectId.parse(id), data, actorOf(user));
    } catch (err) {
        return errorState(err, "fee.status", raw);
    }
    refresh();
    return { ok: true, message: `Marked ${LABEL[data.status].toLowerCase()}.` };
}

/** FR-PAY-06 bulk. */
export async function bulkFeeStatusAction(_prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, ["ids[]", "status", "note"]);
    const { data, state } = parseOrState(feeBulkSchema, raw);
    if (state) return state;
    try {
        const r = await bulkSetFeeStatus(data.ids, data, actorOf(user));
        refresh();
        return {
            ok: true,
            message: `${r.changed} of ${r.total} record${r.total === 1 ? "" : "s"} marked ${LABEL[data.status].toLowerCase()}.`,
        };
    } catch (err) {
        return errorState(err, "fee.bulk");
    }
}

/** Manual run of the monthly job for the current month (idempotent). */
export async function generateFeesAction(_prev) {
    await requireAuth(ADMINS);
    try {
        const r = await generateFeeRecords();
        refresh();
        return {
            ok: true,
            message: r.created
                ? `Created ${r.created} record(s) for this month.`
                : "Everyone already has a record for this month.",
        };
    } catch (err) {
        return errorState(err, "fees.generate");
    }
}
