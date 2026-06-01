-- RLRDD app auth: roles, separate session column, and prefixed RPCs.
-- Run in the same Supabase project as pro4a-rprmd.

-- Extend allowed roles (keeps existing RPRMD roles).
alter table public.users drop constraint if exists users_role_check;
alter table public.users add constraint users_role_check check (
  role in (
    'stn_admin',
    'phq_admin',
    'rhq_admin',
    'RPRMD_admin',
    'super_admin',
    'RLRDD_admin',
    'stn_logistics',
    'phq_logistics',
    'rhq_logistics'
  )
);

-- Separate session so RPRMD and RLRDD logins do not invalidate each other.
alter table public.users add column if not exists rlrdd_session text;

create index if not exists idx_users_rlrdd_session
  on public.users (rlrdd_session)
  where rlrdd_session is not null;

create or replace function public.rlrdd_login_user(p_badge text, p_password text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.users%rowtype;
  v_token text;
  v_badge text;
begin
  v_badge := upper(regexp_replace(trim(coalesce(p_badge, '')), '[^A-Za-z0-9]', '', 'g'));

  if v_badge = '' or coalesce(p_password, '') = '' then
    return json_build_object('ok', false, 'message', 'Badge number and password are required.');
  end if;

  select * into v_user
  from public.users
  where badge_number = v_badge
    and is_active = true;

  if not found then
    return json_build_object('ok', false, 'message', 'Invalid badge number or password.');
  end if;

  if extensions.crypt(p_password, v_user.password) is distinct from v_user.password then
    return json_build_object('ok', false, 'message', 'Invalid badge number or password.');
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  update public.users
  set rlrdd_session = v_token,
      updated_at = now()
  where id = v_user.id;

  return json_build_object(
    'ok', true,
    'session_token', v_token,
    'user_id', v_user.id,
    'role', v_user.role
  );
end;
$$;

create or replace function public.rlrdd_get_user_by_session(p_session text)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user public.users%rowtype;
begin
  if coalesce(p_session, '') = '' then
    return null;
  end if;

  select * into v_user
  from public.users
  where rlrdd_session = p_session
    and is_active = true;

  if not found then
    return null;
  end if;

  return json_build_object(
    'id', v_user.id,
    'rank', v_user.rank,
    'full_name', v_user.full_name,
    'rank_fullname', v_user.rank_fullname,
    'badge_number', v_user.badge_number,
    'office', v_user.office,
    'unit', v_user.unit,
    'role', v_user.role,
    'is_active', v_user.is_active
  );
end;
$$;

create or replace function public.rlrdd_logout_user(p_session text)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if coalesce(p_session, '') = '' then
    return;
  end if;

  update public.users
  set rlrdd_session = null,
      updated_at = now()
  where rlrdd_session = p_session;
end;
$$;

revoke execute on function public.rlrdd_login_user(text, text) from anon, authenticated;
revoke execute on function public.rlrdd_get_user_by_session(text) from anon, authenticated;
revoke execute on function public.rlrdd_logout_user(text) from anon, authenticated;

grant execute on function public.rlrdd_login_user(text, text) to anon, authenticated, service_role;
grant execute on function public.rlrdd_get_user_by_session(text) to anon, authenticated, service_role;
grant execute on function public.rlrdd_logout_user(text) to anon, authenticated, service_role;

notify pgrst, 'reload schema';
