import { requireSystemSettingsAccess } from '@/lib/auth/session';

export default async function SystemSettingsPage() {
  await requireSystemSettingsAccess();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <h2 className="text-lg font-bold text-[var(--app-text)]">System Settings</h2>
      <p className="mt-2 text-xs text-[var(--app-text-muted)]">
        User management and integration settings for RLRDD will be added here.
      </p>
    </div>
  );
}
