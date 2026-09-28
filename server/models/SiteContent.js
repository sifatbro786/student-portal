import "server-only";
import { Schema, baseOptions, model, FileRefSchema } from "./_shared.js";

// Singleton document: _id = 'singleton'. Shape is refined in P8.
const SiteContentSchema = new Schema(
    {
        _id: { type: String, default: "singleton" },
        hero: {
            headline: String,
            tagline: String,
            photo: FileRefSchema,
            primaryCta: String,
            secondaryCta: String,
        },
        about: { type: String, default: "" }, // sanitised HTML
        education: [{ degree: String, institution: String, year: String }],
        experience: [
            {
                institution: String,
                role: String,
                from: String,
                to: String,
                logo: FileRefSchema,
                order: Number,
            },
        ],
        stats: [{ label: String, value: String }],
        contact: {
            phone: String,
            email: String,
            whatsapp: String,
            venue: String,
            mapEmbedUrl: String,
        },
        socials: [{ platform: String, url: String }],
        classInfo: { type: String, default: "" },
    },
    baseOptions,
);

export const SiteContent = model("SiteContent", SiteContentSchema, "sitecontent");
