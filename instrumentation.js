// Server-side error reporting (Next's instrumentation hook). Every uncaught error in a
// page, Route Handler, Server Action or the proxy lands here once, as one JSON log line
// with the request id Nginx (or proxy.js) attached — grep the id from a user's report.
export async function register() {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    if (process.env.NEXT_PHASE === "phase-production-build") return; // runtime secrets not needed to build
    const { checkEnvAtBoot } = await import("./server/env.js");
    checkEnvAtBoot();
}

export async function onRequestError(err, request, context) {
    if (process.env.NEXT_RUNTIME !== "nodejs") return;
    const header = (name) => {
        const v = request.headers?.[name];
        return Array.isArray(v) ? v[0] : v;
    };
    const e = err instanceof Error ? err : new Error(String(err));
    // Plain JSON here (no server/log.js import) so this file stays runtime-agnostic.
    console.error(
        JSON.stringify({
            level: "error",
            msg: "request.failed",
            at: new Date().toISOString(),
            proc: process.env.APP_PROCESS || "web",
            reqId: header("x-request-id"),
            method: request.method,
            path: String(request.path ?? "").split("?")[0], // no query strings in logs
            route: context.routePath,
            kind: context.routeType,
            err: { name: e.name, message: e.message, digest: e.digest, stack: e.stack },
        }),
    );
}
