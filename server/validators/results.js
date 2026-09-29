import { z } from "zod";
import { APP_TZ, GRADES, STUDENT_ID_RE } from "../../lib/constants.js";
import { checkbox, objectId } from "./common.js";
import { TZDate } from "@date-fns/tz";

/** "2026-10-10" → that day 00:00 in Asia/Dhaka (stored as UTC). */
export function fromDhakaDate(value) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
    if (!m) return null;
    const [, y, mo, d] = m.map(Number);
    const t = new TZDate(y, mo - 1, d, 0, 0, APP_TZ);
    if (t.getMonth() !== mo - 1) return null; // 2026-02-31 etc.
    return new Date(t.getTime());
}

/** Marks: ≥ 0, at most 2 decimals. */
const marksNumber = z.coerce
    .number({ error: "Enter a number." })
    .min(0, "Marks can’t be negative.")
    .max(10_000, "Marks look too high.")
    .refine((n) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6, "Use at most 2 decimals.");

export const EXAM_FIELDS = ["title", "class", "batches[]", "date", "fullMarks", "isPublished"];

// FR-RES-01
export const examSchema = z.strictObject({
    title: z.string().trim().min(3, "Enter a title.").max(200),
    class: objectId,
    batches: z.array(objectId).min(1, "Pick at least one batch.").max(100),
    date: z.string({ error: "Enter the exam date." }).transform((v, ctx) => {
        const d = fromDhakaDate(v);
        if (!d) {
            ctx.addIssue({ code: "custom", message: "Enter a valid date." });
            return z.NEVER;
        }
        return d;
    }),
    fullMarks: z.coerce
        .number({ error: "Enter full marks." })
        .int("Full marks must be a whole number.")
        .min(1, "Full marks must be at least 1.")
        .max(1000, "Full marks can be at most 1000."),
    isPublished: checkbox,
});

export const RESULT_FIELDS = ["student[]", "marks[]", "grade[]", "remark[]"];

/**
 * FR-RES-02 grid → rows. Parallel arrays from the form (one entry per student row).
 * Blank marks = "no result" (an existing entry is removed).
 * @returns {{ rows: Array<{ student: string, marks: number | null, grade?: string, remark?: string }>,
 *   rowErrors: Record<string, string>, error?: string }}
 */
export function parseResultGrid(raw) {
    const shape = z
        .strictObject({
            student: z.array(objectId).max(1000),
            marks: z.array(z.string().max(20)),
            grade: z.array(z.string().max(4)),
            remark: z.array(z.string().max(1000)),
        })
        .safeParse(raw);
    if (!shape.success) return { rows: [], rowErrors: {}, error: "The form was incomplete." };
    const { student, marks, grade, remark } = shape.data;
    const n = student.length;
    if (
        marks.length !== n ||
        grade.length !== n ||
        remark.length !== n ||
        new Set(student).size !== n
    )
        return { rows: [], rowErrors: {}, error: "The form was incomplete." };

    const rows = [];
    const rowErrors = {};
    for (let i = 0; i < n; i++) {
        const m = marks[i].trim();
        const g = grade[i].trim();
        const r = remark[i].trim();
        if (m === "") {
            if (g || r) rowErrors[student[i]] = "Enter marks, or clear the grade and remark.";
            rows.push({ student: student[i], marks: null });
            continue;
        }
        const pm = marksNumber.safeParse(m);
        if (!pm.success) {
            rowErrors[student[i]] = pm.error.issues[0].message;
            continue;
        }
        if (g && !GRADES.includes(g)) {
            rowErrors[student[i]] = "Unknown grade.";
            continue;
        }
        if (r.length > 300) {
            rowErrors[student[i]] = "Remark is too long (max 300).";
            continue;
        }
        rows.push({
            student: student[i],
            marks: pm.data,
            grade: g || undefined,
            remark: r || undefined,
        });
    }
    return { rows, rowErrors };
}

/** Minimal RFC 4180 line splitter (quotes, "" escapes). */
function splitCsvLine(line) {
    const out = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
            if (c === '"' && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else if (c === '"') q = false;
            else cur += c;
        } else if (c === '"') q = true;
        else if (c === ",") {
            out.push(cur);
            cur = "";
        } else cur += c;
    }
    out.push(cur);
    return out.map((v) => v.trim());
}

export const CSV_MAX_BYTES = 256 * 1024;
export const CSV_MAX_ROWS = 1000;

/**
 * FR-RES-03: `studentId,marks,grade,remark` (header optional). Only syntax is checked
 * here; scope, duplicates and full marks are checked by the service.
 * @returns {Array<{ line: number, studentId: string, marks?: number, grade?: string, remark?: string, error?: string }>}
 */
export function parseResultsCsv(text) {
    const lines = String(text ?? "")
        .replace(/^﻿/, "")
        .split(/\r?\n/);
    const rows = [];
    lines.forEach((raw, idx) => {
        if (!raw.trim()) return;
        const [studentId = "", marks = "", grade = "", remark = "", ...extra] = splitCsvLine(raw);
        const line = idx + 1;
        if (idx === 0 && /^student\s*id$/i.test(studentId.replace(/_/g, " "))) return; // header
        const row = { line, studentId: studentId.toUpperCase() };
        if (extra.some((e) => e !== "")) row.error = "Too many columns (expected 4).";
        else if (!STUDENT_ID_RE.test(row.studentId)) row.error = "Not a student ID (TM-YYYY-NNNN).";
        else {
            const pm = marksNumber.safeParse(marks);
            if (marks === "" || !pm.success)
                row.error = marks === "" ? "Marks missing." : pm.error.issues[0].message;
            else if (grade && !GRADES.includes(grade.toUpperCase()))
                row.error = `Unknown grade “${grade}”.`;
            else if (remark.length > 300) row.error = "Remark is too long (max 300).";
            else
                Object.assign(row, {
                    marks: pm.data,
                    grade: grade.toUpperCase() || undefined,
                    remark: remark || undefined,
                });
        }
        rows.push(row);
    });
    return rows;
}

export const examListQuery = z.object({
    class: objectId.optional().catch(undefined),
    status: z.enum(["all", "published", "draft"]).catch("all"),
});
