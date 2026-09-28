import "server-only";
import bcrypt from "bcryptjs";

const COST = 12; // SEC-01

/** @param {string} plain */
export const hashPassword = (plain) => bcrypt.hash(plain, COST);

let dummyHash;
/**
 * Compare against a real or dummy hash so "unknown email" and "wrong password"
 * take the same time (FR-AUTH-09, no user enumeration).
 * @param {string} plain
 * @param {string | undefined | null} hash
 */
export async function verifyPassword(plain, hash) {
    if (!hash) {
        dummyHash ??= await bcrypt.hash("timing-equaliser-not-a-password", COST);
        await bcrypt.compare(plain, dummyHash);
        return false;
    }
    return bcrypt.compare(plain, hash);
}
