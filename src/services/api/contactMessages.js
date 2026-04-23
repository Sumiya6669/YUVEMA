import { createHttpEntity } from "@/services/api/httpEntity";

export const ContactMessage = createHttpEntity({
  path: "/api/contact-messages",
  listKey: "messages",
  itemKey: "message",
  authModes: {
    list: "required",
    create: "none",
  },
});
