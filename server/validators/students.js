import { z } from "zod";
import { STUDENT_ID_RE } from "../../lib/constants.js";
import {
    bdPhone,
    email,
    newPassword,
    objectId,
    optionalBdPhone,
    optionalText,
    personName,
} from "./common.js";

const institutionType = z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["school", "private"]).optional(),
);

const profileShape = {
    fullName: personName,
    email,
    whatsapp: bdPhone,
    fatherName: optionalText(120),
    fatherPhone: optionalBdPhone,
    motherName: optionalText(120),
    motherPhone: optionalBdPhone,
    address: optionalText(500),
    institutionType,
    institutionName: optionalText(200),
};

const schoolNeedsName = (d) => d.institutionType !== "school" || !!d.institutionName;
const schoolNameIssue = { path: ["institutionName"], message: "Enter the school name." };

export const createStudentSchema = z
    .strictObject({ ...profileShape, class: objectId, batch: objectId, password: newPassword })
    .refine(schoolNeedsName, schoolNameIssue);

export const updateStudentSchema = z
    .strictObject(profileShape)
    .refine(schoolNeedsName, schoolNameIssue);

export const changeBatchSchema = z.strictObject({
    class: objectId,
    batch: objectId,
    reason: optionalText(300),
});

export const resetPasswordSchema = z.strictObject({ password: newPassword });

export const purgeStudentSchema = z.strictObject({
    confirmStudentId: z.string().trim().toUpperCase().regex(STUDENT_ID_RE, "Type the student ID."),
    honorAction: z.enum(["keep", "delete"]).default("keep"),
});

export const studentListQuery = z.object({
    class: objectId.optional().catch(undefined),
    batch: objectId.optional().catch(undefined),
    status: z.enum(["active", "inactive", "all"]).catch("active"),
});
