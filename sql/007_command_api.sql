-- RLRDD command integration API: read-only vehicle data for external analytics.
-- Uses the shared api_keys table (created by pro4a-rprmd/sql/013_command_api.sql).

create or replace function public.command_rlrdd_meta()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from public.vehicle_data),
    'last_updated', (select max(updated_at) from public.vehicle_data),
    'checked_at', now()
  );
$$;

revoke execute on function public.command_rlrdd_meta() from anon, authenticated;
grant execute on function public.command_rlrdd_meta() to service_role;

create or replace function public.command_rlrdd_vehicle_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total', (select count(*) from public.vehicle_data),
    'last_updated', (select max(updated_at) from public.vehicle_data),
    'by_status', coalesce((
      select json_agg(json_build_object('label', label, 'count', c) order by c desc)
      from (
        select coalesce(nullif(btrim(status), ''), 'Unknown') as label, count(*) as c
        from public.vehicle_data
        group by 1
      ) s
    ), '[]'::json),
    'by_office', coalesce((
      select json_agg(json_build_object('label', label, 'count', c) order by c desc)
      from (
        select coalesce(nullif(btrim(office), ''), 'Unknown') as label, count(*) as c
        from public.vehicle_data
        group by 1
      ) o
    ), '[]'::json),
    'by_vehicle_type', coalesce((
      select json_agg(json_build_object('label', label, 'count', c) order by c desc)
      from (
        select coalesce(nullif(btrim(vehicle_type), ''), 'Unknown') as label, count(*) as c
        from public.vehicle_data
        group by 1
      ) v
    ), '[]'::json),
    'by_source', coalesce((
      select json_agg(json_build_object('label', label, 'count', c) order by c desc)
      from (
        select coalesce(nullif(btrim(source), ''), 'Unknown') as label, count(*) as c
        from public.vehicle_data
        group by 1
      ) src
    ), '[]'::json),
    'generated_at', now()
  );
$$;

revoke execute on function public.command_rlrdd_vehicle_stats() from anon, authenticated;
grant execute on function public.command_rlrdd_vehicle_stats() to service_role;

create or replace function public.list_vehicle_rlrdd_paged(
  p_search text default '',
  p_limit int default 500,
  p_offset int default 0
)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_result json;
  v_search text := lower(nullif(btrim(coalesce(p_search, '')), ''));
  v_limit int := greatest(1, least(coalesce(p_limit, 500), 5000));
  v_offset int := greatest(0, coalesce(p_offset, 0));
begin
  with filtered as (
    select v.*
    from public.vehicle_data v
    where
      v_search is null
      or lower(
        coalesce(v.plate_num, '') || ' ' ||
        coalesce(v.chasis_num, '') || ' ' ||
        coalesce(v.engine_num, '') || ' ' ||
        coalesce(v.office, '') || ' ' ||
        coalesce(v.unit, '') || ' ' ||
        coalesce(v.make, '') || ' ' ||
        coalesce(v.vehicle_type, '') || ' ' ||
        coalesce(v.status, '') || ' ' ||
        coalesce(v.source, '') || ' ' ||
        coalesce(v.defects_noted, '')
      ) like '%' || v_search || '%'
  ),
  page as (
    select *
    from filtered
    order by id desc
    offset v_offset
    limit v_limit
  )
  select json_build_object(
    'total', (select count(*) from filtered),
    'records', coalesce(
      (
        select json_agg(
          json_build_object(
            'id', pg.id,
            'plate_num', pg.plate_num,
            'chasis_num', pg.chasis_num,
            'engine_num', pg.engine_num,
            'office', pg.office,
            'unit', pg.unit,
            'make', pg.make,
            'vehicle_type', pg.vehicle_type,
            'status', pg.status,
            'source', pg.source,
            'defects_noted', pg.defects_noted,
            'created_at', pg.created_at,
            'updated_at', pg.updated_at
          )
          order by pg.id desc
        )
        from page pg
      ),
      '[]'::json
    )
  )
  into v_result;

  return v_result;
end;
$$;

revoke execute on function public.list_vehicle_rlrdd_paged(text, int, int) from anon, authenticated;
grant execute on function public.list_vehicle_rlrdd_paged(text, int, int) to service_role;

notify pgrst, 'reload schema';
