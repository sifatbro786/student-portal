// Seed values from the client (project doc CLIENT-INFO.md). They fill the SiteContent
// singleton (FR-CMS-01) via `npm run seed:site`, and are the fallback until it exists.
// Components never read this file directly — they get content from the public readers.
export const SITE_DEFAULTS = {
    name: "Tauhid Mostafa",
    jobTitle: "O-Level English Language Teacher",
    boards: "Cambridge Assessment International Education · Pearson Edexcel",
    hero: {
        eyebrow: "Cambridge · Edexcel · Dhanmondi & Uttara",
        headline: "O’Level English, taught for",
        accent: "confident top grades.",
        tagline:
            "Personalised coaching, exam-focused strategy and proven results — from a teacher with 17+ years in O & A Level English classrooms.",
        note: "Seats open — enrol today!",
    },
    highlights: [
        {
            title: "Expert strategies for Paper 1 & 2",
            body: "Lessons aligned to the Cambridge & Edexcel curriculum, built around how the papers are actually marked.",
        },
        {
            title: "Regular mock examinations",
            body: "Timed mock tests with detailed written feedback, so exam day feels familiar.",
        },
        {
            title: "Personalised attention",
            body: "Focused writing, comprehension and grammar practice for each student’s weak spots.",
        },
        {
            title: "Proven results, higher grades",
            body: "Year after year, students leave with A and A* grades — see the Honor Board.",
        },
    ],
    stats: [
        { value: "17+", label: "Years teaching O & A Level" },
        { value: "20", label: "Top achievers in 2026" },
        { value: "2", label: "Campuses — Dhanmondi & Uttara" },
    ],
    about: "<p>Tauhid Mostafa is an O-Level English Language teacher with more than seventeen years of experience teaching O Level and A Level English in Dhaka. He is currently a Senior English Faculty at Sunnydale (Bashundhara campus), and has taught at Scholastica, Mastermind and HURDCO International School.</p><p>He holds a Master’s in Applied Linguistics and English Language Teaching (ELT), and has also run IELTS classes at Mentors’ for over seventeen years. His classes prepare students for both Cambridge Assessment International Education and Pearson Edexcel.</p>",
    education: [
        {
            degree: "MA in Applied Linguistics and English Language Teaching (ELT)",
            institution: "",
            year: "",
        },
    ],
    experience: [
        {
            institution: "Sunnydale — Bashundhara Campus",
            role: "Senior English Faculty",
            from: "",
            to: "",
        },
        { institution: "Mentors’", role: "IELTS Instructor", from: "", to: "" },
        { institution: "Scholastica", role: "English Faculty", from: "", to: "Past" },
        { institution: "Mastermind", role: "English Faculty", from: "", to: "Past" },
        {
            institution: "HURDCO International School",
            role: "English Faculty",
            from: "",
            to: "Past",
        },
    ],
    faculties: [
        "Sunnydale",
        "Scholastica",
        "Mastermind",
        "HURDCO International School",
        "Mentors’",
    ],
    campuses: [
        {
            name: "Dhanmondi",
            address:
                "Mie Pathways, House #76 (KOI The Building, Level 13), Satmasjid Road, Dhanmondi, Dhaka-1209",
            schedule: "Fri & Sat — morning classes",
            mapUrl: "https://www.google.com/maps?q=KOI+The+Building,+Satmasjid+Road,+Dhanmondi,+Dhaka&output=embed",
        },
        {
            name: "Uttara",
            address: "Mie Pathways, House #40, Lake Drive Road, Uttara, Dhaka",
            schedule: "",
            mapUrl: "https://www.google.com/maps?q=House+40,+Lake+Drive+Road,+Uttara,+Dhaka&output=embed",
        },
    ],
    contact: {
        phone: "8801798415191",
        whatsapp: "8801798415191",
        email: "tauhidmostafa25@gmail.com",
    },
    socials: [],
    classInfo:
        "Small offline batches for Class 8, 9 and 10 (O Level). Each batch meets on fixed days with regular mock tests, written feedback and study materials in the student portal. Admission is by a short placement test.",
};
