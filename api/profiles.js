import {
  getRequestUrl,
  isSupabaseServerConfigured,
  normalizeOrderField,
  normalizeString,
  parseBoolean,
  parseLimit,
  readBody,
  requireAdmin,
  sendJson,
} from "./_lib/supabase.js";

const PROFILE_FIELDS = [
  "id",
  "email",
  "full_name",
  "role",
  "company_name",
  "company_bin",
  "city",
  "phone",
  "wholesale_approved",
  "created_at",
  "updated_at",
].join(", ");

function applyProfileFilters(query, searchParams) {
  for (const [key, value] of searchParams.entries()) {
    if (key === "orderBy" || key === "limit" || value === "") {
      continue;
    }

    if (key === "wholesale_approved") {
      query = query.eq(key, parseBoolean(value));
      continue;
    }

    query = query.eq(key, value);
  }

  return query;
}

async function handleGet(request, response) {
  const access = await requireAdmin(request, "Доступ к профилям разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const requestUrl = getRequestUrl(request, "/api/profiles");
  const order = normalizeOrderField(requestUrl.searchParams.get("orderBy") || "-created_date");
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 100);
  let query = access.adminClient.from("profiles").select(PROFILE_FIELDS);
  query = applyProfileFilters(query, requestUrl.searchParams);

  const { data, error } = await query
    .order(order.field, { ascending: order.ascending })
    .limit(limit);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось загрузить профили",
    });
  }

  return sendJson(response, 200, { profiles: data || [] });
}

async function handlePatch(request, response) {
  const access = await requireAdmin(request, "Доступ к профилям разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const body = await readBody(request);
  const id = normalizeString(body.id);

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор профиля" });
  }

  const payload = {};
  [
    "full_name",
    "role",
    "company_name",
    "company_bin",
    "city",
    "phone",
    "wholesale_approved",
  ].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  if (Object.keys(payload).length === 0) {
    return sendJson(response, 400, { error: "Нет данных для обновления" });
  }

  const { data, error } = await access.adminClient
    .from("profiles")
    .update(payload)
    .eq("id", id)
    .select(PROFILE_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обновить профиль",
    });
  }

  return sendJson(response, 200, { profile: data });
}

export default async function handler(request, response) {
  if (!isSupabaseServerConfigured()) {
    return sendJson(response, 500, { error: "Supabase env is not configured" });
  }

  try {
    if (request.method === "GET") {
      return await handleGet(request, response);
    }

    if (request.method === "PATCH") {
      return await handlePatch(request, response);
    }

    response.setHeader("Allow", "GET, PATCH");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обработать профили",
    });
  }
}
