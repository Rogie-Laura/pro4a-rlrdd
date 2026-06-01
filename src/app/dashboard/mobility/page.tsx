import { VehicleTable } from '@/components/mobility/vehicle-table';
import { getVehiclePage } from '@/lib/mobility/fetch-list';
import {
  canDeleteVehicles,
  formatVehicleScopeLabel,
  getVehicleScopeForUser,
  isScopedVehicleRole,
} from '@/lib/auth/roles';
import { requireRlrddAccess } from '@/lib/auth/session';

const LIMIT_OPTIONS = [50, 100, 250, 500];

type SearchParams = Record<string, string | string[] | undefined>;

function pickString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export default async function MobilityPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const session = await requireRlrddAccess();
  const scope = getVehicleScopeForUser(session.user);
  const deleteVehicles = canDeleteVehicles(session.user?.role);
  const lockOfficeUnit = isScopedVehicleRole(session.user?.role);

  const sp = await searchParams;
  const search = pickString(sp.q).trim();

  const limitParam = Number.parseInt(pickString(sp.limit), 10);
  const limit = LIMIT_OPTIONS.includes(limitParam as (typeof LIMIT_OPTIONS)[number])
    ? limitParam
    : 100;

  const pageParam = Number.parseInt(pickString(sp.page), 10);
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const offset = (page - 1) * limit;

  const data = await getVehiclePage({ search, limit, offset, scope });

  const scopeLabel =
    data.error
      ? null
      : scope && scope.office && scope.unit
        ? formatVehicleScopeLabel(scope)
        : scope
          ? 'Your account has no office/unit assigned — contact an administrator.'
          : null;

  return (
    <VehicleTable
      records={data.records}
      total={data.total}
      search={search}
      limit={limit}
      page={page}
      scopeLabel={scopeLabel}
      fetchError={data.error}
      canDeleteVehicles={deleteVehicles}
      defaultOffice={scope?.office ?? session.user?.office}
      defaultUnit={scope?.unit ?? session.user?.unit}
      lockOfficeUnit={lockOfficeUnit}
    />
  );
}
