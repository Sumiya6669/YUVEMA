import { createClient } from "@supabase/supabase-js";
import {
  buildRoutineFallback,
  buildRoutinePlan,
  findRelevantProducts,
} from "../src/services/recommendations/catalog.js";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";
const PRODUCT_FIELDS = [
  "id",
  "name",
  "brand",
  "category",
  "subcategory",
  "short_description",
  "description",
  "effects",
  "skin_types",
  "skin_problems",
  "price",
  "wholesale_price",
  "volume",
  "image_url",
  "featured",
  "bestseller",
  "new_arrival",
  "in_stock",
].join(", ");

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const chunks = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
}

function createServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase server env is not configured");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getCatalogProducts() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_FIELDS)
    .order("featured", { ascending: false })
    .order("bestseller", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(120);

  if (error) {
    throw new Error(error.message || "Failed to load catalog products");
  }

  return data || [];
}

function ensureProducts(products, fallbackProducts) {
  if (products.length > 0) {
    return products;
  }

  return fallbackProducts.slice(0, 4);
}

function buildConsultationFallback(message, products) {
  const recommendedProducts = products.slice(0, 3);

  return {
    title: "Экспертная консультация YUVEMA",
    summary: "Подобрали продукты и объяснили логику выбора без лишнего шума.",
    responseMarkdown: [
      "### Что важно по вашему запросу",
      message
        ? `Мы ориентировались на запрос: **${message}**.`
        : "Мы собрали рекомендации по типовым задачам ухода и совместимости средств.",
      "",
      "### На что обратить внимание",
      "- Выбирайте средство не только по громкому активу, но и по состоянию кожи, чувствительности и текстуре.",
      "- В ежедневной схеме важно сочетать очищение, восстановление барьера и продукт под основную задачу.",
      "- Если в рутине есть активы, усиливайте её постепенно и не перегружайте кожу сразу несколькими агрессивными формулами.",
      "",
      recommendedProducts.length > 0 ? "### Что посмотреть в каталоге" : "### Следующий шаг",
      ...recommendedProducts.map(
        (product) =>
          `- **${product.brand} ${product.name}** — ${product.short_description || product.effects || "подходит для базового премиального ухода"}.`,
      ),
    ].join("\n"),
    highlights: [
      "Помогаем понять разницу между средствами",
      "Смотрим на задачу кожи, а не только на название продукта",
      "Рекомендуем позиции из реального каталога YUVEMA",
    ],
    suggestedQuestions: [
      "Что выбрать на утро и вечер?",
      "Какие средства можно сочетать вместе?",
      "Нужен ли мне дополнительный восстанавливающий крем?",
    ],
    recommendedProductIds: recommendedProducts.map((product) => product.id),
    ctaLabel: "Посмотреть рекомендованные средства",
  };
}

function buildSalesFallback(message, products) {
  const recommendedProducts = products.slice(0, 4);

  return {
    title: "Собираем более сильную корзину",
    summary: "Мягкий upsell и cross-sell с акцентом на ценность ухода, а не на навязчивую продажу.",
    responseMarkdown: [
      "### Логика предложения",
      message
        ? `Мы исходили из запроса: **${message}**.`
        : "Мы собрали набор так, чтобы клиент увидел не один товар, а завершённый результат ухода.",
      "",
      "### Как усиливать корзину правильно",
      "- Сначала выбирается главный продукт под ключевую задачу кожи.",
      "- Затем добавляется поддерживающий продукт: восстановление, увлажнение, защита или усиление результата.",
      "- Финальный шаг — показать понятную пользу набора и объяснить, зачем нужен каждый продукт.",
      "",
      "### Рекомендуемый набор",
      ...recommendedProducts.map(
        (product) =>
          `- **${product.brand} ${product.name}** — ${product.short_description || product.effects || "сильная позиция для продуманного ухода"}.`,
      ),
    ].join("\n"),
    highlights: [
      "Фокус на росте среднего чека через ценность",
      "AI подбирает продукты не хаотично, а как готовую систему ухода",
      "Подходит и для прямой продажи, и для B2B-консультации",
    ],
    suggestedQuestions: [
      "Собери набор до определённого бюджета",
      "Что добавить к сыворотке для завершённого ухода?",
      "Подбери набор для подарка с ощущением премиального бренда",
    ],
    recommendedProductIds: recommendedProducts.map((product) => product.id),
    ctaLabel: "Собрать набор",
  };
}

function buildRoutineResponse(profile, products) {
  const fallback = buildRoutineFallback(profile, products);

  return {
    title: "Персональная схема ухода",
    summary: "Собрали рутину под тип кожи, основные задачи и желаемый результат.",
    responseMarkdown: fallback.markdown,
    highlights: [
      `Тип кожи: ${profile.skinType || "не указан"}`,
      `Задачи: ${(profile.concerns || []).length ? profile.concerns.join(", ") : "базовый уход"}`,
      `Цель: ${profile.goal || "ежедневная поддержка кожи"}`,
    ],
    suggestedQuestions: [
      "Сделай версию рутины для чувствительной кожи",
      "Сократи уход до 3 шагов",
      "Подбери более насыщенный вечерний уход",
    ],
    recommendedProductIds: fallback.productIds,
    ctaLabel: "Посмотреть рутину",
  };
}

function formatProductList(products) {
  return products
    .map((product) => {
      const parts = [
        `[${product.id}]`,
        `${product.brand} ${product.name}`,
        product.category,
        product.short_description,
        product.effects,
        product.volume ? `объём: ${product.volume}` : null,
        product.skin_types?.length ? `типы кожи: ${product.skin_types.join(", ")}` : null,
        product.skin_problems?.length ? `задачи: ${product.skin_problems.join(", ")}` : null,
        product.price ? `цена: ${product.price}` : null,
      ];

      return `- ${parts.filter(Boolean).join(" | ")}`;
    })
    .join("\n");
}

function buildSystemPrompt(mode) {
  const modeRules = {
    consultation:
      "Помогай разобраться в различиях между средствами, активами и схемой ухода. Отвечай как умный бренд-консультант, без медицинских обещаний.",
    sales:
      "Помогай выбрать основной продукт и мягко усиливать корзину. Аргументируй через пользу, комфорт и логику ухода, а не через давление.",
    routine:
      "Собирай понятную персональную рутину на русском языке. Объясняй, зачем выбран каждый шаг, и формулируй ответ красиво и прикладно.",
  };

  return [
    "Ты — YUVEMA AI advisor, премиальный онлайн-консультант бренда уходовой косметики.",
    "Отвечай только на русском языке.",
    "Тон: уверенный, тёплый, экспертный, премиальный, но без пафоса.",
    "Не выдумывай продукты вне каталога и не советуй то, чего нет в списке.",
    "Не давай медицинских диагнозов и не обещай лечить заболевания кожи.",
    "Если информации не хватает, мягко предложи следующий уточняющий вопрос.",
    modeRules[mode],
  ].join(" ");
}

function buildUserPrompt({ mode, message, profile, candidateProducts, routinePlan }) {
  const profileBlock =
    mode === "routine"
      ? [
          `Тип кожи: ${profile.skinType || "не указан"}`,
          `Задачи: ${(profile.concerns || []).length ? profile.concerns.join(", ") : "не указаны"}`,
          `Цель: ${profile.goal || "не указана"}`,
        ].join("\n")
      : "";

  const routineBlock =
    mode === "routine"
      ? routinePlan.steps
          .map(
            (step) =>
              `- ${step.label}: ${step.product.brand} ${step.product.name} — ${step.reason}`,
          )
          .join("\n")
      : "";

  return [
    `Сценарий: ${mode}.`,
    message ? `Запрос клиента: ${message}` : "Запрос клиента: нет отдельного текста.",
    profileBlock ? `Профиль клиента:\n${profileBlock}` : null,
    candidateProducts.length > 0
      ? `Продукты, из которых можно рекомендовать:\n${formatProductList(candidateProducts)}`
      : "Каталог-кандидаты не найдены.",
    routineBlock ? `Черновик рутинного подбора:\n${routineBlock}` : null,
    "Верни строго JSON по схеме. recommendedProductIds должны содержать только id из списка продуктов-кандидатов.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function requestOpenAi(payload) {
  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(errorBody || "OpenAI request failed");
  }

  return response.json();
}

function getParsedMessageContent(completion) {
  const content = completion?.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return JSON.parse(content);
  }

  if (Array.isArray(content)) {
    const textChunk = content.find((item) => item.type === "text");

    if (textChunk?.text) {
      return JSON.parse(textChunk.text);
    }
  }

  throw new Error("OpenAI response did not contain structured content");
}

function normalizeAiResult(rawResult, fallbackResult, candidateProducts) {
  const fallbackIds = fallbackResult.recommendedProductIds || [];
  const requestedIds = Array.isArray(rawResult?.recommendedProductIds)
    ? rawResult.recommendedProductIds
    : fallbackIds;

  const recommendedProducts = candidateProducts.filter((product) =>
    requestedIds.includes(product.id),
  );

  return {
    title: rawResult?.title || fallbackResult.title,
    summary: rawResult?.summary || fallbackResult.summary,
    responseMarkdown: rawResult?.responseMarkdown || fallbackResult.responseMarkdown,
    highlights:
      Array.isArray(rawResult?.highlights) && rawResult.highlights.length > 0
        ? rawResult.highlights
        : fallbackResult.highlights,
    suggestedQuestions:
      Array.isArray(rawResult?.suggestedQuestions) && rawResult.suggestedQuestions.length > 0
        ? rawResult.suggestedQuestions
        : fallbackResult.suggestedQuestions,
    recommendedProductIds:
      recommendedProducts.length > 0
        ? recommendedProducts.map((product) => product.id)
        : fallbackIds,
    recommendedProducts:
      recommendedProducts.length > 0
        ? recommendedProducts
        : candidateProducts.filter((product) => fallbackIds.includes(product.id)),
    ctaLabel: rawResult?.ctaLabel || fallbackResult.ctaLabel,
  };
}

function buildModeContext(mode, body, products) {
  const fallbackProducts = products.filter((product) => product.featured || product.bestseller);
  const selectedProductIds = Array.isArray(body.selectedProductIds) ? body.selectedProductIds : [];
  const message = String(body.message || "").trim();

  if (mode === "routine") {
    const profile = {
      skinType: body.profile?.skinType || "Не знаю",
      concerns: Array.isArray(body.profile?.concerns) ? body.profile.concerns : [],
      goal: body.profile?.goal || "Полный уход",
    };

    const routinePlan = buildRoutinePlan(profile, products);
    const candidateProducts = ensureProducts(
      routinePlan.steps.map((step) => step.product),
      fallbackProducts,
    );
    const fallbackResult = buildRoutineResponse(profile, products);

    return { message, profile, routinePlan, candidateProducts, fallbackResult };
  }

  const relevantProducts = findRelevantProducts(products, message, {
    limit: mode === "sales" ? 8 : 6,
    preferredIds: selectedProductIds,
  });
  const candidateProducts = ensureProducts(relevantProducts, fallbackProducts);

  return {
    message,
    profile: null,
    routinePlan: null,
    candidateProducts,
    fallbackResult:
      mode === "sales"
        ? buildSalesFallback(message, candidateProducts)
        : buildConsultationFallback(message, candidateProducts),
  };
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  }

  try {
    const body = await readBody(request);
    const mode = body.mode;

    if (!["consultation", "sales", "routine"].includes(mode)) {
      return sendJson(response, 400, { error: "Некорректный AI-сценарий" });
    }

    const products = await getCatalogProducts();
    const context = buildModeContext(mode, body, products);
    let finalResult = {
      ...context.fallbackResult,
      recommendedProducts: context.candidateProducts.filter((product) =>
        context.fallbackResult.recommendedProductIds.includes(product.id),
      ),
    };
    let provider = "fallback";

    if (process.env.OPENAI_API_KEY) {
      try {
        const completion = await requestOpenAi({
          model: OPENAI_MODEL,
          temperature: 0.7,
          max_completion_tokens: 1200,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "yuvema_ai_response",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  title: { type: "string" },
                  summary: { type: "string" },
                  responseMarkdown: { type: "string" },
                  highlights: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 3,
                    maxItems: 4,
                  },
                  suggestedQuestions: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 2,
                    maxItems: 4,
                  },
                  recommendedProductIds: {
                    type: "array",
                    items: { type: "string" },
                  },
                  ctaLabel: { type: "string" },
                },
                required: [
                  "title",
                  "summary",
                  "responseMarkdown",
                  "highlights",
                  "suggestedQuestions",
                  "recommendedProductIds",
                  "ctaLabel",
                ],
              },
            },
          },
          messages: [
            {
              role: "system",
              content: buildSystemPrompt(mode),
            },
            {
              role: "user",
              content: buildUserPrompt({
                mode,
                message: context.message,
                profile: context.profile,
                candidateProducts: context.candidateProducts,
                routinePlan: context.routinePlan,
              }),
            },
          ],
        });

        finalResult = normalizeAiResult(
          getParsedMessageContent(completion),
          context.fallbackResult,
          context.candidateProducts,
        );
        provider = "openai";
      } catch (error) {
        console.error("AI assistant fallback:", error);
      }
    }

    return sendJson(response, 200, {
      mode,
      provider,
      ...finalResult,
    });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось выполнить AI-запрос",
    });
  }
}
