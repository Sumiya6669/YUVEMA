import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function loadEnvFile(filename) {
  const filePath = path.join(projectRoot, filename);

  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const requiredEnv = [
  "VITE_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ADMIN_EMAIL",
  "ADMIN_PASSWORD",
];

const missing = requiredEnv.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`Missing environment variables: ${missing.join(", ")}`);
  process.exit(1);
}

const adminClient = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const {
  data: { users },
  error: listError,
} = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 });

if (listError) {
  console.error(listError.message);
  process.exit(1);
}

let adminUser = users.find(
  (user) => user.email?.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase(),
);

if (!adminUser) {
  const { data, error } = await adminClient.auth.admin.createUser({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: "YUVEMA Admin",
    },
  });

  if (error) {
    console.error(error.message);
    process.exit(1);
  }

  adminUser = data.user;
}

const { error: profileError } = await adminClient.from("profiles").upsert(
  {
    id: adminUser.id,
    email: process.env.ADMIN_EMAIL,
    full_name: adminUser.user_metadata?.full_name || "YUVEMA Admin",
    role: "admin",
    wholesale_approved: true,
  },
  {
    onConflict: "id",
  },
);

if (profileError) {
  if (profileError.message?.includes("public.profiles")) {
    console.error(
      "В Supabase ещё не создана схема проекта. Сначала выполните supabase/schema.sql, затем при необходимости supabase/seed.sql, и повторите bootstrap:admin.",
    );
  } else {
    console.error(profileError.message);
  }
  process.exit(1);
}

console.log(`Admin account ready: ${process.env.ADMIN_EMAIL}`);
