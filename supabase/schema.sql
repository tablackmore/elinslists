-- Shared ratings for Elin's lists. Run once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Only people listed in public.members can read or write ratings. Everyone else (the public site)
-- sees the lists but no ratings. Replace the two e-mail addresses below before running.

create table if not exists public.ratings (
  list        text        not null,               -- "places" or "recipes" (one per list on the site)
  item        integer     not null,               -- the item's permanent id (not the number shown, which can shift)
  stars       smallint    not null default 0 check (stars between 0 and 5),
  date        date,
  note        text        not null default '',
  updated_at  timestamptz not null default now(),
  updated_by  uuid        default auth.uid(),
  primary key (list, item)
);

create table if not exists public.members (
  email text primary key
);

-- Who may use the ratings. Keep this list short; it is never readable from the site.
insert into public.members (email) values
  ('you@example.com'),
  ('elin@example.com')
on conflict do nothing;

-- Checked by the policies below and by the site (rpc "is_member").
-- security definer: it can read public.members even though the site itself cannot.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.members m where lower(m.email) = lower(auth.jwt() ->> 'email'));
$$;
revoke all on function public.is_member() from public;
grant execute on function public.is_member() to anon, authenticated;

alter table public.ratings enable row level security;
alter table public.members enable row level security;   -- no policies: not readable or writable from the site

drop policy if exists "members read ratings"   on public.ratings;
drop policy if exists "members add ratings"    on public.ratings;
drop policy if exists "members change ratings" on public.ratings;
drop policy if exists "members remove ratings" on public.ratings;
create policy "members read ratings"   on public.ratings for select to authenticated using (public.is_member());
create policy "members add ratings"    on public.ratings for insert to authenticated with check (public.is_member());
create policy "members change ratings" on public.ratings for update to authenticated using (public.is_member()) with check (public.is_member());
create policy "members remove ratings" on public.ratings for delete to authenticated using (public.is_member());

-- keep updated_by honest on every change
create or replace function public.ratings_stamp() returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end $$;
drop trigger if exists ratings_stamp on public.ratings;
create trigger ratings_stamp before insert or update on public.ratings for each row execute function public.ratings_stamp();
