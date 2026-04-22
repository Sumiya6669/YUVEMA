# YUVEMA Platform

## Stack
- Vite + React
- Supabase Auth + Postgres
- OpenAI server-side AI scenarios for consultation, sales, and routine selection
- Vercel static hosting + serverless API routes
- Tailwind CSS + local shadcn/ui primitives

## Local setup
1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example`.
3. In Supabase SQL Editor run:
   - `supabase/schema.sql`
   - `supabase/seed.sql`
4. Create the admin account:
   `npm run bootstrap:admin`
5. Start the app:
   `npm run dev`

## Required env vars
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4.1
ADMIN_EMAIL=admin@yuvema.kz
ADMIN_PASSWORD=
```

## Build validation
- `npm run lint`
- `npm run build`
- `npm run typecheck`

## Vercel deployment
1. Create a Supabase project.
2. Run `supabase/schema.sql` and `supabase/seed.sql`.
3. Add the environment variables from `.env.example` in Vercel.
4. Deploy the repository to Vercel.
5. Run `npm run bootstrap:admin` once with the production env vars available.
6. Verify:
   - `/api/health`
   - `/api/ai-assistant`
   - storefront pages
   - login / registration
   - admin access
