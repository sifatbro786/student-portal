import "server-only";
import { connectDB, trusted } from "../db.js";
import { User } from "../models/User.js";
import { hashPassword } from "../auth/password.js";
import { ServiceError } from "../errors.js";
import { writeAudit } from "../audit.js";

// FR-ADMN-02: every invariant from PRD §2.1 is enforced HERE, not only in the UI.
const ADMIN_ROLES = ["admin", "super_admin"];

/** @param {{ id: string, role: string }} actor */
function assertSuperAdmin(actor) {
    if (actor?.role !== "super_admin")
        throw new ServiceError("forbidden", "Only a super admin can manage admins.");
}

async function loadAdmin(id) {
    const u = await User.findOne({ _id: id, role: trusted({ $in: ADMIN_ROLES }) }).lean();
    if (!u) throw new ServiceError("not_found", "Admin not found.");
    return u;
}

/** Is `user` the last ACTIVE super_admin? */
async function isLastActiveSuperAdmin(user) {
    if (user.role !== "super_admin" || !user.isActive) return false;
    const others = await User.countDocuments({
        role: "super_admin",
        isActive: true,
        _id: trusted({ $ne: user._id }),
    });
    return others === 0;
}

const emailTaken = () =>
    new ServiceError("email_taken", "Another account already uses this email.", "email");

export async function listAdmins(actor) {
    assertSuperAdmin(actor);
    await connectDB();
    return User.find({ role: trusted({ $in: ADMIN_ROLES }) })
        .sort({ role: -1, name: 1 })
        .select("name email role isActive lastLoginAt mustChangePassword createdAt")
        .lean();
}

export async function getAdmin(id, actor) {
    assertSuperAdmin(actor);
    await connectDB();
    return loadAdmin(id);
}

export async function createAdmin({ name, email, role, password }, actor) {
    assertSuperAdmin(actor);
    await connectDB();
    if (await User.exists({ email })) throw emailTaken();
    try {
        const u = await User.create({
            name,
            email,
            role,
            passwordHash: await hashPassword(password),
            mustChangePassword: true,
        });
        await writeAudit({
            actor: actor.id,
            actorRole: actor.role,
            action: "admin.create",
            target: { type: "user", id: String(u._id) },
            meta: { role },
        });
        return String(u._id);
    } catch (err) {
        if (err?.code === 11000) throw emailTaken();
        throw err;
    }
}

export async function updateAdmin(id, { name, email, role }, actor) {
    assertSuperAdmin(actor);
    await connectDB();
    const u = await loadAdmin(id);
    const roleChanged = u.role !== role;
    if (roleChanged && String(u._id) === actor.id) {
        throw new ServiceError("self", "You cannot change your own role.", "role");
    }
    if (roleChanged && role !== "super_admin" && (await isLastActiveSuperAdmin(u))) {
        throw new ServiceError(
            "last_super_admin",
            "This is the last active super admin and cannot be demoted.",
            "role",
        );
    }
    if (email !== u.email && (await User.exists({ email, _id: trusted({ $ne: u._id }) })))
        throw emailTaken();
    try {
        await User.updateOne(
            { _id: u._id },
            { $set: { name, email, role }, ...(roleChanged && { $inc: { tokenVersion: 1 } }) },
        );
    } catch (err) {
        if (err?.code === 11000) throw emailTaken();
        throw err;
    }
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: roleChanged ? "admin.role_change" : "admin.update",
        target: { type: "user", id: String(u._id) },
        meta: roleChanged ? { from: u.role, to: role } : undefined,
    });
}

export async function setAdminActive(id, active, actor) {
    assertSuperAdmin(actor);
    await connectDB();
    const u = await loadAdmin(id);
    if (String(u._id) === actor.id)
        throw new ServiceError("self", "You cannot deactivate your own account.");
    if (!active && (await isLastActiveSuperAdmin(u))) {
        throw new ServiceError(
            "last_super_admin",
            "This is the last active super admin and cannot be deactivated.",
        );
    }
    await User.updateOne(
        { _id: u._id },
        active
            ? { $set: { isActive: true } }
            : { $set: { isActive: false }, $inc: { tokenVersion: 1 } },
    );
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: active ? "admin.reactivate" : "admin.deactivate",
        target: { type: "user", id: String(u._id) },
    });
}

export async function deleteAdmin(id, actor) {
    assertSuperAdmin(actor);
    await connectDB();
    const u = await loadAdmin(id);
    if (String(u._id) === actor.id)
        throw new ServiceError("self", "You cannot delete your own account.");
    if (await isLastActiveSuperAdmin(u)) {
        throw new ServiceError(
            "last_super_admin",
            "This is the last active super admin and cannot be deleted.",
        );
    }
    await User.deleteOne({ _id: u._id });
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "admin.delete",
        target: { type: "user", id: String(u._id) },
    });
}

export async function resetAdminPassword(id, password, actor) {
    assertSuperAdmin(actor);
    await connectDB();
    const u = await loadAdmin(id);
    if (String(u._id) === actor.id) {
        throw new ServiceError("self", "Use “Change password” for your own account.");
    }
    await User.updateOne(
        { _id: u._id },
        {
            $set: { passwordHash: await hashPassword(password), mustChangePassword: true },
            $inc: { tokenVersion: 1 },
        },
    );
    await writeAudit({
        actor: actor.id,
        actorRole: actor.role,
        action: "admin.password_reset",
        target: { type: "user", id: String(u._id) },
    });
}
