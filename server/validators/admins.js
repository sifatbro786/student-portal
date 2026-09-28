import { z } from "zod";
import { email, newPassword, personName } from "./common.js";

const role = z.enum(["admin", "super_admin"]);

export const createAdminSchema = z.strictObject({
    name: personName,
    email,
    role,
    password: newPassword,
});
export const updateAdminSchema = z.strictObject({ name: personName, email, role });
export const adminPasswordSchema = z.strictObject({ password: newPassword });
