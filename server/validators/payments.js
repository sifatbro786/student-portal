import { z } from "zod";
import { FEE_STATUSES } from "../../lib/constants.js";
import { objectId, optionalText } from "./common.js";

export const period = z
    .string()
    .trim()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Pick a month.");

// FR-PAY-05/07: one cell
export const feeStatusSchema = z.strictObject({
    status: z.enum(FEE_STATUSES, { error: "Pick a status." }),
    note: optionalText(300),
});

// FR-PAY-06: bulk
export const feeBulkSchema = z.strictObject({
    ids: z.array(objectId).min(1, "Select at least one row.").max(200, "Select at most 200 rows."),
    status: z.enum(FEE_STATUSES),
    note: optionalText(300),
});

/** URL filters (searchParams): unknown keys ignored on purpose. */
export const matrixQuery = z.object({
    year: z.coerce.number().int().min(2020).max(2100).optional().catch(undefined),
    class: objectId.optional().catch(undefined),
    batch: objectId.optional().catch(undefined),
});

export const feeListQuery = z.object({
    period: period.optional().catch(undefined),
    status: z.enum(["all", ...FEE_STATUSES]).catch("all"),
    class: objectId.optional().catch(undefined),
    batch: objectId.optional().catch(undefined),
    q: z.string().trim().max(100).optional().catch(undefined),
});
