export const ACCESS_PAGES = ['RPRMD', 'RLRDD', 'BOTH'] as const;

export type AccessPage = (typeof ACCESS_PAGES)[number];

export function isAccessPage(value: string | null | undefined): value is AccessPage {
  return !!value && ACCESS_PAGES.includes(value as AccessPage);
}

export function canSignInToRlrdd(accessPage: string | null | undefined): boolean {
  return accessPage === 'RLRDD' || accessPage === 'BOTH';
}
