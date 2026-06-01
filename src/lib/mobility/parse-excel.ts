import * as XLSX from 'xlsx';
import type { VehicleImportRow } from '@/lib/mobility/types';

type ImportField = keyof VehicleImportRow;

const HEADER_ALIASES: Record<string, ImportField> = {
  plate_num: 'plate_num',
  plate: 'plate_num',
  plate_no: 'plate_num',
  plate_number: 'plate_num',
  platenum: 'plate_num',
  chasis_num: 'chasis_num',
  chassis_num: 'chasis_num',
  chasis: 'chasis_num',
  chassis: 'chasis_num',
  chasis_no: 'chasis_num',
  chassis_no: 'chasis_num',
  chasis_number: 'chasis_num',
  chassis_number: 'chasis_num',
  engine_num: 'engine_num',
  engine: 'engine_num',
  engine_no: 'engine_num',
  engine_number: 'engine_num',
  enginenum: 'engine_num',
  office: 'office',
  unit: 'unit',
  make: 'make',
  vehicle_type: 'vehicle_type',
  vehicletype: 'vehicle_type',
  type: 'vehicle_type',
  status: 'status',
  source: 'source',
  defects_noted: 'defects_noted',
  defects: 'defects_noted',
  defect: 'defects_noted',
  defects_noted_remarks: 'defects_noted',
  remarks: 'defects_noted',
};

function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[#\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function cellToString(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  return String(value).trim() || null;
}

function hasAnyValue(row: Partial<VehicleImportRow>): boolean {
  return VEHICLE_FIELDS.some((field) => {
    const value = row[field];
    return typeof value === 'string' && value.trim() !== '';
  });
}

const VEHICLE_FIELDS: ImportField[] = [
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
];

function mapRecord(record: Record<string, unknown>): {
  row: VehicleImportRow | null;
  error: string | null;
} {
  const mapped: Partial<VehicleImportRow> = {
    status: 'Active',
  };

  for (const [key, value] of Object.entries(record)) {
    const normalized = normalizeHeader(key);
    const field = HEADER_ALIASES[normalized];

    if (!field) {
      continue;
    }

    if (field === 'status') {
      mapped.status = cellToString(value) ?? 'Active';
      continue;
    }

    mapped[field] = cellToString(value);
  }

  if (!hasAnyValue(mapped)) {
    return { row: null, error: null };
  }

  const hasIdentifier =
    !!mapped.plate_num?.trim() || !!mapped.chasis_num?.trim() || !!mapped.engine_num?.trim();

  if (!hasIdentifier) {
    return {
      row: null,
      error: 'At least one of plate_num, chasis_num, or engine_num is required.',
    };
  }

  return {
    row: {
      plate_num: mapped.plate_num ?? null,
      chasis_num: mapped.chasis_num ?? null,
      engine_num: mapped.engine_num ?? null,
      office: mapped.office ?? null,
      unit: mapped.unit ?? null,
      make: mapped.make ?? null,
      vehicle_type: mapped.vehicle_type ?? null,
      status: mapped.status?.trim() || 'Active',
      source: mapped.source ?? null,
      defects_noted: mapped.defects_noted ?? null,
    },
    error: null,
  };
}

export function parseVehicleExcel(buffer: ArrayBuffer): {
  rows: VehicleImportRow[];
  errors: string[];
} {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return { rows: [], errors: ['No worksheet found in the Excel file.'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });

  if (rawRows.length === 0) {
    return { rows: [], errors: ['The Excel file has no data rows.'] };
  }

  const rows: VehicleImportRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((record, index) => {
    const { row, error } = mapRecord(record);

    if (error) {
      errors.push(`Row ${index + 2}: ${error}`);
      return;
    }

    if (row) {
      rows.push(row);
    }
  });

  return { rows, errors };
}
