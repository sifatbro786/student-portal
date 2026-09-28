export function PageTitle({ eyebrow, title, children }) {
    return (
        <header className="mb-6">
            {eyebrow && <p className="eyebrow text-gold-deep">{eyebrow}</p>}
            <h1 className="mt-2 text-3xl font-medium tracking-tight">{title}</h1>
            <span className="gold-rule mt-3" />
            {children && <p className="mt-4 text-sm leading-relaxed text-muted">{children}</p>}
        </header>
    );
}
