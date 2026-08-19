# CareerSim Gulf

CareerSim Gulf is a bilingual, Gulf-focused virtual job simulation platform for university students and recent graduates. The initial release implements a complete **Junior Data Analyst** workplace simulation for the fictional Gulf Retail Group, moving a student from discovery and onboarding through interactive work tasks, scoring, feedback, a certificate, and a portfolio.

## Product Flow

The main journey is designed to feel like a workplace assignment rather than an online course. Students can browse public simulations, sign in with Manus OAuth, complete onboarding, and begin the simulation. The protected workplace includes an inbox, company files, the synthetic sales dataset, task-specific guidance, notes, progress, hints, and five connected task experiences. Completion produces stored results, AI-assisted feedback grounded in deterministic scoring evidence, a printable certificate, and an optional public portfolio profile.

## Architecture

The implementation uses **React 19**, **Vite**, **Tailwind CSS 4**, **Express 4**, **tRPC 11**, **Supabase PostgreSQL**, and **Manus OAuth**. Manus OAuth continues to establish the student session; the server synchronizes that identity to the private CareerSim Supabase schema before protected workflows run. Authentication and authorization are enforced in server-side tRPC procedures; browser clients never receive private scoring metadata or server credentials.

| Layer | Implementation | Responsibility |
|---|---|---|
| Presentation | `client/src/pages` and `client/src/components` | Bilingual public pages, onboarding, catalog, workspace, results, certificates, and portfolios. |
| Localization | `client/src/i18n.tsx` | English/Arabic interface copy, persistent language selection, and RTL/LTR document direction. |
| Simulation content | `shared/simulations/junior-data-analyst.json` | Narrative, characters, files, synthetic-data blueprint, tasks, hints, and rubrics. |
| Simulation engine | `server/simulationEngine.ts` | Configuration loading, catalog-safe projections, and removal of private evaluation rules from client payloads. |
| Dataset and scoring | `server/syntheticData.ts`, `server/scoringEngine.ts` | Reproducible synthetic data and deterministic, hint-aware rubric scoring. |
| Feedback | `server/feedbackEngine.ts` | Structured, server-side LLM feedback with an evidence-grounded deterministic fallback. |
| API and persistence | `server/routers.ts`, `server/db.ts`, `server/db/career.ts`, `server/supabase.ts` | Authenticated orchestration, Manus OAuth identity synchronization, ownership checks, sessions, submissions, results, certificates, portfolios, and events. |

## JSON-Driven Simulation Engine

New simulations should be added as structured JSON files under `shared/simulations/`. Every configuration contains the simulation identity, localized copy, characters, messages, files, synthetic-data design, tasks, task inputs, hints, scoring rubrics, and completion requirements. The workspace does not hardcode the Junior Data Analyst task layout: it chooses the appropriate reusable task renderer from each task’s `type`.

The initial engine supports these implemented task types:

| Type | Student interaction |
|---|---|
| `data_exploration` | Branch selection and evidence statement using the data workspace. |
| `visualization_builder` | Metric, dimension, branch, cause, and chart takeaway selection. |
| `written_insight` | Selection of evidence sources plus a structured written brief. |
| `single_choice` | Evidence-led business decision and rationale. |
| `recommendation` | Final management recommendation with findings, evidence, action, and measurement. |

To introduce an additional task type, add it to the `SimulationTaskType` union in `shared/simulation/types.ts`, build a focused renderer in `client/src/components/workspace/TaskPanel.tsx` or a dedicated task component, and extend `server/scoringEngine.ts` with deterministic scoring where possible. Keep all expected answers and detailed rubric evaluation metadata on the server-safe configuration path; do not expose them through public catalog routes.

## Database Model

The data model stores user profiles, simulations, sessions, task submissions, scores, results, certificates, public portfolio items, and simulation events. Student-owned routes enforce `ctx.user.id` ownership before reading or modifying any session, submission, score, result, certificate, or portfolio object. Public certificate and portfolio routes expose only the scoped information needed for verification or opt-in sharing.

The active database source of truth is `supabase/migrations/0001_careersim_schema.sql`. It creates an isolated `careersim` schema containing user identities, profiles, simulations, sessions, submissions, scores, results, certificates, portfolio items, and events. The historical Drizzle/MySQL schema remains in the repository only as a reference to the original model and is no longer used by the runtime data layer.

## Development

Install dependencies and start the local environment with the standard project commands:

```bash
pnpm dev
```

Run static type validation and automated tests before merging changes:

```bash
pnpm check
pnpm test
```

When changing the schema, add a reviewed PostgreSQL migration under `supabase/migrations/` and apply it through the approved Supabase migration workflow. The `careersim` schema must remain exposed in **Project Settings → API → Exposed schemas** for the server-side client to reach it.

```bash
pnpm check
pnpm test
```

Review every SQL migration before applying it. Avoid destructive schema changes without a tested backup and migration plan.

## Environment and Security

The server requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to reach the `careersim` schema. The service-role key bypasses RLS and must remain server-only; it must never be added to Vite `VITE_*` variables or exposed in browser code. `SUPABASE_PUBLISHABLE_KEY` is suitable only for a future browser client protected by explicit RLS policies. Do not commit `.env` files, service credentials, OAuth secrets, or API keys. LLM calls are performed only from `server/feedbackEngine.ts`; task correctness and numerical scoring remain deterministic and server-controlled.

Public browsing is intentionally permitted for the marketing catalog. Starting or resuming a simulation requires Manus OAuth and a completed onboarding profile. The catalog-safe API omits workplace messages, documents, datasets, and rubric evaluation metadata; the protected workspace API returns only content necessary for the authenticated student’s active session.

## Certificates and Public Portfolios

Each completed session receives an opaque verification code and a public certificate route:

```text
/certificate/{verificationCode}
```

Each completed simulation also creates a portfolio item. A student controls public profile visibility from `/portfolio`; when public, the shareable profile is:

```text
/u/{publicSlug}
```

The certificate template states that it represents completion of a job simulation and **does not constitute academic accreditation**.

## Deployment

This project is configured for the platform’s managed autoscaling Node deployment. Before publishing, run `pnpm check` and `pnpm test`, then create a project checkpoint. The deployed service must retain the OAuth, LLM, and server-only Supabase environment variables.

### Vercel

CareerSim Gulf is a **Vite React SPA with an Express/tRPC API**, rather than a Next.js application. The root `vercel.json` sets `dist/public` as the Vite output, deploys `api/[...path].ts` as the serverless API entry point, and rewrites client-side routes to the compiled `index.html`. Without this configuration, Vercel can fall back to serving repository files rather than the built interface.

Set these environment variables in Vercel for both Preview and Production before testing sign-in or any protected workflow: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `VITE_APP_ID`, `VITE_OAUTH_PORTAL_URL`, `OAUTH_SERVER_URL`, `OWNER_OPEN_ID`, `BUILT_IN_FORGE_API_URL`, and `BUILT_IN_FORGE_API_KEY`. Also update the OAuth provider callback URL to `https://<your-vercel-domain>/api/oauth/callback`. Manus-managed environment values do not transfer automatically to Vercel.

After setting those variables, redeploy from the Vercel dashboard. The production frontend is built with `pnpm build:client`; API calls are served by the Vercel function.

For a future external-hosting migration, preserve the Node server runtime, secure OAuth callback handling, all server-side environment variables, and the database connection layer. Do not move scoring rules or LLM credentials to the browser.
