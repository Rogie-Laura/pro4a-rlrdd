import type { VehicleImportRow } from '@/lib/mobility/types';

function trimField(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? '').trim();
  return text || null;
}

export function parseVehicleFormData(formData: FormData): {
  row?: VehicleImportRow;
  error?: string;
} {
  const plate_num = trimField(formData.get('plate_num'));
  const chasis_num = trimField(formData.get('chasis_num'));
  const engine_num = trimField(formData.get('engine_num'));

  if (!plate_num && !chasis_num && !engine_num) {
    return { error: 'At least one of Plate#, Chasis#, or Engine# is required.' };
  }

  const status = trimField(formData.get('status')) ?? 'Active';

  return {
    row: {
      plate_num,
      chasis_num,
      engine_num,
      office: trimField(formData.get('office')),
      unit: trimField(formData.get('unit')),
      make: trimField(formData.get('make')),
      vehicle_type: trimField(formData.get('vehicle_type')),
      status,
      source: trimField(formData.get('source')),
      defects_noted: trimField(formData.get('defects_noted')),
    },
  };
}

export function vehicleLabel(record: {
  plate_num?: string | null;
  chasis_num?: string | null;
  engine_num?: string | null;
  id?: number;
}): string {
  return (
    record.plate_num?.trim() ||
    record.chasis_num?.trim() ||
    record.engine_num?.trim() ||
    (record.id != null ? `Vehicle #${record.id}` : 'this vehicle')
  );
}
