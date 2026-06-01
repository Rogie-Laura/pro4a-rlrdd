'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  AssetsIcon,
  CampsIcon,
  FirearmsIcon,
  MobilityIcon,
  SettingsIcon,
} from '@/components/dashboard/nav-icons';

const NAV_ITEMS = [
  { href: '/dashboard/mobility', label: 'Mobility', icon: MobilityIcon },
  { href: '/dashboard/firearms', label: 'Firearms', icon: FirearmsIcon },
  { href: '/dashboard/camps', label: 'Camps / Stations / Offices', icon: CampsIcon },
  { href: '/dashboard/assets', label: 'Other PRO4A Assets', icon: AssetsIcon },
] as const;

type DashboardSidebarProps = {
  showSystemSettings?: boolean;
};

function navLinkClass(isActive: boolean) {
  return `flex items-center gap-2.5 rounded-md px-2.5 py-2.5 text-xs leading-snug transition ${
    isActive
      ? 'bg-emerald-500/15 font-semibold text-emerald-600 ring-1 ring-emerald-500/30 dark:text-emerald-200'
      : 'text-[var(--app-text-muted)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text)]'
  }`;
}

export function DashboardSidebar({ showSystemSettings = false }: DashboardSidebarProps) {
  const pathname = usePathname();
  const isSettingsActive =
    pathname === '/dashboard/settings' || pathname.startsWith('/dashboard/settings/');

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col overflow-hidden border-r border-[var(--app-border)] bg-[var(--app-surface)]">
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link key={item.href} href={item.href} className={navLinkClass(isActive)}>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-200'
                    : 'bg-[var(--app-surface-2)] text-[var(--app-text-muted)]'
                }`}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 leading-snug">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {showSystemSettings ? (
        <div className="border-t border-[var(--app-border)] p-3">
          <Link href="/dashboard/settings" className={navLinkClass(isSettingsActive)}>
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                isSettingsActive
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-200'
                  : 'bg-[var(--app-surface-2)] text-[var(--app-text-muted)]'
              }`}
            >
              <SettingsIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 leading-snug">System Settings</span>
          </Link>
        </div>
      ) : null}
    </aside>
  );
}
