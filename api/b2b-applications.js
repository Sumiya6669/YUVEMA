import {
  createAdminClient,
  getRequestUrl,
  getUserProfile,
  isSupabaseServerConfigured,
  normalizeOrderField,
  normalizeString,
  parseLimit,
  readBody,
  requireAdmin,
  resolveUser,
  sendJson,
} from "./_lib/supabase.js";

const APPLICATION_FIELDS = [
  "id",
  "user_id",
  "company",
  "bin",
  "name",
  "email",
  "phone",
  "city",
  "message",
  "status",
  "created_at",
  "updated_at",
].join(", ");

function sanitizeApplicationPayload(body = {}) {
  const payload = {};
  ["company", "bin", "name", "email", "phone", "city", "message", "status"].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] =
        typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });

  return payload;
}

function applyApplicationFilters(query, searchParams) {
  for (const [key, value] of searchParams.entries()) {
    if (key === "orderBy" || key === "limit" || value === "") {
      continue;
    }

    query = query.eq(key, value);
  }

  return query;
}

async function handleGet(request, response) {
  const resolved = await resolveUser(request);

  if (resolved.error || !resolved.user) {
    return sendJson(response, resolved.status || 401, {
      error: resolved.error || "Требуется авторизация",
    });
  }

  const adminClient = createAdminClient();
  const profile = await getUserProfile(adminClient, resolved.user.id);
  const requestUrl = getRequestUrl(request, "/api/b2b-applications");
  const order = normalizeOrderField(requestUrl.searchParams.get("orderBy") || "-created_date");
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 100);
  let query = adminClient.from("b2b_applications").select(APPLICATION_FIELDS);

  if (profile?.role === "admin") {
    query = applyApplicationFilters(query, requestUrl.searchParams);
  } else {
    query = query.or(
      `user_id.eq.${resolved.user.id},email.eq.${resolved.user.email}`,
    );
  }

  const { data, error } = await query
    .order(order.field, { ascending: order.ascending })
    .limit(limit);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось загрузить B2B-заявки",
    });
  }

  return sendJson(response, 200, { applications: data || [] });
}

async function handlePost(request, response) {
  const adminClient = createAdminClient();
  const resolved = await resolveUser(request);
  const payload = sanitizeApplicationPayload(await readBody(request));

  if (
    !payload.company ||
    !payload.bin ||
    !payload.name ||
    !payload.email ||
    !payload.phone ||
    !payload.city
  ) {
    return sendJson(response, 400, {
      error: "Заполните компанию, БИН, контактное лицо, email, телефон и город",
    });
  }

  payload.status = payload.status || "pending";
  payload.user_id = resolved.user?.id || null;

  const { data, error } = await adminClient
    .from("b2b_applications")
    .insert(payload)
    .select(APPLICATION_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось отправить B2B-заявку",
    });
  }

  return sendJson(response, 201, { application: data });
}

async function handlePatch(request, response) {
  const access = await requireAdmin(request, "Доступ к B2B-заявкам разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const body = await readBody(request);
  const id = normalizeString(body.id);

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор заявки" });
  }

  const payload = sanitizeApplicationPayload(body);

  if (Object.keys(payload).length === 0) {
    return sendJson(response, 400, { error: "Нет данных для обновления" });
  }

  const { data, error } = await access.adminClient
    .from("b2b_applications")
    .update(payload)
    .eq("id", id)
    .select(APPLICATION_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обновить заявку",
    });
  }

  return sendJson(response, 200, { application: data });
}

export default async function handler(request, response) {
  if (!isSupabaseServerConfigured()) {
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

    response.setHeader("Allow", "GET, POST, PATCH");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обработать B2B-заявку",
    });
  }
}
