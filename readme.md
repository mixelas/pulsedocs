git config --list# PulseDocs

A modern SaaS platform combining Slack-style channels with Notion-style documentation. PulseDocs helps teams unify communication and knowledge management in a single workspace, eliminating context switching between tools.

## Features

### Core Features (Phase 3)
- **Workspace Management** - Isolated team spaces with role-based access control (owner, admin, member, guest)
- **Authentication** - Email/password auth with session persistence
- **Channels** - Real-time team communication with message history
- **Documents** - Markdown-based knowledge base with folder organization
- **Search** - Full-text search across documents and messages using PostgreSQL vectors
- **Responsive UI** - Desktop, tablet, and mobile support with Tailwind CSS

### Advanced Features (Phase 4)
- **Real-time Subscriptions** - Live updates for messages, channels, and documents using Supabase Realtime
- **Notifications** - Mention alerts, comment notifications, and activity digests with bell icon UI
- **Member Management** - Invite members, manage roles, revoke invitations, with pending state tracking
- **Document Comments** - Inline threading, edit/delete with author permissions, comment count badges
- **Activity Logs** - Comprehensive workspace audit trail with event categorization and metadata

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime), Server Actions for type-safe mutations
- **Database**: PostgreSQL with Row-Level Security (RLS) policies, full-text search vectors
- **Deployment**: Optimized for Vercel

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier: [supabase.com](https://supabase.com))

### Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <repo>
   cd pulsedocs
   npm install
   ```

2. **Create Supabase project:**
   - Sign up at [supabase.com](https://supabase.com)
   - Create a new project and copy the project URL and anon key from **Settings > API**

3. **Configure environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   Add your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

4. **Set up database schema:**
   
   Open your Supabase SQL Editor and run migrations in order:
   - `supabase/migrations/001_initial_schema.sql` - Creates 10 core tables
   - `supabase/migrations/002_functions_and_rls.sql` - Adds RLS policies and helper functions
   - (Optional) `supabase/seed/001_dev_seed.sql` - Loads dev sample data

   ⚠️ **Important**: Keep "Enable Automatic RLS" disabled. PulseDocs uses explicit RLS policies.

5. **Run dev server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                      # Next.js App Router (pages, layouts, server actions)
│   ├── actions/             # Server Actions (workspace, members, notifications, comments, activity)
│   ├── auth/                # Authentication flows (signin, signup, confirm)
│   ├── dashboard/           # Workspace switcher and creation
│   ├── workspace/[id]/      # Workspace shell and sub-routes
│   │   ├── channels/        # Channel creation and messaging
│   │   ├── docs/            # Document management and viewing
│   │   ├── search/          # Full-text search interface
│   │   ├── members/         # Member management and invitations
│   │   ├── activity/        # Audit log and event history
│   │   └── notifications/   # Notification center
│   └── page.tsx             # Landing page
├── components/              # Reusable React components
│   ├── NotificationBell      # Real-time notification dropdown
│   ├── InviteMembers        # Member invitation form
│   ├── DocumentComments     # Comment threading UI
│   ├── ActivityFeed         # Audit trail display
│   └── ...
├── hooks/                   # Custom React hooks
│   ├── useMessagesSubscription      # Real-time message listener
│   ├── useChannelsSubscription      # Real-time channel listener
│   ├── useDocumentsSubscription     # Real-time document listener
│   ├── useDocumentCommentsSubscription # Real-time comment listener
│   └── useNotificationsSubscription    # Real-time notification listener
├── lib/                     # Utility modules
│   ├── supabase/           # Client and server Supabase factories
│   ├── auth-helpers.ts     # Auth and permission utilities
│   ├── permissions.ts      # Role-based permission checks
│   └── constants.ts        # App-wide constants
├── types/
│   ├── database.ts         # Database table types (10 tables)
│   └── index.ts            # Re-exports
└── middleware.ts           # Auth session middleware

supabase/
├── migrations/             # SQL schema and RLS policy definitions
└── seed/                   # Development fixture data

public/                     # Static assets
```

## Architecture Decisions

### Server Actions
All mutations (create, update, delete) use Next.js Server Actions for:
- Type safety across network boundary
- Permission checks at data access layer
- Optimistic UI updates in client
- Reduced attack surface (sensitive logic server-side)

### Real-time Subscriptions
Client components use custom React hooks (`useXxxSubscription`) that:
- Fetch initial state with Server Actions
- Subscribe to `postgres_changes` events for live updates
- Handle INSERT/UPDATE/DELETE events with optimistic state
- Auto-cleanup subscriptions on unmount

### Row-Level Security (RLS)
All table access enforced at database layer:
- Workspace members can only see content they have access to
- Role-based filters on channels, documents, messages
- No admin bypass - RLS applies to all authenticated users
- Server Actions verify role before mutations

### Search Implementation
Full-text search uses PostgreSQL:
- `tsvector` columns updated via triggers on document/message inserts
- Search ranking by relevance and recency
- Instant filtering without external search service

## Development

```bash
# Type check
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## Roadmap

- **Phase 5**: Direct messaging and video calls
- **Phase 6**: Collaborative editing and version history
- **Phase 7**: Integrations (Slack, Zapier, GitHub)
- **Phase 8**: Advanced analytics and insights
- **Phase 9**: Mobile apps (React Native)
- **Phase 10**: Enterprise features (SSO, audit logs export)
- **Phase 11**: AI-powered search and summarization

## Contributing

This is an actively developed project. Contributions welcome—open issues for bugs or feature requests.

## License

MIT
8. Workspace Dashboard
9. Notifications & Comments
10. Polish & Responsive Design
11. Testing & Deployment

## Development Workflow

```bash
# Start dev server
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Start production server
npm start
```

## Database Schema Overview

Key entities in Supabase PostgreSQL:

- `users` - User accounts (managed by Supabase Auth)
- `workspaces` - Team/organization workspaces
- `workspace_members` - Membership with role-based access
- `channels` - Team communication channels
- `messages` - Channel messages
- `documents` - Knowledge base documents
- `folders` - Document organization
- `document_comments` - Comments on documents
- `notifications` - User notifications
- `activity_logs` - Workspace activity history

Row-Level Security (RLS) policies ensure users only access data from workspaces they're members of.

## Deployment

The app is built for deployment on Vercel:

1. Push your code to GitHub
2. Connect the repository to Vercel
3. Set environment variables in Vercel dashboard
4. Vercel auto-deploys on push to main branch

[Learn more about Vercel deployment](https://vercel.com/docs/frameworks/nextjs)

## Roadmap

### MVP (Phase 1-11)
- Authentication and workspaces
- Channels with messaging
- Document management
- Basic search
- Notifications
- Dashboard overview

### Future Features
- Real-time collaborative editing
- Video/audio calls
- File attachments and uploads
- Advanced document versioning
- Team analytics
- Integrations (Slack, GitHub, etc.)
- Mobile native apps

## Contributing

This is a portfolio project, but contributions and suggestions are welcome!

## License

MIT License - feel free to use this project as a reference or foundation for your own work.

## Support

For issues or questions:
- Check the implementation plan in `/memories/session/plan.md`
- Review Supabase documentation at [supabase.com/docs](https://supabase.com/docs)
- Check Next.js documentation at [nextjs.org/docs](https://nextjs.org/docs)

---

**Author:** Built as a modern team collaboration SaaS MVP  
**Last Updated:** March 25, 2026
