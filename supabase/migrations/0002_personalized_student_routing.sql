-- CareerSim Gulf personalized student onboarding and smart routing.
-- This migration is additive and non-destructive. It extends the existing
-- careersim.profiles table; it does not create another user or profile system.

begin;

alter table careersim.profiles
  add column if not exists full_name text,
  add column if not exists age smallint check (age between 13 and 100),
  add column if not exists education_level varchar(32),
  add column if not exists academic_year varchar(32),
  add column if not exists assessment_score integer check (assessment_score between 0 and 100),
  add column if not exists career_path_key varchar(80),
  add column if not exists recommended_level varchar(32),
  add column if not exists routing_decision jsonb not null default '{}'::jsonb check (jsonb_typeof(routing_decision) = 'object'),
  add column if not exists onboarding_completed_at timestamptz;

alter table careersim.profiles
  drop constraint if exists profiles_education_level_check;

alter table careersim.profiles
  add constraint profiles_education_level_check
  check (education_level is null or education_level in ('high_school', 'university', 'graduate', 'other'));

alter table careersim.profiles
  drop constraint if exists profiles_academic_year_check;

alter table careersim.profiles
  add constraint profiles_academic_year_check
  check (academic_year is null or academic_year in ('year_1', 'year_2', 'year_3', 'year_4', 'year_5', 'final_year', 'other'));

alter table careersim.profiles
  drop constraint if exists profiles_recommended_level_check;

alter table careersim.profiles
  add constraint profiles_recommended_level_check
  check (recommended_level is null or recommended_level in ('explorer', 'intern', 'advanced_intern', 'junior_professional'));

create table if not exists careersim.career_routing_rules (
  id varchar(80) primary key,
  career_key varchar(80) not null,
  education_level varchar(32) not null check (education_level in ('high_school', 'university', 'graduate', 'other')),
  academic_year varchar(32),
  minimum_assessment_score integer check (minimum_assessment_score between 0 and 100),
  minimum_completed_score integer check (minimum_completed_score between 0 and 100),
  required_completed_simulations integer not null default 0 check (required_completed_simulations >= 0),
  recommended_level varchar(32) not null check (recommended_level in ('explorer', 'intern', 'advanced_intern', 'junior_professional')),
  simulation_slug varchar(120),
  label jsonb not null default '{"en":"","ar":""}'::jsonb check (jsonb_typeof(label) = 'object'),
  skills jsonb not null default '[]'::jsonb check (jsonb_typeof(skills) = 'array'),
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists career_routing_rules_lookup_idx
  on careersim.career_routing_rules (career_key, education_level, academic_year, is_active, priority desc);

insert into careersim.career_routing_rules (
  id, career_key, education_level, academic_year, minimum_assessment_score,
  required_completed_simulations, recommended_level, simulation_slug, label, skills, priority
) values
  ('engineering-high-school-explorer', 'engineering', 'high_school', null, null, 0, 'explorer', null, '{"en":"Engineering Explorer","ar":"مستكشف الهندسة"}', '["Problem Solving","Technical Understanding","Decision Making"]', 100),
  ('engineering-year-1-explorer', 'engineering', 'university', 'year_1', null, 0, 'explorer', null, '{"en":"Engineering Explorer","ar":"مستكشف الهندسة"}', '["Problem Solving","Technical Understanding","Decision Making"]', 100),
  ('engineering-year-2-intern', 'engineering', 'university', 'year_2', null, 0, 'intern', null, '{"en":"Engineering Intern","ar":"متدرب هندسة"}', '["Problem Solving","Technical Understanding","Decision Making"]', 100),
  ('engineering-year-3-advanced', 'engineering', 'university', 'year_3', 80, 1, 'advanced_intern', null, '{"en":"Advanced Engineering Intern","ar":"متدرب هندسة متقدم"}', '["Problem Solving","Technical Understanding","Decision Making"]', 200),
  ('engineering-year-4-advanced', 'engineering', 'university', 'year_4', 80, 1, 'advanced_intern', null, '{"en":"Advanced Engineering Intern","ar":"متدرب هندسة متقدم"}', '["Problem Solving","Technical Understanding","Decision Making"]', 200),
  ('engineering-graduate-junior', 'engineering', 'graduate', null, null, 0, 'junior_professional', null, '{"en":"Junior Civil Engineer","ar":"مهندس مدني مبتدئ"}', '["Problem Solving","Technical Understanding","Decision Making"]', 100),
  ('technology-graduate-junior', 'technology', 'graduate', null, null, 0, 'junior_professional', 'junior-data-analyst-gulf-retail-group', '{"en":"Junior Data Analyst","ar":"محلل بيانات مبتدئ"}', '["Data Analysis","Problem Solving","Business Thinking"]', 100),
  ('business-graduate-junior', 'business', 'graduate', null, null, 0, 'junior_professional', 'business-analyst-gulf-growth-partners', '{"en":"Junior Business Analyst","ar":"محلل أعمال مبتدئ"}', '["Business Analysis","Stakeholder Management","Decision Making"]', 100)
on conflict (id) do update set
  career_key = excluded.career_key,
  education_level = excluded.education_level,
  academic_year = excluded.academic_year,
  minimum_assessment_score = excluded.minimum_assessment_score,
  required_completed_simulations = excluded.required_completed_simulations,
  recommended_level = excluded.recommended_level,
  simulation_slug = excluded.simulation_slug,
  label = excluded.label,
  skills = excluded.skills,
  priority = excluded.priority,
  updated_at = now();

alter table careersim.career_routing_rules enable row level security;
revoke all privileges on careersim.career_routing_rules from public, anon, authenticated;
grant select, insert, update, delete on careersim.career_routing_rules to service_role;
alter default privileges in schema careersim revoke all on tables from public, anon, authenticated;
alter default privileges in schema careersim grant select, insert, update, delete on tables to service_role;

notify pgrst, 'reload schema';

commit;

-- Verify the new private profile columns and editable routing-rule table.
select table_name
from information_schema.tables
where table_schema = 'careersim' and table_name in ('profiles', 'career_routing_rules')
order by table_name;
