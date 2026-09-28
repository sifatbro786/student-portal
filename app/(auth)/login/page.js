import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/guards.js";
import { homeForRole } from "@/lib/constants.js";
import { LoginForm } from "./LoginForm.js";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
    // Real DB check (not just JWT) so a revoked cookie never causes a redirect loop.
    const user = await getCurrentUser();
    if (user) redirect(user.mustChangePassword ? "/change-password" : homeForRole(user.role));

    return (
        <div className="animate-rise">
            <p className="eyebrow text-gold-deep">Student & staff portal</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
                Use the email and password given to you by the office.
            </p>
            <LoginForm />
            <p className="mt-8 border-t border-line pt-5 text-sm leading-relaxed text-muted">
                Forgot your password? Contact the office — an admin will reset it for you.
            </p>
        </div>
    );
}
