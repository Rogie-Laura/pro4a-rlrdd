-- RLRDD mobility: vehicle inventory table.
-- Run in the same Supabase project as pro4a-rprmd.

create table if not exists public.vehicle_data (
  id bigint generated always as identity primary key,
  plate_num text,
  chasis_num text,
  engine_num text,
  office text,
  unit text,
  make text,
  vehicle_type text,
  status text not null default 'Active',
  source text,
  defects_noted text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_vehicle_data_plate_num
  on public.vehicle_data (plate_num);

create index if not exists idx_vehicle_data_office
  on public.vehicle_data (office);

create index if not exists idx_vehicle_data_unit
  on public.vehicle_data (unit);

create index if not exists idx_vehicle_data_status
  on public.vehicle_data (status);

alter table public.vehicle_data enable row level security;

-- App uses service role on the server after session checks (same as personnel_list).
drop policy if exists "vehicle_data_select" on public.vehicle_data;
drop policy if exists "vehicle_data_insert" on public.vehicle_data;
drop policy if exists "vehicle_data_update" on public.vehicle_data;
drop policy if exists "vehicle_data_delete" on public.vehicle_data;

notify pgrst, 'reload schema';
