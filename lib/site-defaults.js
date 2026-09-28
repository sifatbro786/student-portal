// Seed values from the client (see project doc CLIENT-INFO.md). P8 moves these
// into the editable SiteContent singleton; until then the public pages read them here.
export const SITE_DEFAULTS = {
    name: "Tauhid Mostafa",
    title: "O-Level English Language Teacher",
    phone: "8801798415191",
    whatsapp: "8801798415191",
    email: "tauhidmostafa25@gmail.com",
    campuses: [
        {
            name: "Dhanmondi",
            address:
                "Mie Pathways, House #76 (KOI The Building, Level 13), Satmasjid Road, Dhanmondi, Dhaka-1209",
            schedule: "Fri & Sat — morning classes",
        },
        {
            name: "Uttara",
            address: "Mie Pathways, House #40, Lake Drive Road, Uttara, Dhaka",
        },
    ],
};
