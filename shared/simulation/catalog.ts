import type { LocalizedText } from "./types";

export type CatalogPlaceholder = {
  id: string;
  slug: string;
  title: LocalizedText;
  company: LocalizedText;
  industry: LocalizedText;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  skills: string[];
  status: "coming_soon";
};

export const futureSimulationPlaceholders: CatalogPlaceholder[] = [
  {
    id: "placeholder-business-analyst",
    slug: "business-analyst",
    title: { en: "Business Analyst", ar: "محلل أعمال" },
    company: { en: "Gulf Growth Partners", ar: "شركاء النمو الخليجي" },
    industry: { en: "Strategy & Operations", ar: "الاستراتيجية والعمليات" },
    category: "business",
    difficulty: "intermediate",
    estimatedMinutes: 80,
    skills: ["Business Analysis", "Stakeholder Thinking", "Problem Solving"],
    status: "coming_soon",
  },
  {
    id: "placeholder-financial-analyst",
    slug: "financial-analyst",
    title: { en: "Financial Analyst", ar: "محلل مالي" },
    company: { en: "Gulf Finance Co.", ar: "شركة الخليج المالية" },
    industry: { en: "Corporate Finance", ar: "التمويل المؤسسي" },
    category: "finance",
    difficulty: "intermediate",
    estimatedMinutes: 90,
    skills: ["Financial Analysis", "Forecasting", "Business Communication"],
    status: "coming_soon",
  },
  {
    id: "placeholder-digital-marketing",
    slug: "digital-marketing-specialist",
    title: { en: "Digital Marketing Specialist", ar: "أخصائي تسويق رقمي" },
    company: { en: "Gulf Digital Labs", ar: "مختبرات الخليج الرقمية" },
    industry: { en: "Digital Marketing", ar: "التسويق الرقمي" },
    category: "marketing",
    difficulty: "beginner",
    estimatedMinutes: 70,
    skills: ["Campaign Analysis", "Creative Strategy", "Data Literacy"],
    status: "coming_soon",
  },
  {
    id: "placeholder-laboratory-quality",
    slug: "laboratory-quality-specialist",
    title: { en: "Laboratory Quality Specialist", ar: "أخصائي جودة مختبرية" },
    company: { en: "Gulf Science Services", ar: "خدمات الخليج العلمية" },
    industry: { en: "Laboratory & Quality", ar: "المختبرات والجودة" },
    category: "science",
    difficulty: "beginner",
    estimatedMinutes: 75,
    skills: ["Quality Control", "Documentation", "Critical Thinking"],
    status: "coming_soon",
  },
];
