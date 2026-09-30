@AGENTS.md

# Project conventions (Tauhid Mostafa portal)

## Current status (read first in a new chat)

- Phase status, decisions and the next phase: project docs **PHASES.md** ("START HERE") and **HANDOVER.md**.
- Demo data: `npm run seed:demo` (password `Demo@1234`, all `@demo.test`), `npm run seed:demo -- --reset` removes it. Extend it when a phase adds a module.

## Conventions

- Spec: PRD.md (project doc). Build plan: PHASES.md.
- JavaScript only (no TS), JSDoc for types. `app/` at repo root (no `src/`).
- `package.json` has `"type": "module"`.
- `server/**` = DB/auth/mail/files, always `import "server-only"`, uses RELATIVE imports with `.js` extensions (no `@/`) so `scripts/*` can run it under plain Node.
- `app/**` and `components/**` may use `@/`.
- Scripts run with `node --conditions=react-server --env-file=.env` (see package.json).
- Mutations: requireAuth(roles) → zod strictObject → service → revalidateTag. Student scope only via getStudentScope().
- Verify: `npm run lint`, `npm run check:syntax`, `npm run build`.
- Mongoose runs with `sanitizeFilter: true`: every `{ $op: … }` written by server code in a FILTER must be wrapped with `trusted()` from `server/db.js` (e.g. `{ status: trusted({ $in: [...] }) }`), otherwise it is silently turned into `$eq`.
- Aggregation pipelines are not cast: use ObjectIds, not strings, in `$match`.
- Never run parallel queries (`Promise.all`) on one transaction session. Use `withTransaction()` from `server/db.js`.
- Never pass Mongoose docs (ObjectId/Date) to Client Components — map to plain values first.
- Forms: uncontrolled inputs (`defaultValue`/`defaultChecked`). React resets forms after each action, and controlled radios/selects lose their DOM value on that reset.
- Sidebar items: admin in `components/admin/nav.js`, student in `components/student/nav.js` — both rendered by `components/admin/Sidebar.js` (add new icons to its `ICONS`). Only add links for modules that already exist.
- Formatting: Prettier, printWidth 100, tabWidth 4.
- Uploads: `saveImage()` in `server/storage/files.js` (magic bytes → sharp → WebP, EXIF stripped). Route Handlers read multipart with `readLimitedFormData()` (streaming byte cap). Private files are served only by `app/api/files/[kind]/[id]` (404 when out of scope).
- Emails are queued with `enqueueMail()` and sent by `npm run cron` (separate process). Templates live in `server/mail/templates.js` and must escape every value.
- Public forms: honeypot + signed render token (`server/form-token.js`) + IP rate limits. No Turnstile.
- Rate limits key on Nginx's `X-Real-IP`. Without it every visitor shares the key "unknown", so production MUST run behind Nginx (P9).
- Content visibility for students goes through `audienceFilter()` / `inAudience()` in `server/services/audience.js` — the only place that rule lives.
- Students get materials only as per-student watermarked copies (`server/storage/watermark.js`); admins get the original.
- PDF viewer uses the pdf.js LEGACY build (`pdfjs-dist/legacy/...`) — the modern build needs JS APIs older Safari/Chrome lack.
- Admin uploads > 4 MB go through Route Handlers wrapped by `adminUpload()` (`server/admin-route.js`), not Server Actions.
- Student submissions (P5): `receiveFiles()` streams multipart to `UPLOAD_ROOT/tmp/uploads` with busboy (never buffered), `finalizeFiles()` checks magic bytes (docx/pptx by their ZIP contents) and moves them to `private/students/<studentId>/submissions/<assignmentId>/`. Order on resubmit: new files → DB → delete old files. Deadline = server time the request arrived (`submissionWindow()`).
- A busboy file stream must be destroyed WITH an error (`stream.destroy(err)`); a plain `destroy()` never settles its pipeline and the request hangs.
- Early answers to an upload (closed, rate-limited) call `drainBody()` first, otherwise the browser sees a connection reset instead of the JSON error.
- Streamed ZIP downloads: `archiver` `ZipArchive({ store: true })` piped through a `PassThrough` → `Readable.toWeb()`; files are read one at a time.
- Reviewed submissions are locked (`isSubmissionLocked()` + atomic upsert filter). Keep that filter if you touch `submitAssignment`.
- `next/cache` does not resolve under plain Node: anything `scripts/*` imports must not import it. Cached readers live in separate files (e.g. `server/services/honor-public.js`).
- Result grid / honor reorder submit via `startTransition(() => formAction(fd))`, not `<form action>`, so React doesn't reset the form when rows come back with errors.
- Public honor photos: `UPLOAD_ROOT/public/honor/<year>/`, URL via `mediaUrl()`; Nginx serves `/media` (P9). Mutations on honor data must call `updateTag("honor")` (actions) or `revalidateTag("honor", { expire: 0 })` (route handlers).
- Avoid `$avg`/`$max` in aggregations while testing on FerretDB; small per-exam stats are computed in JS.
- Payments (P7): `generateFeeRecords(period)` is the only way records are created (bulk upsert + `$setOnInsert` snapshots — idempotent). Status changes go through `setFeeStatus`/`bulkSetFeeStatus` (they write the audit log). Nothing about fees is ever imported by student pages.
- FerretDB (test DB) also lacks `$push`; group in JS or verify an accumulator before relying on it.
- Public site (P8): pages read ONLY through `server/services/site-public.js` (cached, tags `site-content`, `honor`, `testimonials`, `gallery`, `notices-public`; DB errors fall back instead of 500). Every mutation of that data must `updateTag(tag)` (actions) or `revalidateTag(tag, { expire: 0 })` (route handlers) — incl. notice save/delete and student purge.
- Site text lives in the SiteContent singleton (`/admin/site-content`); `lib/site-defaults.js` is only the seed/fallback. Never hardcode teacher info in components.
- Reviews: one per student; student edit → pending; admin moderation is version-checked (`version` = submittedAt the admin saw). Photos: student upload ≤ 1 MB, private until approved, public copy in `public/testimonials/`.
- Gallery: `saveImageSet()` stores 1600 + 800 WebP with real width/height (no CLS). Publishing requires `consentConfirmed`.
- `buttonClass({ className })` can't override `display`/`bg` of a variant (Tailwind order) — wrap in an element or add a variant (`paper`, `outlineLight`).
- Public design: paper/burgundy/ink bands, serif headings with ONE italic accent, gold rule, Caveat (`font-hand`) for at most one handwritten note per section, `reveal` utility (CSS scroll-driven, no JS). No glass, gradient text, count-ups or carousels.
- SEO (between P8 and P9): Admin → Website → SEO (`/admin/seo`) edits `SiteContent.seo` (site keywords, Google/Bing verification, title/description/keywords per public page). Public pages build their `<head>` ONLY with `pageMetadata(site, key, fallback)` from `lib/seo.js` (it also re-adds the OG image — a segment that sets `openGraph` otherwise drops `app/opengraph-image`). Recommended values: `npm run seed:seo` (`-- --force` overwrites). Until saved, the defaults in `lib/site-defaults.js` are used.
- `/admission` copy (headline, steps, checklist, FAQ, open/closed switch) lives in `SiteContent.admission` (Admin → Site content → Admission page). FAQ is also emitted as FAQPage JSON-LD.
- `getPublicSite()` is cached under a versioned key (`["site-content", "v2"]`). Bump the version whenever the shape from `shapeSiteContent()` changes, or pages read an old cached object after deploy.
- Icons: `app/favicon.ico`, `app/icon.png`, `app/apple-icon.png`, `public/brand/icon-*.png` + `app/manifest.js`, all generated from `public/brand/tm-mark.png` (red mark on paper). Regenerate them when the client sends the SVG logo.
- Only the header `<Logo>` is `priority`; the footer uses `tone="ink"` (red mark on dark) with `priority={false}`.
- P9 Step 1 (hardening): security headers + CSP live in `next.config.mjs` (`'unsafe-inline'` scripts are required by Next without nonces; frames only from Google Maps). Adding a new external origin (fonts, analytics, embeds) means editing the CSP there. HSTS is set by Nginx.
- Errors: `app/(public)/error.js`, `app/(admin)/admin/error.js`, `app/(student)/dashboard/error.js` (shared `components/ui/ErrorView.js`), `app/global-error.js`, branded `app/not-found.js`. Error boundaries receive `{ error, retry }` (Next 16), and show `error.digest` as a reference.
- Logs: `server/log.js` writes JSON lines and redacts sensitive keys (password/token/email/phone/…); never log raw request bodies. Uncaught server errors are logged once by `instrumentation.js` `onRequestError` with `reqId` (Nginx `$request_id`, else minted in `proxy.js`). `instrumentation.js register()` validates env at boot (`checkEnvAtBoot`).
- Audit log UI: `/admin/audit-log` (super_admin only, `server/services/audit-log.js`, filters by area/actor/date). New audit actions should use `<area>.<verb>` so they fall into an `AUDIT_GROUPS` area.
- File cleanup: `server/services/cleanup.js` `runFileCleanup()` (cron 03:00 + `npm run cleanup:files`): PendingFileDeletion retries, `tmp/uploads` > 1 day, `cache/watermarked` > 30 days.
- Deploy files: `deploy/` (Nginx for Ubuntu 24.04 incl. `bootstrap-http.conf` for the first certificate, PM2 `ecosystem.config.cjs`, `deploy.sh`, `backup.sh`, `restore.sh`, `env.production.example`). Production runs the **standalone** build (`.next/standalone/server.js`, not `next start`); `deploy.sh` copies `.next/static` + `public/` into it.
- Nginx must serve `.mjs` as JavaScript (pdf.js worker) — already in the config. Rate limits are generous on purpose (CGNAT + Next prefetch); only POST /login and POST /api/admissions are tight.
- Server (2026-09-30): Namecheap VPS Spark reinstalled with Ubuntu 24.04 LTS (1 GB RAM + 2 GB swap); DB = MongoDB Atlas M0 (free: 512 MB, 100 ops/s, no built-in backups → deploy/backup.sh); repo github.com/sifatbro786/student-portal. `.gitattributes` keeps deploy/ and *.sh LF.
