export type EducationLevel = "high_school" | "university" | "graduate" | "other";
export type AcademicYear = "year_1" | "year_2" | "year_3" | "year_4" | "year_5" | "final_year" | "other" | null;
export type RoutingLevel = "explorer" | "intern" | "advanced_intern" | "junior_professional";

export type LocalizedText = { en: string; ar: string };

export type CareerFamily = {
  key: string;
  label: LocalizedText;
  explorer: LocalizedText;
  intern: LocalizedText;
  advancedIntern: LocalizedText;
  junior: LocalizedText;
  aliases: string[];
  interestAliases: string[];
  availableSimulationSlugs: string[];
  skills: string[];
};

export type RoutingInput = {
  educationLevel: EducationLevel;
  major?: string | null;
  careerInterests?: string[];
  academicYear?: AcademicYear;
  assessmentScore?: number | null;
  completedSimulationSlugs?: string[];
  averageCompletedScore?: number | null;
};

export type RoutingDecision = {
  career: CareerFamily;
  level: RoutingLevel;
  experience: LocalizedText;
  reason: LocalizedText;
  isExploration: boolean;
  recommendedSimulationSlug: string | null;
  recommendedSimulationAvailable: boolean;
  needsSkillCheck: boolean;
};

export const careerFamilies: CareerFamily[] = [
  {
    key: "engineering", label: { en: "Engineering", ar: "الهندسة" }, explorer: { en: "Engineering Explorer", ar: "مستكشف الهندسة" }, intern: { en: "Engineering Intern", ar: "متدرب هندسة" }, advancedIntern: { en: "Advanced Engineering Intern", ar: "متدرب هندسة متقدم" }, junior: { en: "Junior Civil Engineer", ar: "مهندس مدني مبتدئ" },
    aliases: ["civil engineering", "mechanical engineering", "electrical engineering", "engineering", "architecture", "construction"], interestAliases: ["engineering"], availableSimulationSlugs: [], skills: ["Problem Solving", "Technical Understanding", "Decision Making"],
  },
  {
    key: "technology", label: { en: "Technology", ar: "التقنية" }, explorer: { en: "Technology Explorer", ar: "مستكشف التقنية" }, intern: { en: "Technology Intern", ar: "متدرب تقنية" }, advancedIntern: { en: "Advanced Technology Intern", ar: "متدرب تقنية متقدم" }, junior: { en: "Junior Data Analyst", ar: "محلل بيانات مبتدئ" },
    aliases: ["computer science", "information technology", "information systems", "software", "data science", "data analytics", "technology"], interestAliases: ["technology", "data analysis", "business intelligence"], availableSimulationSlugs: ["junior-data-analyst-gulf-retail-group"], skills: ["Data Analysis", "Problem Solving", "Business Thinking"],
  },
  {
    key: "business", label: { en: "Business", ar: "الأعمال" }, explorer: { en: "Business Explorer", ar: "مستكشف الأعمال" }, intern: { en: "Business Intern", ar: "متدرب أعمال" }, advancedIntern: { en: "Advanced Business Intern", ar: "متدرب أعمال متقدم" }, junior: { en: "Junior Business Analyst", ar: "محلل أعمال مبتدئ" },
    aliases: ["business", "business administration", "management", "accounting", "marketing", "economics"], interestAliases: ["business", "finance", "marketing"], availableSimulationSlugs: ["business-analyst-gulf-growth-partners"], skills: ["Business Analysis", "Stakeholder Management", "Decision Making"],
  },
  {
    key: "medicine", label: { en: "Medicine", ar: "الطب" }, explorer: { en: "Medicine Explorer", ar: "مستكشف الطب" }, intern: { en: "Clinical Foundations Intern", ar: "متدرب أساسيات سريرية" }, advancedIntern: { en: "Advanced Clinical Intern", ar: "متدرب سريري متقدم" }, junior: { en: "Junior Clinical Professional", ar: "ممارس سريري مبتدئ" },
    aliases: ["medicine", "pharmacy", "nursing", "health"], interestAliases: ["medicine", "health"], availableSimulationSlugs: [], skills: ["Scientific Reasoning", "Ethical Decision Making", "Communication"],
  },
  {
    key: "chemistry", label: { en: "Chemistry", ar: "الكيمياء" }, explorer: { en: "Chemistry Explorer", ar: "مستكشف الكيمياء" }, intern: { en: "Laboratory Intern", ar: "متدرب مختبر" }, advancedIntern: { en: "Advanced Laboratory Intern", ar: "متدرب مختبر متقدم" }, junior: { en: "Junior Laboratory Professional", ar: "أخصائي مختبر مبتدئ" },
    aliases: ["chemistry", "chemical"], interestAliases: ["chemistry", "science"], availableSimulationSlugs: [], skills: ["Scientific Reasoning", "Quality Control", "Documentation"],
  },
  {
    key: "design", label: { en: "Graphic Design", ar: "التصميم الجرافيكي" }, explorer: { en: "Design Explorer", ar: "مستكشف التصميم" }, intern: { en: "Design Intern", ar: "متدرب تصميم" }, advancedIntern: { en: "Advanced Design Intern", ar: "متدرب تصميم متقدم" }, junior: { en: "Junior Graphic Designer", ar: "مصمم جرافيك مبتدئ" },
    aliases: ["graphic design", "design", "visual communication"], interestAliases: ["graphic design", "design"], availableSimulationSlugs: [], skills: ["Creative Strategy", "Communication", "Decision Making"],
  },
];

const generalCareer: CareerFamily = {
  key: "general", label: { en: "Career Exploration", ar: "استكشاف المسار المهني" }, explorer: { en: "Career Explorer", ar: "مستكشف المسارات المهنية" }, intern: { en: "Foundations Intern", ar: "متدرب الأساسيات" }, advancedIntern: { en: "Advanced Foundations Intern", ar: "متدرب أساسيات متقدم" }, junior: { en: "Junior Professional", ar: "محترف مبتدئ" },
  aliases: [], interestAliases: [], availableSimulationSlugs: [], skills: ["Problem Solving", "Communication", "Decision Making"],
};

function normalized(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

export function identifyCareerFamily(major?: string | null, interests: string[] = []): CareerFamily {
  const majorValue = normalized(major);
  const interestValues = interests.map(normalized);
  return careerFamilies.find(career => career.aliases.some(alias => majorValue.includes(alias)))
    ?? careerFamilies.find(career => career.interestAliases.some(alias => interestValues.some(interest => interest.includes(alias))))
    ?? generalCareer;
}

function hasRelevantCompletion(career: CareerFamily, completedSimulationSlugs: string[] = []) {
  return career.availableSimulationSlugs.some(slug => completedSimulationSlugs.includes(slug));
}

function experienceForLevel(career: CareerFamily, level: RoutingLevel) {
  if (level === "explorer") return career.explorer;
  if (level === "intern") return career.intern;
  if (level === "advanced_intern") return career.advancedIntern;
  return career.junior;
}

export function calculateRoutingDecision(input: RoutingInput): RoutingDecision {
  const career = identifyCareerFamily(input.major, input.careerInterests);
  const assessment = input.assessmentScore ?? null;
  const completedRelevant = hasRelevantCompletion(career, input.completedSimulationSlugs);
  const strongEvidence = completedRelevant && (input.averageCompletedScore ?? 0) >= 70;
  let level: RoutingLevel = "explorer";
  let needsSkillCheck = false;

  if (input.educationLevel === "graduate") {
    level = "junior_professional";
  } else if (input.educationLevel === "university") {
    if (input.academicYear === "year_1" || !input.academicYear || input.academicYear === "other") {
      level = "explorer";
    } else if (input.academicYear === "year_2") {
      level = "intern";
    } else {
      needsSkillCheck = !strongEvidence && assessment === null;
      if (strongEvidence || (assessment !== null && assessment >= 80)) level = "advanced_intern";
      else level = "intern";
    }
  }

  const isExploration = level === "explorer" || input.educationLevel === "high_school" || input.educationLevel === "other";
  const recommendedSimulationSlug = isExploration ? null : career.availableSimulationSlugs[0] ?? null;
  const recommendedSimulationAvailable = Boolean(recommendedSimulationSlug);
  const reason: LocalizedText = isExploration
    ? { en: "We are starting with exploration so you can build confidence before a professional simulation.", ar: "سنبدأ بالاستكشاف لتبني ثقتك قبل الدخول إلى محاكاة مهنية." }
    : { en: "This starting point reflects your education stage, field, and current evidence of readiness—not your year alone.", ar: "تعكس نقطة البداية هذه مرحلتك التعليمية ومجالك وأدلة جاهزيتك الحالية، وليس سنتك الدراسية وحدها." };

  return { career, level: isExploration ? "explorer" : level, experience: experienceForLevel(career, isExploration ? "explorer" : level), reason, isExploration, recommendedSimulationSlug, recommendedSimulationAvailable, needsSkillCheck };
}

export const academicYearOptions: Array<{ value: Exclude<AcademicYear, null>; label: LocalizedText }> = [
  { value: "year_1", label: { en: "1st Year", ar: "السنة الأولى" } },
  { value: "year_2", label: { en: "2nd Year", ar: "السنة الثانية" } },
  { value: "year_3", label: { en: "3rd Year", ar: "السنة الثالثة" } },
  { value: "year_4", label: { en: "4th Year", ar: "السنة الرابعة" } },
  { value: "year_5", label: { en: "5th Year", ar: "السنة الخامسة" } },
  { value: "final_year", label: { en: "Graduate / Final Year", ar: "سنة التخرج" } },
  { value: "other", label: { en: "Other", ar: "أخرى" } },
];
