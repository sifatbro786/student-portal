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
