export type LocalizedText = {
  en: string;
  ar: string;
};

export type SimulationTaskType =
  | "data_exploration"
  | "visualization_builder"
  | "written_insight"
  | "single_choice"
  | "recommendation";

export type SimulationTaskConfig = {
  id: string;
  type: SimulationTaskType;
  title: LocalizedText;
  objective: LocalizedText;
  instructions: LocalizedText;
  deliverable: LocalizedText;
  estimatedMinutes: number;
  resources: string[];
  hints: LocalizedText[];
  input: Record<string, unknown>;
  rubric: {
    maxPoints: number;
    skillWeights: Record<string, number>;
    criteria: Array<{
      id: string;
      maxPoints: number;
      labels: LocalizedText;
      evaluation?: Record<string, unknown>;
    }>;
  };
};

export type SimulationConfig = {
  version: string;
  id: string;
  slug: string;
  title: LocalizedText;
  company: LocalizedText;
  role: LocalizedText;
  category: string;
  industry: LocalizedText;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  description: LocalizedText;
  story: LocalizedText;
  skills: string[];
  characters: Array<{
    id: string;
    name: string;
    title: LocalizedText;
    initials: string;
    color: string;
  }>;
  emails: Array<{
    id: string;
    from: string;
    subject: LocalizedText;
    preview: LocalizedText;
    body: LocalizedText;
    timestamp: string;
    attachments: string[];
    unlockAfterTask?: number;
  }>;
  files: Array<{
    id: string;
    name: string;
    kind: "dataset" | "report" | "memo";
    label: LocalizedText;
    description: LocalizedText;
    usefulFor: string[];
    content: LocalizedText;
    downloadUrl: string;
  }>;
  datasetBlueprint: {
    months: string[];
    branches: Array<{ name: string; city: string; baselineCustomers: number; baselineAov: number }>;
    categories: Array<{ category: string; product: string; multiplier: number; margin: number }>;
    anomaly: {
      branch: string;
      months: string[];
      customerMultiplier: number;
      marketingMultiplier: number;
      returnMultiplier: number;
    };
  };
  tasks: SimulationTaskConfig[];
  completion: { passingScore: number; certificateSkills: string[] };
};

export type SalesRecord = {
  id: string;
  date: string;
  month: string;
  branch: string;
  city: string;
  productCategory: string;
  product: string;
  unitsSold: number;
  revenue: number;
  cost: number;
  profit: number;
  customers: number;
  averageOrderValue: number;
  marketingSpend: number;
  discount: number;
  returns: number;
};

export type TaskScore = {
  score: number;
  maxScore: number;
  criteria: Array<{ id: string; awarded: number; maxPoints: number; note: string }>;
  skillScores: Record<string, number>;
  feedbackContext: string[];
};
