const DEFAULT_FIELD_MAP = {
  created_date: "created_at",
  updated_date: "updated_at",
};

export function normalizeFieldName(field, fieldMap = {}) {
  return fieldMap[field] || DEFAULT_FIELD_MAP[field] || field;
}

export function applyOrder(query, orderBy = "-created_date", fieldMap = {}) {
  if (!orderBy) {
    return query;
  }

  const descending = orderBy.startsWith("-");
  const field = normalizeFieldName(
    descending ? orderBy.slice(1) : orderBy,
    fieldMap,
  );

  return query.order(field, { ascending: !descending });
}

export function applyFilters(query, filters = {}, fieldMap = {}) {
  return Object.entries(filters).reduce((currentQuery, [rawField, value]) => {
    if (value === undefined || value === null || value === "") {
      return currentQuery;
    }

    const field = normalizeFieldName(rawField, fieldMap);

    if (Array.isArray(value)) {
      return currentQuery.contains(field, value);
    }

    return currentQuery.eq(field, value);
  }, query);
}

export function mapTimestampFields(record) {
  if (!record) {
    return record;
  }

  return {
    ...record,
    created_date: record.created_at ?? record.created_date ?? null,
    updated_date: record.updated_at ?? record.updated_date ?? null,
  };
}

export function mapRecords(records, mapper = mapTimestampFields) {
  return (records || []).map(mapper);
}

export function assertNoError(error, action) {
  if (!error) {
    return;
  }

  throw new Error(error.message || `Не удалось выполнить действие: ${action}`);
}

export async function getCurrentSessionUser(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

