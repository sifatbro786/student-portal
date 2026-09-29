export const APP_TZ = "Asia/Dhaka";

export const ROLES = /** @type {const} */ (["super_admin", "admin", "student"]);
export const ADMIN_ROLES = /** @type {const} */ (["super_admin", "admin"]);

export const WEEKDAYS = /** @type {const} */ (["sat", "sun", "mon", "tue", "wed", "thu", "fri"]);
export const GRADES = /** @type {const} */ (["A*", "A", "B", "C", "D", "E", "U"]);

export const AUDIENCES = /** @type {const} */ (["public", "all_students", "class", "batches"]);
export const MATERIAL_TYPES = /** @type {const} */ (["note", "question_paper", "routine", "other"]);
export const ASSIGNMENT_TYPES = /** @type {const} */ (["homework", "assignment", "presentation"]);
export const ASSIGNMENT_TYPE_LABELS = {
    homework: "Homework",
    assignment: "Assignment",
    presentation: "Presentation",
};
/** FR-ASG-01: file types a student may submit (checked by magic bytes on the server). */
export const SUBMISSION_FILE_TYPES = /** @type {const} */ ([
    "pdf",
    "docx",
    "pptx",
    "jpg",
    "png",
    "webp",
]);
export const SUBMISSION_FILE_LABELS = {
    pdf: "PDF",
    docx: "Word (.docx)",
    pptx: "PowerPoint (.pptx)",
    jpg: "JPG",
    png: "PNG",
    webp: "WebP",
};
/** `accept` attribute values per type (a UX hint only — the server decides). */
export const SUBMISSION_ACCEPT = {
    pdf: ".pdf,application/pdf",
    docx: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    pptx: ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation",
    jpg: ".jpg,.jpeg,image/jpeg",
    png: ".png,image/png",
    webp: ".webp,image/webp",
};
export const FEE_STATUSES = /** @type {const} */ (["due", "paid", "waived"]);
export const ADMISSION_STATUSES = /** @type {const} */ (["pending", "approved", "rejected"]);

export const SESSION_COOKIE = "tm_session";

/** @param {string} role */
export const homeForRole = (role) => (role === "student" ? "/dashboard" : "/admin");

export const STUDENT_ID_RE = /^TM-\d{4}-\d{4,}$/;

export const WEEKDAY_LABELS = {
    sat: "Sat",
    sun: "Sun",
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
};

export const ROLE_LABELS = { super_admin: "Super admin", admin: "Admin", student: "Student" };
