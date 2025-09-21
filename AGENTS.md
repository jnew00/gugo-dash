# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js route handlers, layouts, and server actions. Place API endpoints under `app/api/<feature>/route.ts`.
- `components/`: Client and server UI components in PascalCase (e.g. `NavBar.tsx`). Co-locate stories or demos when helpful.
- `lib/`: Shared utilities, background jobs, and integrations such as `lib/discord-bot.js`.
- `prisma/`: Schema, migrations, and generated client assets. Run Prisma commands from here.
- `public/`: Static assets served as-is via `/` paths.
- `styles/`: Tailwind configuration and global CSS. Keep component-specific styles near their components.
- `storage/`: Local uploads; ensure it remains untracked by Git.

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js locally on `http://localhost:3005`.
- `npm run build`: Produce the optimized production bundle.
- `npm start`: Serve the production build.
- `npm run lint`: Run ESLint with Next.js rules; resolve all warnings before PRs.
- `npm run typecheck`: Execute `tsc --noEmit` for static type coverage.
- Prisma helpers: `npm run db:generate`, `npm run db:push`, `npm run db:migrate`, `npm run db:studio`.
- Bootstrap example: `cp .env.example .env && npm i && npm run db:push && npm run dev`.

## Coding Style & Naming Conventions
- TypeScript-first; prefer functional components and server rendering by default.
- Two-space indentation and no unused exports. Keep props and return types explicit.
- Components use `PascalCase.tsx`; utilities use `camelCase.ts`. Place hooks alongside their usage.
- Add `"use client"` only when browser APIs or interactivity are required.

## Testing Guidelines
- Preferred stacks: Jest or Vitest with tests co-located or in `__tests__/`.
- Name files `*.test.ts` or `*.test.tsx` and cover critical flows. Document repro steps in PR notes.
- Before submitting, run new tests plus `npm run lint` and `npm run typecheck`.

## Commit & Pull Request Guidelines
- Commits: short, imperative subject (e.g. `feat(auth): add OAuth callback`), scoped to one change.
- Reference issues (`Closes #123`) and highlight migrations or configuration updates.
- PRs should summarize intent, list verification steps, include UI screenshots when relevant, and document env impacts.

## Security & Configuration Tips
- Never commit secrets; copy `.env.example` to `.env` and populate `DATABASE_URL`, `NEXTAUTH_SECRET`, API keys, and `UPLOAD_DIR`.
- After schema changes, regenerate and push with `npm run db:generate && npm run db:push` (use `db:migrate` for production).
- Audit `.env` and `storage/` permissions before deploying; remove unused credentials promptly.
