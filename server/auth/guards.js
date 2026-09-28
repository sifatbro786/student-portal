import "server-only";
import { cache } from "react";
import { isValidObjectId } from "mongoose";
import { notFound, redirect } from "next/navigation";
import { connectDB } from "../db.js";
import { User } from "../models/User.js";
import { Student } from "../models/Student.js";
import { readSession } from "./session.js";

/**
 * @typedef {{ id: string, email: string, name: string,
 *   role: 'super_admin'|'admin'|'student', mustChangePassword: boolean, tokenVersion: number }} CurrentUser
 */

/**
 * Loads the user once per request (FR-AUTH-04). Rejects inactive users,
 * stale token versions and stale roles → instant revocation.
 * @returns {Promise<CurrentUser | null>}
 */
export const getCurrentUser = cache(async () => {
    const session = await readSession();
    if (!session || !isValidObjectId(session.sub)) return null;

    await connectDB();
    const u = await User.findById(session.sub)
        .select("email name role isActive tokenVersion mustChangePassword")
        .lean();
    if (!u || !u.isActive || u.tokenVersion !== session.tv || u.role !== session.role) return null;

    return {
        id: String(u._id),
        email: u.email,
        name: u.name,
        role: u.role,
        mustChangePassword: u.mustChangePassword,
        tokenVersion: u.tokenVersion,
    };
});

/**
 * Pages, layouts and Server Actions.
 * - not logged in → /login
 * - wrong role → 404 (SEC-10, don't reveal the area exists)
 * - mustChangePassword → /change-password (FR-AUTH-07)
 * @param {Array<CurrentUser['role']> | null} roles null = any logged-in user
 * @param {{ allowPasswordChange?: boolean }} [opts]
 * @returns {Promise<CurrentUser>}
 */
export async function requireAuth(roles, { allowPasswordChange = false } = {}) {
    const user = await getCurrentUser();
    if (!user) redirect("/login");
    if (roles && !roles.includes(user.role)) notFound();
    if (user.mustChangePassword && !allowPasswordChange) redirect("/change-password");
    return user;
}

/**
 * The ONLY source of a student's class/batch. Never read scope from the client.
 */
export const getStudentScope = cache(async () => {
    const user = await requireAuth(["student"]);
    const s = await Student.findOne({ user: user.id })
        .select("studentId fullName class batch status")
        .lean();
    if (!s || s.status !== "active") notFound();
    return {
        user,
        studentObjectId: s._id,
        studentId: s.studentId,
        fullName: s.fullName,
        classId: s.class,
        batchId: s.batch,
    };
});

/**
 * Route-handler variant: same DB-derived scope, but returns null instead of
 * redirecting (file routes answer 404 — SEC-10).
 */
export const findStudentScope = cache(async () => {
    const user = await getCurrentUser();
    if (!user || user.role !== "student" || user.mustChangePassword) return null;
    const s = await Student.findOne({ user: user.id, status: "active" })
        .select("studentId fullName class batch")
        .lean();
    if (!s) return null;
    return {
        user,
        studentObjectId: s._id,
        studentId: s.studentId,
        fullName: s.fullName,
        classId: s.class,
        batchId: s.batch,
    };
});
