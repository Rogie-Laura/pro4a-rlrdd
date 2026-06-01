import { headers } from 'next/headers';
import Link from 'next/link';
import { listApiKeys } from '@/app/actions/api-keys';
import { CommandIntegration } from '@/components/dashboard/command-integration';
import { VehicleUpload } from '@/components/dashboard/vehicle-upload';
import { requireSystemSettingsAccess } from '@/lib/auth/session';
import { hasAdminClient } from '@/lib/supabase/admin';

export default async function SystemSettingsPage() {
  await requireSystemSettingsAccess();

  const serviceRoleReady = hasAdminClient();
  const apiKeys = serviceRoleReady ? await listApiKeys() : [];

  const headerList = await headers();
  const host = headerList.get('host') ?? 'localhost:3001';
  const protocol = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-y-auto">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[var(--app-text)]">System Settings</h2>
        <p className="text-sm text-[var(--app-text-muted)]">
          Admin tools for managing RLRDD login accounts and system data.
        </p>
      </div>

      <div className="max-w-6xl space-y-4">
        <div className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[var(--app-text)]">User Management</h3>
              <p className="mt-1 text-xs text-[var(--app-text-muted)]">
                Create, edit, and reset passwords for RLRDD login accounts.
              </p>
            </div>
            <Link
              href="/dashboard/users"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-emerald-500 px-4 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Manage Users
            </Link>
          </div>
        </div>

        <CommandIntegration
          apiKeys={apiKeys}
          baseUrl={baseUrl}
          hasServiceRole={serviceRoleReady}
        />

        <VehicleUpload hasServiceRole={serviceRoleReady} />

        {!serviceRoleReady ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
            <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-200">
              Service role key missing
            </h3>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-100/90">
              Add <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to{' '}
              <code className="font-mono">.env.local</code> to enable user management actions.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
