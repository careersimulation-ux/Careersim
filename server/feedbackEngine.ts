import { invokeLLM, listLLMModels } from "./_core/llm";

export type FeedbackPayload = {
  score: number;
  taskEvidence: string[];
  finalRecommendation: string;
  locale: "en" | "ar";
};

export type FeedbackResult = {
  strengths: string[];
  improvements: string[];
  summary: string;
};

function fallbackFeedback(payload: FeedbackPayload): FeedbackResult {
  const highScore = payload.score >= 75;
  const language = payload.locale === "ar" ? "ar" : "en";
  if (language === "ar") {
    return {
      strengths: highScore
        ? ["ربطت انخفاض الإيرادات بانخفاض حركة العملاء وأشرت إلى الأدلة ذات الصلة.", "اخترت توصية تركز على استعادة الوصول للحملة المحلية."]
        : ["أنجزت دورة التحقيق وقدّمت استجابة للإدارة."],
      improvements: highScore
        ? ["زد دقة التوصية بذكر مقياس نجاح واضح مثل زيارات المتجر أو التحويلات المنسوبة للحملة."]
        : ["اربط البيانات التشغيلية وأدلة التسويق وملاحظات العملاء بشكل أوضح قبل اتخاذ القرار."],
      summary: `أكملت محاكاة محلل البيانات المبتدئ بنتيجة ${payload.score} من 100. يعتمد هذا التقييم على اختياراتك وأدلتك المسجلة خلال المحاكاة.`,
    };
  }
  return {
    strengths: highScore
      ? ["You connected revenue decline to lower customer traffic and referenced relevant evidence.", "You chose an action focused on restoring the local campaign's reach."]
      : ["You completed the investigation flow and provided a management response."],
    improvements: highScore
      ? ["Make the recommendation more measurable by naming a success metric such as store visits or campaign-attributed conversions."]
      : ["Link the operational data, marketing evidence, and customer feedback more explicitly before making the decision."],
    summary: `You completed the Junior Data Analyst simulation with ${payload.score} out of 100. This feedback reflects the decisions and evidence captured in your simulation work.`,
  };
}

export async function generateFeedback(payload: FeedbackPayload): Promise<FeedbackResult> {
  const fallback = fallbackFeedback(payload);
  try {
    const models = await listLLMModels();
    const model = models.data.find(candidate => candidate.id === "gpt-5-mini")?.id ?? models.data[0]?.id;
    if (!model) return fallback;

    const response = await invokeLLM({
      model,
      messages: [
        {
          role: "system",
          content: "You are a precise early-career assessor. Use only the supplied scoring evidence; do not invent performance details, do not change numeric scores, and produce constructive feedback in the requested language.",
        },
        {
          role: "user",
          content: JSON.stringify({
            requestedLanguage: payload.locale,
            overallScore: payload.score,
            taskEvidence: payload.taskEvidence,
            finalRecommendation: payload.finalRecommendation,
            requiredOutput: "Two concise strengths, two concise improvement areas, and one 2–3 sentence summary grounded in the supplied evidence.",
          }),
        },
      ],
      outputSchema: {
        name: "simulation_feedback",
        strict: true,
        schema: {
          type: "object",
          properties: {
            strengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
            improvements: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 2 },
            summary: { type: "string" },
          },
          required: ["strengths", "improvements", "summary"],
          additionalProperties: false,
        },
      },
      maxTokens: 500,
    });
    const content = response.choices[0]?.message.content;
    if (typeof content !== "string") return fallback;
    const parsed = JSON.parse(content) as FeedbackResult;
    if (!Array.isArray(parsed.strengths) || !Array.isArray(parsed.improvements) || typeof parsed.summary !== "string") return fallback;
    return parsed;
  } catch (error) {
    console.warn("[CareerSim] AI feedback fallback", error instanceof Error ? error.message : error);
    return fallback;
  }
}
