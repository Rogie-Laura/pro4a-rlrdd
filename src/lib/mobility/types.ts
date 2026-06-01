export const VEHICLE_DATA_TABLE = 'vehicle_data';

export const VEHICLE_IMPORT_FIELDS = [
  'plate_num',
  'chasis_num',
  'engine_num',
  'office',
  'unit',
  'make',
  'vehicle_type',
  'status',
  'source',
  'defects_noted',
] as const;

export type VehicleImportRow = {
  plate_num: string | null;
  chasis_num: string | null;
  engine_num: string | null;
  office: string | null;
  unit: string | null;
  make: string | null;
  vehicle_type: string | null;
  status: string;
  source: string | null;
  defects_noted: string | null;
};

export type VehicleRecord = {
  id: number;
  plate_num: string | null;
  chasis_num: string | null;
  engine_num: string | null;
  office: string | null;
  unit: string | null;
  make: string | null;
  vehicle_type: string | null;
  status: string | null;
  source: string | null;
  defects_noted: string | null;
  created_at: string;
  updated_at: string;
};
