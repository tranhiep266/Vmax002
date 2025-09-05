-- Supabase: tạo bảng phones (tuỳ chọn, chạy trong SQL Editor)
create table if not exists public.phones (
  id bigint generated always as identity primary key,
  name text not null,
  brand text not null,
  battery integer not null check (battery >= 0),
  price bigint not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  created_at timestamptz not null default now()
);
alter table public.phones enable row level security;
drop policy if exists "All select" on public.phones;
drop policy if exists "All ins" on public.phones;
drop policy if exists "All upd" on public.phones;
drop policy if exists "All del" on public.phones;
create policy "All select" on public.phones for select using (true);
create policy "All ins"    on public.phones for insert with check (true);
create policy "All upd"    on public.phones for update using (true);
create policy "All del"    on public.phones for delete using (true);
