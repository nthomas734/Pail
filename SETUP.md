# yarinokoshi — Setup Guide

Same flow as daizu. About 15 minutes end-to-end.

## What you'll do

1. Create a new GitHub repo and upload these files
2. Create a new Supabase project and run one SQL script
3. Deploy to Vercel and add 2 environment variables
4. Install on phones as a PWA

---

## Step 1 — GitHub

1. Go to https://github.com/new
2. Repo name: `yarinokoshi` (or whatever you want)
3. Make it Private
4. Click **Create repository**
5. On the empty repo page, click **uploading an existing file** (or drag-and-drop the unzipped folder contents into the page)
6. Drag every file from this zip into GitHub. **Important:** drag the contents, not the outer `yarinokoshi` folder itself. You should see `package.json`, `next.config.js`, `src/`, `public/` etc. at the repo root.
7. Scroll down → **Commit changes**

---

## Step 2 — Supabase

1. Go to https://supabase.com/dashboard and click **New project**
2. Name it `yarinokoshi`
3. Pick a strong database password and save it (you won't need it for the app, but you'll need it later if you ever want raw DB access)
4. Region: pick the one closest to you
5. Click **Create new project** and wait ~2 minutes

### Run the schema

1. Once the project is ready, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste the entire block below and click **Run**:

```sql
-- yarinokoshi schema
create extension if not exists "uuid-ossp";

create table if not exists items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  category text not null,
  time_window text not null default 'any',
  status text not null default 'dreaming',
  notes text,
  added_by text,
  completed_by text,
  completed_at timestamptz,
  memory_photo text,
  memory_note text,
  created_at timestamptz not null default now()
);

-- Enable Row Level Security but allow anon read/write
-- (this is a private app for two people, anon key is acceptable)
alter table items enable row level security;

create policy "anon can read" on items for select using (true);
create policy "anon can insert" on items for insert with check (true);
create policy "anon can update" on items for update using (true);
create policy "anon can delete" on items for delete using (true);
```

You should see **Success. No rows returned.**

### Set up photo storage

1. Click **Storage** in the left sidebar
2. Click **New bucket**
3. Name: `memories`
4. Toggle **Public bucket** to ON (so the photos can render in the app)
5. Click **Create bucket**

Then add a policy so the app can upload:

1. Click into the `memories` bucket
2. Click **Policies** tab at the top
3. Click **New policy** → **For full customization**
4. Policy name: `anon can upload`
5. Allowed operation: check **INSERT**
6. Target roles: leave as `public` (default — this means the anon key works)
7. WITH CHECK expression: `true`
8. Click **Review** → **Save policy**

Repeat for read access if needed:
- Most public buckets allow public reads automatically. If photos don't load, add another policy for SELECT with `true`.

### Get your keys

1. Click **Project Settings** (gear icon, bottom left)
2. Click **API** in the left sub-menu
3. You need two values from this page:
   - **Project URL** (under "Project URL")
   - **anon public** key (under "Project API keys" → look for the row labeled `anon` `public`)
4. Keep this tab open — you'll paste them into Vercel next

---

## Step 3 — Vercel

1. Go to https://vercel.com/new
2. Import your `yarinokoshi` GitHub repo (you may need to grant Vercel access to it)
3. **Before** clicking Deploy, expand **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (paste Project URL from Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (paste anon public key from Supabase) |

4. Click **Deploy**
5. Wait ~2 minutes. You'll get a URL like `yarinokoshi-xyz.vercel.app`

---

## Step 4 — Install as PWA on phones

### iPhone
1. Open the Vercel URL in **Safari** (not Chrome — only Safari can install PWAs on iOS)
2. Tap the share icon (square with arrow up)
3. Scroll down → **Add to Home Screen**
4. Tap **Add**

### Android
1. Open the URL in Chrome
2. Tap the menu (⋮) → **Add to Home screen** or **Install app**

---

## Optional — Tag who's adding what

The app silently tracks who added/completed each item. To turn this on for a specific phone, open the browser console once on that phone and run:

```javascript
localStorage.setItem('yarinokoshi_user', 'nathan')
```

Or for your wife's phone:
```javascript
localStorage.setItem('yarinokoshi_user', 'her_name')
```

This is optional — the app works fine without it. Attribution is stored but not shown in the UI by default. If you ever want to show it, ping the next chat and we can add a toggle.

(If you don't want to mess with the console, we can also add a one-time "who is this?" prompt in a future update.)

---

## Troubleshooting

**Vercel deploy fails with a security warning about React versions:** the package.json in this zip already pins to the safe versions (next 15.5.7, react 19.2.1). If you see this, double-check that GitHub actually has the package.json from this zip, not an older one.

**"Cannot find module '@supabase/supabase-js'":** Vercel didn't install dependencies. Trigger a redeploy from the Vercel dashboard.

**Items don't appear after adding:** Check that the Supabase SQL ran successfully and that your env vars in Vercel exactly match the Supabase URL and anon key (no trailing spaces).

**Photos won't upload:** Check that the `memories` bucket exists, is public, and has the INSERT policy described above.

**The page is blank:** Open the browser console (Safari → Develop → [device]) and look for the error. Most likely the env vars are missing or wrong.

---

## What's in v1

- **Board view** — all items with category filters, status badges, flap-text status animation
- **Timeline view** — 17-month layout from now to September 2027, items dropped into their time windows
- **Memories view** — photo grid of completed items
- **Add item** — floating + button, modal with title / category / time window / optional notes
- **Item detail** — tap any row, change status, attach photo + memory note when departed
- **Subtle countdown** — bottom of board, shows days remaining to San Diego
- **Bottom tab bar + horizontal swipe** to switch views
- **PWA** — installs to home screen on iOS and Android

## What's not in v1 (could be added later)

- "Who added what" attribution displayed in UI
- Push notifications when partner adds something
- Categories beyond the 9 built in
- Custom time windows (e.g. "first weekend of June 2027")
- Sharing memories outside the app
- Export to a printable list for the move

Let me know what you want next once you've used it for a week.
