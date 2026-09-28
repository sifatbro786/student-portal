"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useState } from "react";
import {
    Bold,
    Heading2,
    Heading3,
    Italic,
    Link2,
    List,
    ListOrdered,
    Quote,
    Redo2,
    Undo2,
} from "lucide-react";
import { cx } from "@/components/ui/cx.js";

/**
 * Minimal rich text (Tiptap) → hidden <input name={name}> as HTML.
 * The server sanitises it again before saving (SEC-08) — this is not a security boundary.
 */
export function RichTextEditor({ name, label, initialHTML = "", error }) {
    const [html, setHtml] = useState(initialHTML);
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [2, 3] },
                codeBlock: false,
                code: false,
                link: {
                    openOnClick: false,
                    autolink: true,
                    protocols: ["http", "https", "mailto", "tel"],
                },
            }),
        ],
        content: initialHTML,
        immediatelyRender: false, // SSR-safe
        editorProps: {
            attributes: {
                class: "prose-notice min-h-48 px-4 py-3 focus:outline-none",
                "aria-label": label,
            },
        },
        onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
    });

    const btn = (active, onClick, Icon, title) => (
        <button
            type="button"
            title={title}
            aria-label={title}
            aria-pressed={active}
            onClick={onClick}
            className={cx(
                "grid size-8 place-items-center rounded text-ink/75 hover:bg-paper-deep hover:text-ink",
                active && "bg-burgundy-tint text-burgundy",
            )}
        >
            <Icon aria-hidden="true" className="size-4" />
        </button>
    );

    function setLink() {
        const prev = editor.getAttributes("link").href ?? "";
        const url = window.prompt("Link URL (https://…)", prev);
        if (url === null) return;
        if (url === "") editor.chain().focus().unsetLink().run();
        else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }

    return (
        <div className="space-y-1.5">
            <span className="block text-sm font-semibold">{label}</span>
            <div
                className={cx(
                    "overflow-hidden rounded-md border bg-surface focus-within:border-burgundy focus-within:ring-2 focus-within:ring-burgundy/20",
                    error ? "border-danger" : "border-line-strong",
                )}
            >
                {editor && (
                    <div
                        role="toolbar"
                        aria-label="Formatting"
                        className="flex flex-wrap gap-0.5 border-b border-line bg-paper/70 px-2 py-1.5"
                    >
                        {btn(
                            editor.isActive("bold"),
                            () => editor.chain().focus().toggleBold().run(),
                            Bold,
                            "Bold",
                        )}
                        {btn(
                            editor.isActive("italic"),
                            () => editor.chain().focus().toggleItalic().run(),
                            Italic,
                            "Italic",
                        )}
                        {btn(
                            editor.isActive("heading", { level: 2 }),
                            () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                            Heading2,
                            "Heading",
                        )}
                        {btn(
                            editor.isActive("heading", { level: 3 }),
                            () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                            Heading3,
                            "Sub-heading",
                        )}
                        {btn(
                            editor.isActive("bulletList"),
                            () => editor.chain().focus().toggleBulletList().run(),
                            List,
                            "Bullet list",
                        )}
                        {btn(
                            editor.isActive("orderedList"),
                            () => editor.chain().focus().toggleOrderedList().run(),
                            ListOrdered,
                            "Numbered list",
                        )}
                        {btn(
                            editor.isActive("blockquote"),
                            () => editor.chain().focus().toggleBlockquote().run(),
                            Quote,
                            "Quote",
                        )}
                        {btn(editor.isActive("link"), setLink, Link2, "Link")}
                        <span className="mx-1 w-px bg-line" />
                        {btn(false, () => editor.chain().focus().undo().run(), Undo2, "Undo")}
                        {btn(false, () => editor.chain().focus().redo().run(), Redo2, "Redo")}
                    </div>
                )}
                <EditorContent editor={editor} />
            </div>
            <input type="hidden" name={name} value={html} />
            {error && <p className="text-xs font-medium text-danger">{error}</p>}
        </div>
    );
}
