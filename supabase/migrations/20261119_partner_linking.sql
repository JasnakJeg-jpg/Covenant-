-- Usage (solo / couple), an extra relationship status, and partner linking via invite codes.

-- 1. New profile columns
alter table public.profiles
  add column if not exists usage text check (usage in ('solo', 'couple')),
  add column if not exists partner_id uuid references public.profiles(id) on delete set null;

alter table public.profiles drop constraint if exists profiles_intent_check;
alter table public.profiles add constraint profiles_intent_check
  check (intent in ('married', 'engaged', 'dating', 'preparing_single', 'study_single'));

-- 2. Members may only write their own non-sensitive columns; partner_id is set only by the functions below.
revoke insert, update on public.profiles from anon, authenticated;
grant insert (id, first_name, date_of_birth, gender, intent, usage, onboarding_completed) on public.profiles to authenticated;
grant update (first_name, date_of_birth, gender, intent, usage, onboarding_completed) on public.profiles to authenticated;

-- 3. Invite codes (one active code per member)
create table if not exists public.partner_invites (
  code text primary key,
  inviter_id uuid not null unique references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
alter table public.partner_invites enable row level security;
revoke all on public.partner_invites from anon, authenticated;
grant select on public.partner_invites to authenticated;
create policy "own invite read" on public.partner_invites
  for select to authenticated using (inviter_id = (select auth.uid()));

-- 4. Functions
create or replace function public.create_partner_invite()
returns text language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  b bytea;
  new_code text;
  idx int;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'Please finish setting up your profile first';
  end if;
  if exists (select 1 from public.profiles where id = me and partner_id is not null) then
    raise exception 'You are already linked with a partner';
  end if;
  loop
    b := uuid_send(gen_random_uuid());
    new_code := '';
    foreach idx in array array[0, 1, 2, 3, 4, 5, 10, 11] loop
      new_code := new_code || substr(alphabet, (get_byte(b, idx) % 32) + 1, 1);
    end loop;
    exit when not exists (select 1 from public.partner_invites where code = new_code);
  end loop;
  delete from public.partner_invites where inviter_id = me;
  insert into public.partner_invites (code, inviter_id) values (new_code, me);
  return new_code;
end $$;

create or replace function public.accept_partner_invite(invite_code text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  inv public.partner_invites;
  partner_name text;
begin
  if me is null then raise exception 'Not signed in'; end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'Please finish setting up your profile first';
  end if;
  select * into inv from public.partner_invites
    where code = upper(replace(trim(invite_code), ' ', '')) and expires_at > now();
  if inv.code is null then raise exception 'That code isn''t valid or has expired'; end if;
  if inv.inviter_id = me then raise exception 'That''s your own code — share it with your partner'; end if;
  if exists (select 1 from public.profiles where id in (me, inv.inviter_id) and partner_id is not null) then
    raise exception 'One of you is already linked with a partner';
  end if;
  update public.profiles set partner_id = inv.inviter_id, usage = 'couple' where id = me;
  update public.profiles set partner_id = me, usage = 'couple' where id = inv.inviter_id
    returning first_name into partner_name;
  delete from public.partner_invites where inviter_id in (me, inv.inviter_id);
  return partner_name;
end $$;

create or replace function public.get_partner()
returns table (id uuid, first_name text) language sql stable security definer set search_path = '' as $$
  select p.id, p.first_name
  from public.profiles me
  join public.profiles p on p.id = me.partner_id and p.partner_id = me.id
  where me.id = auth.uid();
$$;

create or replace function public.unlink_partner()
returns void language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  other uuid;
begin
  if me is null then raise exception 'Not signed in'; end if;
  select partner_id into other from public.profiles where id = me;
  update public.profiles set partner_id = null where id = me;
  if other is not null then
    update public.profiles set partner_id = null where id = other and partner_id = me;
  end if;
end $$;

revoke execute on function public.create_partner_invite(), public.accept_partner_invite(text),
  public.get_partner(), public.unlink_partner() from public, anon;
grant execute on function public.create_partner_invite(), public.accept_partner_invite(text),
  public.get_partner(), public.unlink_partner() to authenticated;
