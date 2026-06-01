-- Remove category column from vehicle_data.
alter table public.vehicle_data drop column if exists category;

notify pgrst, 'reload schema';
