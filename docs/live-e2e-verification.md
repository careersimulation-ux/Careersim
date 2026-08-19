# Live End-to-End Verification

An authenticated browser session completed the CareerSim Gulf user journey on 19 August 2026. The onboarding gate correctly redirected a signed-in student to profile completion before a new simulation could be started. The saved profile used King Fahd University of Petroleum and Minerals (KFUPM), Information & Computer Science, a 2026 graduation year, and the Data Analysis and Business Intelligence interests.

The student launched a fresh Junior Data Analyst session and submitted all five task types through the visible browser controls. The live inbox downloaded the `Sales_Data.xlsx` workbook to the browser download directory and opened the `Management_Request.pdf` file in the browser PDF viewer. The submission flow reached 100%, and the completed Results route displayed the persisted 99/100 score, task breakdown, and feedback after the bounded AI-feedback fallback fix.

The fresh certificate rendered at a unique public route with verification code `CSG-ELTAFBF-ZB`. The private portfolio listed the new completion and the public portfolio route rendered the same simulation without requiring authentication. Database verification for session `Teb4W3Tm6wa8EtasxT4E3SHS` confirmed one completed session with five submissions, five score rows, one result, one certificate, and one portfolio item.

## Supabase Migration Verification

The CareerSim persistence layer was migrated to the user-selected Supabase project on 19 August 2026. The owner applied `supabase/migrations/0001_careersim_schema.sql` through the Supabase SQL Editor and exposed the dedicated `careersim` schema through the Data API configuration. The server-only service-role client then successfully seeded the public catalog and synchronized the authenticated Manus OAuth identity without exposing any Supabase server credential to the browser.

Using the same approved onboarding profile, a fresh Junior Data Analyst session (`htHzfnRNU-wXoWNozJGUg0fU`) was created in the `careersim` schema. All five interactive submissions completed successfully, the server persisted the five score rows (20/20, 20/20, 20/20, 15/15, and 25/25), and the session reached `completed` with 100% progress. The Supabase `simulation_results` record stored a 100/100 result; the generated public certificate `CSG-IU6QKVPUY_` rendered successfully, and the authenticated portfolio rendered the matching public portfolio item.

Validation also included the credential smoke tests, a live read against the exposed `careersim` schema, `pnpm check`, the 18-test Vitest suite, production server and client builds, live catalog rendering, onboarding persistence, session creation, task submission, result generation, certificate lookup, and portfolio rendering.
