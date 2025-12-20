# 🚀 Quick Start: Deploy in 5 Minutes

## Step 1: Supabase Setup (2 minutes)
1. Go to [supabase.com](https://supabase.com) → Create account → New Project
2. Wait for provisioning (~1 min)
3. Go to Settings → API → Copy:
   - Project URL
   - Anon public key
   - Service role key

## Step 2: Deploy to Vercel (2 minutes)
1. Go to [vercel.com](https://vercel.com) → Import Git Repository
2. Connect this GitHub repo
3. Add Environment Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
4. Deploy → Get live URL in ~30 seconds

## Step 3: Test Live App (1 minute)
1. Open your live URL (e.g., `ai-code-review-platform.vercel.app`)
2. Test user signup/login
3. Test basic navigation
4. Share URL with others for testing

## 🎯 What You'll Have
- ✅ **Live production URL** accessible worldwide
- ✅ **User authentication** with Google/GitHub
- ✅ **Database operations** working in production
- ✅ **Automatic deployments** on every git push
- ✅ **Preview URLs** for every branch/PR

## 📱 Testing Checklist
- [ ] Desktop: Chrome, Safari, Firefox
- [ ] Mobile: iOS Safari, Android Chrome
- [ ] Authentication: Google OAuth, GitHub OAuth
- [ ] Database: Create/read operations work
- [ ] Performance: <3s load time
- [ ] Responsive: Works on all screen sizes

## 🔄 Development Cycle
1. **Code locally** → `git push`
2. **Auto-deployment** in ~30 seconds
3. **Test live URL** → Real-world validation
4. **Iterate quickly** → Repeat cycle

This setup gives you immediate production testing for every change!