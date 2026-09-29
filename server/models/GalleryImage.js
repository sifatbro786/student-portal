import "server-only";
import { Schema, ObjectId, baseOptions, model, FileRefSchema } from "./_shared.js";

// [P8 addition] Public gallery (classrooms, students, events). Files live in
// UPLOAD_ROOT/public/gallery/ and are served at /media/gallery/… (Nginx in production).
const GalleryImageSchema = new Schema(
    {
        image: { type: FileRefSchema, required: true }, // ≤ 1600px WebP
        thumb: { type: FileRefSchema, required: true }, // ≤ 800px WebP
        width: { type: Number, required: true }, // of `image` — lets the page reserve space (CLS)
        height: { type: Number, required: true },
        caption: { type: String, trim: true, maxlength: 160 },
        alt: { type: String, trim: true, maxlength: 200 },
        category: { type: String, enum: ["classroom", "students", "events"], required: true },
        isFeatured: { type: Boolean, default: false }, // shown on the homepage
        consentConfirmed: { type: Boolean, default: false },
        isPublished: { type: Boolean, default: false },
        order: { type: Number, default: 0 },
        // Stock placeholders until the client sends real photos (npm run seed:gallery).
        isPlaceholder: { type: Boolean, default: false },
        credit: { type: String, trim: true, maxlength: 160 },
        createdBy: { type: ObjectId, ref: "User" },
    },
    baseOptions,
);
GalleryImageSchema.index({ isPublished: 1, order: 1, createdAt: -1 });

export const GalleryImage = model("GalleryImage", GalleryImageSchema, "galleryimages");
