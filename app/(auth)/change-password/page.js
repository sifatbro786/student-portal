import { requireAuth } from "@/server/auth/guards.js";
import { homeForRole } from "@/lib/constants.js";
import { logoutAction } from "../actions.js";
import { ChangePasswordForm } from "./ChangePasswordForm.js";
import { Alert } from "@/components/ui/Alert.js";
import { Button } from "@/components/ui/Button.js";

export const metadata = { title: "Change password" };

export default async function ChangePasswordPage() {
    const user = await requireAuth(null, { allowPasswordChange: true });
    const forced = user.mustChangePassword;

    return (
        <div className="animate-rise">
            <p className="eyebrow text-gold-deep">Account security</p>
            <h1 className="mt-3 text-4xl font-medium tracking-tight">
                {forced ? "Set a new password" : "Change password"}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
                Signed in as <span className="font-semibold text-ink">{user.email}</span>
            </p>

            {forced && (
                <Alert tone="info" className="mt-6">
                    For your security, choose your own password before continuing.
                </Alert>
            )}

            <ChangePasswordForm />

            <div className="mt-8 flex items-center justify-between border-t border-line pt-5 text-sm">
                {forced ? (
                    <span className="text-muted">Not you?</span>
                ) : (
                    <Button variant="link" href={homeForRole(user.role)}>
                        ← Back
                    </Button>
                )}
                <form action={logoutAction}>
                    <button type="submit" className="font-semibold text-burgundy hover:underline">
                        Log out
                    </button>
                </form>
            </div>
        </div>
    );
}
