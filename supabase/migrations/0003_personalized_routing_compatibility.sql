-- Compatibility migration for a project that already contains an earlier
-- personalized-routing draft (age, education_level, academic_year,
-- high_school_interests, career_id, starting_level, min_assessment_score).
-- This script only adds the runtime fields used by CareerSim Gulf. It does not
-- drop, rename, or delete any existing rows or legacy configuration columns.

begin;

alter table careersim.profiles
  add column if not exists full_name text,
  add column if not exists assessment_score integer check (assessment_score between 0 and 100),
  add column if not exists career_path_key varchar(80),
  add column if not exists recommended_level varchar(32),
  add column if not exists routing_decision jsonb not null default '{}'::jsonb check (jsonb_typeof(routing_decision) = 'object'),
  add column if not exists onboarding_completed_at timestamptz;

alter table careersim.career_routing_rules
  add column if not exists career_key varchar(80),
  add column if not exists minimum_assessment_score integer check (minimum_assessment_score between 0 and 100),
  add column if not exists minimum_completed_score integer check (minimum_completed_score between 0 and 100),
  add column if not exists required_completed_simulations integer not null default 0 check (required_completed_simulations >= 0),
  add column if not exists recommended_level varchar(32),
  add column if not exists simulation_slug varchar(120),
  add column if not exists label jsonb not null default '{"en":"","ar":""}'::jsonb check (jsonb_typeof(label) = 'object'),
  add column if not exists skills jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array'),
  add column if not exists priority integer not null default 0,
  add column if not exists is_active boolean not null default true;

-- Preserve any earlier rule configuration as a conservative fallback. These
-- values remain editable by a future admin configuration interface.
update careersim.career_routing_rules
set
  career_key = coalesce(career_key, 'general'),
  minimum_assessment_score = coalesce(minimum_assessment_score, min_assessment_score),
  recommended_level = coalesce(recommended_level, starting_level, 'explorer'),
  is_active = coalesce(is_active, true)
where career_key is null
   or minimum_assessment_score is null
   or recommended_level is null
   or is_active is null;

create index if not exists career_routing_rules_runtime_lookup_idx
  on careersim.career_routing_rules (career_key, education_level, academic_year, is_active, priority desc);

alter table careersim.career_routing_rules enable row level security;
revoke all privileges on careersim.career_routing_rules from public, anon, authenticated;
grant select, insert, update, delete on careersim.career_routing_rules to service_role;

notify pgrst, 'reload schema';

commit;

-- Safe verification query; it does not expose student rows.
select column_name
from information_schema.columns
where table_schema = 'careersim'
  and table_name in ('profiles', 'career_routing_rules')
  and column_name in ('full_name', 'assessment_score', 'career_path_key', 'recommended_level', 'routing_decision', 'career_key', 'minimum_assessment_score', 'required_completed_simulations', 'simulation_slug', 'priority', 'is_active')
order by table_name, column_name;
