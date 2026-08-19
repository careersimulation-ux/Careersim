import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  certificates,
  portfolioItems,
  profiles,
  simulationEvents,
  simulationResults,
  simulations,
  simulationSessions,
  taskScores,
  taskSubmissions,
  users,
} from "../../drizzle/schema";
import type { SimulationConfig, TaskScore } from "@shared/simulation/types";
import { getDb } from "../db";

const profileId = () => nanoid(24);
const publicSlug = (userId: number) => `student-${userId}-${nanoid(6).toLowerCase()}`;

export async function ensureSimulationSeed(config: SimulationConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.insert(simulations).values({
    id: config.id,
    slug: config.slug,
    configVersion: config.version,
    status: "published",
    title: config.title,
    company: config.company,
    industry: config.industry,
    category: config.category,
    difficulty: config.difficulty,
    estimatedMinutes: config.estimatedMinutes,
    skills: config.skills,
  }).onDuplicateKeyUpdate({
    set: {
      configVersion: config.version,
      status: "published",
      title: config.title,
      company: config.company,
      industry: config.industry,
      category: config.category,
      difficulty: config.difficulty,
      estimatedMinutes: config.estimatedMinutes,
      skills: config.skills,
    },
  });
}

export async function listPublishedSimulations() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  return db.select().from(simulations).where(eq(simulations.status, "published"));
}

export async function getProfile(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const result = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  return result[0];
}

export async function upsertProfile(input: {
  userId: number;
  country: string;
  university: string;
  major: string;
  graduationYear: number;
  careerInterests: string[];
  preferredLanguage: "en" | "ar";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await getProfile(input.userId);
  if (existing) {
    await db.update(profiles).set({
      country: input.country,
      university: input.university,
      major: input.major,
      graduationYear: input.graduationYear,
      careerInterests: input.careerInterests,
      preferredLanguage: input.preferredLanguage,
      onboardingComplete: "yes",
    }).where(eq(profiles.userId, input.userId));
  } else {
    await db.insert(profiles).values({
      id: profileId(),
      userId: input.userId,
      country: input.country,
      university: input.university,
      major: input.major,
      graduationYear: input.graduationYear,
      careerInterests: input.careerInterests,
      preferredLanguage: input.preferredLanguage,
      publicSlug: publicSlug(input.userId),
      portfolioIsPublic: "yes",
      onboardingComplete: "yes",
    });
  }
  return getProfile(input.userId);
}

export async function setPortfolioVisibility(userId: number, isPublic: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(profiles).set({ portfolioIsPublic: isPublic ? "yes" : "no" }).where(eq(profiles.userId, userId));
  return getProfile(userId);
}

export async function startOrResumeSession(userId: number, config: SimulationConfig) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const active = await db.select().from(simulationSessions).where(and(
    eq(simulationSessions.userId, userId),
    eq(simulationSessions.simulationId, config.id),
    eq(simulationSessions.status, "active"),
  )).orderBy(desc(simulationSessions.lastActiveAt)).limit(1);
  if (active[0]) return active[0];
  const id = nanoid(24);
  await db.insert(simulationSessions).values({
    id,
    userId,
    simulationId: config.id,
    configVersion: config.version,
    status: "active",
    currentTaskId: config.tasks[0]?.id,
    progressPercent: 0,
    hintUsage: {},
  });
  await db.insert(simulationEvents).values({ id: nanoid(24), userId, sessionId: id, eventType: "simulation_started", payload: { simulationId: config.id } });
  const session = await db.select().from(simulationSessions).where(eq(simulationSessions.id, id)).limit(1);
  return session[0];
}

export async function getOwnedSession(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const session = await db.select().from(simulationSessions).where(and(eq(simulationSessions.id, sessionId), eq(simulationSessions.userId, userId))).limit(1);
  return session[0];
}

export async function getSessionProgress(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const session = await getOwnedSession(userId, sessionId);
  if (!session) return undefined;
  const submissions = await db.select().from(taskSubmissions).where(eq(taskSubmissions.sessionId, sessionId));
  const scores = await db.select().from(taskScores).where(eq(taskScores.sessionId, sessionId));
  return { session, submissions, scores };
}

export async function saveTaskSubmission({
  userId,
  sessionId,
  taskId,
  taskType,
  response,
  hintLevel,
  score,
  taskCount,
  nextTaskId,
}: {
  userId: number;
  sessionId: string;
  taskId: string;
  taskType: string;
  response: Record<string, unknown>;
  hintLevel: number;
  score: TaskScore;
  taskCount: number;
  nextTaskId?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const session = await getOwnedSession(userId, sessionId);
  if (!session || session.status !== "active") throw new Error("Simulation session not found or unavailable");
  const existing = await db.select().from(taskSubmissions).where(and(eq(taskSubmissions.sessionId, sessionId), eq(taskSubmissions.taskId, taskId))).limit(1);
  const submissionId = existing[0]?.id ?? nanoid(24);
  const submissionData = { sessionId, taskId, taskType, response, hintLevel };
  if (existing[0]) {
    await db.update(taskSubmissions).set(submissionData).where(eq(taskSubmissions.id, submissionId));
  } else {
    await db.insert(taskSubmissions).values({ id: submissionId, ...submissionData });
  }
  const existingScore = await db.select().from(taskScores).where(eq(taskScores.submissionId, submissionId)).limit(1);
  const scoreData = { sessionId, taskId, score: score.score, maxScore: score.maxScore, skillScores: score.skillScores, criteria: score.criteria, feedbackContext: score.feedbackContext };
  if (existingScore[0]) {
    await db.update(taskScores).set(scoreData).where(eq(taskScores.id, existingScore[0].id));
  } else {
    await db.insert(taskScores).values({ id: nanoid(24), submissionId, ...scoreData });
  }
  const scoreRows = await db.select().from(taskScores).where(eq(taskScores.sessionId, sessionId));
  const completed = scoreRows.length;
  const hintUsage = { ...session.hintUsage, [taskId]: hintLevel };
  await db.update(simulationSessions).set({
    hintUsage,
    currentTaskId: nextTaskId ?? taskId,
    progressPercent: Math.round((completed / taskCount) * 100),
  }).where(eq(simulationSessions.id, sessionId));
  await db.insert(simulationEvents).values({ id: nanoid(24), userId, sessionId, eventType: "task_completed", payload: { taskId, score: score.score, maxScore: score.maxScore } });
  return { score, completed, taskCount, nextTaskId };
}

export async function saveCompletion({
  userId,
  sessionId,
  simulationId,
  totalScore,
  skillScores,
  feedback,
}: {
  userId: number;
  sessionId: string;
  simulationId: string;
  totalScore: number;
  skillScores: Record<string, number>;
  feedback: { strengths: string[]; improvements: string[]; summary: string };
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const existing = await db.select().from(simulationResults).where(eq(simulationResults.sessionId, sessionId)).limit(1);
  const resultId = existing[0]?.id ?? nanoid(24);
  const resultData = { userId, simulationId, totalScore, maxScore: 100, skillScores, feedback };
  if (existing[0]) {
    await db.update(simulationResults).set(resultData).where(eq(simulationResults.id, resultId));
  } else {
    await db.insert(simulationResults).values({ id: resultId, sessionId, ...resultData });
  }
  await db.update(simulationSessions).set({ status: "completed", progressPercent: 100, completedAt: new Date() }).where(eq(simulationSessions.id, sessionId));
  const existingCertificate = await db.select().from(certificates).where(eq(certificates.resultId, resultId)).limit(1);
  const certificateId = existingCertificate[0]?.id ?? nanoid(24);
  const verificationCode = existingCertificate[0]?.verificationCode ?? `CSG-${nanoid(10).toUpperCase()}`;
  if (!existingCertificate[0]) {
    await db.insert(certificates).values({ id: certificateId, resultId, userId, simulationId, verificationCode });
  }
  const existingPortfolio = await db.select().from(portfolioItems).where(eq(portfolioItems.resultId, resultId)).limit(1);
  if (!existingPortfolio[0]) {
    await db.insert(portfolioItems).values({
      id: nanoid(24), userId, resultId, simulationId, isPublic: "yes",
      summary: "Analyzed synthetic retail sales data to identify the primary drivers behind a regional sales decline and proposed a data-supported management recommendation.",
    });
  }
  await db.insert(simulationEvents).values({ id: nanoid(24), userId, sessionId, eventType: "simulation_completed", payload: { totalScore, certificateId } });
  return { resultId, certificateId, verificationCode };
}

export async function getPublicCertificate(verificationCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ certificate: certificates, result: simulationResults, simulation: simulations, profile: profiles, user: users })
    .from(certificates)
    .innerJoin(simulationResults, eq(certificates.resultId, simulationResults.id))
    .innerJoin(simulations, eq(certificates.simulationId, simulations.id))
    .innerJoin(profiles, eq(certificates.userId, profiles.userId))
    .innerJoin(users, eq(certificates.userId, users.id))
    .where(eq(certificates.verificationCode, verificationCode)).limit(1);
  return rows[0];
}

export async function getOwnedResult(userId: number, sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const rows = await db.select({ result: simulationResults, certificate: certificates, simulation: simulations, profile: profiles, user: users })
    .from(simulationResults)
    .innerJoin(certificates, eq(certificates.resultId, simulationResults.id))
    .innerJoin(simulations, eq(simulationResults.simulationId, simulations.id))
    .innerJoin(profiles, eq(simulationResults.userId, profiles.userId))
    .innerJoin(users, eq(simulationResults.userId, users.id))
    .where(and(eq(simulationResults.sessionId, sessionId), eq(simulationResults.userId, userId))).limit(1);
  if (!rows[0]) return undefined;
  const scoreRows = await db.select().from(taskScores).where(eq(taskScores.sessionId, sessionId));
  return { ...rows[0], taskScores: scoreRows };
}

export async function getPublicPortfolio(publicProfileSlug: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const profileRows = await db.select({ profile: profiles, user: users }).from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(and(eq(profiles.publicSlug, publicProfileSlug), eq(profiles.portfolioIsPublic, "yes"))).limit(1);
  if (!profileRows[0]) return undefined;
  const profile = profileRows[0].profile;
  const items = await db.select({ item: portfolioItems, result: simulationResults, simulation: simulations, certificate: certificates })
    .from(portfolioItems)
    .innerJoin(simulationResults, eq(portfolioItems.resultId, simulationResults.id))
    .innerJoin(simulations, eq(portfolioItems.simulationId, simulations.id))
    .leftJoin(certificates, eq(certificates.resultId, simulationResults.id))
    .where(and(eq(portfolioItems.userId, profile.userId), eq(portfolioItems.isPublic, "yes")))
    .orderBy(desc(portfolioItems.createdAt));
  return { profile, user: profileRows[0].user, items };
}

export async function getOwnPortfolio(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const profileRows = await db.select({ profile: profiles, user: users }).from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id)).where(eq(profiles.userId, userId)).limit(1);
  if (!profileRows[0]) return undefined;
  const items = await db.select({ item: portfolioItems, result: simulationResults, simulation: simulations, certificate: certificates })
    .from(portfolioItems)
    .innerJoin(simulationResults, eq(portfolioItems.resultId, simulationResults.id))
    .innerJoin(simulations, eq(portfolioItems.simulationId, simulations.id))
    .leftJoin(certificates, eq(certificates.resultId, simulationResults.id))
    .where(eq(portfolioItems.userId, userId)).orderBy(desc(portfolioItems.createdAt));
  return { profile: profileRows[0].profile, user: profileRows[0].user, items };
}
