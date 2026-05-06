# BrotherSpace

BrotherSpace is a React community app for anonymous support, posts, replies, groups, and premium membership flows.

## Run locally

1. Install dependencies:
   `npm install`
2. Build the app bundle:
   `npm run build`
3. Start the local server:
   `npm run dev`

The app will be available at `http://localhost:3000`.

## Environment

Supabase values live in the root env files:

- `.env` for local development
- `.env.example` for the tracked template

Required frontend-safe keys:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Keep the Supabase service-role secret out of browser env files. If you need it later for server-only admin work, we can add a server env and wire that separately.

If you are moving from the local mock layer to Supabase, also run [`supabase_migration_update.sql`](/C:/Users/USER/Downloads/brotherspace/supabase_migration_update.sql) in the Supabase SQL editor so the profile preferences column and admin policies match the app.

## Vercel Deploy

Use these settings when importing the repo into Vercel:

- Build command: `npm run build`
- Output directory: `dist`

Set these environment variables in Vercel project settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

If you want to keep Netlify as a fallback, the existing `netlify.toml` still works too.
