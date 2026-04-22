import { buildRoutineFallback, buildRoutinePlan } from "@/services/recommendations/catalog";

export function buildRecommendation(answers, products = []) {
  const profile = {
    skinType: answers[0],
    concerns: answers[1] ? answers[1].split(", ").filter(Boolean) : [],
    goal: answers[2],
  };

  const fallback = buildRoutineFallback(profile, products);

  return {
    routine: fallback.markdown,
    productIds: fallback.productIds,
    steps: fallback.steps,
  };
}

export function buildRecommendationPlan(profile, products = []) {
  return buildRoutinePlan(profile, products);
}
