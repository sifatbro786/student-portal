// Create the first super_admin (PRD §16.4). Credentials are read from an
// interactive prompt — never from argv, so they don't land in shell history.
//
//   npm run seed:admin                      → super_admin
//   npm run seed:admin -- --role=student    → dev-only test user (refused in production)
//
// Runs outside Next, hence `node --conditions=react-server` (see package.json)
// so the 'server-only' guard in server/** resolves to a no-op.
import readline from "node:readline";
import { z } from "zod";
import { connectDB, disconnectDB } from "../server/db.js";
import { User } from "../server/models/User.js";
import { hashPassword } from "../server/auth/password.js";

const roleArg = process.argv.find((a) => a.startsWith("--role="))?.split("=")[1] ?? "super_admin";
if (!["super_admin", "admin", "student"].includes(roleArg)) fail(`Unknown role "${roleArg}".`);
if (roleArg !== "super_admin" && process.env.NODE_ENV === "production") {
    fail("Only super_admin can be seeded in production. Create other users from the admin panel.");
}

const schema = z.strictObject({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().toLowerCase().pipe(z.email()),
    password: z
        .string()
        .min(8, "Use at least 8 characters.")
        .refine((v) => Buffer.byteLength(v) <= 72, "Max 72 bytes."),
});

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});
let muted = false;
rl._writeToOutput = (s) => {
    if (!muted) rl.output.write(s);
    else if (s.includes("\n") || s.includes("\r")) rl.output.write("\n");
};
// Line iterator (instead of rl.question) so piped input works too.
const lines = rl[Symbol.asyncIterator]();
async function ask(q, { hidden = false } = {}) {
    rl.output.write(q);
    muted = hidden;
    const { value = "" } = await lines.next();
    muted = false;
    return value;
}

try {
    console.log(`\nCreate ${roleArg}\n`);
    const name = await ask("Full name: ");
    const email = await ask("Email: ");
    const password = await ask("Password (hidden): ", { hidden: true });
    const confirm = await ask("Confirm password: ", { hidden: true });
    rl.close();

    if (password !== confirm) fail("Passwords do not match.");
    const parsed = schema.safeParse({ name, email, password });
    if (!parsed.success)
        fail(parsed.error.issues.map((i) => `${i.path[0]}: ${i.message}`).join("\n"));

    await connectDB();
    await User.init(); // make sure the unique email index exists
    if (await User.exists({ email: parsed.data.email }))
        fail("A user with this email already exists.");

    await User.create({
        name: parsed.data.name,
        email: parsed.data.email,
        role: roleArg,
        passwordHash: await hashPassword(parsed.data.password),
        mustChangePassword: true, // FR-AUTH-07: every new account starts with this flag
    });
    console.log(`\n✓ ${roleArg} created for ${parsed.data.email}. Sign in at /login.\n`);
} catch (err) {
    fail(err?.message ?? String(err));
} finally {
    await disconnectDB();
}

function fail(msg) {
    console.error(`\n✗ ${msg}\n`);
    process.exit(1);
}
