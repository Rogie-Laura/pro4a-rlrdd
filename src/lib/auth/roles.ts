export const DIVISION = {
  code: 'RLRDD',
  directorate: 'RLRDD',
  label: 'PRO4A Property Management Information System',
} as const;

/** Roles allowed to sign in to the RLRDD app */
export const RLRDD_ROLES = ['super_admin', 'rlrdd_admin', 'rlrdd_officer', 'rlrdd_staff'] as const;

export type RlrddRole = (typeof RLRDD_ROLES)[number];

export const ROLE_LABELS: Record<RlrddRole, string> = {
  super_admin: 'Super Admin',
  rlrdd_admin: 'RLRDD Admin',
  rlrdd_officer: 'Property Officer',
  rlrdd_staff: 'Property Staff',
};

export function isRlrddRole(role: string | null | undefined): role is RlrddRole {
  return !!role && RLRDD_ROLES.includes(role as RlrddRole);
}

export function canAccessRlrdd(role: string | null | undefined): boolean {
  return isRlrddRole(role);
}

export function canManageUsers(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'rlrdd_admin';
}

export function canAccessSystemSettings(role: string | null | undefined): boolean {
  return role === 'super_admin' || role === 'rlrdd_admin';
}
