# PHASES — Tauhid Mostafa Portal (build plan)

> Source of truth: PRD.md §18. এই ফাইল শুধু প্রতিটা phase কে ছোট sub-step এ ভাগ করেছে। PRD আর এই ফাইলে conflict হলে PRD জিতবে।
> Repo: **Next.js 16.3.6, React 19.2.8, JavaScript only (no TS), Tailwind v4, `app/` root এ — [DECIDED] `src/` হবে না**; PRD §7.2 এর `src/server` → `server/`, `src/lib` → `lib/`। `"type": "module"`।
> Brand: শুধু Tauhid Mostafa personal brand (MIE Academy নয়) — [DECIDED]।

## Status
- ✅ P1 Foundation — 2026-09-28 (e2e tested on FerretDB stand-in; real MongoDB test pending on dev machine)

## Global rules (সব phase এ)
- প্রতিটা sub-step: backend contract (model + zod `.strict()` + service + guard) → verify → তারপর UI।
- Mutation flow: `requireAuth(roles)` → zod parse → service → `revalidateTag()`।
- Student scope সবসময় `getStudentScope()` (DB) থেকে; out-of-scope → 404।
- JS repo → JSDoc types; verify = `eslint` + `esbuild` syntax check + দরকার হলে `next build`।
- Scripts (`scripts/*.js`) Next এর বাইরে চলে: `node --conditions=react-server --env-file=.env` দিয়ে run হবে। তাই `server/**` এর ভেতরে শুধু relative import + `.js` extension (no `@/`)।
- Design: PRD §13 + premium-web-design-system skill (conflict হলে PRD §13 জিতবে — নিচে দেখো)।
- প্রতিটা phase শেষে: বাংলায় summary — কী হলো, কীভাবে test করবে, open issue।

## Design rule merge (skill ↔ PRD §13)
| বিষয় | সিদ্ধান্ত |
|---|---|
| Glass nav / glass cards | ❌ PRD §13 নিষেধ করে। Nav = solid paper background + thin gold hairline, scroll এ subtle shadow। |
| Heading font | PRD: serif display (Fraunces) headings; sans (Manrope/Inter) UI। Skill এর "one italic serif accent" → hero তে একটা italic phrase। |
| Hero | Teacher এর real photo, lower-left headline + CTA, paper texture। Blob/gradient hero ❌। Video না থাকলে দরকার নেই। |
| Logo rail | "Ex-faculty: Scholastica · Mastermind · Hurdco · Sunnydale" + Cambridge/Edexcel — typographic marquee, 30s linear, gradient mask, reduced-motion এ static। |
| Testimonials | PRD তে নেই → build করব না (out of spec) যতক্ষণ না তুমি বলো। |
| Count-up numbers / gradient text | ❌ (PRD)। |
| Motion | Skill: reveal 700–900ms `cubic-bezier(.22,1,.36,1)`, hover lift ≤ 4px, `prefers-reduced-motion` respect। ✅ |
| Verification | Skill checklist (390/768/1440, no overflow, no console error, build pass) প্রতিটা UI phase এ। ✅ |

---

## P1 — Foundation
**লক্ষ্য:** প্রজেক্টের কঙ্কাল + auth।
- **P1.1 Setup & design foundation** — deps install, `.env.example`, `lib/env.js` (zod-validated env), `next.config.mjs` (`output: 'standalone'`, `serverExternalPackages`), Tailwind v4 `@theme` tokens (ink/paper/burgundy/gold/badge/muted), `next/font` (Fraunces + Manrope), paper texture, base UI primitives: Button, Input, Label, FieldError (`aria-live`), StatusChip, Card, SectionTitle (gold rule)। `lib/date.js` (Asia/Dhaka helpers, `28 Sep 2026, 6:00 PM` format)।
- **P1.2 Data layer** — `server/db.js` (cached connection, `sanitizeFilter`, `strictQuery`), সব models (§6) schema + indexes, `Counter` atomic `nextSeq()`।
- **P1.3 Auth core** — `password.js` (bcryptjs 12), `session.js` (jose HS256, 7d, sliding refresh), `guards.js` (`getCurrentUser` React.cache, `requireAuth`, `getStudentScope`), `rate-limit.js` (lru-cache, `X-Real-IP`), `audit.js`।
- **P1.4 Auth UI + routing** — `/login` (brand designed), logout, `/change-password` + `mustChangePassword` gate, "log out all devices", `proxy.js` (redirect only), `/admin` + `/dashboard` empty shells, `/api/health`, `scripts/seed-super-admin.js` (prompt-based)।
- **Done when:** role redirect ঠিক; student `/admin` → 404; tokenVersion bump এ instant logout; lint + esbuild pass।

## P2 — People
- **P2.1 Storage core** (purge এর জন্য আগেই লাগবে) — `storage/paths.js` (UPLOAD_ROOT assert), `delete.js` + `PendingFileDeletion`।
- **P2.2 Classes & Batches** — CRUD, unique (class,name), schedule validator, has-students হলে hard delete block।
- **P2.3 Students** — create (`TM-YYYY-NNNN` counter), list (filter/search/paginate, regex escape), edit, batch change + `BatchChangeLog`, deactivate/reactivate (`tokenVersion++`), purge (transaction → commit → folder rm, type-ID confirm, honor entry keep/delete prompt), password reset।
- **P2.4 Admin management** (super_admin) — CRUD admins, role set, reset password; সব invariant service layer এ।
- **P2.5 Admin shell UI** — sidebar layout, dense tables, sticky header, empty states, skeletons।
- **Done when:** §2.1 সব invariant service-level এ enforced; purge DB rows + folder মুছে।

## P3 — Admission
- **P3.1 Upload pipeline** — stream + byte counter, `file-type` magic bytes allowlist, `sharp` (rotate, EXIF strip, webp), random UUID names, `/api/uploads` (admin), origin check।
- **P3.2 Mail** — `transport.js` (Gmail SMTP env), `MailJob` queue, templates (4টা), `scripts/cron.js` এ mail worker (1 min, backoff, max 5)।
- **P3.3 Public form** — `/admission` page (editorial design, mobile-first), Turnstile + honeypot + 3/IP/hr, BD phone normalise, duplicate guard, `ADM-YYYY-NNNN`, confirmation screen।
- **P3.4 Admin review** — list/filter/search, detail with photo (private stream), approve/reject + note, `scoreVerified`, convert-to-student (pre-filled, once only, transaction), delete।
- **Done when:** duplicate + spam guard কাজ করে; দুটো email যায়; conversion pre-fill + link।

## P4 — Content
- **P4.1 Audience helper** — একটা `buildScopeFilter(scope)` যেটা notice/material/assignment সবাই use করবে।
- **P4.2 Notices** — Tiptap editor, `sanitize-html`, slug, pin/publishAt/expiresAt, attachment, optional email broadcast (BCC 50, throttle)।
- **P4.3 Materials / question papers / routine** — PDF/image only ≤ 25MB, publish flag, admin original download।
- **P4.4 Scoped streaming + watermark** — `/api/files/[kind]/[id]`, 404 on no access, `pdf-lib`/`sharp` stamp, disk cache `(materialId, studentId, fileHash)`, purge on replace।
- **P4.5 Student portal UI** — mobile-first `/dashboard` layout, notices, materials viewer (`react-pdf`, no download/print, select off), question papers, routine header (batch schedule)।
- **Done when:** Batch A student direct URL এ Batch C material → 404; watermark এ name/ID দেখা যায়।

## P5 — Assignments
- **P5.1** Assignment CRUD (deadline Asia/Dhaka, allowLate, maxFiles, types, size)।
- **P5.2** Submission route — multipart stream, per-file validation, resubmit replace (new save → DB → old delete), late rule server time, unique (assignment, student), 30 uploads/hr।
- **P5.3** Admin review — scope এর সব student (submitted/late/missing) aggregation, feedback + marks, single download, ZIP (`archiver` streamed)।
- **P5.4** Student UI — list with status + countdown, submit/resubmit, feedback view।
- **Done when:** deadline server-side enforced; ZIP memory এ load না করে stream হয়।

## P6 — Results & Honor Board
- **P6.1** Exams CRUD, result grid (bulk save, % auto), CSV import + row report, stats (avg/high/low/grade dist)।
- **P6.2** Student results (published only, own only)।
- **P6.3** Honor admin — entries, HonorYear settings, add-from-student, 600×600 + 200 thumb, consent tick, drag reorder, `revalidateTag('honor')`।
- **P6.4** Seed 2026 board (poster থেকে 20 জন — নাম/grade/%; photo শুধু consent পাওয়ার পর)।
- **Done when:** unpublished exam student এর কাছে invisible; honor save এ public page revalidate।

## P7 — Payments
- **P7.1** `generateFeeRecords(period)` idempotent upsert + snapshot; create/reactivate hook; cron 00:05 day-1।
- **P7.2** Matrix view (single aggregation, sticky col/header, confirm popover toggle, totals)।
- **P7.3** List view (filters, bulk mark paid, CSV export), audit on every change।
- **P7.4** Admin dashboard cards (active students, pending admissions, submissions 7d, due this month)।
- **Done when:** cron দুবার চালালেও duplicate নেই; batch change এর পর পুরনো মাস ঠিক থাকে।

## P8 — Public site & SEO
- **P8.1** SiteContent CMS (singleton, seed from poster: bio, ex-faculty, 17+ yrs, venue, phone, email)।
- **P8.2** Homepage: Hero → Honor Board → About → Education → Experience timeline → Notice Board → Class info/venue/map → Contact/WhatsApp। Faculty marquee, numbered highlights (01–04)।
- **P8.3** `/honor-board` (year index-tabs), `/notices`, `/notices/[slug]`।
- **P8.4** Metadata, sitemap, robots, JSON-LD (Person, LocalBusiness, ItemList), OG image।
- **Done when:** Lighthouse mobile ≥ 90 perf / 100 SEO / ≥ 95 a11y on `/`।

## P9 — Hardening & deploy
- CSP + security headers, `error.js`/`not-found.js`, structured logs, audit log UI (super_admin), file cleanup job, `npm audit`।
- VPS: Mongo replica set, Nginx (`/media`, limit_req, body size), PM2 (`web` + `cron`), certbot, UFW/fail2ban, `backup.sh` + **restore test**, handover doc।
- **Done when:** §11 checklist ticked; restore verified।

---

## Client থেকে যা লাগবে (কোন phase এর আগে)
| কী | কখন লাগবে |
|---|---|
| Class names (Class 8/9/10 ) | P2 |
| Logo (SVG), teacher professional photos | P1.4 (login) / P8 |
| Honor board student photos + guardian consent | P6 |
| Bio, education details (degree/institution/year) | P8 |
| Domain + Hostinger VPS access | P9 |