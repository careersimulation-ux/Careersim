import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getOwnPortfolio, getOwnedResult, getPublicCertificate, getPublicPortfolio, getProfile, getSessionProgress, listPublishedSimulations, saveCompletion, saveTaskSubmission, setPortfolioVisibility, startOrResumeSession, upsertProfile } from "./db/career";
import { generateFeedback } from "./feedbackEngine";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { buildSalesDataset } from "./syntheticData";
import { getSimulationConfig, getSimulationConfigById, getTaskConfig, getUnlockedEmails, listSimulationConfigs, toCatalogSimulation, toPublicSimulationConfig } from "./simulationEngine";
import { scoreTaskResponse } from "./scoringEngine";
import { futureSimulationPlaceholders } from "@shared/simulation/catalog";

const sessionInput = z.object({ sessionId: z.string().min(1) });

function requireConfig(slug: string) {
  const config = getSimulationConfig(slug);
  if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation not found" });
  return config;
}

function requireOwnedSession(data: Awaited<ReturnType<typeof getSessionProgress>>) {
  if (!data) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation session not found" });
  return data;
}

function calculateSkillScores(scores: Array<{ taskId: string; score: number; maxScore: number }>, simulationId: string) {
  const config = getSimulationConfigById(simulationId);
  if (!config) return {};
  const weighted: Record<string, { earned: number; weight: number }> = {};
  for (const score of scores) {
    const task = config.tasks.find(item => item.id === score.taskId);
    if (!task || score.maxScore === 0) continue;
    const performance = score.score / score.maxScore;
    for (const [skill, weight] of Object.entries(task.rubric.skillWeights)) {
      const current = weighted[skill] ?? { earned: 0, weight: 0 };
      current.earned += performance * weight;
      current.weight += weight;
      weighted[skill] = current;
    }
  }
  return Object.fromEntries(Object.entries(weighted).map(([skill, values]) => [skill, Math.round((values.earned / values.weight) * 100)]));
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  profile: router({
    me: protectedProcedure.query(({ ctx }) => getProfile(ctx.user.id)),
    completeOnboarding: protectedProcedure.input(z.object({
      country: z.string().min(2).max(80),
      university: z.string().min(2).max(160),
      major: z.string().min(2).max(160),
      graduationYear: z.number().int().min(2020).max(2045),
      careerInterests: z.array(z.string().min(2).max(64)).min(1).max(6),
      preferredLanguage: z.enum(["en", "ar"]),
    })).mutation(({ ctx, input }) => upsertProfile({ userId: ctx.user.id, ...input })),
    setPortfolioVisibility: protectedProcedure.input(z.object({ isPublic: z.boolean() })).mutation(({ ctx, input }) => setPortfolioVisibility(ctx.user.id, input.isPublic)),
  }),
  catalog: router({
    list: publicProcedure.query(async () => {
      for (const config of listSimulationConfigs()) {
        const { ensureSimulationSeed } = await import("./db/career");
        await ensureSimulationSeed(config);
      }
      const liveSimulations = await listPublishedSimulations();
      return [...liveSimulations.map(simulation => ({ ...simulation, status: "published" as const })), ...futureSimulationPlaceholders];
    }),
    detail: publicProcedure.input(z.object({ slug: z.string().min(1) })).query(({ input }) => toCatalogSimulation(requireConfig(input.slug))),
  }),
  simulation: router({
    start: protectedProcedure.input(z.object({ slug: z.string().min(1) })).mutation(async ({ ctx, input }) => {
      const profile = await getProfile(ctx.user.id);
      if (!profile?.onboardingComplete || profile.onboardingComplete !== "yes") {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete your profile before starting a simulation." });
      }
      const config = requireConfig(input.slug);
      const { ensureSimulationSeed } = await import("./db/career");
      await ensureSimulationSeed(config);
      return startOrResumeSession(ctx.user.id, config);
    }),
    workspace: protectedProcedure.input(sessionInput).query(async ({ ctx, input }) => {
      const state = requireOwnedSession(await getSessionProgress(ctx.user.id, input.sessionId));
      const config = getSimulationConfigById(state.session.simulationId);
      if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation configuration not found" });
      return {
        session: state.session,
        submissions: state.submissions.map(submission => ({ taskId: submission.taskId, response: submission.response, hintLevel: submission.hintLevel })),
        scores: state.scores,
        config: {
          ...toPublicSimulationConfig(config),
          emails: getUnlockedEmails(config, state.scores.length),
        },
      };
    }),
    dataset: protectedProcedure.input(sessionInput).query(async ({ ctx, input }) => {
      const state = requireOwnedSession(await getSessionProgress(ctx.user.id, input.sessionId));
      const config = getSimulationConfigById(state.session.simulationId);
      if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation configuration not found" });
      return buildSalesDataset(config);
    }),
    submitTask: protectedProcedure.input(z.object({
      sessionId: z.string().min(1),
      taskId: z.string().min(1),
      response: z.record(z.string(), z.unknown()),
      hintLevel: z.number().int().min(0).max(3).default(0),
    })).mutation(async ({ ctx, input }) => {
      const state = requireOwnedSession(await getSessionProgress(ctx.user.id, input.sessionId));
      const config = getSimulationConfigById(state.session.simulationId);
      if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation configuration not found" });
      const task = getTaskConfig(config.id, input.taskId);
      if (!task) throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      const score = scoreTaskResponse({ task, response: input.response, hintLevel: input.hintLevel });
      const taskIndex = config.tasks.findIndex(item => item.id === task.id);
      return saveTaskSubmission({
        userId: ctx.user.id,
        sessionId: input.sessionId,
        taskId: task.id,
        taskType: task.type,
        response: input.response,
        hintLevel: input.hintLevel,
        score,
        taskCount: config.tasks.length,
        nextTaskId: config.tasks[taskIndex + 1]?.id,
      });
    }),
    complete: protectedProcedure.input(sessionInput).mutation(async ({ ctx, input }) => {
      const existingResult = await getOwnedResult(ctx.user.id, input.sessionId);
      if (existingResult) return { resultId: existingResult.result.id, certificateId: existingResult.certificate.id, verificationCode: existingResult.certificate.verificationCode };
      const state = requireOwnedSession(await getSessionProgress(ctx.user.id, input.sessionId));
      const config = getSimulationConfigById(state.session.simulationId);
      if (!config) throw new TRPCError({ code: "NOT_FOUND", message: "Simulation configuration not found" });
      if (state.scores.length < config.tasks.length) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Complete every task before requesting results." });
      }
      const totalScore = state.scores.reduce((total, score) => total + score.score, 0);
      const skillScores = calculateSkillScores(state.scores, config.id);
      const profile = await getProfile(ctx.user.id);
      const locale = profile?.preferredLanguage === "ar" ? "ar" : "en";
      const finalTask = config.tasks.find(task => task.type === "recommendation");
      const finalResponse = state.submissions.find(submission => submission.taskId === finalTask?.id);
      const feedback = await generateFeedback({
        score: totalScore,
        taskEvidence: state.scores.flatMap(score => score.feedbackContext),
        finalRecommendation: JSON.stringify(finalResponse?.response ?? {}),
        simulationTitle: config.title[locale],
        locale,
      });
      return saveCompletion({ userId: ctx.user.id, sessionId: input.sessionId, simulationId: config.id, totalScore, skillScores, feedback, portfolioSummary: config.portfolioSummary[locale] });
    }),
    result: protectedProcedure.input(sessionInput).query(async ({ ctx, input }) => {
      const result = await getOwnedResult(ctx.user.id, input.sessionId);
      if (!result) return null;
      const config = getSimulationConfigById(result.result.simulationId);
      return {
        ...result,
        taskScores: result.taskScores.map(score => ({
          ...score,
          title: config?.tasks.find(task => task.id === score.taskId)?.title,
        })),
      };
    }),
  }),
  sharing: router({
    certificate: publicProcedure.input(z.object({ code: z.string().min(3) })).query(({ input }) => getPublicCertificate(input.code)),
    portfolio: publicProcedure.input(z.object({ slug: z.string().min(3) })).query(({ input }) => getPublicPortfolio(input.slug)),
    myPortfolio: protectedProcedure.query(({ ctx }) => getOwnPortfolio(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
