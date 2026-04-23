import { siteConfig } from "../src/config/site.js";
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

const ORDER_FIELDS = [
  "id",
  "user_id",
  "order_number",
  "customer_email",
  "customer_name",
  "customer_phone",
  "type",
  "status",
  "payment_status",
  "payment_method",
  "items",
  "subtotal",
  "shipping_cost",
  "total",
  "shipping_address",
  "shipping_city",
  "notes",
  "created_at",
  "updated_at",
].join(", ");

function parseNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sanitizeOrderItems(items = []) {
  return Array.isArray(items)
    ? items
        .map((item) => ({
          product_id: normalizeString(item.product_id),
          product_name: normalizeString(item.product_name) || "Товар",
          quantity: Math.max(1, parseInt(String(item.quantity || 1), 10) || 1),
          price: parseNumber(item.price, 0),
          image_url: normalizeString(item.image_url),
        }))
        .filter((item) => item.product_name)
    : [];
}

function getFulfillmentMethod(body) {
  return body.delivery_method === "pickup" ? "pickup" : "delivery";
}

function buildOrderPayload(body, user, profile) {
  const items = sanitizeOrderItems(body.items);
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 1),
    0,
  );
  const deliveryMethod = getFulfillmentMethod(body);
  const shippingCost =
    deliveryMethod === "pickup"
      ? 0
      : subtotal >= siteConfig.freeShippingThreshold
        ? 0
        : siteConfig.shippingPrice;
  const shippingAddress =
    deliveryMethod === "pickup"
      ? siteConfig.location
      : normalizeString(body.shipping_address);
  const total = subtotal + shippingCost;
  const customerEmail = normalizeString(body.customer_email) || user?.email;
  const customerName =
    normalizeString(body.customer_name) ||
    normalizeString(profile?.full_name) ||
    customerEmail;

  return {
    user_id: user?.id || null,
    order_number: normalizeString(body.order_number),
    customer_email: customerEmail,
    customer_name: customerName,
    customer_phone: normalizeString(body.customer_phone),
    type: profile?.role === "b2b_client" || body.type === "b2b" ? "b2b" : "b2c",
    status: "pending",
    payment_status: "unpaid",
    payment_method: normalizeString(body.payment_method) || "kaspi",
    items,
    subtotal,
    shipping_cost: shippingCost,
    total,
    shipping_address: shippingAddress,
    shipping_city: normalizeString(body.shipping_city),
    notes: normalizeString(body.notes),
  };
}

function validateOrderPayload(payload) {
  if (!payload.order_number) {
    return "Не удалось сформировать номер заказа";
  }

  if (!payload.customer_name) {
    return "Укажите имя получателя";
  }

  if (!payload.customer_email) {
    return "Укажите email";
  }

  if (!payload.customer_phone) {
    return "Укажите телефон";
  }

  if (!payload.shipping_city) {
    return "Укажите город";
  }

  if (!payload.shipping_address) {
    return "Укажите адрес доставки или выберите самовывоз";
  }

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return "Корзина пуста";
  }

  return null;
}

function applyAdminOrderFilters(query, searchParams) {
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
  const requestUrl = getRequestUrl(request, "/api/orders");
  const order = normalizeOrderField(requestUrl.searchParams.get("orderBy") || "-created_date");
  const limit = parseLimit(requestUrl.searchParams.get("limit"), 100);
  let query = adminClient.from("orders").select(ORDER_FIELDS);

  if (profile?.role === "admin") {
    query = applyAdminOrderFilters(query, requestUrl.searchParams);
  } else {
    query = query.or(
      `user_id.eq.${resolved.user.id},customer_email.eq.${resolved.user.email}`,
    );

    const id = normalizeString(requestUrl.searchParams.get("id"));
    const status = normalizeString(requestUrl.searchParams.get("status"));
    const orderNumber = normalizeString(requestUrl.searchParams.get("order_number"));

    if (id) {
      query = query.eq("id", id);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (orderNumber) {
      query = query.eq("order_number", orderNumber);
    }
  }

  const { data, error } = await query
    .order(order.field, { ascending: order.ascending })
    .limit(limit);

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось загрузить заказы",
    });
  }

  return sendJson(response, 200, { orders: data || [] });
}

async function handlePost(request, response) {
  const adminClient = createAdminClient();
  const resolved = await resolveUser(request);
  const body = await readBody(request);
  const profile = resolved.user ? await getUserProfile(adminClient, resolved.user.id) : null;
  const payload = buildOrderPayload(body, resolved.user, profile);
  const validationError = validateOrderPayload(payload);

  if (validationError) {
    return sendJson(response, 400, { error: validationError });
  }

  const { data, error } = await adminClient
    .from("orders")
    .insert(payload)
    .select(ORDER_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось оформить заказ",
    });
  }

  return sendJson(response, 201, { order: data });
}

async function handlePatch(request, response) {
  const access = await requireAdmin(request, "Доступ к заказам разрешён только администратору");

  if (!access.adminClient) {
    return sendJson(response, access.status, { error: access.error });
  }

  const body = await readBody(request);
  const id = normalizeString(body.id);

  if (!id) {
    return sendJson(response, 400, { error: "Не указан идентификатор заказа" });
  }

  const payload = {};

  [
    "status",
    "payment_status",
    "payment_method",
    "notes",
    "shipping_address",
    "shipping_city",
    "customer_name",
    "customer_email",
    "customer_phone",
  ].forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] =
        typeof body[field] === "string" ? body[field].trim() : body[field];
    }
  });

  if (Object.keys(payload).length === 0) {
    return sendJson(response, 400, { error: "Нет данных для обновления" });
  }

  const { data, error } = await access.adminClient
    .from("orders")
    .update(payload)
    .eq("id", id)
    .select(ORDER_FIELDS)
    .single();

  if (error) {
    return sendJson(response, 500, {
      error: error.message || "Не удалось обновить заказ",
    });
  }

  return sendJson(response, 200, { order: data });
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
      error: error.message || "Не удалось обработать заказ",
    });
  }
}
