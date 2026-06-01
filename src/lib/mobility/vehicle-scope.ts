import type { VehicleScope } from '@/lib/auth/roles';
import { expandOfficeAliases } from '@/lib/mobility/office-aliases';
import type { VehicleImportRow } from '@/lib/mobility/types';

export function vehicleMatchesScope(
  vehicle: { office: string | null; unit: string | null },
  scope: VehicleScope
): boolean {
  const officeVariants = expandOfficeAliases(scope.office).map((value) => value.toLowerCase());
  const vehicleOffice = (vehicle.office ?? '').trim().toLowerCase();

  if (!officeVariants.includes(vehicleOffice)) {
    return false;
  }

  const scopeUnit = scope.unit.trim().toLowerCase();
  const vehicleUnit = (vehicle.unit ?? '').trim().toLowerCase();

  if (scope.includeSubUnits) {
    return vehicleUnit === scopeUnit || vehicleUnit.startsWith(`${scopeUnit}-`);
  }

  return vehicleUnit === scopeUnit;
}

export function applyScopedOfficeUnit(
  row: VehicleImportRow,
  scope: VehicleScope | null
): { row?: VehicleImportRow; error?: string } {
  if (!scope) {
    return { row };
  }

  if (!scope.office.trim() || !scope.unit.trim()) {
    return { error: 'Your account is missing office or unit. Contact an administrator.' };
  }

  return {
    row: {
      ...row,
      office: scope.office,
      unit: scope.unit,
    },
  };
}
