export const APP_TZ = "Asia/Dhaka";

export const ROLES = /** @type {const} */ (["super_admin", "admin", "student"]);
export const ADMIN_ROLES = /** @type {const} */ (["super_admin", "admin"]);

export const WEEKDAYS = /** @type {const} */ (["sat", "sun", "mon", "tue", "wed", "thu", "fri"]);
export const GRADES = /** @type {const} */ (["A*", "A", "B", "C", "D", "E", "U"]);

export const AUDIENCES = /** @type {const} */ (["public", "all_students", "class", "batches"]);
export const MATERIAL_TYPES = /** @type {const} */ (["note", "question_paper", "routine", "other"]);
export const ASSIGNMENT_TYPES = /** @type {const} */ (["homework", "assignment", "presentation"]);
export const FEE_STATUSES = /** @type {const} */ (["due", "paid", "waived"]);
export const ADMISSION_STATUSES = /** @type {const} */ (["pending", "approved", "rejected"]);

export const SESSION_COOKIE = "tm_session";

/** @param {string} role */
export const homeForRole = (role) => (role === "student" ? "/dashboard" : "/admin");
