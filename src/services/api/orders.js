import { createHttpEntity } from "@/services/api/httpEntity";

export const Order = createHttpEntity({
  path: "/api/orders",
  listKey: "orders",
  itemKey: "order",
  authModes: {
    list: "required",
    filter: "required",
    create: "optional",
    update: "required",
  },
});
