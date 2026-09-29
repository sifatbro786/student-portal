import { StatusChip } from "@/components/ui/StatusChip.js";

/** FR-ASG-02 statuses, always spelled out (never colour alone). */
export function AssignmentStatus({ status }) {
    if (status === "submitted") return <StatusChip tone="success">Submitted</StatusChip>;
    if (status === "late") return <StatusChip tone="gold">Submitted (late)</StatusChip>;
    if (status === "closed") return <StatusChip tone="ink">Closed</StatusChip>;
    return <StatusChip tone="danger">Not submitted</StatusChip>;
}
