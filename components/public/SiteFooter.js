import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/ui/Logo.js";
import { formatPhone } from "@/lib/format.js";
import { getPublicSite } from "@/server/services/site-public.js";
import { PUBLIC_NAV } from "./SiteHeader.js";
import { SocialIcon, whatsappHref } from "./contact.js";

export async function SiteFooter() {
    const s = await getPublicSite();
    return (
        <footer className="bg-ink text-paper/80">
            <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
                <div>
                    <Logo tone="paper" />
                    <p className="mt-5 max-w-xs text-sm leading-relaxed text-paper/60">
                        {s.jobTitle}. {s.boards}.
                    </p>
                    {s.socials.length > 0 && (
                        <ul className="mt-6 flex gap-2">
                            {s.socials.map((so) => (
                                <li key={so.url}>
                                    <a
                                        href={so.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="grid size-10 place-items-center rounded-full border border-paper/20 text-paper/80 transition-colors hover:border-gold-light hover:text-gold-light"
                                    >
                                        <SocialIcon platform={so.platform} className="size-4" />
                                        <span className="sr-only">{so.platform}</span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <nav aria-label="Footer">
                    <p className="eyebrow text-[0.65rem] text-gold-light">Explore</p>
                    <ul className="mt-4 space-y-2.5 text-sm">
                        {[...PUBLIC_NAV, { href: "/admission", label: "Admission" }].map((l) => (
                            <li key={l.href}>
                                <Link href={l.href} className="hover:text-paper">
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div>
                    <p className="eyebrow text-[0.65rem] text-gold-light">Contact</p>
                    <ul className="mt-4 space-y-3 text-sm">
                        <li>
                            <a
                                href={`tel:+${s.contact.phone}`}
                                className="flex items-center gap-2.5 hover:text-paper"
                            >
                                <Phone aria-hidden="true" className="size-4 text-gold-light" />
                                {formatPhone(s.contact.phone)}
                            </a>
                        </li>
                        <li>
                            <a
                                href={whatsappHref(s.contact.whatsapp)}
                                className="flex items-center gap-2.5 hover:text-paper"
                            >
                                <SocialIcon
                                    platform="whatsapp"
                                    className="size-4 text-gold-light"
                                />
                                WhatsApp
                            </a>
                        </li>
                        <li>
                            <a
                                href={`mailto:${s.contact.email}`}
                                className="flex items-center gap-2.5 break-all hover:text-paper"
                            >
                                <Mail
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-gold-light"
                                />
                                {s.contact.email}
                            </a>
                        </li>
                    </ul>
                </div>
                <div>
                    <p className="eyebrow text-[0.65rem] text-gold-light">Campuses</p>
                    <ul className="mt-4 space-y-4 text-sm">
                        {s.campuses.map((c) => (
                            <li key={c.name} className="flex gap-2.5">
                                <MapPin
                                    aria-hidden="true"
                                    className="mt-0.5 size-4 shrink-0 text-gold-light"
                                />
                                <span>
                                    <span className="font-semibold text-paper">{c.name}</span>
                                    <span className="block leading-relaxed text-paper/60">
                                        {c.address}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="border-t border-paper/10">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-paper/50 sm:flex-row sm:justify-between sm:px-6 lg:px-8">
                    <p>
                        © {new Date().getFullYear()} {s.name}. All rights reserved.
                    </p>
                    <p>Cambridge · Edexcel · Dhaka</p>
                </div>
            </div>
        </footer>
    );
}
