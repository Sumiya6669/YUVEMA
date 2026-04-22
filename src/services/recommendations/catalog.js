export const routineSteps = {
  cleanser: {
    label: "Очищение",
    keywords: ["очищ", "clean", "foam", "gel", "пенка", "гель", "cleansing"],
  },
  toner: {
    label: "Тонизация",
    keywords: ["toner", "tonic", "тоник", "mist", "essence", "эссенц"],
  },
  serum: {
    label: "Сыворотка",
    keywords: ["serum", "сыворот", "ampoule", "ампул", "booster"],
  },
  cream: {
    label: "Крем",
    keywords: ["cream", "крем", "emulsion", "эмульс", "balm", "бальзам"],
  },
  sunscreen: {
    label: "Защита",
    keywords: ["spf", "sun", "uv", "солнц", "защит"],
  },
};

const goalWeights = {
  Увлажнение: ["увлаж", "hydrat", "moist"],
  "Антивозрастной уход": ["anti-age", "age", "морщ", "лифт", "firm", "repair"],
  Очищение: ["очищ", "clean", "purify"],
  "Выравнивание тона": ["тон", "bright", "pigment", "сиян", "tone"],
  "Защита от солнца": ["spf", "sun", "uv"],
  "Полный уход": ["care", "routine", "daily", "balanced"],
};

const concernKeywords = {
  Акне: ["acne", "acneic", "blemish", "breakout", "акне", "воспал"],
  Сухость: ["dry", "dehydr", "сух", "увлаж"],
  Пигментация: ["pigment", "tone", "dark spot", "пигмент", "тон"],
  Морщины: ["wrinkle", "firm", "age", "морщ", "лифт"],
  Покраснения: ["redness", "sensitive", "calm", "покрас", "успок"],
  "Расширенные поры": ["pores", "seb", "поры", "матир"],
  "Тусклый тон": ["glow", "radiance", "bright", "сиян", "туск"],
};

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function buildSearchText(product) {
  return normalizeText(
    [
      product.name,
      product.brand,
      product.category,
      product.subcategory,
      product.short_description,
      product.description,
      product.effects,
      product.composition,
      product.skin_types?.join(" "),
      product.skin_problems?.join(" "),
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function keywordScore(text, keywords = []) {
  return keywords.reduce(
    (score, keyword) => score + (text.includes(normalizeText(keyword)) ? 1 : 0),
    0,
  );
}

export function scoreQueryProduct(product, query = "", options = {}) {
  const text = buildSearchText(product);
  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(" ").filter((token) => token.length > 2);
  let score = 0;

  if (!product?.in_stock) {
    score -= 8;
  }

  if (options.preferredIds?.includes(product.id)) {
    score += 10;
  }

  if (options.excludedIds?.includes(product.id)) {
    score -= 20;
  }

  for (const token of queryTokens) {
    if (text.includes(token)) {
      score += token.length > 4 ? 3 : 2;
    }

    if (normalizeText(product.name).includes(token)) {
      score += 3;
    }

    if (normalizeText(product.brand).includes(token)) {
      score += 2;
    }
  }

  if (product.featured) {
    score += 1.5;
  }

  if (product.bestseller) {
    score += 1.5;
  }

  if (options.requiredCategory && product.category === options.requiredCategory) {
    score += 3;
  }

  return score;
}

export function findRelevantProducts(products = [], query = "", options = {}) {
  return products
    .map((product) => ({
      product,
      score: scoreQueryProduct(product, query, options),
    }))
    .filter((entry) => entry.score > -10)
    .sort((left, right) => right.score - left.score)
    .slice(0, options.limit || 6)
    .map((entry) => entry.product);
}

function scoreRoutineProduct(product, profile, stepKey) {
  const text = buildSearchText(product);
  let score = 0;

  if (!product?.in_stock) {
    return -100;
  }

  if (profile.skinType && product.skin_types?.includes(profile.skinType)) {
    score += 5;
  }

  if (profile.skinType === "Не знаю") {
    score += 2;
  }

  score += (profile.concerns || []).reduce(
    (total, concern) =>
      total + (product.skin_problems?.includes(concern) ? 4 : keywordScore(text, concernKeywords[concern]) * 2),
    0,
  );

  score += keywordScore(text, goalWeights[profile.goal] || []) * 2;
  score += keywordScore(text, routineSteps[stepKey]?.keywords || []) * 4;
  score += product.featured ? 1 : 0;
  score += product.bestseller ? 1 : 0;

  return score;
}

function buildReason(product, profile) {
  const reasons = [];

  if (product.skin_types?.includes(profile.skinType)) {
    reasons.push(`подходит для типа кожи «${profile.skinType.toLowerCase()}»`);
  }

  const matchingConcerns = (profile.concerns || []).filter((concern) =>
    product.skin_problems?.includes(concern),
  );

  if (matchingConcerns.length) {
    reasons.push(`работает с задачами: ${matchingConcerns.join(", ").toLowerCase()}`);
  }

  if (product.effects) {
    reasons.push(product.effects.toLowerCase());
  }

  return reasons.length
    ? reasons.join("; ")
    : "закрывает базовые задачи в ежедневной рутине";
}

export function buildRoutinePlan(profile, products = []) {
  const normalizedProfile = {
    skinType: profile.skinType || "Не знаю",
    concerns: profile.concerns || [],
    goal: profile.goal || "Полный уход",
  };

  const usedIds = new Set();
  const steps = [];

  for (const stepKey of Object.keys(routineSteps)) {
    const match = products
      .filter((product) => !usedIds.has(product.id))
      .map((product) => ({
        product,
        score: scoreRoutineProduct(product, normalizedProfile, stepKey),
      }))
      .sort((left, right) => right.score - left.score)
      .find((entry) => entry.score > -100);

    if (!match) {
      continue;
    }

    usedIds.add(match.product.id);
    steps.push({
      key: stepKey,
      label: routineSteps[stepKey].label,
      product: match.product,
      reason: buildReason(match.product, normalizedProfile),
    });
  }

  return {
    profile: normalizedProfile,
    steps,
    productIds: steps.map((entry) => entry.product.id),
  };
}

export function buildRoutineFallback(profile, products = []) {
  const plan = buildRoutinePlan(profile, products);

  const markdown = [
    "### Диагностика кожи",
    `- Тип кожи: ${plan.profile.skinType || "не указан"}`,
    `- Основные задачи: ${
      plan.profile.concerns.length ? plan.profile.concerns.join(", ") : "базовый уход"
    }`,
    `- Цель: ${plan.profile.goal || "ежедневная поддержка кожи"}`,
    "",
    "### Рекомендованная схема ухода",
    ...plan.steps.map(
      ({ label, product, reason }) =>
        `**${label}**\n- ${product.brand} ${product.name}\n- Почему: ${reason}.`,
    ),
    "",
    "### Как использовать",
    "Утром используйте очищение, тонизацию, сыворотку, крем и SPF. Вечером повторяйте рутину без SPF и отслеживайте реакцию кожи в течение 2–3 недель.",
  ].join("\n");

  return {
    markdown,
    productIds: plan.productIds,
    steps: plan.steps,
  };
}
