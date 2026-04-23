import { createHttpEntity } from "@/services/api/httpEntity";

export const B2BApplication = createHttpEntity({
  path: "/api/b2b-applications",
  listKey: "applications",
  itemKey: "application",
  authModes: {
    list: "required",
    filter: "required",
    create: "optional",
    update: "required",
  },
});
