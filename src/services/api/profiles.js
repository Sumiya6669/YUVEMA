import { createHttpEntity } from "@/services/api/httpEntity";
import { mapTimestampFields } from "@/services/api/helpers";

export const User = createHttpEntity({
  path: "/api/profiles",
  listKey: "profiles",
  itemKey: "profile",
  mapRecord(record) {
    const profile = mapTimestampFields(record);
    return {
      ...profile,
      full_name: profile.full_name || profile.email,
    };
  },
  authModes: {
    list: "required",
    filter: "required",
    update: "required",
  },
});
