import { StatusChip } from "@/components/ui/StatusChip.js";

/** Admin-side assignment state (assignmentState() in server/services/assignments.js). */
export function AssignmentState({ state }) {
    if (state === "draft") return <StatusChip>Hidden</StatusChip>;
    if (state === "open") return <StatusChip tone="success">Open</StatusChip>;
    if (state === "late") return <StatusChip tone="gold">Accepting late</StatusChip>;
    return <StatusChip tone="ink">Closed</StatusChip>;
}

/** Per-student status in the review table. */
export function SubmissionState({ status }) {
    if (status === "submitted") return <StatusChip tone="success">Submitted</StatusChip>;
    if (status === "late") return <StatusChip tone="gold">Late</StatusChip>;
    return <StatusChip tone="danger">Missing</StatusChip>;
}
