import {
  createAdminClient,
  getRequestUrl,
  isSupabaseServerConfigured,
  normalizeOrderField,
  parseLimit,
  readBody,
  requireAdmin,
  sendJson,
} from "./_lib/supabase.js";

const MESSAGE_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "message",
  "created_at",
  "updated_at",
].join(", ");

function sanitizeMessagePayload(body = {}) {
  const payload = {};
  ["name", "email", "phone", "message"].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] =
        typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });

  return payload;
}

async function handleGet(request, response) {
  const access = await requireAdmin(request, "Доступ к сообщениям разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const requestUrl = getRequestUrl(request, "/api/contact-messages");
  const order = normalizeOrderField(requestUrl.searchParams.get("orderBy") || "-created_date");
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 100);
  const { data, error } = await access.adminClient
    .from("contact_messages")
    .select(MESSAGE_FIELDS)
    .order(order.field, { ascending: order.ascending })
    .limit(limit);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось загрузить сообщения",
    });
  }

  return sendJson(response, 200, { messages: data || [] });
}

async function handlePost(request, response) {
  const adminClient = createAdminClient();
  const payload = sanitizeMessagePayload(await readBody(request));

  if (!payload.message) {
    return sendJson(response, 400, { error: "Введите текст сообщения" });
  }

  const { data, error } = await adminClient
    .from("contact_messages")
    .insert(payload)
    .select(MESSAGE_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось отправить сообщение",
    });
  }

  return sendJson(response, 201, { message: data });
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

    response.setHeader("Allow", "GET, POST");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обработать сообщение",
    });
  }
}
