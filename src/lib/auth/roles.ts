export const DIVISION = {
  code: 'RLRDD',
  directorate: 'RLRDD',
  label: 'PRO4A Property Management Information System',
} as const;

/** Roles allowed to sign in to the RLRDD app */
export const RLRDD_ROLES = [
  'super_admin',
  'RLRDD_admin',
  'stn_logistics',
  'phq_logistics',
  'rhq_logistics',
] as const;

export type RlrddRole = (typeof RLRDD_ROLES)[number];

export const ROLE_LABELS: Record<RlrddRole, string> = {
  super_admin: 'Super Admin',
  RLRDD_admin: 'RLRDD Admin',
  stn_logistics: 'Station Logistics',
  phq_logistics: 'PHQ Logistics',
  rhq_logistics: 'RHQ Logistics',
};

export function isRlrddRole(role: string | null | undefined): role is RlrddRole {
  return !!role && RLRDD_ROLES.includes(role as RlrddRole);
}

export function roleLabel(role: string | null | undefined): string {
  if (!role) {
    return '—';
  }

  return ROLE_LABELS[role as RlrddRole] ?? role;
}

export function canAccessRlrdd(user: {
  role: string | null | undefined;
  access_page?: string | null;
}): boolean {
  const accessPage = user.access_page ?? 'RPRMD';
  if (accessPage !== 'RLRDD' && accessPage !== 'BOTH') {
    return false;
  }

  return isRlrddRole(user.role);
}

export function canManageUsers(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'RLRDD_admin';
}

export function canAccessSystemSettings(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'RLRDD_admin';
}

export function rolesForAccessPage(accessPage: 'RPRMD' | 'RLRDD' | 'BOTH'): RlrddRole[] {
  if (accessPage === 'BOTH') {
    return ['super_admin'];
  }

  if (accessPage === 'RLRDD') {
    return ['RLRDD_admin', 'stn_logistics', 'phq_logistics', 'rhq_logistics'];
  }

  return [];
}

export function isRoleValidForAccessPage(
  role: string,
  accessPage: 'RPRMD' | 'RLRDD' | 'BOTH'
): boolean {
  return rolesForAccessPage(accessPage).includes(role as RlrddRole);
}

export function canManageTargetRole(
  actorRole: string | null | undefined,
  targetRole: RlrddRole
): boolean {
  if (actorRole === 'super_admin') {
    return true;
  }

  if (actorRole === 'RLRDD_admin') {
    return (
      targetRole === 'stn_logistics' ||
      targetRole === 'phq_logistics' ||
      targetRole === 'rhq_logistics'
    );
  }

  return false;
}

export function assignableRoles(actorRole: string | null | undefined): RlrddRole[] {
  if (actorRole === 'super_admin') {
    return [...RLRDD_ROLES];
  }

  if (actorRole === 'RLRDD_admin') {
    return ['stn_logistics', 'phq_logistics', 'rhq_logistics'];
  }

  return [];
}

/** Roles that only see vehicles matching their own office + unit. */
export function isScopedVehicleRole(role: string | null | undefined): boolean {
  return role === 'stn_logistics' || role === 'phq_logistics' || role === 'rhq_logistics';
}

export type VehicleScope = {
  office: string;
  unit: string;
  /** PHQ/RHQ logistics also see hyphenated sub-units (e.g. ORPRMD → ORPRMD-RPHAS). */
  includeSubUnits: boolean;
};

/**
 * Returns office/unit filters for vehicle_data queries.
 * null = no restriction (super_admin, RLRDD_admin).
 */
export function getVehicleScopeForUser(user: {
  role: RlrddRole;
  office: string | null;
  unit: string | null;
} | null): VehicleScope | null {
  if (!user || !isScopedVehicleRole(user.role)) {
    return null;
  }

  const office = user.office?.trim() ?? '';
  const unit = user.unit?.trim() ?? '';

  return {
    office,
    unit,
    includeSubUnits: user.role === 'phq_logistics' || user.role === 'rhq_logistics',
  };
}

export function formatVehicleScopeLabel(scope: VehicleScope): string {
  const base = `${scope.office} — ${scope.unit}`;
  if (scope.includeSubUnits) {
    return `${base} (incl. ${scope.unit}-*)`;
  }
  return base;
}
