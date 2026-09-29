# PHASES — Tauhid Mostafa Portal (build plan)

> Source of truth: PRD.md §18. এই ফাইল শুধু প্রতিটা phase কে ছোট sub-step এ ভাগ করেছে। PRD আর এই ফাইলে conflict হলে PRD জিতবে।
> Repo: **Next.js 16.3.6, React 19.2.8, JavaScript only (no TS), Tailwind v4, `app/` root এ — [DECIDED] `src/` হবে না**; PRD §7.2 এর `src/server` → `server/`, `src/lib` → `lib/`। `"type": "module"`।
> Brand: শুধু Tauhid Mostafa personal brand (MIE Academy নয়) — [DECIDED]।

## ▶ START HERE (new chat)
- **Next phase: P8 — Public site & SEO.** P1–P7 done and delivered to the repo.
- Before coding, read **HANDOVER.md** (project doc): working method, environment, conventions, next-phase checklist.
- Repo on the user's PC: `E:\Works\Tauhid Mostafa\tauhid-mostafa` (via the device bridge). Read the repo's `CLAUDE.md` first.

## Status
- ✅ P1 Foundation — 2026-09-28
- ✅ P2 People — 2026-09-28 (sidebar admin shell, classes/batches, students, admins; 32 e2e + 39 service checks)
- ✅ P3 Admission — 2026-09-28 (public form, upload pipeline, mail queue + `npm run cron`, admin review, convert-to-student; 30 service + 23 e2e checks)
- ✅ P4 Content — 2026-09-28 (notices + rich text + email broadcast, materials/question papers/routine, per-student PDF/image watermark, canvas-only viewer; 31 service + 22 e2e checks incl. Batch B → Batch A file 404)
- ✅ Between phases — 2026-09-29: sidebar account block → compact dropdown (`AccountMenu` in `components/admin/Sidebar.js`); demo seed `npm run seed:demo` / `npm run seed:demo -- --reset`
- ✅ P5 Assignments — 2026-09-29 (admin CRUD + review table + feedback/marks + streamed ZIP; student list/countdown/upload with progress; busboy streaming uploads; 33 service + 39 e2e checks incl. 9B → 9A 404, server-side deadline, resubmit deletes old files, 95 MB ZIP streamed with flat memory)
- ✅ P5 follow-up — 2026-09-29: reviewed submission = locked (atomic); dev image warning fixed
- ✅ P6 Results & Honor Board — 2026-09-29 (exams CRUD, result grid + bulk save, CSV import with row report, stats, student results + dashboard card; honor admin with photos 600/200, consent, reorder, year headings, add-from-student, cached public reader tag `honor` + admin preview; `/media` dev fallback; `npm run seed:honor`; 38 service + 31 e2e checks)
- ✅ Student portal shell — 2026-09-29: same sidebar system as the admin (fixed sidebar ≥ lg, top bar + drawer on phones); dashboard home redesigned as a 2-column layout; bottom tab bar removed
- ✅ P7 Payments — 2026-09-29 (idempotent monthly generation + create/reactivate hooks + cron 00:05 day 1 + `npm run fees:generate`; matrix with sticky header/column, confirm popover, totals; list with filters, bulk, streamed CSV; audit per change; admin dashboard cards §4.13; 21 service + 15 e2e checks)
- ⏭ **P8 Public site & SEO — next, not started**
- ⏳ P9

## Decisions after the PRD
- [DECIDED 2026-09-28] **No Cloudflare Turnstile.** FR-ADM-05 anti-spam = honeypot + signed min-fill-time token + 3/IP/hour rate limit + Nginx limit_req.
- [DECIDED] Uploads stay in `UPLOAD_ROOT` outside the project (not `public/uploads`). `server/env.js` refuses a path inside the project.
- [DECIDED] Password minimum length = 8 (user's choice).
- [DECIDED 2026-09-29] **Vercel = temporary preview only.** Production = Hostinger VPS + real domain (P9). On Vercel uploads are not kept and `npm run cron` (mail queue) never runs → test mail/files locally or on the VPS.
- Purge also deletes the linked Admission document (same PII). Flagged to owner.
- Client info (contacts, bio, 2 campuses, 2026 honor board list) → project doc CLIENT-INFO.md; seed values in `lib/site-defaults.js` until the P8 CMS.
- Logo: transparent PNGs cut from the client JPEG → `public/brand/`. Ask the client for an SVG.
- Public /notices pages are built in P8 (service `listPublicNotices()` is ready).
- Admin UI = left sidebar (professional, student-friendly). Nav grows per phase in `components/admin/nav.js` (only link modules that exist). Account = one-row dropdown at the bottom (Change password / Log out of all devices / Log out).
- [NOTED 2026-09-29 — scope in P8] Homepage **may** get **Testimonials** and **Gallery** sections. PRD additions (need CMS models + admin UI + image upload + consent for student photos). Confirm exact scope with the user at the start of P8. Testimonials must be real, with permission — never invented.
- Demo data: `npm run seed:demo` (all `@demo.test`, password `Demo@1234`); `-- --reset` removes it. Refuses when NODE_ENV=production unless `--allow-production`. Extend the seed in each phase (P5: 5 assignments + 4 submissions; P6: 3 exams with results; P7: fee records).
- [DECIDED 2026-09-29 — P5] Submission files live at `private/students/<studentId>/submissions/<assignmentId>/` (PRD §8 layout; HANDOVER had a different path — PRD wins). Student purge already removes them with the student folder. Assignment attachments: `private/assignments/<id>/`.
- [DECIDED — P5] Student uploads are streamed to disk with `busboy` (`server/storage/submissions.js`), never buffered in memory (5 × 20 MB per request). Staging folder `UPLOAD_ROOT/tmp/uploads` — P9 cleanup job should delete staged files older than 1 day (left only if the process crashes mid-upload).
- [DECIDED — P5] Lateness uses the time the request ARRIVED (server clock); uploads are capped at 10 minutes. Re-submitting after the deadline (allowLate on) marks the submission late.
- [DECIDED 2026-09-29 — Sifat] A reviewed submission is LOCKED: once an admin saves feedback/marks the student can't replace it (atomic filter `reviewedAt $exists:false` in the upsert). Each new assignment is submitted separately as usual.
- [DECIDED 2026-09-29 — Sifat] Student portal uses the admin's sidebar shell (`components/admin/Sidebar.js` with `nav={STUDENT_NAV}` from `components/student/nav.js`). The phone bottom bar and the header tab row are gone; phones get top bar + drawer + home-screen shortcut tiles. `components/student/StudentNav.js` and `components/shell/AccountBar.js` are now unused (safe to delete).
- [DECIDED — P6] Results: blank marks = no result (entry removed). CSV import is all-or-nothing with a row report. Exam class can't change once results exist; changing full marks recomputes every %. Stats are computed in JS from one exam's entries (FerretDB lacks `$avg`; tiny data).
- [DECIDED — P6] Honor photos: `UPLOAD_ROOT/public/honor/<year>/` (600×600 + 200×200 WebP), URL `${PUBLIC_MEDIA_BASE}/honor/...`. Nginx serves `/media` in prod; `app/media/[...path]` is only a local fallback (public/ only). Model got a `thumb` FileRef (PRD FR-HON-04 needs two sizes). Photos never reach the public reader without consent.
- [DECIDED — P6] Public honor data = `getPublicHonorBoard()` in `server/services/honor-public.js` (`unstable_cache`, tag `honor`, 1 h safety net). Admin saves call `updateTag`/`revalidateTag("honor", { expire: 0 })`. P8 builds the public pages on it.
- [DECIDED — P7] Fee matrix = one indexed find over the year's FeeRecords + one student lookup, grouped in JS (FerretDB has no `$push`; PRD §14 "one aggregation" intent = no N+1). Rows/cells follow the SNAPSHOT batch, so a batch change keeps old months under the old batch.
- [DECIDED — P7] Records are created for ACTIVE students on the 1st (cron, also on cron boot to catch up), on create and on reactivate. Deactivation never deletes records (shown greyed). The admin "Create this month's records" button runs the same idempotent job. "Due this month" on the dashboard counts active students only.
- [DECIDED — P7] CSV export streams in pages of 500 with a UTF-8 BOM and neutralises formula-leading cells (`= + - @`).
- [NOTED — P6] 2026 honor list (20 names, no photos, published) is seeded by `npm run seed:honor` (idempotent, production-safe) — not part of the demo seed.

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
| Heading font | PRD: serif display (Fraunces) headings; sans (Manrope) UI। Skill এর "one italic serif accent" → hero তে একটা italic phrase। |
| Hero | Teacher এর real photo, lower-left headline + CTA, paper texture। Blob/gradient hero ❌। |
| Logo rail | "Ex-faculty: Scholastica · Mastermind · Hurdco · Sunnydale" + Cambridge/Edexcel — typographic marquee, 30s linear, gradient mask, reduced-motion এ static। |
| Testimonials / Gallery | User চেয়েছেন (2026-09-29) → P8 এ scope confirm করে build। শুধু real testimonial; editorial quote layout (auto-carousel না)। Gallery = real class photos, lazy, consent সহ। |
| Count-up numbers / gradient text | ❌ (PRD)। |
| Motion | Skill: reveal 700–900ms `cubic-bezier(.22,1,.36,1)`, hover lift ≤ 4px, `prefers-reduced-motion` respect। ✅ |
| Verification | Skill checklist (390/768/1440, no overflow, no console error, build pass) প্রতিটা UI phase এ। ✅ |

---

## P1 — Foundation ✅
- P1.1 Setup & design foundation · P1.2 Data layer (all models) · P1.3 Auth core · P1.4 Auth UI + routing + seed super admin.
- **Done when:** role redirect ঠিক; student `/admin` → 404; tokenVersion bump এ instant logout; lint + esbuild pass।

## P2 — People ✅
- P2.1 Storage core · P2.2 Classes & Batches · P2.3 Students (create/list/edit/batch change/deactivate/purge/reset) · P2.4 Admin management · P2.5 Admin shell UI.
- **Done when:** §2.1 সব invariant service-level এ enforced; purge DB rows + folder মুছে।

## P3 — Admission ✅
- P3.1 Upload pipeline · P3.2 Mail queue + cron worker · P3.3 Public form (honeypot + form token + IP limit) · P3.4 Admin review + convert-to-student.
- **Done when:** duplicate + spam guard কাজ করে; দুটো email যায়; conversion pre-fill + link।

## P4 — Content ✅
- P4.1 Audience helper (`server/services/audience.js`) · P4.2 Notices · P4.3 Materials · P4.4 Scoped streaming + watermark · P4.5 Student portal UI (pdf.js legacy canvas viewer; react-pdf removed).
- **Done when:** Batch A student direct URL এ Batch C material → 404; watermark এ name/ID দেখা যায়।

## P5 — Assignments ✅
- **P5.1** Assignment CRUD (deadline Asia/Dhaka, allowLate default false, maxFiles default 5, types, size default 20MB, published flag, optional attachment)। Model আগে থেকেই আছে: `server/models/Assignment.js`, `Submission.js` — PRD FR-ASG এর সাথে মিলিয়ে দেখো।
- **P5.2** Submission route — multipart stream, per-file validation (magic bytes; docx/pptx = zip container check), resubmit replace (new save → DB → old delete), late rule server time, unique (assignment, student), 30 uploads/hr।
- **P5.3** Admin review — scope এর সব student (submitted/late/missing) aggregation, feedback + marks, single download, ZIP (`archiver` streamed)।
- **P5.4** Student UI — list with status + countdown, submit/resubmit, feedback view।
- **Done when:** deadline server-side enforced; ZIP memory এ load না করে stream হয়।

## P6 — Results & Honor Board ✅
- **P6.1** Exams CRUD, result grid (bulk save, % auto), CSV import + row report, stats (avg/high/low/grade dist)।
- **P6.2** Student results (published only, own only)।
- **P6.3** Honor admin — entries, HonorYear settings, add-from-student, 600×600 + 200 thumb, consent tick, drag reorder, `revalidateTag('honor')`।
- **P6.4** Seed 2026 board (CLIENT-INFO.md এর 20 জন — নাম/grade/%; photo শুধু consent পাওয়ার পর)।
- **Done when:** unpublished exam student এর কাছে invisible; honor save এ public page revalidate।

## P7 — Payments ✅
- **P7.1** `generateFeeRecords(period)` idempotent upsert + snapshot; create/reactivate hook; cron 00:05 day-1।
- **P7.2** Matrix view (single aggregation, sticky col/header, confirm popover toggle, totals)।
- **P7.3** List view (filters, bulk mark paid, CSV export), audit on every change।
- **P7.4** Admin dashboard cards (active students, pending admissions, submissions 7d, due this month)।
- **Done when:** cron দুবার চালালেও duplicate নেই; batch change এর পর পুরনো মাস ঠিক থাকে।

## P8 — Public site & SEO ⏭ NEXT
- **P8.1** SiteContent CMS (singleton, seed from CLIENT-INFO: bio, ex-faculty, 17+ yrs, 2 campuses, phone, email)।
- **P8.2** Homepage: Hero → Honor Board → About → Education → Experience timeline → Notice Board → Class info/venues/map → Contact/WhatsApp। Faculty marquee, numbered highlights (01–04)। **+ Testimonials / Gallery if confirmed.**
- **P8.3** `/honor-board` (year index-tabs), `/notices`, `/notices/[slug]`।
- **P8.4** Metadata, sitemap, robots, JSON-LD (Person, LocalBusiness, ItemList), OG image।
- **Done when:** Lighthouse mobile ≥ 90 perf / 100 SEO / ≥ 95 a11y on `/`।

## P9 — Hardening & deploy
- CSP + security headers, `error.js`/`not-found.js`, structured logs, audit log UI (super_admin), file cleanup job, `npm audit`।
- VPS: Mongo replica set, Nginx (`/media`, limit_req, body size, **`X-Real-IP` header — rate limits depend on it**), PM2 (`web` + `cron`), certbot, UFW/fail2ban, `backup.sh` + **restore test**, handover doc। Vercel preview বন্ধ করা।
- **Done when:** §11 checklist ticked; restore verified।

---

## Client থেকে যা লাগবে (কোন phase এর আগে)
| কী | কখন লাগবে |
|---|---|
| Honor board student photos + guardian consent | P6 |
| Logo (SVG), teacher professional photos | P8 |
| Bio, education details (degree/institution/year) | P8 |
| Real testimonials (with permission) + gallery photos | P8 (if confirmed) |
| Domain + Hostinger VPS access | P9 |
