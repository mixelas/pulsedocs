# PulseDocs Sign-Up & Auth Checklist

## Before Going Live

### ✅ Code Ready
- [x] `npm run type-check` passes
- [x] `npm run build` passes
- [x] Auth pages implemented (signin, signup, confirm, callback)
- [x] Middleware handles auth session
- [x] Server actions check permissions

### ✅ Supabase Setup Checklist

1. **Create/Verify Project**
   - [ ] Create project at https://supabase.com (free tier)
   - [ ] Copy Project URL from Settings > API
   - [ ] Copy Anon Key from Settings > API

2. **Email Configuration** (Choose one)
   - [ ] **Option A (Instant signup)**: Disable email confirmation
     - Go to: Authentication > Providers > Email
     - Toggle "Confirm email" OFF
     - Users sign up → immediately can sign in
   - [ ] **Option B (Production)**: Enable email confirmation
     - Go to: Authentication > Providers > Email
     - Keep "Confirm email" ON
     - Add custom email redirect: https://your-vercel-url.vercel.app/auth/callback

3. **Run Database Migrations**
   - [ ] Go to SQL Editor in Supabase
   - [ ] Copy & run: `supabase/migrations/001_initial_schema.sql`
   - [ ] Copy & run: `supabase/migrations/002_functions_and_rls.sql`
   - [ ] Verify all tables exist (check "Tables" sidebar)

4. **Test Auth Locally**
   - [ ] Create `.env.local` with your Supabase credentials
   - [ ] Run `npm run dev`
   - [ ] Sign up with test email
   - [ ] Sign in with same credentials
   - [ ] Can create workspace
   - [ ] Can create channel
   - [ ] Can send message

### ✅ Vercel Deployment Checklist

1. **Push Code to GitHub**
   - [ ] Commit all changes: `git add . && git commit -m "Auth ready for deploy"`
   - [ ] Push: `git push origin main`

2. **Create Vercel Project**
   - [ ] Go to https://vercel.com
   - [ ] Click "New Project"
   - [ ] Import your GitHub repo
   - [ ] Select main branch

3. **Set Environment Variables in Vercel**
   - [ ] Go to: Settings > Environment Variables
   - [ ] Add:
     ```
     NEXT_PUBLIC_SUPABASE_URL = [your supabase URL]
     NEXT_PUBLIC_SUPABASE_ANON_KEY = [your supabase anon key]
     ```
   - [ ] Save & redeploy

4. **Test on Vercel Deployment**
   - [ ] Visit your live URL
   - [ ] Sign up with new email
   - [ ] Check inbox for confirmation (if Option B enabled)
   - [ ] Sign in
   - [ ] Create workspace
   - [ ] Send a message
   - [ ] Search documents

5. **Update README Badge**
   - [ ] Replace placeholder in `readme.md`:
     ```
     Replace: https://your-vercel-deploy-url.vercel.app
     With: https://[your-actual-vercel-url]
     ```

## Troubleshooting

### "Invalid credentials" on sign-in
- Check Supabase project is active
- Verify user was actually created (check Supabase > Auth > Users table)
- Ensure email confirmation is disabled (Option A) or email was confirmed

### Sign-up page shows error
- Check browser console (F12) for detailed error
- Verify env vars in Vercel (or `.env.local` locally)
- Try signing up with different email

### Redirect loop after sign-up
- Check email confirmation setting (should be OFF for MVP)
- Verify `/auth/callback` route exists
- Check Supabase email redirect URL is correct

### Build fails on Vercel
- Run `npm run build` locally to see error first
- Check Vercel deployment logs
- Ensure all environment variables are set

## What Works Now

✅ **Authentication**
- Email/password sign-up
- Email/password sign-in
- Session persistence

✅ **Workspaces**
- Create workspace
- View all workspaces
- Dashboard per workspace

✅ **Channels**
- Create channels
- Send/view messages
- Channel sidebar

✅ **Documents**
- Create/edit markdown documents
- View as markdown
- Delete documents

✅ **Search**
- Full-text search across workspace

✅ **Live Features**
- Real-time updates
- RLS (Row-Level Security)
- Role-based access

## Quick Start for Friends/Testers

1. Visit your Vercel URL
2. Click "Sign Up"
3. Enter email and password
4. Click "Create Workspace"
5. Create a channel
6. Send messages
7. Create documents

That's it! 🚀

---

**Questions?** Check:
- Local build: `npm run build`
- Type check: `npm run type-check`
- Supabase dashboard logs
- Vercel deployment logs (Settings > Deployments)
