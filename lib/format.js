import { WEEKDAYS, WEEKDAY_LABELS } from "./constants.js";

/** "18:00" → "6:00 PM" */
export function formatTime(hhmm) {
    if (!hhmm) return "";
    const [h, m] = hhmm.split(":").map(Number);
    const suffix = h >= 12 ? "PM" : "AM";
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** { days, startTime, endTime } → "Sat, Mon, Wed · 6:00 PM – 8:00 PM" */
export function scheduleLabel(schedule) {
    if (!schedule) return "";
    const days = WEEKDAYS.filter((d) => schedule.days?.includes(d)).map((d) => WEEKDAY_LABELS[d]);
    return `${days.join(", ")} · ${formatTime(schedule.startTime)} – ${formatTime(schedule.endTime)}`;
}

/** "8801712345678" → "+880 1712-345678" */
export function formatPhone(p) {
    if (!p || !/^8801\d{9}$/.test(p)) return p ?? "";
    return `+880 ${p.slice(3, 7)}-${p.slice(7)}`;
}

/** "8801712345678" → "01712345678" (how people type it). */
export const localPhone = (p) => (p && /^8801\d{9}$/.test(p) ? p.slice(2) : (p ?? ""));

/** Student document → plain values for StudentForm (safe to pass to a Client Component). */
export function studentFormValues(s) {
    return {
        fullName: s.fullName ?? "",
        email: s.email ?? "",
        whatsapp: localPhone(s.whatsapp),
        fatherName: s.father?.name ?? "",
        fatherPhone: localPhone(s.father?.phone),
        motherName: s.mother?.name ?? "",
        motherPhone: localPhone(s.mother?.phone),
        address: s.address ?? "",
        institutionType: s.institution?.type ?? "",
        institutionName: s.institution?.name ?? "",
    };
}

/** "Nusrat Jahan" → "NJ" (avatar fallback). */
export const initials = (name) =>
    String(name ?? "")
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0].toUpperCase())
        .join("") || "?";
