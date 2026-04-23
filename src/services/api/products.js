import { supabase } from "@/services/supabase/client";
import {
  assertNoError,
  mapRecords,
  mapTimestampFields,
} from "@/services/api/helpers";

const ARRAY_FIELDS = new Set(["skin_types", "skin_problems", "gallery"]);

function buildProductsUrl(filters = {}, orderBy = "-created_date", limit = 100) {
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

  const query = params.toString();
  return query ? `/api/products?${query}` : "/api/products";
}

async function parseJsonResponse(response) {
  return response.json().catch(() => ({}));
}

async function getAccessToken() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  assertNoError(error, "load session");

  if (!session?.access_token) {
    throw new Error("Сначала войдите в админ-аккаунт");
  }

  return session.access_token;
}

function normalizePayload(payload = {}) {
  return Object.entries(payload).reduce((result, [key, value]) => {
    if (value === undefined) {
      return result;
    }

    if (ARRAY_FIELDS.has(key)) {
      result[key] = Array.isArray(value)
        ? value.filter(Boolean)
        : String(value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
      return result;
    }

    result[key] = value;
    return result;
  }, {});
}

async function requestProducts({
  method = "GET",
  filters,
  orderBy,
  limit,
  payload,
  id,
  authRequired = false,
}) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authRequired) {
    headers.Authorization = `Bearer ${await getAccessToken()}`;
  }

  const baseUrl = buildProductsUrl(filters, orderBy, limit);
  const url = id && method === "DELETE" ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}id=${encodeURIComponent(id)}` : baseUrl;
  const response = await fetch(url, {
    method,
    headers,
    body: method === "GET" || method === "DELETE"
      ? undefined
      : JSON.stringify(id ? { id, ...normalizePayload(payload) } : normalizePayload(payload)),
  });

  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(data.error || "Не удалось выполнить запрос по товарам");
  }

  return data;
}

export function createProductsEntity() {
  return {
    async list(orderBy = "-created_date", limit = 100) {
      const data = await requestProducts({ method: "GET", orderBy, limit });
      return mapRecords(data.products, mapTimestampFields);
    },

    async filter(filters = {}, orderBy = "-created_date", limit = 100) {
      const data = await requestProducts({
        method: "GET",
        filters,
        orderBy,
        limit,
      });

      return mapRecords(data.products, mapTimestampFields);
    },

    async create(payload) {
      const data = await requestProducts({
        method: "POST",
        payload,
        authRequired: true,
      });

      return mapTimestampFields(data.product);
    },

    async update(id, payload) {
      const data = await requestProducts({
        method: "PATCH",
        id,
        payload,
        authRequired: true,
      });

      return mapTimestampFields(data.product);
    },

    async delete(id) {
      await requestProducts({
        method: "DELETE",
        id,
        authRequired: true,
      });

      return true;
    },
  };
}
