import { createClient } from "@supabase/supabase-js";

export function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

export async function readBody(request) {
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

export function isSupabaseServerConfigured() {
  return Boolean(
    process.env.VITE_SUPABASE_URL &&
      process.env.VITE_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function createAnonClient() {
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

export function createAdminClient() {
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

export function getRequestUrl(request, fallbackPath = "/") {
  return new URL(request.url || fallbackPath, "http://localhost");
}

export function normalizeOrderField(orderBy = "-created_date") {
  const descending = orderBy.startsWith("-");
  const field = descending ? orderBy.slice(1) : orderBy;
  const mappedField =
    field === "created_date" ? "created_at" : field === "updated_date" ? "updated_at" : field;

  return {
    field: mappedField,
    ascending: !descending,
  };
}

export function parseLimit(value, fallback = 100, max = 500) {
  const parsed = Number.parseInt(String(value || fallback), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, max);
}

export function parseBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return String(value).toLowerCase() === "true";
}

export function normalizeString(value) {
  const normalized = String(value ?? "").trim();
  return normalized.length > 0 ? normalized : null;
}

export function getBearerToken(request) {
  const authHeader = request.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

export async function resolveUser(request) {
  const token = getBearerToken(request);

  if (!token) {
    return { token: "", user: null };
  }

  const anonClient = createAnonClient();
  const {
    data: { user },
    error,
  } = await anonClient.auth.getUser(token);

  if (error || !user) {
    return {
      token,
      user: null,
      status: 401,
      error: "Сессия пользователя недействительна",
    };
  }

  return { token, user };
}

export async function getUserProfile(adminClient, userId) {
  if (!userId) {
    return null;
  }

  const { data, error } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Не удалось загрузить профиль");
  }

  return data || null;
}

export async function requireAdmin(request, forbiddenMessage = "Доступ разрешён только администратору") {
  const resolved = await resolveUser(request);

  if (resolved.error || !resolved.user) {
    return {
      status: resolved.status || 401,
      error: resolved.error || "Требуется авторизация администратора",
    };
  }

  const adminClient = createAdminClient();
  const profile = await getUserProfile(adminClient, resolved.user.id);

  if (profile?.role !== "admin") {
    return {
      status: 403,
      error: forbiddenMessage,
    };
  }

  return {
    adminClient,
    user: resolved.user,
    profile,
  };
}
