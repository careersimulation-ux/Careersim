# CareerSim Gulf Supabase SQL Editor Migration

Run [`../supabase/migrations/0001_careersim_schema.sql`](../supabase/migrations/0001_careersim_schema.sql) in the **SQL Editor** for Supabase project `gnarrdggnzmfgkiqzret`. The script creates only a new `careersim` schema and does not alter the existing `public` schema or its tables.

After the script commits successfully, open **Project Settings → API → Exposed schemas** and add `careersim`. This platform setting is intentionally not modified by the SQL script, because it controls the Data API exposure boundary. Then refresh the API schema cache in the Dashboard if the setting does not trigger an automatic refresh.

CareerSim continues to authenticate through Manus OAuth. The Supabase service-role key remains server-only and is never added to the browser bundle. All CareerSim tables use RLS and deny `anon` and `authenticated` privileges; the Express/tRPC server is the sole data-access layer.

> This is a schema migration, not an import of existing MySQL/TiDB records. The existing application data remains intact in its current database until the server persistence layer is migrated and a separately verified data-transfer process is approved.
