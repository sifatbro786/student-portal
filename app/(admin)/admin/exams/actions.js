"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { requireAuth } from "@/server/auth/guards.js";
import { errorState, parseOrState, pickForm } from "@/server/action-utils.js";
import { objectId } from "@/server/validators/common.js";
import {
    CSV_MAX_BYTES,
    EXAM_FIELDS,
    RESULT_FIELDS,
    examSchema,
    parseResultGrid,
} from "@/server/validators/results.js";
import {
    deleteExam,
    importResultsCsv,
    saveExam,
    saveResults,
    setExamPublished,
} from "@/server/services/results.js";
import { ServiceError } from "@/server/errors.js";

const ADMINS = ["super_admin", "admin"];
const actorOf = (u) => ({ id: u.id, role: u.role });

/** Create (id null) or update an exam. */
export async function saveExamAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const raw = pickForm(formData, EXAM_FIELDS);
    const { data, state } = parseOrState(examSchema, raw);
    if (state) return state;
    let res;
    try {
        res = await saveExam(id ? objectId.parse(id) : null, data, actorOf(user));
    } catch (err) {
        return errorState(err, "exam.save", raw);
    }
    redirect(`/admin/exams/${res.id}?saved=1`);
}

/** FR-RES-02 bulk save of the whole grid. */
export async function saveResultsAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const { rows, rowErrors, error } = parseResultGrid(pickForm(formData, RESULT_FIELDS));
    if (error) return { error };
    if (Object.keys(rowErrors).length)
        return { error: "Some rows need fixing — nothing was saved.", rowErrors };
    try {
        const r = await saveResults(objectId.parse(id), rows, actorOf(user));
        refresh();
        return { ok: true, message: `Saved ${r.saved} result${r.saved === 1 ? "" : "s"}.` };
    } catch (err) {
        if (err instanceof ServiceError && err.rowErrors)
            return {
                error: "Some rows need fixing — nothing was saved.",
                rowErrors: err.rowErrors,
            };
        return errorState(err, "results.save");
    }
}

/** FR-RES-03 CSV import (all-or-nothing, row report). */
export async function importResultsCsvAction(id, _prev, formData) {
    const user = await requireAuth(ADMINS);
    const file = formData.get("file");
    if (!file || typeof file === "string" || file.size === 0)
        return { error: "Choose a CSV file.", fieldErrors: { file: "Choose a CSV file." } };
    if (file.size > CSV_MAX_BYTES) return { error: "The CSV is too large (max 256 KB)." };
    try {
        const r = await importResultsCsv(objectId.parse(id), await file.text(), actorOf(user));
        if (!r.ok)
            return {
                error: "Nothing was imported — fix the rows marked below and try again.",
                report: r.report,
            };
        refresh();
        return { ok: true, message: `Imported ${r.saved} results.`, report: r.report };
    } catch (err) {
        return errorState(err, "results.import");
    }
}

export async function setExamPublishedAction(id, isPublished, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await setExamPublished(objectId.parse(id), isPublished === true, actorOf(user));
    } catch (err) {
        return errorState(err, "exam.publish");
    }
    refresh();
    return {
        ok: true,
        message: isPublished
            ? "Published — students can see their results."
            : "Hidden from students.",
    };
}

export async function deleteExamAction(id, _prev) {
    const user = await requireAuth(ADMINS);
    try {
        await deleteExam(objectId.parse(id), actorOf(user));
    } catch (err) {
        return errorState(err, "exam.delete");
    }
    redirect("/admin/exams?deleted=1");
}
