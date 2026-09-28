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
- Admin sidebar items live in `components/admin/nav.js`. Only add links for modules that already exist.
- Formatting: Prettier, printWidth 100, tabWidth 4.
- Uploads: `saveImage()` in `server/storage/files.js` (magic bytes → sharp → WebP, EXIF stripped). Route Handlers read multipart with `readLimitedFormData()` (streaming byte cap). Private files are served only by `app/api/files/[kind]/[id]` (404 when out of scope).
- Emails are queued with `enqueueMail()` and sent by `npm run cron` (separate process). Templates live in `server/mail/templates.js` and must escape every value.
- Public forms: honeypot + signed render token (`server/form-token.js`) + IP rate limits. No Turnstile.
- Rate limits key on Nginx's `X-Real-IP`. Without it every visitor shares the key "unknown", so production MUST run behind Nginx (P9).
- Content visibility for students goes through `audienceFilter()` / `inAudience()` in `server/services/audience.js` — the only place that rule lives.
- Students get materials only as per-student watermarked copies (`server/storage/watermark.js`); admins get the original.
- PDF viewer uses the pdf.js LEGACY build (`pdfjs-dist/legacy/...`) — the modern build needs JS APIs older Safari/Chrome lack.
- Admin uploads > 4 MB go through Route Handlers wrapped by `adminUpload()` (`server/admin-route.js`), not Server Actions.

