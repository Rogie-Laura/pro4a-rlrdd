-- Replace legacy rlrdd_* roles with logistics roles.
-- Run in Supabase SQL Editor after 001_rlrdd_auth.sql (and 019_users_access_page.sql if used).

update public.users
set role = 'RLRDD_admin'
where role = 'rlrdd_admin';

update public.users
set role = 'stn_logistics'
where role in ('rlrdd_officer', 'rlrdd_staff');

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

update public.users
set access_page = 'RLRDD'
where role in ('RLRDD_admin', 'stn_logistics', 'phq_logistics', 'rhq_logistics')
  and access_page = 'RPRMD';

notify pgrst, 'reload schema';
