-- Remove model column from vehicle_data (not used in RLRDD mobility table).
alter table public.vehicle_data drop column if exists model;

notify pgrst, 'reload schema';
