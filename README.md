 # AI Code Review Platform - Deployable MVP

🚀 **Live Demo**: Deploy and test in 5 minutes!

## Quick Deploy to Production

### 1. Supabase Setup (2 minutes)
1. Go to [supabase.com](https://supabase.com) → Create Project
2. Copy your project credentials:
   - Project URL: `https://xxx.supabase.co`
   - Anon Key: `eyJhbGc...`
   - Service Role Key: `eyJhbGc...`

### 2. Deploy to Vercel (1 minute)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-code-review-platform)

Or manually:
1. Fork this repo
2. Connect to Vercel
3. Add environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
4. Deploy → Get live URL in ~30 seconds

### 3. Configure OAuth (2 minutes)
In Supabase Dashboard → Authentication → Providers:

**Google OAuth:**
- Get credentials from [Google Console](https://console.cloud.google.com)
- Add redirect URL: `https://xxx.supabase.co/auth/v1/callback`

**GitHub OAuth:**
- Get credentials from GitHub Settings → Developer settings
- Add callback URL: `https://xxx.supabase.co/auth/v1/callback`

## ✅ Manual Testing Checklist

### Basic Functionality
- [ ] Live URL loads successfully
- [ ] Responsive design (mobile + desktop)
- [ ] Google OAuth works end-to-end
- [ ] GitHub OAuth works end-to-end
- [ ] User dashboard displays correctly
- [ ] Sign out functionality works
- [ ] Health check API: `/api/health`

### Production Validation
- [ ] HTTPS certificate valid
- [ ] Performance: <3s load time
- [ ] Cross-browser: Chrome, Safari, Firefox
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Error handling: Network failures, auth errors

## 🔧 Local Development

```bash
# Clone and install
git clone <repo-url>
cd ai-code-review-platform
npm install

# Set up environment
cp .env.example .env.local
# Add your Supabase credentials

# Run locally
npm run dev
# Open http://localhost:3000
```

## 🎯 What's Working

### ✅ Production Ready
- **Authentication**: Google + GitHub OAuth
- **Database**: Supabase PostgreSQL connection
- **Deployment**: Auto-deploy on git push
- **Responsive**: Mobile-first design
- **Health Monitoring**: `/api/health` endpoint

### 🚧 Coming Next (Week 0-1)
- Scenario creation interface
- Diff viewer component
- Comment system
- AI assistant integration
- Evaluation dashboard

## 📊 System Architecture

```
User Browser
    ↓
Vercel (Next.js App)
    ↓
Supabase (Auth + Database)
    ↓
OAuth Providers (Google/GitHub)
```

## 🔗 Key URLs

- **Production**: `https://your-app.vercel.app`
- **Health Check**: `https://your-app.vercel.app/api/health`
- **Supabase Dashboard**: `https://app.supabase.com/project/xxx`
- **Vercel Dashboard**: `https://vercel.com/dashboard`

## 📈 Monitoring

### Built-in Analytics
- **Vercel**: Performance, Core Web Vitals
- **Supabase**: Auth metrics, database performance
- **Browser DevTools**: Network, performance profiling

### Health Checks
```bash
# Test health endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "ok",
    "authentication": "ok"
  }
}
```

This MVP provides a solid foundation for incremental feature development with immediate production testing!
