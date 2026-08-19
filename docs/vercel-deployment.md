# Vercel deployment notes

CareerSim Gulf is a Vite React SPA with an Express/tRPC backend, not a Next.js project. Vercel’s Vite guidance specifies that a static SPA requires a root `vercel.json` with a catch-all rewrite to `/index.html` for deep links. Vercel also recognizes root `api` files as serverless functions and supports per-function configuration and included dependency files through `vercel.json`.

The repository therefore needs an explicit Vercel static-output directory, a Vercel-compatible serverless Express entry point, an `/api/*` rewrite that preserves serverless functions, and a fallback SPA rewrite for all other paths. Required environment variables must be configured separately in Vercel because the Manus-managed runtime variables are not exported to GitHub deployments.

The server persistence layer also requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in both Preview and Production. The service-role key is strictly server-only: never add it to a `VITE_*` variable, client bundle, or public repository. The target Supabase project must expose the `careersim` schema in **Project Settings → API → Exposed schemas**.

## Credential ownership and hosting choice

The managed CareerSim Gulf runtime receives Manus OAuth, JWT, Forge API, LLM, storage, and service-role credentials through its secure hosting environment. These managed values cannot be copied from the runtime into an external Vercel project. A Vercel deployment therefore requires user-owned equivalents for `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`, together with a compatible OAuth callback configuration.

When those user-owned credentials are not available, use CareerSim Gulf’s managed hosting instead. It already has the required credentials, supports the verified Supabase-backed workflow, and can be connected to a custom domain through the project settings. Vercel production-health checks should be deferred until the external credential set is intentionally supplied and a dashboard redeploy has been triggered by the project owner.

Sources: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel project configuration](https://vercel.com/docs/project-configuration/vercel-json), and [Vercel rewrites](https://vercel.com/docs/routing/rewrites).
