import { StatusChip } from "@/components/ui/StatusChip.js";

export function AdmissionStatus({ status, converted }) {
    if (converted) return <StatusChip tone="ink">Student</StatusChip>;
    if (status === "approved") return <StatusChip tone="success">Approved</StatusChip>;
    if (status === "rejected") return <StatusChip tone="danger">Rejected</StatusChip>;
    return <StatusChip tone="gold">Pending</StatusChip>;
}
