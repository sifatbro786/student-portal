import { NextResponse } from "next/server";
import { SESSION_COOKIE, homeForRole } from "./lib/constants.js";
import {
    verifySessionToken,
    signSessionToken,
    needsRefresh,
    sessionCookieOptions,
} from "./server/auth/token.js";

// UX redirects + sliding cookie refresh ONLY. Real authorization is always
// re-checked on the server (SEC-03): requireAuth() hits the DB every request.
export async function proxy(request) {
    const { pathname } = request.nextUrl;
    // Request id for log correlation: Nginx sets X-Request-ID in production; locally we mint one.
    const reqId = request.headers.get("x-request-id") || crypto.randomUUID();
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token);

    const isAdminArea = pathname === "/admin" || pathname.startsWith("/admin/");
    const isStudentArea = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    const isProtected = isAdminArea || isStudentArea || pathname === "/change-password";

    if (isProtected && !session) {
        const res = NextResponse.redirect(new URL("/login", request.url));
        if (token) res.cookies.delete(SESSION_COOKIE); // expired or tampered
        res.headers.set("x-request-id", reqId);
        return res;
    }

    if (
        session &&
        ((isAdminArea && session.role === "student") ||
            (isStudentArea && session.role !== "student"))
    ) {
        return NextResponse.redirect(new URL(homeForRole(session.role), request.url));
    }

    const forwarded = new Headers(request.headers);
    forwarded.set("x-request-id", reqId);
    const res = NextResponse.next({ request: { headers: forwarded } });
    res.headers.set("x-request-id", reqId);
    if (session && needsRefresh(session.exp)) {
        const fresh = await signSessionToken({
            sub: session.sub,
            role: session.role,
            tv: session.tv,
        });
        res.cookies.set(SESSION_COOKIE, fresh, sessionCookieOptions());
    }
    return res;
}

export const config = {
    // Skip API routes (uploads must not be buffered by proxy), Next internals and static files.
    matcher: [
        "/((?!api|_next/static|_next/image|media|favicon.ico|robots.txt|sitemap.xml|.*\\.[a-zA-Z0-9]+$).*)",
    ],
};
