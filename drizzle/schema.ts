import { index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const profiles = mysqlTable("profiles", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  country: varchar("country", { length: 80 }),
  university: varchar("university", { length: 160 }),
  major: varchar("major", { length: 160 }),
  graduationYear: int("graduationYear"),
  careerInterests: json("careerInterests").$type<string[]>().notNull(),
  preferredLanguage: mysqlEnum("preferredLanguage", ["en", "ar"]).default("en").notNull(),
  publicSlug: varchar("publicSlug", { length: 80 }).notNull(),
  portfolioIsPublic: mysqlEnum("portfolioIsPublic", ["yes", "no"]).default("yes").notNull(),
  onboardingComplete: mysqlEnum("onboardingComplete", ["yes", "no"]).default("no").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("profiles_userId_unique").on(table.userId), uniqueIndex("profiles_publicSlug_unique").on(table.publicSlug)]);

export const simulations = mysqlTable("simulations", {
  id: varchar("id", { length: 80 }).primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull(),
  configVersion: varchar("configVersion", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("published").notNull(),
  title: json("title").$type<{ en: string; ar: string }>().notNull(),
  company: json("company").$type<{ en: string; ar: string }>().notNull(),
  industry: json("industry").$type<{ en: string; ar: string }>().notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).notNull(),
  estimatedMinutes: int("estimatedMinutes").notNull(),
  skills: json("skills").$type<string[]>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("simulations_slug_unique").on(table.slug), index("simulations_status_idx").on(table.status)]);

export const simulationSessions = mysqlTable("simulationSessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  simulationId: varchar("simulationId", { length: 80 }).notNull().references(() => simulations.id, { onDelete: "restrict" }),
  configVersion: varchar("configVersion", { length: 32 }).notNull(),
  status: mysqlEnum("status", ["active", "completed", "abandoned"]).default("active").notNull(),
  currentTaskId: varchar("currentTaskId", { length: 80 }),
  progressPercent: int("progressPercent").default(0).notNull(),
  hintUsage: json("hintUsage").$type<Record<string, number>>().notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  lastActiveAt: timestamp("lastActiveAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
}, table => [index("sessions_user_status_idx").on(table.userId, table.status), index("sessions_simulation_idx").on(table.simulationId)]);

export const taskSubmissions = mysqlTable("taskSubmissions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("sessionId", { length: 36 }).notNull().references(() => simulationSessions.id, { onDelete: "cascade" }),
  taskId: varchar("taskId", { length: 80 }).notNull(),
  taskType: varchar("taskType", { length: 48 }).notNull(),
  response: json("response").$type<Record<string, unknown>>().notNull(),
  hintLevel: int("hintLevel").default(0).notNull(),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("taskSubmissions_session_task_unique").on(table.sessionId, table.taskId), index("taskSubmissions_session_idx").on(table.sessionId)]);

export const taskScores = mysqlTable("taskScores", {
  id: varchar("id", { length: 36 }).primaryKey(),
  submissionId: varchar("submissionId", { length: 36 }).notNull().references(() => taskSubmissions.id, { onDelete: "cascade" }),
  sessionId: varchar("sessionId", { length: 36 }).notNull().references(() => simulationSessions.id, { onDelete: "cascade" }),
  taskId: varchar("taskId", { length: 80 }).notNull(),
  score: int("score").notNull(),
  maxScore: int("maxScore").notNull(),
  skillScores: json("skillScores").$type<Record<string, number>>().notNull(),
  criteria: json("criteria").$type<Array<{ id: string; awarded: number; maxPoints: number; note: string }>>().notNull(),
  feedbackContext: json("feedbackContext").$type<string[]>().notNull(),
  evaluatedAt: timestamp("evaluatedAt").defaultNow().notNull(),
}, table => [uniqueIndex("taskScores_submission_unique").on(table.submissionId), uniqueIndex("taskScores_session_task_unique").on(table.sessionId, table.taskId)]);

export const simulationResults = mysqlTable("simulationResults", {
  id: varchar("id", { length: 36 }).primaryKey(),
  sessionId: varchar("sessionId", { length: 36 }).notNull().references(() => simulationSessions.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  simulationId: varchar("simulationId", { length: 80 }).notNull().references(() => simulations.id, { onDelete: "restrict" }),
  totalScore: int("totalScore").notNull(),
  maxScore: int("maxScore").notNull(),
  skillScores: json("skillScores").$type<Record<string, number>>().notNull(),
  feedback: json("feedback").$type<{ strengths: string[]; improvements: string[]; summary: string }>().notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
}, table => [uniqueIndex("simulationResults_session_unique").on(table.sessionId), index("simulationResults_user_completed_idx").on(table.userId, table.completedAt)]);

export const certificates = mysqlTable("certificates", {
  id: varchar("id", { length: 36 }).primaryKey(),
  resultId: varchar("resultId", { length: 36 }).notNull().references(() => simulationResults.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  simulationId: varchar("simulationId", { length: 80 }).notNull().references(() => simulations.id, { onDelete: "restrict" }),
  verificationCode: varchar("verificationCode", { length: 40 }).notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
}, table => [uniqueIndex("certificates_result_unique").on(table.resultId), uniqueIndex("certificates_code_unique").on(table.verificationCode)]);

export const portfolioItems = mysqlTable("portfolioItems", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  resultId: varchar("resultId", { length: 36 }).notNull().references(() => simulationResults.id, { onDelete: "cascade" }),
  simulationId: varchar("simulationId", { length: 80 }).notNull().references(() => simulations.id, { onDelete: "restrict" }),
  summary: text("summary").notNull(),
  isPublic: mysqlEnum("isPublic", ["yes", "no"]).default("yes").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [uniqueIndex("portfolioItems_result_unique").on(table.resultId), index("portfolioItems_user_public_idx").on(table.userId, table.isPublic)]);

export const simulationEvents = mysqlTable("simulationEvents", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("sessionId", { length: 36 }).references(() => simulationSessions.id, { onDelete: "cascade" }),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  payload: json("payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("simulationEvents_session_type_idx").on(table.sessionId, table.eventType)]);

export type Profile = typeof profiles.$inferSelect;
export type Simulation = typeof simulations.$inferSelect;
export type SimulationSession = typeof simulationSessions.$inferSelect;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;
export type TaskScoreRow = typeof taskScores.$inferSelect;
export type SimulationResult = typeof simulationResults.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type PortfolioItem = typeof portfolioItems.$inferSelect;
