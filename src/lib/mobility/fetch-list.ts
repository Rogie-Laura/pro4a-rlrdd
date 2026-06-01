import { VEHICLE_DATA_TABLE } from '@/lib/mobility/types';
import type { VehicleRecord } from '@/lib/mobility/types';
import type { VehicleScope } from '@/lib/auth/roles';
import { expandOfficeAliases } from '@/lib/mobility/office-aliases';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';

export type VehiclePageParams = {
  search: string;
  limit: number;
  offset: number;
  scope: VehicleScope | null;
};

export type VehiclePage = {
  records: VehicleRecord[];
  total: number;
  error?: string;
};

function buildSearchFilter(search: string): string | null {
  const query = search.trim();
  if (!query) {
    return null;
  }

  const pattern = `%${query.replace(/[%_]/g, '')}%`;

  return [
    `plate_num.ilike.${pattern}`,
    `chasis_num.ilike.${pattern}`,
    `engine_num.ilike.${pattern}`,
    `office.ilike.${pattern}`,
    `unit.ilike.${pattern}`,
    `make.ilike.${pattern}`,
    `vehicle_type.ilike.${pattern}`,
    `status.ilike.${pattern}`,
    `source.ilike.${pattern}`,
    `defects_noted.ilike.${pattern}`,
  ].join(',');
}

function resolveScopeFilters(scope: VehicleScope | null): {
  office: string | null;
  unit: string | null;
  includeSubUnits: boolean;
  incomplete: boolean;
} {
  if (!scope) {
    return { office: null, unit: null, includeSubUnits: false, incomplete: false };
  }

  const office = scope.office.trim();
  const unit = scope.unit.trim();

  if (!office || !unit) {
    return { office: null, unit: null, includeSubUnits: false, incomplete: true };
  }

  return {
    office,
    unit,
    includeSubUnits: scope.includeSubUnits,
    incomplete: false,
  };
}

function quotePostgrestFilterValue(value: string): string {
  if (/[,()]/.test(value) || /\s/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function buildIlikeOrFilter(column: string, values: string[]): string {
  return values.map((value) => `${column}.ilike.${quotePostgrestFilterValue(value)}`).join(',');
}

function applyVehicleScope<T extends { or: (filters: string) => T; ilike: (col: string, val: string) => T }>(
  query: T,
  scope: VehicleScope | null
): { query: T; incomplete: boolean } {
  const { office, unit, includeSubUnits, incomplete } = resolveScopeFilters(scope);

  if (incomplete) {
    return { query, incomplete: true };
  }

  if (!office || !unit) {
    return { query, incomplete: false };
  }

  const officeVariants = expandOfficeAliases(office);
  let scopedQuery =
    officeVariants.length > 1
      ? query.or(buildIlikeOrFilter('office', officeVariants))
      : query.ilike('office', office);

  if (includeSubUnits) {
    scopedQuery = scopedQuery.or(
      buildIlikeOrFilter('unit', [unit, `${unit}-%`])
    );
  } else {
    scopedQuery = scopedQuery.ilike('unit', unit);
  }

  return { query: scopedQuery, incomplete: false };
}

export async function getVehiclePage(params: VehiclePageParams): Promise<VehiclePage> {
  if (!hasAdminClient()) {
    return {
      records: [],
      total: 0,
      error: 'Missing SUPABASE_SERVICE_ROLE_KEY in .env.local',
    };
  }

  try {
    const admin = createAdminClient();
    const searchFilter = buildSearchFilter(params.search);
    const { incomplete } = resolveScopeFilters(params.scope);

    if (incomplete) {
      return {
        records: [],
        total: 0,
        error: 'Your account is missing office or unit. Contact an administrator.',
      };
    }

    let query = admin
      .from(VEHICLE_DATA_TABLE)
      .select('*', { count: 'exact' })
      .order('id', { ascending: false });

    const scoped = applyVehicleScope(query, params.scope);
    query = scoped.query;

    if (searchFilter) {
      query = query.or(searchFilter);
    }

    const { data, error, count } = await query.range(
      params.offset,
      params.offset + params.limit - 1
    );

    if (error) {
      if (error.code === '42P01' || error.message.includes('vehicle_data')) {
        return {
          records: [],
          total: 0,
          error: 'Vehicle table not set up yet. Run sql/004_vehicle_data.sql in Supabase SQL Editor.',
        };
      }

      return {
        records: [],
        total: 0,
        error: error.message,
      };
    }

    return {
      records: (data ?? []) as VehicleRecord[],
      total: count ?? 0,
    };
  } catch (error) {
    return {
      records: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unable to load vehicle data.',
    };
  }
}
