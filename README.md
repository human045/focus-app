# Focus App v2

Minimal Pomodoro timer with **Google OAuth + Email/Password auth**, per-user task persistence, streak tracking, dark/light mode.

**Stack:** Next.js 14 · Supabase (Auth + Postgres) · Vercel · Tailwind CSS

---

## Quick Start

### 1. Install
```bash
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/migrations/001_init.sql`
3. **Authentication → Providers → Email** — should be ON by default
4. **Authentication → Providers → Google** — enable and add your Google OAuth credentials
   - Create credentials at [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0 Client ID
   - Authorised redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`

### 3. Configure environment
```bash
cp .env.example .env.local
```
Fill in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Run
```bash
npm run dev
# → http://localhost:3000
```

---

## Deploy to Vercel

```bash
# Push to GitHub first
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR_USER/focus-app.git
git push -u origin main
```

Then on [vercel.com](https://vercel.com):
1. Import the GitHub repo
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your Vercel URL
3. Deploy

**After deploy:**
- Supabase → Authentication → URL Configuration → add `https://your-app.vercel.app/**` to Redirect URLs
- Google Console → OAuth client → add `https://your-app.vercel.app` to Authorised origins

---

## Auth methods

| Method | How it works |
|--------|-------------|
| Email + Password | User signs up, receives confirmation email, then can sign in |
| Google OAuth | One-click, no password needed |

Both methods share the same user profile, todos, and settings in Supabase.

**Email confirmation:** enabled by default in Supabase. To disable during development: Authentication → Settings → toggle off "Confirm email".

---

## Project structure

```
src/
├── app/
│   ├── auth/
│   │   ├── page.tsx          # Sign in / Sign up (email + Google)
│   │   └── callback/
│   │       └── route.ts      # Handles OAuth redirect + email confirm
│   ├── dashboard/
│   │   └── page.tsx          # Protected page, loads data server-side
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx              # Redirects → /auth or /dashboard
├── components/
│   ├── DashboardClient.tsx   # Main client shell, state + Supabase calls
│   ├── timer/
│   │   └── Timer.tsx         # Pomodoro ring timer
│   ├── todos/
│   │   └── TodoList.tsx      # Task list with filters + pom tracking
│   ├── stats/
│   │   └── StatsPanel.tsx    # Streak + 14-day chart
│   └── ui/
│       ├── Topbar.tsx
│       └── SettingsPanel.tsx
├── lib/supabase/
│   ├── client.ts             # Browser client
│   └── server.ts             # Server component client
├── middleware.ts             # Protects /dashboard, redirects /auth if logged in
└── types/index.ts
supabase/
└── migrations/
    └── 001_init.sql          # All tables + RLS + triggers
```

---

## Database tables

| Table | Description |
|-------|-------------|
| `profiles` | Auto-created from Google/email user metadata |
| `todos` | Per-user tasks with pom tracking |
| `pomo_sessions` | Each completed session for stats |
| `user_settings` | Timer config + theme, per user |
| `daily_focus_stats` | View: sessions grouped by day for streak/chart |

All tables use Row Level Security — users can only access their own data.
