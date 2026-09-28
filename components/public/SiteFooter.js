import { Mail, MapPin, Phone } from "lucide-react";
import { formatPhone } from "@/lib/format.js";
import { SITE_DEFAULTS } from "@/lib/site-defaults.js";

export function SiteFooter() {
    const s = SITE_DEFAULTS;
    return (
        <footer className="mt-24 bg-ink text-paper/85">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr]">
                <div>
                    <p className="font-serif text-2xl text-paper">{s.name}</p>
                    <p className="eyebrow mt-2 text-[0.65rem] text-gold-light">{s.title}</p>
                    <div className="mt-6 space-y-2 text-sm">
                        <a
                            href={`tel:+${s.phone}`}
                            className="flex items-center gap-2.5 hover:text-paper"
                        >
                            <Phone aria-hidden="true" className="size-4 text-gold-light" />{" "}
                            {formatPhone(s.phone)}
                        </a>
                        <a
                            href={`mailto:${s.email}`}
                            className="flex items-center gap-2.5 hover:text-paper"
                        >
                            <Mail aria-hidden="true" className="size-4 text-gold-light" /> {s.email}
                        </a>
                    </div>
                </div>
                {s.campuses.map((c) => (
                    <div key={c.name}>
                        <p className="eyebrow text-[0.65rem] text-gold-light">{c.name} campus</p>
                        <p className="mt-3 flex gap-2.5 text-sm leading-relaxed">
                            <MapPin
                                aria-hidden="true"
                                className="mt-0.5 size-4 shrink-0 text-gold-light"
                            />
                            {c.address}
                        </p>
                        {c.schedule && (
                            <p className="mt-2 pl-6.5 text-sm text-paper/60">{c.schedule}</p>
                        )}
                    </div>
                ))}
            </div>
            <div className="border-t border-paper/10">
                <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-paper/50 sm:px-6">
                    © {new Date().getFullYear()} {s.name}. Cambridge Assessment International
                    Education · Pearson Edexcel.
                </p>
            </div>
        </footer>
    );
}
