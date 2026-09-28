/** Friendly empty state with a next step (PRD §13 “empty states with guidance”). */
export function EmptyState({ icon: Icon, title, children, action }) {
    return (
        <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
            {Icon && (
                <span className="grid size-12 place-items-center rounded-full bg-paper-deep text-burgundy">
                    <Icon aria-hidden="true" className="size-5" />
                </span>
            )}
            <h2 className="mt-4 text-xl font-medium">{title}</h2>
            {children && (
                <p className="mt-1.5 max-w-md text-sm leading-relaxed text-muted">{children}</p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}
