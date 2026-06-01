import { unstable_cache } from 'next/cache';
import { compareByRank } from '@/lib/personnel/rank-order';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';

export type PersonnelLookupOptions = {
  ranks: string[];
  offices: string[];
  unitsByOffice: Record<string, string[]>;
};

const EMPTY_LOOKUP: PersonnelLookupOptions = {
  ranks: [],
  offices: [],
  unitsByOffice: {},
};

function sortRanks(ranks: string[]): string[] {
  return [...ranks].sort((a, b) =>
    compareByRank(
      { rank: a, rank_name: a, lname: '' },
      { rank: b, rank_name: b, lname: '' },
      'desc'
    )
  );
}

// Office/unit/rank lists change rarely (only on personnel import). Cache the
// RPC result so admins navigating pages don't re-hit the DB each load.
const fetchLookupOptions = unstable_cache(
  async (): Promise<PersonnelLookupOptions> => {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc('personnel_lookup_options');

    if (error || !data) {
      return EMPTY_LOOKUP;
    }

    const parsed = (typeof data === 'string' ? JSON.parse(data) : data) as {
      ranks?: string[];
      offices?: string[];
      units_by_office?: Record<string, string[]>;
    };

    return {
      ranks: sortRanks(parsed.ranks ?? []),
      offices: parsed.offices ?? [],
      unitsByOffice: parsed.units_by_office ?? {},
    };
  },
  ['personnel-lookup-options'],
  { tags: ['personnel-lookup-options'], revalidate: 300 }
);

export async function getPersonnelLookupOptions(): Promise<PersonnelLookupOptions> {
  if (!hasAdminClient()) {
    return EMPTY_LOOKUP;
  }

  return fetchLookupOptions();
}

/** Include a legacy value if it is missing from the lookup list. */
export function withCurrentOption(options: string[], current: string | null | undefined): string[] {
  const value = current?.trim();
  if (!value || options.includes(value)) {
    return options;
  }
  return [value, ...options];
}

export function unitsForOffice(
  lookup: PersonnelLookupOptions,
  office: string,
  currentUnit?: string | null
): string[] {
  const units = lookup.unitsByOffice[office] ?? [];
  return withCurrentOption(units, currentUnit);
}
