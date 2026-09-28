import { StatusChip } from "@/components/ui/StatusChip.js";

export function NoticeState({ state }) {
    if (state === "scheduled") return <StatusChip tone="gold">Scheduled</StatusChip>;
    if (state === "expired") return <StatusChip>Expired</StatusChip>;
    return <StatusChip tone="success">Live</StatusChip>;
}
