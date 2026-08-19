# Vercel deployment notes

CareerSim Gulf is a Vite React SPA with an Express/tRPC backend, not a Next.js project. Vercel’s Vite guidance specifies that a static SPA requires a root `vercel.json` with a catch-all rewrite to `/index.html` for deep links. Vercel also recognizes root `api` files as serverless functions and supports per-function configuration and included dependency files through `vercel.json`.

The repository therefore needs an explicit Vercel static-output directory, a Vercel-compatible serverless Express entry point, an `/api/*` rewrite that preserves serverless functions, and a fallback SPA rewrite for all other paths. Required environment variables must be configured separately in Vercel because the Manus-managed runtime variables are not exported to GitHub deployments.

The server persistence layer also requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in both Preview and Production. The service-role key is strictly server-only: never add it to a `VITE_*` variable, client bundle, or public repository. The target Supabase project must expose the `careersim` schema in **Project Settings → API → Exposed schemas**.

Sources: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), and [Vercel rewrites](https://vercel.com/docs/routing/rewrites).
