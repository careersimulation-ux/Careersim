import juniorDataAnalystJson from "@shared/simulations/junior-data-analyst.json";
import businessAnalystJson from "@shared/simulations/business-analyst.json";
import type { SimulationConfig, SimulationTaskConfig } from "@shared/simulation/types";
import { z } from "zod";

const localizedTextSchema = z.object({ en: z.string().min(1), ar: z.string().min(1) });
const simulationConfigSchema = z.object({
  version: z.string().min(1),
  id: z.string().min(3),
  slug: z.string().min(3),
  title: localizedTextSchema,
  company: localizedTextSchema,
  role: localizedTextSchema,
  category: z.string().min(2),
  industry: localizedTextSchema,
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedMinutes: z.number().positive(),
  description: localizedTextSchema,
  story: localizedTextSchema,
  portfolioSummary: localizedTextSchema,
  skills: z.array(z.string().min(1)).min(1),
  dataExplorer: z.object({
    title: localizedTextSchema,
    subtitle: localizedTextSchema,
    entityLabel: localizedTextSchema,
    categoryLabel: localizedTextSchema,
    metrics: z.object({ revenue: localizedTextSchema, profit: localizedTextSchema, customers: localizedTextSchema, units: localizedTextSchema, aov: localizedTextSchema, returns: localizedTextSchema, chart: localizedTextSchema }),
  }).optional(),
  characters: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), title: localizedTextSchema, initials: z.string().min(1), color: z.string().min(1) })).min(1),
  emails: z.array(z.object({ id: z.string().min(1), from: z.string().min(1), subject: localizedTextSchema, preview: localizedTextSchema, body: localizedTextSchema, timestamp: z.string().min(1), attachments: z.array(z.string()), unlockAfterTask: z.number().int().positive().optional() })).min(1),
  files: z.array(z.object({ id: z.string().min(1), name: z.string().min(1), kind: z.enum(["dataset", "report", "memo"]), label: localizedTextSchema, description: localizedTextSchema, usefulFor: z.array(z.string()), content: localizedTextSchema, downloadUrl: z.string().startsWith("/manus-storage/") })).min(1),
  datasetBlueprint: z.object({ months: z.array(z.string()).min(1), branches: z.array(z.unknown()).min(1), categories: z.array(z.unknown()).min(1), anomaly: z.object({ branch: z.string().min(1), months: z.array(z.string()).min(1), customerMultiplier: z.number().positive(), marketingMultiplier: z.number().positive(), returnMultiplier: z.number().positive() }) }),
  tasks: z.array(z.object({ id: z.string().min(1), type: z.enum(["data_exploration", "visualization_builder", "written_insight", "single_choice", "recommendation"]), title: localizedTextSchema, objective: localizedTextSchema, instructions: localizedTextSchema, deliverable: localizedTextSchema, estimatedMinutes: z.number().positive(), resources: z.array(z.string()), hints: z.array(localizedTextSchema).length(3), input: z.record(z.string(), z.unknown()), rubric: z.object({ maxPoints: z.number().positive(), skillWeights: z.record(z.string(), z.number().positive()), criteria: z.array(z.object({ id: z.string().min(1), maxPoints: z.number().positive(), labels: localizedTextSchema, evaluation: z.record(z.string(), z.unknown()).optional() })).min(1) }) })).min(1),
  completion: z.object({ passingScore: z.number().min(0).max(100), certificateSkills: z.array(z.string()).min(1) }),
});

export function validateSimulationConfig(raw: unknown): SimulationConfig {
  const parsed = simulationConfigSchema.safeParse(raw);
  if (!parsed.success) throw new Error(`Invalid simulation configuration: ${parsed.error.issues[0]?.message ?? "unknown validation error"}`);
  const taskIds = parsed.data.tasks.map(task => task.id);
  if (new Set(taskIds).size !== taskIds.length) throw new Error("Invalid simulation configuration: task ids must be unique");
  const totalPoints = parsed.data.tasks.reduce((sum, task) => sum + task.rubric.maxPoints, 0);
  if (totalPoints !== 100) throw new Error("Invalid simulation configuration: task scores must total 100 points");
  return raw as SimulationConfig;
}

const configs: SimulationConfig[] = [
  validateSimulationConfig(juniorDataAnalystJson),
  validateSimulationConfig(businessAnalystJson),
];

function removePrivateRubricFields(task: SimulationTaskConfig): SimulationTaskConfig {
  return {
    ...task,
    rubric: {
      ...task.rubric,
      criteria: task.rubric.criteria.map(({ evaluation: _evaluation, ...criterion }) => criterion),
    },
  };
}

export function listSimulationConfigs() {
  return configs;
}

export function getSimulationConfig(slug: string) {
  return configs.find(config => config.slug === slug);
}

export function getSimulationConfigById(id: string) {
  return configs.find(config => config.id === id);
}

export function toPublicSimulationConfig(config: SimulationConfig) {
  const { datasetBlueprint: _datasetBlueprint, ...publicConfig } = config;
  return {
    ...publicConfig,
    tasks: config.tasks.map(removePrivateRubricFields),
  };
}

export function toCatalogSimulation(config: SimulationConfig) {
  return {
    id: config.id,
    slug: config.slug,
    version: config.version,
    title: config.title,
    company: config.company,
    role: config.role,
    category: config.category,
    industry: config.industry,
    difficulty: config.difficulty,
    estimatedMinutes: config.estimatedMinutes,
    description: config.description,
    story: config.story,
    skills: config.skills,
    tasks: config.tasks.map(task => ({ id: task.id, title: task.title, estimatedMinutes: task.estimatedMinutes })),
  };
}

export function getTaskConfig(simulationId: string, taskId: string) {
  const simulation = getSimulationConfigById(simulationId);
  return simulation?.tasks.find(task => task.id === taskId);
}

export function getUnlockedEmails(config: SimulationConfig, completedTasks: number) {
  return config.emails.filter(email => !email.unlockAfterTask || completedTasks >= email.unlockAfterTask);
}
