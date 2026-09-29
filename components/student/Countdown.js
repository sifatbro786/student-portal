"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/ui/cx.js";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

function label(ms) {
    if (ms <= 0) return "Deadline passed";
    if (ms >= 2 * DAY) return `${Math.floor(ms / DAY)} days left`;
    if (ms >= DAY) return `1 day ${Math.floor((ms % DAY) / HOUR)} h left`;
    if (ms >= HOUR) return `${Math.floor(ms / HOUR)} h ${Math.floor((ms % HOUR) / MIN)} min left`;
    const m = Math.floor(ms / MIN);
    const s = Math.floor((ms % MIN) / 1000);
    return `${m}:${String(s).padStart(2, "0")} left`;
}

/**
 * FR-ASG-02 live countdown. Driven by SERVER time: `serverNow` is when the page
 * was rendered, so a wrong phone clock can't make it lie. Purely informational —
 * the server decides on every upload.
 * @param {{ deadline: string, serverNow: string, className?: string }} props ISO strings
 */
export function Countdown({ deadline, serverNow, className }) {
    const end = new Date(deadline).getTime();
    const [now, setNow] = useState(() => new Date(serverNow).getTime());

    useEffect(() => {
        const skew = new Date(serverNow).getTime() - Date.now();
        let timer;
        const tick = () => {
            const t = Date.now() + skew;
            setNow(t);
            const left = end - t;
            if (left > 0) timer = setTimeout(tick, left < HOUR ? 1000 : 30_000);
        };
        timer = setTimeout(tick, 0);
        return () => clearTimeout(timer);
    }, [end, serverNow]);

    const left = end - now;
    return (
        <span
            role="timer"
            className={cx(
                "tabular-nums",
                left <= 0 ? "text-muted" : left < DAY ? "font-semibold text-burgundy" : "",
                className,
            )}
        >
            {label(left)}
        </span>
    );
}
