import { nanoid } from "nanoid";
import type { SimulationConfig, TaskScore } from "@shared/simulation/types";
import { calculateRoutingDecision, type AcademicYear, type EducationLevel } from "@shared/studentRouting";
import { getSupabase } from "../supabase";

type Row = Record<string, any>;

const profileId = () => nanoid(24);
const publicSlug = (userId: number) => `student-${userId}-${nanoid(6).toLowerCase()}`;
const iso = () => new Date().toISOString();
const date = (value: string | null | undefined) => (value ? new Date(value) : null);

function assertResult<T>({ data, error }: { data: T; error: { message: string } | null }, action: string): T {
  if (error) throw new Error(`Supabase ${action} failed: ${error.message}`);
  return data;
}

function mapProfile(row: Row) {
  return {
    id: row.id, userId: Number(row.user_id), country: row.country, university: row.university, major: row.major,
    graduationYear: row.graduation_year, careerInterests: row.career_interests ?? [], preferredLanguage: row.preferred_language,
    publicSlug: row.public_slug, portfolioIsPublic: row.portfolio_is_public ? "yes" : "no",
    onboardingComplete: row.onboarding_complete ? "yes" : "no", createdAt: date(row.created_at), updatedAt: date(row.updated_at),
    fullName: row.full_name ?? null, age: row.age ?? null, educationLevel: row.education_level ?? null,
    academicYear: row.academic_year ?? null, assessmentScore: row.assessment_score ?? null,
    careerPathKey: row.career_path_key ?? null, recommendedLevel: row.recommended_level ?? null,
    routingDecision: row.routing_decision ?? {}, onboardingCompletedAt: date(row.onboarding_completed_at),
  };
}

function mapSimulation(row: Row) {
  return {
    id: row.id, slug: row.slug, configVersion: row.config_version, status: row.status, title: row.title, company: row.company,
    industry: row.industry, category: row.category, difficulty: row.difficulty, estimatedMinutes: row.estimated_minutes,
    skills: row.skills ?? [], createdAt: date(row.created_at), updatedAt: date(row.updated_at),
  };
}

function mapSession(row: Row) {
  return {
    id: row.id, userId: Number(row.user_id), simulationId: row.simulation_id, configVersion: row.config_version, status: row.status,
    currentTaskId: row.current_task_id, progressPercent: row.progress_percent, hintUsage: row.hint_usage ?? {},
    startedAt: date(row.started_at), lastActiveAt: date(row.last_active_at), completedAt: date(row.completed_at),
  };
}

function mapSubmission(row: Row) {
  return {
    id: row.id, sessionId: row.session_id, taskId: row.task_id, taskType: row.task_type, response: row.response,
    hintLevel: row.hint_level, submittedAt: date(row.submitted_at), updatedAt: date(row.updated_at),
  };
}

function mapScore(row: Row) {
  return {
    id: row.id, submissionId: row.submission_id, sessionId: row.session_id, taskId: row.task_id, score: row.score,
    maxScore: row.max_score, skillScores: row.skill_scores ?? {}, criteria: row.criteria ?? [],
    feedbackContext: row.feedback_context ?? [], evaluatedAt: date(row.evaluated_at),
  };
}

function mapResult(row: Row) {
  return {
    id: row.id, sessionId: row.session_id, userId: Number(row.user_id), simulationId: row.simulation_id, totalScore: row.total_score,
    maxScore: row.max_score, skillScores: (row.skill_scores ?? {}) as Record<string, number>,
    feedback: row.feedback as { strengths: string[]; improvements: string[]; summary: string },
    completedAt: new Date(row.completed_at),
  };
}

function mapCertificate(row: Row) {
  return {
    id: row.id, resultId: row.result_id, userId: Number(row.user_id), simulationId: row.simulation_id,
    verificationCode: row.verification_code, issuedAt: new Date(row.issued_at),
  };
}

function mapPortfolioItem(row: Row) {
  return {
    id: row.id, userId: Number(row.user_id), resultId: row.result_id, simulationId: row.simulation_id, summary: row.summary,
    isPublic: row.is_public ? "yes" : "no", createdAt: date(row.created_at), updatedAt: date(row.updated_at),
  };
}

async function first(query: any, action: string): Promise<Row | undefined> {
  const rows = assertResult<Row[] | null>(await query.limit(1), action) ?? [];
  return rows[0];
}

async function getUser(userId: number) {
  const row = await first(getSupabase().from("users").select("*").eq("id", userId), "user lookup");
  if (!row) throw new Error("Authenticated Supabase user not found");
  return {
    id: Number(row.id), openId: row.open_id, name: row.name ?? null, email: row.email ?? null, loginMethod: row.login_method ?? null,
    role: row.role === "admin" ? "admin" : "user", createdAt: date(row.created_at), updatedAt: date(row.updated_at), lastSignedIn: date(row.last_signed_in),
  };
}

export async function ensureSimulationSeed(config: SimulationConfig) {
  const { error } = await getSupabase().from("simulations").upsert({
    id: config.id, slug: config.slug, config_version: config.version, status: "published", title: config.title,
    company: config.company, industry: config.industry, category: config.category, difficulty: config.difficulty,
    estimated_minutes: config.estimatedMinutes, skills: config.skills,
  }, { onConflict: "id" });
  if (error) throw new Error(`Supabase simulation seed failed: ${error.message}`);
}

export async function listPublishedSimulations() {
  const rows = assertResult<Row[] | null>(await getSupabase().from("simulations").select("*").eq("status", "published"), "simulation listing") ?? [];
  return rows.map(mapSimulation);
}

export async function getProfile(userId: number) {
  const row = await first(getSupabase().from("profiles").select("*").eq("user_id", userId), "profile lookup");
  return row ? mapProfile(row) : undefined;
}

export async function upsertProfile(input: {
  userId: number; country: string; university: string; major: string; graduationYear: number; careerInterests: string[]; preferredLanguage: "en" | "ar";
}) {
  const existing = await getProfile(input.userId);
  const payload = {
    user_id: input.userId, country: input.country, university: input.university, major: input.major,
    graduation_year: input.graduationYear, career_interests: input.careerInterests, preferred_language: input.preferredLanguage,
    onboarding_complete: true,
  };
  const query = existing
    ? getSupabase().from("profiles").update(payload).eq("user_id", input.userId)
    : getSupabase().from("profiles").insert({ id: profileId(), ...payload, public_slug: publicSlug(input.userId), portfolio_is_public: true });
  const { error } = await query;
  if (error) throw new Error(`Supabase profile upsert failed: ${error.message}`);
  return getProfile(input.userId);
}

type PersonalizedProfileInput = {
  userId: number;
  fullName: string;
  age: number;
  educationLevel: EducationLevel;
  country: string;
  university?: string | null;
  major?: string | null;
  academicYear?: AcademicYear;
  graduationYear?: number | null;
  careerInterests: string[];
  preferredLanguage: "en" | "ar";
  assessmentScore?: number | null;
};

async function getCompletionEvidence(userId: number) {
  const rows = assertResult<Row[] | null>(await getSupabase().from("simulation_results").select("simulation_id,total_score").eq("user_id", userId), "completion evidence lookup") ?? [];
  return {
    completedSimulationSlugs: rows.map(row => row.simulation_id as string),
    averageCompletedScore: rows.length ? Math.round(rows.reduce((sum, row) => sum + Number(row.total_score ?? 0), 0) / rows.length) : null,
  };
}

async function getRoutingRuleOverride(input: { careerKey: string; educationLevel: EducationLevel; academicYear: AcademicYear; assessmentScore: number | null; averageCompletedScore: number | null; completedSimulationCount: number }) {
  const { data, error } = await getSupabase().from("career_routing_rules").select("*")
    .eq("career_key", input.careerKey).eq("education_level", input.educationLevel).eq("is_active", true)
    .order("priority", { ascending: false });
  if (error) {
    if (error.message.toLowerCase().includes("career_routing_rules")) return null;
    throw new Error(`Supabase routing-rule lookup failed: ${error.message}`);
  }
  return (data ?? []).find((row: Row) => {
    const academicYearMatches = !row.academic_year || row.academic_year === input.academicYear;
    const assessmentMatches = row.minimum_assessment_score == null || (input.assessmentScore ?? -1) >= Number(row.minimum_assessment_score);
    const completedScoreMatches = row.minimum_completed_score == null || (input.averageCompletedScore ?? -1) >= Number(row.minimum_completed_score);
    return academicYearMatches && assessmentMatches && completedScoreMatches && input.completedSimulationCount >= Number(row.required_completed_simulations ?? 0);
  }) ?? null;
}

export async function getStudentCareerPath(userId: number) {
  const profile = await getProfile(userId);
  if (!profile) return null;
  const evidence = await getCompletionEvidence(userId);
  const fallbackDecision = calculateRoutingDecision({
    educationLevel: (profile.educationLevel as EducationLevel | null) ?? "other",
    major: profile.major,
    careerInterests: profile.careerInterests,
    academicYear: (profile.academicYear as AcademicYear | null) ?? null,
    assessmentScore: profile.assessmentScore,
    ...evidence,
  });
  const rule = profile.educationLevel ? await getRoutingRuleOverride({
    careerKey: fallbackDecision.career.key,
    educationLevel: profile.educationLevel as EducationLevel,
    academicYear: (profile.academicYear as AcademicYear | null) ?? null,
    assessmentScore: profile.assessmentScore,
    averageCompletedScore: evidence.averageCompletedScore,
    completedSimulationCount: evidence.completedSimulationSlugs.length,
  }) : null;
  const decision = rule ? {
    ...fallbackDecision,
    level: rule.recommended_level,
    experience: rule.label ?? fallbackDecision.experience,
    recommendedSimulationSlug: rule.simulation_slug ?? fallbackDecision.recommendedSimulationSlug,
    recommendedSimulationAvailable: Boolean(rule.simulation_slug ?? fallbackDecision.recommendedSimulationSlug),
    isExploration: rule.recommended_level === "explorer",
    needsSkillCheck: false,
  } : fallbackDecision;
  const active = assertResult<Row[] | null>(await getSupabase().from("simulation_sessions").select("*")
    .eq("user_id", userId).eq("status", "active").order("last_active_at", { ascending: false }).limit(1), "active student session lookup") ?? [];
  return { profile, decision, completedSimulationCount: evidence.completedSimulationSlugs.length, averageCompletedScore: evidence.averageCompletedScore, activeSession: active[0] ? mapSession(active[0]) : null };
}

export async function upsertPersonalizedProfile(input: PersonalizedProfileInput) {
  const existing = await getProfile(input.userId);
  const evidence = await getCompletionEvidence(input.userId);
  const decision = calculateRoutingDecision({
    educationLevel: input.educationLevel,
    major: input.major,
    careerInterests: input.careerInterests,
    academicYear: input.academicYear ?? null,
    assessmentScore: input.assessmentScore ?? null,
    ...evidence,
  });
  const payload = {
    user_id: input.userId, full_name: input.fullName.trim(), age: input.age, education_level: input.educationLevel,
    country: input.country, university: input.university?.trim() || null, major: input.major?.trim() || null,
    academic_year: input.academicYear ?? null, graduation_year: input.graduationYear ?? null,
    career_interests: input.careerInterests, preferred_language: input.preferredLanguage,
    assessment_score: input.assessmentScore ?? null, career_path_key: decision.career.key,
    recommended_level: decision.level, routing_decision: decision, onboarding_complete: true, onboarding_completed_at: iso(),
  };
  const query = existing
    ? getSupabase().from("profiles").update(payload).eq("user_id", input.userId)
    : getSupabase().from("profiles").insert({ id: profileId(), ...payload, public_slug: publicSlug(input.userId), portfolio_is_public: true });
  const { error } = await query;
  if (error) throw new Error(`Supabase personalized profile save failed: ${error.message}`);
  return getStudentCareerPath(input.userId);
}

export async function setPortfolioVisibility(userId: number, isPublic: boolean) {
  const { error } = await getSupabase().from("profiles").update({ portfolio_is_public: isPublic }).eq("user_id", userId);
  if (error) throw new Error(`Supabase portfolio visibility update failed: ${error.message}`);
  return getProfile(userId);
}

export async function startOrResumeSession(userId: number, config: SimulationConfig) {
  const activeRows = assertResult<Row[] | null>(await getSupabase().from("simulation_sessions").select("*")
    .eq("user_id", userId).eq("simulation_id", config.id).eq("status", "active").order("last_active_at", { ascending: false }).limit(1), "active session lookup") ?? [];
  if (activeRows[0]) return mapSession(activeRows[0]);

  const id = nanoid(24);
  const { error } = await getSupabase().from("simulation_sessions").insert({
    id, user_id: userId, simulation_id: config.id, config_version: config.version, status: "active",
    current_task_id: config.tasks[0]?.id ?? null, progress_percent: 0, hint_usage: {},
  });
  if (error) throw new Error(`Supabase session creation failed: ${error.message}`);
  await logEvent(userId, id, "simulation_started", { simulationId: config.id });
  return getOwnedSession(userId, id) as Promise<NonNullable<Awaited<ReturnType<typeof getOwnedSession>>>>;
}

export async function getOwnedSession(userId: number, sessionId: string) {
  const row = await first(getSupabase().from("simulation_sessions").select("*").eq("id", sessionId).eq("user_id", userId), "owned session lookup");
  return row ? mapSession(row) : undefined;
}

async function getScores(sessionId: string) {
  const rows = assertResult<Row[] | null>(await getSupabase().from("task_scores").select("*").eq("session_id", sessionId).order("evaluated_at"), "task score lookup") ?? [];
  return rows.map(mapScore);
}

async function getSubmissions(sessionId: string) {
  const rows = assertResult<Row[] | null>(await getSupabase().from("task_submissions").select("*").eq("session_id", sessionId).order("submitted_at"), "submission lookup") ?? [];
  return rows.map(mapSubmission);
}

export async function getSessionProgress(userId: number, sessionId: string) {
  const session = await getOwnedSession(userId, sessionId);
  if (!session) return undefined;
  const [submissions, scores] = await Promise.all([getSubmissions(sessionId), getScores(sessionId)]);
  return { session, submissions, scores };
}

async function logEvent(userId: number, sessionId: string | null, eventType: string, payload: Record<string, unknown>) {
  const { error } = await getSupabase().from("simulation_events").insert({
    id: nanoid(24), user_id: userId, session_id: sessionId, event_type: eventType, payload,
  });
  if (error) throw new Error(`Supabase simulation event insert failed: ${error.message}`);
}

export async function saveTaskSubmission({ userId, sessionId, taskId, taskType, response, hintLevel, score, taskCount, nextTaskId }: {
  userId: number; sessionId: string; taskId: string; taskType: string; response: Record<string, unknown>; hintLevel: number;
  score: TaskScore; taskCount: number; nextTaskId?: string;
}) {
  const session = await getOwnedSession(userId, sessionId);
  if (!session || session.status !== "active") throw new Error("Simulation session not found or unavailable");
  const existing = await first(getSupabase().from("task_submissions").select("*").eq("session_id", sessionId).eq("task_id", taskId), "submission lookup");
  const submissionId = existing?.id ?? nanoid(24);
  const { error: submissionError } = await getSupabase().from("task_submissions").upsert({
    id: submissionId, session_id: sessionId, task_id: taskId, task_type: taskType, response, hint_level: hintLevel,
  }, { onConflict: "session_id,task_id" });
  if (submissionError) throw new Error(`Supabase task submission save failed: ${submissionError.message}`);

  const existingScore = await first(getSupabase().from("task_scores").select("*").eq("submission_id", submissionId), "score lookup");
  const { error: scoreError } = await getSupabase().from("task_scores").upsert({
    id: existingScore?.id ?? nanoid(24), submission_id: submissionId, session_id: sessionId, task_id: taskId,
    score: score.score, max_score: score.maxScore, skill_scores: score.skillScores, criteria: score.criteria, feedback_context: score.feedbackContext,
  }, { onConflict: "submission_id" });
  if (scoreError) throw new Error(`Supabase task score save failed: ${scoreError.message}`);

  const completed = (await getScores(sessionId)).length;
  const { error: sessionError } = await getSupabase().from("simulation_sessions").update({
    hint_usage: { ...session.hintUsage, [taskId]: hintLevel }, current_task_id: nextTaskId ?? taskId,
    progress_percent: Math.round((completed / taskCount) * 100), last_active_at: iso(),
  }).eq("id", sessionId);
  if (sessionError) throw new Error(`Supabase session progress update failed: ${sessionError.message}`);
  await logEvent(userId, sessionId, "task_completed", { taskId, score: score.score, maxScore: score.maxScore });
  return { score, completed, taskCount, nextTaskId };
}

export async function saveCompletion({ userId, sessionId, simulationId, totalScore, skillScores, feedback, portfolioSummary }: {
  userId: number; sessionId: string; simulationId: string; totalScore: number; skillScores: Record<string, number>;
  feedback: { strengths: string[]; improvements: string[]; summary: string };
  portfolioSummary: string;
}) {
  const existing = await first(getSupabase().from("simulation_results").select("*").eq("session_id", sessionId), "completion lookup");
  const resultId = existing?.id ?? nanoid(24);
  const { error: resultError } = await getSupabase().from("simulation_results").upsert({
    id: resultId, session_id: sessionId, user_id: userId, simulation_id: simulationId, total_score: totalScore,
    max_score: 100, skill_scores: skillScores, feedback,
  }, { onConflict: "session_id" });
  if (resultError) throw new Error(`Supabase completion save failed: ${resultError.message}`);
  const { error: sessionError } = await getSupabase().from("simulation_sessions").update({ status: "completed", progress_percent: 100, completed_at: iso(), last_active_at: iso() }).eq("id", sessionId);
  if (sessionError) throw new Error(`Supabase completion session update failed: ${sessionError.message}`);

  const existingCertificate = await first(getSupabase().from("certificates").select("*").eq("result_id", resultId), "certificate lookup");
  const certificateId = existingCertificate?.id ?? nanoid(24);
  const verificationCode = existingCertificate?.verification_code ?? `CSG-${nanoid(10).toUpperCase()}`;
  if (!existingCertificate) {
    const { error } = await getSupabase().from("certificates").insert({ id: certificateId, result_id: resultId, user_id: userId, simulation_id: simulationId, verification_code: verificationCode });
    if (error) throw new Error(`Supabase certificate creation failed: ${error.message}`);
  }

  const existingPortfolio = await first(getSupabase().from("portfolio_items").select("*").eq("result_id", resultId), "portfolio item lookup");
  if (!existingPortfolio) {
    const { error } = await getSupabase().from("portfolio_items").insert({
      id: nanoid(24), user_id: userId, result_id: resultId, simulation_id: simulationId, is_public: true,
      summary: portfolioSummary,
    });
    if (error) throw new Error(`Supabase portfolio item creation failed: ${error.message}`);
  }
  await logEvent(userId, sessionId, "simulation_completed", { totalScore, certificateId });
  return { resultId, certificateId, verificationCode };
}

async function getResultBundle(resultRow: Row) {
  const result = mapResult(resultRow);
  const [certificateRow, simulationRow, profileRow, user] = await Promise.all([
    first(getSupabase().from("certificates").select("*").eq("result_id", result.id), "certificate lookup"),
    first(getSupabase().from("simulations").select("*").eq("id", result.simulationId), "simulation lookup"),
    first(getSupabase().from("profiles").select("*").eq("user_id", result.userId), "profile lookup"),
    getUser(result.userId),
  ]);
  if (!certificateRow || !simulationRow || !profileRow) return undefined;
  const taskScores = await getScores(result.sessionId);
  return { result, certificate: mapCertificate(certificateRow), simulation: mapSimulation(simulationRow), profile: mapProfile(profileRow), user, taskScores };
}

export async function getPublicCertificate(verificationCode: string) {
  const row = await first(getSupabase().from("certificates").select("*").eq("verification_code", verificationCode), "public certificate lookup");
  if (!row) return undefined;
  const resultRow = await first(getSupabase().from("simulation_results").select("*").eq("id", row.result_id), "certificate result lookup");
  return resultRow ? getResultBundle(resultRow) : undefined;
}

export async function getOwnedResult(userId: number, sessionId: string) {
  const row = await first(getSupabase().from("simulation_results").select("*").eq("session_id", sessionId).eq("user_id", userId), "owned result lookup");
  return row ? getResultBundle(row) : undefined;
}

async function getPortfolioItems(userId: number, publicOnly: boolean) {
  let query = getSupabase().from("portfolio_items").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  if (publicOnly) query = query.eq("is_public", true);
  const rows = assertResult<Row[] | null>(await query, "portfolio item listing") ?? [];
  return Promise.all(rows.map(async row => {
    const item = mapPortfolioItem(row);
    const [resultRow, simulationRow, certificateRow] = await Promise.all([
      first(getSupabase().from("simulation_results").select("*").eq("id", item.resultId), "portfolio result lookup"),
      first(getSupabase().from("simulations").select("*").eq("id", item.simulationId), "portfolio simulation lookup"),
      first(getSupabase().from("certificates").select("*").eq("result_id", item.resultId), "portfolio certificate lookup"),
    ]);
    if (!resultRow || !simulationRow) return undefined;
    return { item, result: mapResult(resultRow), simulation: mapSimulation(simulationRow), certificate: certificateRow ? mapCertificate(certificateRow) : null };
  })).then(items => items.filter((item): item is NonNullable<typeof item> => Boolean(item)));
}

export async function getPublicPortfolio(publicProfileSlug: string) {
  const profileRow = await first(getSupabase().from("profiles").select("*").eq("public_slug", publicProfileSlug).eq("portfolio_is_public", true), "public portfolio lookup");
  if (!profileRow) return undefined;
  const profile = mapProfile(profileRow);
  return { profile, user: await getUser(profile.userId), items: await getPortfolioItems(profile.userId, true) };
}

export async function getOwnPortfolio(userId: number) {
  const profile = await getProfile(userId);
  if (!profile) return undefined;
  return { profile, user: await getUser(userId), items: await getPortfolioItems(userId, false) };
}
