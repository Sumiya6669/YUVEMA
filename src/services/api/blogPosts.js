import { createHttpEntity } from "@/services/api/httpEntity";

export const BlogPost = createHttpEntity({
  path: "/api/blog-posts",
  listKey: "posts",
  itemKey: "post",
  authModes: {
    list: "optional",
    filter: "optional",
    create: "required",
    update: "required",
    delete: "required",
  },
});
