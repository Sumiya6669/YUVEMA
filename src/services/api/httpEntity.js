import { supabase } from "@/services/supabase/client";
import {
  assertNoError,
  mapRecords,
  mapTimestampFields,
} from "@/services/api/helpers";

async function parseJsonResponse(response) {
  return response.json().catch(() => ({}));
}

async function getAccessToken(mode = "none") {
  if (mode === "none") {
    return "";
  }

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  assertNoError(error, "load session");

  if (!session?.access_token) {
    if (mode === "required") {
      throw new Error("Сначала войдите в аккаунт");
    }

    return "";
  }

  return session.access_token;
}

function buildUrl(path, filters = {}, orderBy, limit, id) {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        params.set(key, value.join(","));
      }
      return;
    }

    params.set(key, String(value));
  });

  if (orderBy) {
    params.set("orderBy", orderBy);
  }

  if (limit) {
    params.set("limit", String(limit));
  }

  if (id) {
    params.set("id", id);
  }

  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

async function requestEntity({
  path,
  method = "GET",
  filters,
  orderBy,
  limit,
  id,
  payload,
  authMode = "none",
}) {
  const headers = {
    "Content-Type": "application/json",
  };

  const token = await getAccessToken(authMode);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path, filters, orderBy, limit, method === "DELETE" ? id : null), {
    method,
    headers,
    body:
      method === "GET" || method === "DELETE"
        ? undefined
        : JSON.stringify(id ? { id, ...payload } : payload),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Не удалось выполнить серверный запрос");
  }

  return data;
}

export function createHttpEntity({
  path,
  listKey,
  itemKey,
  mapRecord = mapTimestampFields,
  defaultOrder = "-created_date",
  authModes = {},
  preparePayload = (payload) => payload,
}) {
  return {
    async list(orderBy = defaultOrder, limit = 100) {
      const data = await requestEntity({
        path,
        method: "GET",
        orderBy,
        limit,
        authMode: authModes.list || "none",
      });

      return mapRecords(data[listKey], mapRecord);
    },

    async filter(filters = {}, orderBy = defaultOrder, limit = 100) {
      const data = await requestEntity({
        path,
        method: "GET",
        filters,
        orderBy,
        limit,
        authMode: authModes.filter || authModes.list || "none",
      });

      return mapRecords(data[listKey], mapRecord);
    },

    async create(payload) {
      const data = await requestEntity({
        path,
        method: "POST",
        payload: preparePayload(payload),
        authMode: authModes.create || "required",
      });

      return data[itemKey] ? mapRecord(data[itemKey]) : true;
    },

    async update(id, payload) {
      const data = await requestEntity({
        path,
        method: "PATCH",
        id,
        payload: preparePayload(payload),
        authMode: authModes.update || "required",
      });

      return data[itemKey] ? mapRecord(data[itemKey]) : true;
    },

    async delete(id) {
      await requestEntity({
        path,
        method: "DELETE",
        id,
        authMode: authModes.delete || "required",
      });

      return true;
    },
  };
}
