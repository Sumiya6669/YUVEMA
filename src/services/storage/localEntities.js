import { mapTimestampFields } from "@/services/api/helpers";

function getStorageKey(namespace) {
  return `yuvema:${namespace}`;
}

function safeRead(namespace) {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    return JSON.parse(localStorage.getItem(getStorageKey(namespace)) || "[]");
  } catch {
    return [];
  }
}

function safeWrite(namespace, records) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(getStorageKey(namespace), JSON.stringify(records));
  window.dispatchEvent(new CustomEvent(`yuvema:${namespace}:updated`));
}

function nextRecord(payload) {
  return mapTimestampFields({
    ...payload,
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export function createLocalCartEntity() {
  const namespace = "cart";

  return {
    async list() {
      return safeRead(namespace);
    },

    async filter(filters = {}) {
      return safeRead(namespace).filter((item) =>
        Object.entries(filters).every(([key, value]) => item[key] === value),
      );
    },

    async create(payload) {
      const current = safeRead(namespace);
      const existing = current.find(
        (item) => item.product_id === payload.product_id,
      );

      if (existing) {
        const updated = current.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                quantity: (item.quantity || 1) + (payload.quantity || 1),
                updated_at: new Date().toISOString(),
              }
            : item,
        );

        safeWrite(namespace, updated);
        return updated.find((item) => item.id === existing.id);
      }

      const record = nextRecord({ ...payload, quantity: payload.quantity || 1 });
      safeWrite(namespace, [...current, record]);
      return record;
    },

    async update(id, payload) {
      const updated = safeRead(namespace).map((item) =>
        item.id === id
          ? mapTimestampFields({
              ...item,
              ...payload,
              updated_at: new Date().toISOString(),
            })
          : item,
      );

      safeWrite(namespace, updated);
      return updated.find((item) => item.id === id) || null;
    },

    async delete(id) {
      safeWrite(
        namespace,
        safeRead(namespace).filter((item) => item.id !== id),
      );
      return true;
    },

    async clear() {
      safeWrite(namespace, []);
      return true;
    },
  };
}

export function createLocalWishlistEntity() {
  const namespace = "wishlist";

  return {
    async list() {
      return safeRead(namespace);
    },

    async filter(filters = {}) {
      return safeRead(namespace).filter((item) =>
        Object.entries(filters).every(([key, value]) => item[key] === value),
      );
    },

    async create(payload) {
      const current = safeRead(namespace);
      const existing = current.find(
        (item) => item.product_id === payload.product_id,
      );

      if (existing) {
        return existing;
      }

      const record = nextRecord(payload);
      safeWrite(namespace, [...current, record]);
      return record;
    },

    async update(id, payload) {
      const updated = safeRead(namespace).map((item) =>
        item.id === id
          ? mapTimestampFields({
              ...item,
              ...payload,
              updated_at: new Date().toISOString(),
            })
          : item,
      );

      safeWrite(namespace, updated);
      return updated.find((item) => item.id === id) || null;
    },

    async delete(id) {
      safeWrite(
        namespace,
        safeRead(namespace).filter((item) => item.id !== id),
      );
      return true;
    },

    async clear() {
      safeWrite(namespace, []);
      return true;
    },
  };
}

