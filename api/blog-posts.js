import {
  getRequestUrl,
  isSupabaseServerConfigured,
  normalizeOrderField,
  normalizeString,
  parseBoolean,
  parseLimit,
  readBody,
  requireAdmin,
  resolveUser,
  sendJson,
} from "./_lib/supabase.js";
import { createAdminClient, getUserProfile } from "./_lib/supabase.js";

const POST_FIELDS = [
  "id",
  "slug",
  "title",
  "excerpt",
  "content",
  "cover_image",
  "category",
  "tags",
  "published",
  "created_at",
  "updated_at",
].join(", ");

function sanitizeTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(tags || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function sanitizePostPayload(body = {}) {
  const payload = {};
  [
    "slug",
    "title",
    "excerpt",
    "content",
    "cover_image",
    "category",
    "published",
  ].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] =
        typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });

  if (body.tags !== undefined) {
    payload.tags = sanitizeTags(body.tags);
  }

  return payload;
}

function applyPostFilters(query, searchParams) {
  for (const [key, value] of searchParams.entries()) {
    if (key === "orderBy" || key === "limit" || value === "") {
      continue;
    }

    if (key === "published") {
      query = query.eq(key, parseBoolean(value));
      continue;
    }

    if (key === "tags") {
      const tags = sanitizeTags(value);
      if (tags.length > 0) {
        query = query.contains("tags", tags);
      }
      continue;
    }

    query = query.eq(key, value);
  }

  return query;
}

async function isAdminRequest(request) {
  const resolved = await resolveUser(request);

  if (resolved.error || !resolved.user) {
    return false;
  }

  const adminClient = createAdminClient();
  const profile = await getUserProfile(adminClient, resolved.user.id);
  return profile?.role === "admin";
}

async function handleGet(request, response) {
  const adminClient = createAdminClient();
  const requestUrl = getRequestUrl(request, "/api/blog-posts");
  const order = normalizeOrderField(requestUrl.searchParams.get("orderBy") || "-created_date");
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 100);
  const adminView = await isAdminRequest(request);
  let query = adminClient.from("blog_posts").select(POST_FIELDS);

  if (!adminView) {
    query = query.eq("published", true);
  }

  query = applyPostFilters(query, requestUrl.searchParams);

  const { data, error } = await query
    .order(order.field, { ascending: order.ascending })
    .limit(limit);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось загрузить статьи",
    });
  }

  return sendJson(response, 200, { posts: data || [] });
}

async function handlePost(request, response) {
  const access = await requireAdmin(request, "Доступ к блогу разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const payload = sanitizePostPayload(await readBody(request));

  if (!normalizeString(payload.title) || !normalizeString(payload.content)) {
    return sendJson(response, 400, {
      error: "Заполните заголовок и основной текст статьи",
    });
  }

  const { data, error } = await access.adminClient
    .from("blog_posts")
    .insert(payload)
    .select(POST_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось создать статью",
    });
  }

  return sendJson(response, 201, { post: data });
}

async function handlePatch(request, response) {
  const access = await requireAdmin(request, "Доступ к блогу разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const body = await readBody(request);
  const id = normalizeString(body.id);

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор статьи" });
  }

  const payload = sanitizePostPayload(body);

  if (Object.keys(payload).length === 0) {
    return sendJson(response, 400, { error: "Нет данных для обновления" });
  }

  const { data, error } = await access.adminClient
    .from("blog_posts")
    .update(payload)
    .eq("id", id)
    .select(POST_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обновить статью",
    });
  }

  return sendJson(response, 200, { post: data });
}

async function handleDelete(request, response) {
  const access = await requireAdmin(request, "Доступ к блогу разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const requestUrl = getRequestUrl(request, "/api/blog-posts");
  const id = normalizeString(requestUrl.searchParams.get("id"));

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор статьи" });
  }

  const { error } = await access.adminClient.from("blog_posts").delete().eq("id", id);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось удалить статью",
    });
  }

  return sendJson(response, 200, { success: true });
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

    if (request.method === "DELETE") {
      return await handleDelete(request, response);
    }

    response.setHeader("Allow", "GET, POST, PATCH, DELETE");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обработать статьи",
    });
  }
}
