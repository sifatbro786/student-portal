import "server-only";

/**
 * Structured logger (PRD §14): one JSON object per line on stdout/stderr, which PM2
 * writes to its (rotated) log files. Fields: level, msg, at, proc, + your data.
 *
 * SEC: never log passwords, tokens or personal data. As a safety net, values under
 * keys that look sensitive are replaced with "[redacted]" (any depth), and URLs lose
 * their query string.
 */
const SENSITIVE =
    /pass(word)?|secret|token|cookie|authorization|session|email|phone|whatsapp|address|otp/i;
const PROC = process.env.APP_PROCESS || (process.argv[1]?.includes("scripts") ? "script" : "web");

function clean(value, depth = 0) {
    if (value == null || typeof value !== "object") return value;
    if (depth > 4) return "[depth]";
    if (Array.isArray(value)) return value.slice(0, 20).map((v) => clean(v, depth + 1));
    const out = {};
    for (const [k, v] of Object.entries(value)) {
        if (k === "err") continue; // handled below
        out[k] = SENSITIVE.test(k) ? "[redacted]" : clean(v, depth + 1);
    }
    return out;
}

function serializeError(err) {
    if (!(err instanceof Error)) return { message: String(err) };
    return {
        name: err.name,
        message: err.message,
        ...(err.code !== undefined && { code: err.code }),
        ...(err.digest && { digest: err.digest }),
        stack: err.stack,
    };
}

/** "/notices/x?token=…" → "/notices/x" */
export const stripQuery = (path) => String(path ?? "").split("?")[0];

function write(level, msg, data) {
    const line = { level, msg, at: new Date().toISOString(), proc: PROC, ...clean(data) };
    if (data?.err !== undefined) line.err = serializeError(data.err);
    const text = JSON.stringify(line);
    (level === "error" ? console.error : console.log)(text);
}

export const log = {
    info: (msg, data) => write("info", msg, data),
    warn: (msg, data) => write("warn", msg, data),
    error: (msg, data) => write("error", msg, data),
};
