import type { LocalizedText } from "@shared/simulation/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "ar";

const skillDictionary: Record<string, { en: string; ar: string }> = {
  "Data Analysis": { en: "Data Analysis", ar: "تحليل البيانات" },
  "Problem Solving": { en: "Problem Solving", ar: "حل المشكلات" },
  "Business Thinking": { en: "Business Thinking", ar: "التفكير التجاري" },
  "Decision Making": { en: "Decision Making", ar: "اتخاذ القرار" },
  "Business Communication": { en: "Business Communication", ar: "التواصل التجاري" },
  "Business Analysis": { en: "Business Analysis", ar: "تحليل الأعمال" },
  "Stakeholder Thinking": { en: "Stakeholder Thinking", ar: "فهم أصحاب المصلحة" },
  "Financial Analysis": { en: "Financial Analysis", ar: "التحليل المالي" },
  "Forecasting": { en: "Forecasting", ar: "التنبؤ" },
  "Campaign Analysis": { en: "Campaign Analysis", ar: "تحليل الحملات" },
  "Creative Strategy": { en: "Creative Strategy", ar: "الاستراتيجية الإبداعية" },
  "Data Literacy": { en: "Data Literacy", ar: "الثقافة البيانية" },
  "Quality Control": { en: "Quality Control", ar: "ضبط الجودة" },
  "Documentation": { en: "Documentation", ar: "التوثيق" },
  "Critical Thinking": { en: "Critical Thinking", ar: "التفكير النقدي" },
};

export const translateSkill = (skill: string, language: Language) => skillDictionary[skill]?.[language] ?? skill;

const copy = {
  en: {
    nav: { simulations: "Simulations", portfolio: "Portfolio", careerPath: "My career path", signIn: "Sign in", start: "Start now" },
    home: {
      eyebrow: "Gulf career readiness, reimagined",
      titleLead: "Get real experience",
      titleAccent: "before your first job.",
      description: "Practice the work employers expect through immersive job simulations designed for university students and graduates across the Gulf.",
      primary: "Start your first simulation",
      secondary: "Explore simulations",
      proof: "Built for students across Saudi Arabia and the Gulf",
      workplace: "Your first day does not need to be your first experience.",
      workplaceText: "Open the brief. Review the evidence. Make the decision. CareerSim turns career exploration into work you can show.",
      how: "How it works",
      howTitle: "A practical path from curiosity to proof.",
      paths: "Explore career paths",
      featured: "Featured simulation",
      featuredText: "One immersive first case. More career paths on the way.",
      banner: "Fictional workplace. Synthetic data. Practical experience.",
    },
    onboarding: {
      eyebrow: "Your CareerSim profile",
      title: "Tell us where you’re heading.",
      description: "We’ll use this to shape your starting experience and portfolio.",
      country: "Country", university: "University", major: "Major or field of study", graduation: "Graduation year", interests: "Career interests", language: "Preferred language",
      continue: "Continue to simulations", saving: "Saving your profile…",
    },
    catalog: { eyebrow: "Simulation catalog", title: "Find work worth practicing.", subtitle: "Step into realistic, focused assignments with fictional Gulf companies and synthetic business data.", live: "Available now", soon: "Coming soon", minutes: "min", start: "Start simulation", view: "View simulation", skills: "Skills you’ll demonstrate" },
    detail: { back: "Back to catalog", workplace: "Workplace simulation", start: "Start simulation", signInToStart: "Sign in to start", tasks: "Five connected work tasks", briefing: "Your briefing", skills: "Skills you’ll build", time: "Estimated time", difficulty: "Difficulty", company: "Fictional company" },
    common: { loading: "Loading…", error: "Something went wrong. Please try again.", english: "English", arabic: "العربية", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" },
  },
  ar: {
    nav: { simulations: "المحاكاة", portfolio: "ملفي المهني", careerPath: "مساري المهني", signIn: "تسجيل الدخول", start: "ابدأ الآن" },
    home: {
      eyebrow: "الجاهزية المهنية في الخليج، بشكل مختلف",
      titleLead: "اكتسب خبرة عملية",
      titleAccent: "قبل أول وظيفة.",
      description: "تدرّب على المهام التي يتوقعها أصحاب العمل من خلال محاكاة وظيفية غامرة مصممة لطلاب الجامعات والخريجين في الخليج.",
      primary: "ابدأ محاكاتك الأولى",
      secondary: "استكشف المحاكاة",
      proof: "مصممة للطلاب في السعودية ودول الخليج",
      workplace: "لا يجب أن يكون أول يوم عمل هو أول خبرة لك.",
      workplaceText: "افتح الملخص. راجع الأدلة. اتخذ القرار. تحوّل CareerSim استكشاف المسار المهني إلى عمل يمكنك عرضه.",
      how: "كيف تعمل المنصة",
      howTitle: "مسار عملي من الفضول إلى إثبات المهارة.",
      paths: "استكشف المسارات المهنية",
      featured: "محاكاة مميزة",
      featuredText: "حالة عملية غامرة كبداية، ومسارات مهنية أخرى في الطريق.",
      banner: "بيئة عمل خيالية. بيانات اصطناعية. خبرة عملية.",
    },
    onboarding: {
      eyebrow: "ملفك في CareerSim",
      title: "أخبرنا إلى أين تتجه.",
      description: "سنستخدم هذه المعلومات لتشكيل تجربتك الأولى وملفك المهني.",
      country: "الدولة", university: "الجامعة", major: "التخصص أو مجال الدراسة", graduation: "سنة التخرج", interests: "الاهتمامات المهنية", language: "اللغة المفضلة",
      continue: "المتابعة إلى المحاكاة", saving: "جارٍ حفظ ملفك…",
    },
    catalog: { eyebrow: "كتالوج المحاكاة", title: "ابحث عن عمل يستحق التدريب.", subtitle: "ادخل إلى مهام واقعية ومركزة لدى شركات خليجية خيالية باستخدام بيانات أعمال اصطناعية.", live: "متاحة الآن", soon: "قريباً", minutes: "دقيقة", start: "ابدأ المحاكاة", view: "عرض المحاكاة", skills: "المهارات التي ستظهرها" },
    detail: { back: "العودة إلى الكتالوج", workplace: "محاكاة بيئة العمل", start: "ابدأ المحاكاة", signInToStart: "سجّل الدخول للبدء", tasks: "خمس مهام عمل مترابطة", briefing: "ملخصك", skills: "المهارات التي ستكتسبها", time: "الوقت المتوقع", difficulty: "المستوى", company: "شركة خيالية" },
    common: { loading: "جارٍ التحميل…", error: "حدث خطأ. يرجى المحاولة مرة أخرى.", english: "English", arabic: "العربية", beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
  },
} as const;

type Copy = (typeof copy)[Language];
type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Copy;
  text: (value: LocalizedText) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem("careersim-language") === "ar" ? "ar" : "en"));
  useEffect(() => {
    localStorage.setItem("careersim-language", language);
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const value = useMemo<LanguageContextValue>(() => ({ language, setLanguage, t: copy[language] as unknown as Copy, text: (content: LocalizedText) => content[language] }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
