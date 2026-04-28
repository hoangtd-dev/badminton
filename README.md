# 🏸 Badminton Group Manager

Full-stack web app for managing a badminton group of ~10 people. Dark theme, admin/user roles, balance tracking, attendance, stats, and WhatsApp notifications.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS v4
- **Backend**: Node.js + Express + TypeScript
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Notifications**: WhatsApp via CallMeBot (free)
- **Deploy**: Vercel (frontend) + Render (backend)

---

## 1. Supabase Setup

### Create project at [supabase.com](https://supabase.com) (free tier), then run this SQL in the SQL Editor:

```sql
-- Users extended from Supabase auth
create table profiles (
  id uuid references auth.users primary key,
  full_name text not null,
  phone text,
  whatsapp_api_key text,
  role text default 'user',
  balance numeric default 0,
  low_balance_threshold numeric default 25,
  avatar_url text,
  created_at timestamptz default now()
);

-- Sessions
-- status is derived at runtime: 'completed' is stored after finalization;
-- 'ongoing' when played_at date <= today; 'upcoming' otherwise.
create table sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  played_at timestamptz not null,
  location text,
  status text default 'upcoming',
  cost_per_player numeric default 0,
  duration_hours numeric default 2,
  vote_token text unique,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Attendances
-- voted = true when the player checked in via the public vote link (cannot be removed by admin)
create table attendances (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  player_id uuid references profiles(id),
  checked_in_at timestamptz,
  hours_attended numeric,
  fee_charged numeric default 0,
  voted boolean not null default false,
  unique(session_id, player_id)
);

-- Transactions
create table transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references profiles(id),
  amount numeric not null,
  type text not null,
  description text,
  session_id uuid references sessions(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Group expenses (player_id = null means equal split, set means individual charge)
create table group_expenses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  category text not null,
  amount numeric not null,
  note text,
  player_id uuid references profiles(id),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);
```

### Row Level Security (RLS)

> **Important**: The policies below use a `SECURITY DEFINER` helper function to avoid infinite recursion. Policies that query `profiles` from within a `profiles` policy cause PostgreSQL error `42P17`. Run the function first.

```sql
-- Helper function to get current user's role without triggering RLS recursion
create or replace function public.get_my_role()
returns text
language sql
security definer
stable
as $$
  select role from profiles where id = auth.uid()
$$;

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table sessions enable row level security;
alter table attendances enable row level security;
alter table transactions enable row level security;
alter table group_expenses enable row level security;

-- profiles: users see own, admins see all (use get_my_role() to avoid recursion)
create policy "Users can view own profile" on profiles
  for select using (auth.uid() = id);
create policy "Admins can view all profiles" on profiles
  for select using (get_my_role() = 'admin');
create policy "Users can update own profile" on profiles
  for update using (auth.uid() = id);
create policy "Admins can update all profiles" on profiles
  for update using (get_my_role() = 'admin');
create policy "Admins can insert profiles" on profiles
  for insert with check (get_my_role() = 'admin');

-- sessions: authenticated users can read
create policy "Auth users can view sessions" on sessions
  for select using (auth.role() = 'authenticated');

-- attendances: authenticated can read, users can insert/update own
create policy "Auth users can view attendances" on attendances
  for select using (auth.role() = 'authenticated');
create policy "Users can insert own attendance" on attendances
  for insert with check (player_id = auth.uid());
create policy "Users can update own attendance" on attendances
  for update using (player_id = auth.uid());

-- transactions: users see own, admins see all
create policy "Users view own transactions" on transactions
  for select using (player_id = auth.uid());
create policy "Admins view all transactions" on transactions
  for select using (get_my_role() = 'admin');

-- group_expenses: authenticated can read
create policy "Auth users can view expenses" on group_expenses
  for select using (auth.role() = 'authenticated');
create policy "Auth users can insert expenses" on group_expenses
  for insert with check (auth.role() = 'authenticated');
```

### Create the first admin user

1. Go to Supabase → Authentication → Users → Add user
2. Then in SQL Editor:

```sql
insert into profiles (id, full_name, role)
values ('<user-uuid-from-auth>', 'Your Name', 'admin');
```

### Auto-create profiles on signup (optional trigger)

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

---

## 2. WhatsApp Notifications (CallMeBot — Free)

Each member who wants WhatsApp notifications must:

1. Send this message to **+34 644 56 55 18** on WhatsApp:
   ```
   I allow callmebot to send me messages
   ```
2. They'll receive a personal API key
3. Member (or admin) enters their phone + API key in Settings

**Limits**: ~80 messages/day per sender — plenty for a 10-person group.

---

## 3. Local Development

```bash
# Clone & setup
git clone <repo>

# Frontend
cd frontend
npm install
npm run dev                    # http://localhost:5174

# Backend
cd backend
npm install
npm run dev                    # http://localhost:3001
```

---

## 4. Deploy

### Frontend → Vercel

```bash
cd frontend
vercel --prod
# Set env vars in Vercel dashboard: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
```

### Backend → Render

1. Connect GitHub repo
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Set env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FRONTEND_URL`

> **Note**: Render free tier sleeps after 15 min inactivity (~30s cold start). Use Supabase Edge Functions as an alternative.

---

## Features

| Feature                | User | Admin |
| ---------------------- | ---- | ----- |
| Dashboard (personal)   | ✅   | ✅    |
| View sessions          | ✅   | ✅    |
| Check in to session    | ✅   | ✅    |
| View own transactions  | ✅   | ✅    |
| Personal stats & chart | ✅   | ✅    |
| Create/delete sessions | ❌   | ✅    |
| Check in for others    | ❌   | ✅    |
| Add session expenses   | ❌   | ✅    |
| Finalize & deduct fees | ❌   | ✅    |
| Top up member balance  | ❌   | ✅    |
| View all transactions  | ❌   | ✅    |
| Manage members         | ❌   | ✅    |
| Send WhatsApp alerts   | ❌   | ✅    |
| Export CSV             | ❌   | ✅    |
