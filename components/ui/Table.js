import { cx } from "./cx.js";

/** Dense, calm data table with a sticky header (PRD §13 dashboards). */
export function Table({ children, className }) {
    return (
        <div className={cx("overflow-x-auto rounded-lg border border-line bg-surface", className)}>
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                {children}
            </table>
        </div>
    );
}

export function Th({ children, className }) {
    return (
        <th
            scope="col"
            className={cx(
                "sticky top-0 z-[1] border-b border-line bg-paper-deep/80 px-4 py-2.5 text-[0.7rem] font-bold tracking-[0.12em] text-muted uppercase backdrop-blur-sm",
                className,
            )}
        >
            {children}
        </th>
    );
}

export function Td({ children, className }) {
    return (
        <td className={cx("border-b border-line/70 px-4 py-3 align-middle", className)}>
            {children}
        </td>
    );
}
