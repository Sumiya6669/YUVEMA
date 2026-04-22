export default function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "Method Not Allowed" });
  }

  return response.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    supabaseConfigured: Boolean(
      process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY,
    ),
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    openAiConfigured: Boolean(process.env.OPENAI_API_KEY),
    adminBootstrapConfigured: Boolean(
      process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD,
    ),
  });
}
