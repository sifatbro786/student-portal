"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2, Upload, X } from "lucide-react";
import { Alert } from "@/components/ui/Alert.js";
import { buttonClass } from "@/components/ui/Button.js";
import { SUBMISSION_ACCEPT, SUBMISSION_FILE_LABELS } from "@/lib/constants.js";

const MB = 1024 * 1024;
const EXT_OK = {
    pdf: ["pdf"],
    docx: ["docx"],
    pptx: ["pptx"],
    jpg: ["jpg", "jpeg"],
    png: ["png"],
    webp: ["webp"],
};
const size = (n) => (n >= MB ? `${(n / MB).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);

/**
 * FR-ASG-03/04 upload form (mobile-first). Uses XHR only for upload progress.
 * Client checks are for convenience — the server re-checks everything
 * (magic bytes, size, count, deadline).
 * @param {{ assignmentId: string, maxFiles: number, maxFileSizeMB: number,
 *   allowedTypes: string[], hasSubmission: boolean, late: boolean }} props
 */
export function SubmitWork({
    assignmentId,
    maxFiles,
    maxFileSizeMB,
    allowedTypes,
    hasSubmission,
    late,
}) {
    const router = useRouter();
    const input = useRef(null);
    const [files, setFiles] = useState([]);
    const [state, setState] = useState({ status: "idle" });
    const [progress, setProgress] = useState(0);
    const busy = state.status === "busy";
    const exts = allowedTypes.flatMap((t) => EXT_OK[t] ?? []);

    function add(list) {
        const next = [...files];
        const problems = [];
        for (const f of list) {
            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            if (!exts.includes(ext)) problems.push(`“${f.name}” isn’t an allowed type.`);
            else if (f.size > maxFileSizeMB * MB)
                problems.push(`“${f.name}” is larger than ${maxFileSizeMB} MB.`);
            else if (f.size === 0) problems.push(`“${f.name}” is empty.`);
            else if (next.length >= maxFiles)
                problems.push(`You can add at most ${maxFiles} files.`);
            else if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
        }
        setFiles(next);
        setState(
            problems.length ? { status: "error", error: problems.join(" ") } : { status: "idle" },
        );
        if (input.current) input.current.value = ""; // allow picking the same file again
    }

    function submit(e) {
        e.preventDefault();
        if (!files.length) return setState({ status: "error", error: "Choose at least one file." });
        const body = new FormData();
        for (const f of files) body.append("files", f, f.name);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/submissions/${assignmentId}`);
        xhr.responseType = "json";
        xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) setProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => {
            const res = xhr.response ?? {};
            if (xhr.status === 200 && res.ok) {
                setFiles([]);
                setState({
                    status: "done",
                    message: res.isLate
                        ? "Handed in — marked late."
                        : res.replaced
                          ? "Your new files replaced the earlier ones."
                          : "Handed in. Well done!",
                });
                router.refresh();
            } else {
                setState({
                    status: "error",
                    error: res.error ?? "Upload failed. Please try again.",
                });
                if (res.code === "closed") router.refresh();
            }
        };
        xhr.onerror = () =>
            setState({ status: "error", error: "No connection. Please try again." });
        setProgress(0);
        setState({ status: "busy" });
        xhr.send(body);
    }

    return (
        <form onSubmit={submit} noValidate className="space-y-4">
            {state.status === "error" && <Alert tone="error">{state.error}</Alert>}
            {state.status === "done" && <Alert tone="success">{state.message}</Alert>}
            {late && (
                <Alert tone="info">
                    The deadline has passed. You can still hand in, but it will be marked{" "}
                    <strong>late</strong>.
                </Alert>
            )}

            <label
                className={
                    "flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed border-line-strong bg-surface px-4 py-7 text-center transition-colors hover:border-burgundy has-[:focus-visible]:border-burgundy has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-burgundy/20" +
                    (busy ? " pointer-events-none opacity-60" : "")
                }
            >
                <FilePlus2 aria-hidden="true" className="size-7 text-burgundy" />
                <span className="font-semibold">
                    {files.length ? "Add more files" : "Choose files"}
                </span>
                <span className="text-xs leading-relaxed text-muted">
                    {allowedTypes.map((t) => SUBMISSION_FILE_LABELS[t]).join(", ")} · up to{" "}
                    {maxFiles} file{maxFiles === 1 ? "" : "s"}, {maxFileSizeMB} MB each
                </span>
                <input
                    ref={input}
                    type="file"
                    multiple={maxFiles > 1}
                    accept={allowedTypes.map((t) => SUBMISSION_ACCEPT[t]).join(",")}
                    onChange={(e) => add([...(e.target.files ?? [])])}
                    className="sr-only"
                    disabled={busy}
                />
            </label>

            {files.length > 0 && (
                <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${f.size}`}
                            className="flex items-center gap-3 px-4 py-3"
                        >
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{f.name}</span>
                                <span className="text-xs text-muted">{size(f.size)}</span>
                            </span>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                                className="grid size-10 place-items-center rounded-md text-muted hover:bg-burgundy-tint hover:text-burgundy"
                                aria-label={`Remove ${f.name}`}
                            >
                                <X aria-hidden="true" className="size-4" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {busy && (
                <div className="space-y-1.5">
                    <div
                        role="progressbar"
                        aria-label="Upload progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={progress}
                        className="h-2 overflow-hidden rounded-full bg-paper-deep"
                    >
                        <div
                            className="h-full rounded-full bg-burgundy transition-[width] duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted" aria-live="polite">
                        {progress < 100 ? `Uploading… ${progress}%` : "Checking your files…"}
                    </p>
                </div>
            )}

            {hasSubmission && files.length > 0 && !busy && (
                <p className="text-xs text-muted">
                    Handing in again replaces all the files you submitted before.
                </p>
            )}
            <button
                type="submit"
                disabled={busy || !files.length}
                className={buttonClass({ size: "lg", className: "w-full sm:w-auto" })}
            >
                <Upload aria-hidden="true" className="size-4" />
                {busy ? "Uploading…" : hasSubmission ? "Replace my submission" : "Hand in"}
            </button>
        </form>
    );
}
