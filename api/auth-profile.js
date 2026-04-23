import { createClient } from "@supabase/supabase-js";

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload));
}

function mapProfile(record) {
  if (!record) {
    return null;
  }

  return {
    ...record,
    created_date: record.created_at ?? null,
    updated_date: record.updated_at ?? null,
  };
}

function createAnonClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function createAdminClient() {
  return createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return sendJson(response, 405, { error: "Method Not Allowed" });
  }

  if (
    !process.env.VITE_SUPABASE_URL ||
    !process.env.VITE_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    return sendJson(response, 500, { error: "Supabase env is not configured" });
  }

  const authHeader = request.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token) {
    return sendJson(response, 401, { error: "Missing access token" });
  }

  try {
    const anonClient = createAnonClient();
    const adminClient = createAdminClient();

    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser(token);

    if (userError || !user) {
      return sendJson(response, 401, { error: "Unauthorized" });
    }

    const { data: rawProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    const isAdminEmail =
      process.env.ADMIN_EMAIL &&
      user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase();

    const nextProfile = {
      id: user.id,
      email: user.email,
      full_name:
        rawProfile?.full_name ||
        user.user_metadata?.full_name ||
        user.email ||
        "Пользователь",
      role: isAdminEmail ? "admin" : rawProfile?.role || "user",
      wholesale_approved: isAdminEmail ? true : rawProfile?.wholesale_approved || false,
      company_name: rawProfile?.company_name || "",
      company_bin: rawProfile?.company_bin || "",
      city: rawProfile?.city || "",
      phone: rawProfile?.phone || "",
    };

    if (
      !rawProfile ||
      rawProfile.role !== nextProfile.role ||
      rawProfile.wholesale_approved !== nextProfile.wholesale_approved
    ) {
      const { error: upsertError } = await adminClient.from("profiles").upsert(
        nextProfile,
        { onConflict: "id" },
      );

      if (upsertError) {
        return sendJson(response, 500, { error: upsertError.message });
      }
    }

    const { data: finalProfile } = await adminClient
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const normalized = mapProfile(finalProfile) || mapProfile(nextProfile);

    return sendJson(response, 200, {
      id: user.id,
      email: user.email,
      full_name: normalized?.full_name || user.email,
      role: normalized?.role || "user",
      wholesale_approved: normalized?.wholesale_approved || false,
      company_name: normalized?.company_name || "",
      company_bin: normalized?.company_bin || "",
      city: normalized?.city || "",
      phone: normalized?.phone || "",
      created_date: normalized?.created_date || user.created_at || null,
      updated_date: normalized?.updated_date || null,
    });
  } catch (error) {
    return sendJson(response, 500, {
      error: error.message || "Failed to resolve auth profile",
    });
  }
}
