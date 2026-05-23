# PulseDocs Deployment Guide

## Prerequisites
- Supabase project (free tier)
- Vercel account
- Node.js 18+

## Local Development

### 1. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key from **Settings > API**
3. Create `.env.local`:
```bash
cp .env.local.example .env.local
```
4. Add your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Set up database schema
In Supabase SQL Editor, run migrations in order:
```sql
-- 1. Initial schema (creates all tables)
-- Copy content of: supabase/migrations/001_initial_schema.sql

-- 2. RLS policies and functions
-- Copy content of: supabase/migrations/002_functions_and_rls.sql

-- 3. (Optional) Dev seed data
-- Copy content of: supabase/seed/001_dev_seed.sql
```

### 3. Run locally
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### 1. Push to GitHub
```bash
git add .
git commit -m "MVP ready for deployment"
git push origin main
```

### 2. Deploy on Vercel
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
5. Deploy

### 3. Important: Configure Supabase for Email Confirmations (Production)

**Option A: Enable Email Confirmations** (recommended for production)
1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Under "Email Templates", customize the confirmation link to point to your Vercel domain
4. Users will receive confirmation emails (Supabase free tier allows limited emails/day)

**Option B: Disable Email Confirmations** (fastest for MVP testing)
1. In Supabase → Authentication → Providers
2. Disable "Email Confirmations"
3. Users can sign up and immediately sign in

For live demo testing, use **Option B** to get instant sign-ups working.

## Features

### Authentication
- Sign up with email/password
- Sign in with email/password
- Sign out
- Session persistence via cookies

### Workspaces
- Create workspaces
- Switch between workspaces
- Dashboard with recent activity

### Channels
- Create channels
- Send/view messages
- Channel sidebar navigation

### Documents
- Create markdown documents
- Edit with live preview
- Organize documents
- Delete documents

### Search
- Full-text search across docs, messages, channels
- Results categorized by type

## Troubleshooting

### Sign-up not working
1. Check `.env.local` / Vercel env vars are set correctly
2. Verify Supabase project is active
3. If email confirmation is enabled, check spam folder
4. See "Configure Supabase for Email Confirmations" above

### Database errors
1. Verify all migrations ran in SQL Editor
2. Check RLS policies are enabled
3. Confirm auth user has workspace membership

### Build fails on Vercel
1. Check `npm run type-check` passes locally
2. Ensure all `.env.local` vars are in Vercel settings
3. Check error logs in Vercel dashboard

## Database Schema

Tables created by migrations:
- `auth.users` (Supabase managed)
- `workspaces` - team spaces
- `workspace_members` - membership with roles
- `channels` - discussion channels
- `messages` - channel messages
- `documents` - knowledge base
- `document_folders` - doc organization
- `document_comments` - doc collaboration
- `notifications` - user notifications
- `activity_logs` - audit trail
- `workspace_invitations` - pending invites

## Next Steps (Future)

Phase 5: Direct messaging & video calls
Phase 6: Collaborative editing with version history
Phase 7: Integrations (Slack, GitHub)
Phase 8: AI-powered search

## Support

Issues? Check:
1. Browser console for errors
2. Supabase dashboard for database logs
3. Vercel dashboard for deployment logs
4. GitHub issues (if applicable)
