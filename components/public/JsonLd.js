/** Structured data (PRD §12). `<` is escaped so content can never close the script tag. */
export function JsonLd({ data }) {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
        />
    );
}

/** Person + EducationalOrganization (with LocalBusiness-style addresses) for the teacher. */
export function siteJsonLd(site, baseUrl) {
    const personId = `${baseUrl}/#person`;
    return [
        {
            "@context": "https://schema.org",
            "@type": "Person",
            "@id": personId,
            name: site.name,
            jobTitle: site.jobTitle,
            url: baseUrl,
            image: site.hero.photoUrl.startsWith("http")
                ? site.hero.photoUrl
                : `${baseUrl}${site.hero.photoUrl}`,
            email: `mailto:${site.contact.email}`,
            telephone: `+${site.contact.phone}`,
            knowsAbout: ["O Level English Language", "IGCSE English", "IELTS"],
            alumniOf: site.education
                .filter((e) => e.institution)
                .map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
            worksFor: site.experience
                .filter((x) => !x.to)
                .map((x) => ({ "@type": "EducationalOrganization", name: x.institution })),
            sameAs: site.socials.map((s) => s.url),
        },
        {
            "@context": "https://schema.org",
            "@type": ["EducationalOrganization", "LocalBusiness"],
            "@id": `${baseUrl}/#classes`,
            name: `${site.name} — O'Level English`,
            url: baseUrl,
            telephone: `+${site.contact.phone}`,
            email: site.contact.email,
            founder: { "@id": personId },
            areaServed: "Dhaka, Bangladesh",
            address: site.campuses.map((c) => ({
                "@type": "PostalAddress",
                name: `${c.name} campus`,
                streetAddress: c.address,
                addressLocality: "Dhaka",
                addressCountry: "BD",
            })),
        },
    ];
}

/** Honor Board as an ItemList of people with their grade (no photos needed). */
export function honorJsonLd(board, baseUrl) {
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: `${board.heading} — ${board.subheading}`,
        url: `${baseUrl}/honor-board?year=${board.year}`,
        numberOfItems: board.entries.length,
        itemListElement: board.entries.map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
                "@type": "Person",
                name: e.name,
                description: `O Level English Language ${board.year}: grade ${e.grade}, ${e.percentage}%`,
            },
        })),
    };
}
