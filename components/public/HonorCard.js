import Image from "next/image";
import { cx } from "@/components/ui/cx.js";

/** Neutral illustrated placeholder when there is no (consented) photo — FR-HON-04. */
function Placeholder() {
    return (
        <svg viewBox="0 0 120 120" aria-hidden="true" className="size-full">
            <rect width="120" height="120" fill="var(--color-paper-deep)" />
            <circle cx="60" cy="47" r="21" fill="var(--color-line-strong)" />
            <path d="M22 112c4-24 20-36 38-36s34 12 38 36" fill="var(--color-line-strong)" />
        </svg>
    );
}

/**
 * One Honor Board card, echoing the client's physical board (PRD §1.2, §13):
 * circular photo in a burgundy ring, yellow grade badge overlapping bottom-right,
 * name in caps, "Percentage Mark : 94".
 * @param {{ name: string, grade: string, percentage: number, photoUrl?: string | null,
 *   size?: 'md' | 'sm', priority?: boolean }} props
 */
export function HonorCard({ name, grade, percentage, photoUrl, size = "md", priority = false }) {
    const px = size === "sm" ? 96 : 132;
    return (
        <figure className="flex flex-col items-center text-center">
            <div className="relative" style={{ width: px, height: px }}>
                <div className="size-full overflow-hidden rounded-full bg-paper-deep ring-4 ring-burgundy ring-offset-2 ring-offset-surface">
                    {photoUrl ? (
                        <Image
                            src={photoUrl}
                            alt={name}
                            width={px}
                            height={px}
                            unoptimized // already a 600×600 / 200×200 WebP
                            priority={priority}
                            className="size-full object-cover"
                        />
                    ) : (
                        <Placeholder />
                    )}
                </div>
                <span
                    className={cx(
                        "absolute -right-1 -bottom-1 grid place-items-center rounded-full border-2 border-surface bg-badge font-serif font-semibold text-ink shadow-sm",
                        size === "sm" ? "size-9 text-sm" : "size-11 text-base",
                    )}
                >
                    {grade}
                    <span className="sr-only"> grade</span>
                </span>
            </div>
            <figcaption className="mt-4">
                <span className="block text-[0.8rem] font-bold tracking-[0.08em] text-ink uppercase">
                    {name}
                </span>
                <span className="mt-1 block text-xs text-muted">
                    Percentage Mark :{" "}
                    <span className="font-semibold text-burgundy">{percentage}</span>
                </span>
            </figcaption>
        </figure>
    );
}
