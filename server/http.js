import "server-only";

/**
 * SEC-05 for Route Handlers: a non-GET request must come from our own origin.
 * (Server Actions already get this check from Next.)
 * @param {Request} request
 */
export function isSameOrigin(request) {
    const origin = request.headers.get("origin");
    if (!origin) return false;
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    try {
        return new URL(origin).host === host;
    } catch {
        return false;
    }
}

export const json = (body, status = 200) =>
    Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Read and discard a request body (up to `maxBytes`) before answering early.
 * Answering a multipart upload without reading it makes many clients see a
 * connection reset instead of our JSON error.
 * @param {Request} request
 * @param {number} maxBytes
 */
export async function drainBody(request, maxBytes) {
    if (!request.body || request.bodyUsed) return;
    const reader = request.body.getReader();
    let seen = 0;
    try {
        for (;;) {
            const { done, value } = await reader.read();
            if (done) return;
            seen += value.byteLength;
            if (seen > maxBytes) return void (await reader.cancel());
        }
    } catch {
        // client went away — nothing to do
    }
}
