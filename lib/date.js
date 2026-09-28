import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";
import { APP_TZ } from "./constants.js";

// Store UTC, compute/display in Asia/Dhaka (PRD §14).

/** @param {Date | string | number} d */
export const inDhaka = (d) => new TZDate(new Date(d).getTime(), APP_TZ);

/** "28 Sep 2026, 6:00 PM" */
export const formatDateTime = (d) => format(inDhaka(d), "d MMM yyyy, h:mm a");

/** "28 Sep 2026" */
export const formatDate = (d) => format(inDhaka(d), "d MMM yyyy");

/** Period key "YYYY-MM" of a date in Asia/Dhaka. */
export const periodOf = (d = new Date()) => format(inDhaka(d), "yyyy-MM");

/** "2026-09" -> "Sep 2026" */
export const formatPeriod = (period) => {
    const [y, m] = period.split("-").map(Number);
    return format(new TZDate(y, m - 1, 1, APP_TZ), "MMM yyyy");
};

/** Current year in Asia/Dhaka. */
export const dhakaYear = (d = new Date()) => inDhaka(d).getFullYear();
