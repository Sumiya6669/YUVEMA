import { createClient } from "@supabase/supabase-js";

const PRODUCT_FIELDS = [
  "id",
  "slug",
  "name",
  "name_ru",
  "brand",
  "category",
  "subcategory",
  "description",
  "short_description",
  "composition",
  "effects",
  "skin_types",
  "skin_problems",
  "price",
  "wholesale_price",
  "volume",
  "image_url",
  "gallery",
  "in_stock",
  "featured",
  "new_arrival",
  "bestseller",
  "usage_instructions",
  "country_of_origin",
  "created_at",
  "updated_at",
].join(", ");

const BOOLEAN_FIELDS = new Set([
  "in_stock",
  "featured",
  "new_arrival",
  "bestseller",
]);
const ARRAY_FIELDS = new Set(["skin_types", "skin_problems", "gallery"]);
const NUMERIC_FIELDS = new Set(["price", "wholesale_price"]);
const ALLOWED_FIELDS = new Set([
  "slug",
  "name",
  "name_ru",
  "brand",
  "category",
  "subcategory",
  "description",
  "short_description",
  "composition",
  "effects",
  "skin_types",
  "skin_problems",
  "price",
  "wholesale_price",
  "volume",
  "image_url",
  "gallery",
  "in_stock",
  "featured",
  "new_arrival",
  "bestseller",
  "usage_instructions",
  "country_of_origin",
]);

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

function createAnonClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function createAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function getRequestUrl(request) {
  return new URL(request.url || "/api/products", "http://localhost");
}

function normalizeOrderField(orderBy = "-created_date") {
  const descending = orderBy.startsWith("-");
  const field = descending ? orderBy.slice(1) : orderBy;
  const mappedField =
    field === "created_date" ? "created_at" : field === "updated_date" ? "updated_at" : field;

  return {
    field: mappedField,
    ascending: !descending,
  };
}

function parseLimit(value, fallback = 100) {
  const parsed = Number.parseInt(String(value || fallback), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 500);
}

function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
}

function normalizeString(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

function sanitizePayload(payload = {}) {
  return Object.entries(payload).reduce((result, [key, value]) => {
    if (!ALLOWED_FIELDS.has(key) || value === undefined) {
      return result;
    }

    if (ARRAY_FIELDS.has(key)) {
      result[key] = Array.isArray(value)
        ? value.map((item) => String(item).trim()).filter(Boolean)
        : String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
      return result;
    }

    if (BOOLEAN_FIELDS.has(key)) {
      result[key] = Boolean(value);
      return result;
    }

    if (NUMERIC_FIELDS.has(key)) {
      if (value === null || value === "") {
        result[key] = null;
        return result;
      }

      const amount = Number(value);
      if (Number.isFinite(amount)) {
        result[key] = amount;
      }
      return result;
    }

    result[key] = typeof value === "string" ? value.trim() : value;
    return result;
  }, {});
}

function validateProductPayload(payload, isCreate = false) {
  if (isCreate) {
    if (!normalizeString(payload.name)) {
      return "Укажите название товара";
    }

    if (!normalizeString(payload.brand)) {
      return "Укажите бренд";
    }

    if (!normalizeString(payload.category)) {
      return "Укажите категорию";
    }
  }

  if (payload.price !== undefined && payload.price !== null && !Number.isFinite(payload.price)) {
    return "Цена должна быть числом";
  }

  if (
    payload.wholesale_price !== undefined &&
    payload.wholesale_price !== null &&
    !Number.isFinite(payload.wholesale_price)
  ) {
    return "B2B цена должна быть числом";
  }

  return null;
}

function applyProductFilters(query, searchParams) {
  for (const [key, rawValue] of searchParams.entries()) {
    if (key === "orderBy" || key === "limit" || rawValue === "") {
      continue;
    }

    if (ARRAY_FIELDS.has(key)) {
      const items = rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      if (items.length > 0) {
        query = query.contains(key, items);
      }

      continue;
    }

    if (BOOLEAN_FIELDS.has(key)) {
      query = query.eq(key, parseBoolean(rawValue));
      continue;
    }

    query = query.eq(key, rawValue);
  }

  return query;
}

async function requireAdmin(request) {
  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return { status: 401, error: "Требуется авторизация администратора" };
  }

  const anonClient = createAnonClient();
  const adminClient = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await anonClient.auth.getUser(token);

  if (userError || !user) {
    return { status: 401, error: "Сессия администратора недействительна" };
  }

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { status: 500, error: profileError.message || "Не удалось проверить роль" };
  }

  if (profile?.role !== "admin") {
    return { status: 403, error: "Доступ к товарам разрешён только администратору" };
  }

  return { adminClient, user };
}

async function handleGet(request, response) {
  const adminClient = createAdminClient();
  const requestUrl = getRequestUrl(request);
  const order = normalizeOrderField(requestUrl.searchParams.get("orderBy") || "-created_date");
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 100);

  let query = adminClient.from("products").select(PRODUCT_FIELDS);
  query = applyProductFilters(query, requestUrl.searchParams);
  query = query.order(order.field, { ascending: order.ascending });
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось загрузить товары",
    });
  }

  return sendJson(response, 200, {
    products: data || [],
  });
}

async function handlePost(request, response) {
  const access = await requireAdmin(request);

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const body = await readBody(request);
  const payload = sanitizePayload(body);
  const validationError = validateProductPayload(payload, true);

  if (validationError) {
    return sendJson(response, 400, { error: validationError });
  }

  const { data, error } = await access.adminClient
    .from("products")
    .insert(payload)
    .select(PRODUCT_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось создать товар",
    });
  }

  return sendJson(response, 201, { product: data });
}

async function handlePatch(request, response) {
  const access = await requireAdmin(request);

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const body = await readBody(request);
  const id = normalizeString(body.id);

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор товара" });
  }

  const payload = sanitizePayload(body);
  delete payload.id;

  const validationError = validateProductPayload(payload, false);
  if (validationError) {
    return sendJson(response, 400, { error: validationError });
  }

  if (Object.keys(payload).length === 0) {
    return sendJson(response, 400, { error: "Нет данных для обновления" });
  }

  const { data, error } = await access.adminClient
    .from("products")
    .update(payload)
    .eq("id", id)
    .select(PRODUCT_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обновить товар",
    });
  }

  return sendJson(response, 200, { product: data });
}

async function handleDelete(request, response) {
  const access = await requireAdmin(request);

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const requestUrl = getRequestUrl(request);
  const id = normalizeString(requestUrl.searchParams.get("id"));

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор товара" });
  }

  const { error } = await access.adminClient.from("products").delete().eq("id", id);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось удалить товар",
    });
  }

  return sendJson(response, 200, { success: true });
}

export default async function handler(request, response) {
  if (
    !process.env.VITE_SUPABASE_URL ||
    !process.env.VITE_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return sendJson(response, 500, { error: "Supabase env is not configured" });
  }

  try {
    if (request.method === "GET") {
      return await handleGet(request, response);
    }

    if (request.method === "POST") {
      return await handlePost(request, response);
    }

    if (request.method === "PATCH") {
      return await handlePatch(request, response);
    }

    if (request.method === "DELETE") {
      return await handleDelete(request, response);
    }

    response.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обработать запрос по товарам",
    });
  }
}
