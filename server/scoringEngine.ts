import type { SimulationTaskConfig, TaskScore } from "@shared/simulation/types";

const conceptAliases: Record<string, string[]> = {
  riyadh: ["riyadh", "الرياض"],
  customer: ["customer", "customers", "client", "العميل", "العملاء"],
  traffic: ["traffic", "visits", "visit", "footfall", "حركة", "زيارات", "الزيارات"],
  marketing: ["marketing", "campaign", "reach", "تسويق", "الحملة", "الوصول"],
  campaign: ["campaign", "marketing", "حملة", "التسويق"],
  targeted: ["targeted", "local", "focused", "مستهدفة", "محلية"],
  activation: ["activation", "event", "in-store", "فعالية", "تنشيط"],
};

function responseText(response: Record<string, unknown>) {
  return Object.values(response)
    .flatMap(value => (Array.isArray(value) ? value : [value]))
    .filter(value => typeof value === "string")
    .join(" ")
    .toLowerCase();
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function responseIncludes(response: Record<string, unknown>, expected: string) {
  return Object.values(response).some(value => value === expected || (Array.isArray(value) && value.includes(expected)));
}

function supportedConcepts(text: string, concepts: string[]) {
  return concepts.filter(concept => (conceptAliases[concept] ?? [concept]).some(alias => text.includes(alias)));
}

export function scoreTaskResponse({
  task,
  response,
  hintLevel,
}: {
  task: SimulationTaskConfig;
  response: Record<string, unknown>;
  hintLevel: number;
}): TaskScore {
  const text = responseText(response);
  const rawCriteria = task.rubric.criteria.map(criterion => {
    const evaluation = criterion.evaluation ?? {};
    let awarded = 0;
    let note = "The criterion needs stronger supporting evidence.";

    if (typeof evaluation.expected === "string") {
      if (responseIncludes(response, evaluation.expected)) {
        awarded = criterion.maxPoints;
        note = "The selected response matches the expected evidence-led conclusion.";
      }
    } else if (Array.isArray(evaluation.expected)) {
      const matches = evaluation.expected.filter(item => responseIncludes(response, String(item))).length;
      awarded = Math.round((matches / evaluation.expected.length) * criterion.maxPoints);
      note = matches === evaluation.expected.length
        ? "All required evidence sources were selected."
        : "Some relevant evidence sources are still missing.";
    } else if (Array.isArray(evaluation.keywords)) {
      const matches = evaluation.keywords.filter(keyword => text.includes(String(keyword).toLowerCase())).length;
      awarded = Math.round((matches / evaluation.keywords.length) * criterion.maxPoints);
      note = matches >= Math.ceil(evaluation.keywords.length / 2)
        ? "The explanation includes relevant evidence terms."
        : "Make the link between the evidence and your conclusion more explicit.";
    } else if (Array.isArray(evaluation.requiredConcepts)) {
      const matches = supportedConcepts(text, evaluation.requiredConcepts.map(String));
      awarded = Math.round((matches.length / evaluation.requiredConcepts.length) * criterion.maxPoints);
      note = matches.length === evaluation.requiredConcepts.length
        ? "The response covers the core business concepts."
        : `Strengthen the response by addressing: ${evaluation.requiredConcepts.filter(concept => !matches.includes(String(concept))).join(", ")}.`;
    } else if (typeof evaluation.minWords === "number") {
      const words = wordCount(text);
      awarded = words >= evaluation.minWords ? criterion.maxPoints : Math.round((words / evaluation.minWords) * criterion.maxPoints);
      note = words >= evaluation.minWords
        ? "The response meets the requested level of detail."
        : "Add more detail so management can understand your reasoning.";
    }

    return { id: criterion.id, awarded: Math.min(criterion.maxPoints, awarded), maxPoints: criterion.maxPoints, note };
  });

  const rawScore = rawCriteria.reduce((total, criterion) => total + criterion.awarded, 0);
  const hintCap = Math.max(0.8, 1 - Math.min(3, Math.max(0, hintLevel)) * 0.05);
  const score = Math.min(task.rubric.maxPoints, Math.floor(rawScore * hintCap));
  const performance = task.rubric.maxPoints === 0 ? 0 : score / task.rubric.maxPoints;
  const skillScores = Object.fromEntries(
    Object.entries(task.rubric.skillWeights).map(([skill, weight]) => [skill, Math.round(performance * weight * 100)]),
  );

  return {
    score,
    maxScore: task.rubric.maxPoints,
    criteria: rawCriteria,
    skillScores,
    feedbackContext: rawCriteria.map(criterion => `${criterion.id}: ${criterion.note}`),
  };
}
