import "server-only";

/**
 * Minimal structured logger (JSON lines). Replaced/extended in P9.
 * Never pass passwords, tokens or PII in `data`.
 */
function write(level, msg, data) {
    const line = { level, msg, at: new Date().toISOString(), ...data };
    if (data?.err instanceof Error) {
        line.err = { name: data.err.name, message: data.err.message, stack: data.err.stack };
    }
    (level === "error" ? console.error : console.log)(JSON.stringify(line));
}

export const log = {
    info: (msg, data) => write("info", msg, data),
    warn: (msg, data) => write("warn", msg, data),
    error: (msg, data) => write("error", msg, data),
};
