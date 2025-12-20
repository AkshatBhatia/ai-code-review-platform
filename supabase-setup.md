# Supabase Setup for AI Code Review Platform

## Why Supabase?
- ✅ Managed PostgreSQL (no Docker needed)
- ✅ Built-in authentication (OAuth providers ready)
- ✅ Real-time subscriptions (perfect for live comments)
- ✅ Auto-generated APIs
- ✅ Built-in dashboard for database inspection
- ✅ Free tier available

## Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Sign in
3. Create new project
4. Choose region closest to you
5. Set database password
6. Wait ~2 minutes for provisioning

### 2. Get Connection Details
From your Supabase dashboard:
- **Project URL**: `https://[project-id].supabase.co`
- **Anon Key**: For client-side access
- **Service Role Key**: For server-side access
- **Database URL**: For direct PostgreSQL connection

### 3. Enable Authentication Providers
In Supabase Dashboard:
1. Go to Authentication → Providers
2. Enable Google OAuth:
   - Add your Google Client ID/Secret
3. Enable GitHub OAuth:
   - Add your GitHub Client ID/Secret

## Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[your-project-id].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[your-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[your-service-role-key]"

# Database URL (for Prisma if needed)
DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres"

# AI Providers (still needed)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
```

## Next Steps
1. Set up Next.js project with Supabase client
2. Create database schema using Supabase SQL editor
3. Test authentication with providers
4. Build first components with real-time features

## Manual Validation Points
- ✅ Can connect to Supabase dashboard
- ✅ Can run SQL queries in SQL editor
- ✅ Can authenticate with OAuth providers
- ✅ Can see real-time data updates
- ✅ Can query data through Supabase client