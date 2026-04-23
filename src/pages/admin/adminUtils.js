import { format } from "date-fns";
import { siteConfig } from "@/config/site";

export const orderStatusLabels = {
  pending: "Ожидает",
  confirmed: "Подтверждён",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};

export const paymentStatusLabels = {
  unpaid: "Не оплачен",
  paid: "Оплачен",
  refunded: "Возврат",
};

export const roleLabels = {
  admin: "Администратор",
  user: "Пользователь",
  b2b_client: "B2B клиент",
};

export const applicationStatusLabels = {
  pending: "На рассмотрении",
  approved: "Одобрена",
  rejected: "Отклонена",
};

export const fulfillmentMethodLabels = {
  delivery: "Доставка",
  pickup: "Самовывоз",
};

export function formatMoney(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ru-RU")} ₸`;
}

export function formatDate(value, pattern = "dd.MM.yyyy") {
  if (!value) {
    return "—";
  }

  return format(new Date(value), pattern);
}

export function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getOrderStatusClass(status) {
  const classes = {
    pending: "border-[#E7D7C1] bg-[#FBF2E5] text-[#7A613E]",
    confirmed: "border-[#E5D8CA] bg-white text-[#66513D]",
    processing: "border-[#E6DDD0] bg-[#F7F1E8] text-[#66513D]",
    shipped: "border-[#D6E5DE] bg-[#EEF7F1] text-[#4F6B57]",
    delivered: "border-[#D7E6D8] bg-[#EFF8EE] text-[#58714D]",
    cancelled: "border-[#F0D7D9] bg-[#FCF0F1] text-[#B35663]",
  };

  return classes[status] || classes.pending;
}

export function getPaymentStatusClass(status) {
  const classes = {
    unpaid: "border-[#E7D7C1] bg-[#FBF2E5] text-[#7A613E]",
    paid: "border-[#D7E6D8] bg-[#EFF8EE] text-[#58714D]",
    refunded: "border-[#F0D7D9] bg-[#FCF0F1] text-[#B35663]",
  };

  return classes[status] || classes.unpaid;
}

export function getRoleClass(role) {
  const classes = {
    admin: "border-[#E1D0B3] bg-[#FBF1E4] text-[#7A613E]",
    user: "border-[#E9DED0] bg-white text-[#66513D]",
    b2b_client: "border-[#F0DED8] bg-[#FCF3F1] text-[#7C5A4B]",
  };

  return classes[role] || classes.user;
}

export function getApplicationStatusClass(status) {
  const classes = {
    pending: "border-[#E7D7C1] bg-[#FBF2E5] text-[#7A613E]",
    approved: "border-[#D7E6D8] bg-[#EFF8EE] text-[#58714D]",
    rejected: "border-[#F0D7D9] bg-[#FCF0F1] text-[#B35663]",
  };

  return classes[status] || classes.pending;
}

export function getFulfillmentMethod(order) {
  const address = String(order?.shipping_address || "").trim().toLowerCase();
  const pickupAddress = String(siteConfig.location || "").trim().toLowerCase();

  return address && address === pickupAddress ? "pickup" : "delivery";
}
