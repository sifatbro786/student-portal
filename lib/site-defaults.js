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
    admission: {
        isOpen: true,
        headline: "Take your seat in the",
        accent: "next batch.",
        intro: "Small offline batches for Class 8, 9 and 10 (O Level) in Dhanmondi and Uttara. Sit the short placement test at a campus, then apply here — the office confirms your batch on WhatsApp.",
        closedNote:
            "Online applications are closed for now. Call or WhatsApp the office to join the waiting list for the next intake.",
        steps: [
            {
                title: "Sit the placement test",
                body: "A short English test at the Dhanmondi or Uttara campus, so we can place you in the right batch.",
            },
            {
                title: "Apply online",
                body: "Fill in this form with your test score and a clear photo. It takes about five minutes.",
            },
            {
                title: "Batch confirmation",
                body: "The office reviews your application and confirms your batch and start date on WhatsApp.",
            },
            {
                title: "Portal & first class",
                body: "You receive a student portal login for notices, notes, routine, assignments and results.",
            },
        ],
        checklist: [
            { text: "Placement test score (%)" },
            { text: "A clear, recent photo of the student (JPG, PNG or WebP, max 3 MB)" },
            { text: "Student’s WhatsApp number and email" },
            { text: "Father’s and mother’s names and phone numbers" },
            { text: "School name (or “private candidate”)" },
        ],
        faqs: [
            {
                question: "Do I have to take a test before applying?",
                answer: "Yes. Every student sits a short placement test at one of our campuses first. Enter the score you received in the form — the office verifies it before confirming your batch.",
            },
            {
                question: "Which classes and exam boards do you teach?",
                answer: "Class 8, 9 and 10 (O Level English Language) for both Cambridge Assessment International Education and Pearson Edexcel.",
            },
            {
                question: "Are the classes online or offline?",
                answer: "All classes are offline, in small batches at our Dhanmondi and Uttara campuses. Notes, notices, assignments and results are shared in the student portal.",
            },
            {
                question: "Can I choose my batch?",
                answer: "Yes — pick a preferred batch in the form. Seats in each batch are limited, so the office confirms the final batch based on availability and your test score.",
            },
            {
                question: "What happens after I submit the form?",
                answer: "You get a reference number on screen and by email. The office reviews your application and contacts you on WhatsApp, usually within a few working days.",
            },
            {
                question: "My child studies at a school — can they still join?",
                answer: "Of course. Most of our students attend English-medium schools; private candidates are welcome too. Just choose the right option in the form.",
            },
        ],
    },
    seo: {
        keywords: [
            "O Level English",
            "O Level English teacher in Dhaka",
            "Tauhid Mostafa",
            "Cambridge O Level English Language",
            "Edexcel IGCSE English Language",
        ],
        googleVerification: "",
        bingVerification: "",
        pages: {
            home: {
                title: "Tauhid Mostafa — O Level English Teacher in Dhaka",
                description:
                    "O Level English Language classes with Tauhid Mostafa in Dhanmondi & Uttara, Dhaka. Cambridge & Edexcel, 17+ years, small batches, mock tests and A* results.",
                keywords: [
                    "O Level English tutor Dhanmondi",
                    "O Level English coaching Uttara",
                    "English Language 1123",
                    "IGCSE English Language A 4EA1",
                    "best O Level English teacher Dhaka",
                ],
            },
            honorBoard: {
                title: "O Level English Results & Honor Board | Tauhid Mostafa",
                description:
                    "Circle of Excellence: A* and A achievers in O Level English Language taught by Tauhid Mostafa in Dhaka — names, grades and percentage marks by year.",
                keywords: ["O Level English results", "A* O Level English Dhaka", "honor board"],
            },
            gallery: {
                title: "Class Gallery — O Level English in Dhaka | Tauhid Mostafa",
                description:
                    "Photos from Tauhid Mostafa’s O Level English classes in Dhanmondi and Uttara — classrooms, mock tests, students and results days.",
                keywords: ["O Level English class photos", "English coaching Dhanmondi"],
            },
            notices: {
                title: "Notices — Admission & Mock Test Updates | Tauhid Mostafa",
                description:
                    "Latest public notices from Tauhid Mostafa’s O Level English classes: admission news, mock test schedules, holidays and batch updates.",
                keywords: ["O Level English admission notice", "mock test schedule"],
            },
            admission: {
                title: "O Level English Admission — Apply Online | Tauhid Mostafa",
                description:
                    "Apply online for O Level English Language batches with Tauhid Mostafa in Dhanmondi & Uttara, Dhaka. Placement test, batch times, FAQs and WhatsApp confirmation.",
                keywords: [
                    "O Level English admission Dhaka",
                    "O Level English batch Dhanmondi",
                    "O Level English batch Uttara",
                ],
            },
        },
    },
};
