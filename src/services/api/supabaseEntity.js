import { supabase } from "@/services/supabase/client";
import {
  applyFilters,
  applyOrder,
  assertNoError,
  mapRecords,
  mapTimestampFields,
} from "@/services/api/helpers";

export function createSupabaseEntity({
  table,
  select = "*",
  fieldMap = {},
  defaultOrder = "-created_date",
  mapRecord = mapTimestampFields,
  beforeCreate,
  beforeUpdate,
}) {
  return {
    async list(orderBy = defaultOrder, limit = 100) {
      let query = supabase.from(table).select(select);
      query = applyOrder(query, orderBy, fieldMap);

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      assertNoError(error, `load ${table}`);

      return mapRecords(data, mapRecord);
    },

    async filter(filters = {}, orderBy = defaultOrder, limit = 100) {
      let query = supabase.from(table).select(select);
      query = applyFilters(query, filters, fieldMap);
      query = applyOrder(query, orderBy, fieldMap);

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      assertNoError(error, `filter ${table}`);

      return mapRecords(data, mapRecord);
    },

    async create(payload) {
      const input = beforeCreate ? await beforeCreate(payload) : payload;
      const { data, error } = await supabase
        .from(table)
        .insert(input)
        .select(select)
        .single();

      assertNoError(error, `create ${table}`);
      return mapRecord(data);
    },

    async update(id, payload) {
      const input = beforeUpdate ? await beforeUpdate(payload, id) : payload;
      const { data, error } = await supabase
        .from(table)
        .update(input)
        .eq("id", id)
        .select(select)
        .single();

      assertNoError(error, `update ${table}`);
      return mapRecord(data);
    },

    async delete(id) {
      const { error } = await supabase.from(table).delete().eq("id", id);
      assertNoError(error, `delete ${table}`);
      return true;
    },
  };
}

