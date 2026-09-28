import "server-only";
import sanitizeHtml from "sanitize-html";

// SEC-08: rich text is sanitised on the server before it is stored.
const OPTIONS = {
    allowedTags: [
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "h2",
        "h3",
        "ul",
        "ol",
        "li",
        "blockquote",
        "a",
        "hr",
    ],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    transformTags: {
        a: sanitizeHtml.simpleTransform("a", {
            target: "_blank",
            rel: "noopener noreferrer nofollow",
        }),
        b: "strong",
        i: "em",
    },
    exclusiveFilter: (frame) =>
        frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren?.length,
};

/** @param {string} html */
export const sanitizeRichText = (html) => sanitizeHtml(String(html ?? ""), OPTIONS).trim();

/** Plain-text version for excerpts and emails. */
export function htmlToText(html, max = 400) {
    const text = sanitizeHtml(String(html ?? "").replace(/<\/(p|h2|h3|li|blockquote)>/g, "$& "), {
        allowedTags: [],
        allowedAttributes: {},
    })
        .replace(/\s+/g, " ")
        .trim();
    return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}
