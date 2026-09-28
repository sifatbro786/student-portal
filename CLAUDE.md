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
