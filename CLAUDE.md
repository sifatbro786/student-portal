@AGENTS.md

# Project conventions (Tauhid Mostafa portal)
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

