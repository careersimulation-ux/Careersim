# Personalized Student Routing — Supabase Migration

CareerSim Gulf already uses one private `careersim.profiles` row for every authenticated student. The personalized onboarding update **extends that existing row** and adds an editable `careersim.career_routing_rules` table; it does not create a new authentication, user, or public student-profile system.

## Owner action required

Run [`supabase/migrations/0002_personalized_student_routing.sql`](../supabase/migrations/0002_personalized_student_routing.sql) as one script in the **SQL Editor** for the selected Supabase project. The migration is additive: it adds nullable profile fields, constraints, an indexed routing-rule table, initial engineering/technology/business rules, RLS, and service-role-only privileges. It does not alter or delete existing student records, simulations, sessions, scores, certificates, or portfolio items.

After execution, keep the existing `careersim` schema listed under **Project Settings → API → Exposed schemas**. The server accesses it using the server-only service-role key; browser roles (`anon` and `authenticated`) receive no table privileges. This means a student can only interact with their profile through the existing authenticated CareerSim server procedures, and the server always scopes profile queries and updates to `ctx.user.id`.

## Configurable routing rules

`careersim.career_routing_rules` is designed for later admin maintenance. Each row may express a career family, education level, academic year, minimum assessment score, prior completion evidence, desired level, simulation slug, localized title, and priority. The server first computes a conservative default based on education stage, field, quick-skill evidence, and completion history. When a matching active database rule exists, it becomes the configurable override. This prevents an academic year alone from unlocking an advanced route.

## Verification

After running the migration, reply **“migration applied”**. CareerSim can then validate actual profile persistence, routing-rule lookup, returning-student continuity, and the high-school/university/graduate flows against Supabase. Vercel production verification remains dependent on user-owned external credentials; the managed preview is used for current authenticated validation.
