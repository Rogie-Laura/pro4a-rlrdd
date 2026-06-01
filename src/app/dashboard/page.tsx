import { ROLE_LABELS } from '@/lib/auth/roles';
import { requireRlrddAccess } from '@/lib/auth/session';

export default async function DashboardPage() {
  const session = await requireRlrddAccess();
  const user = session.user!;
  const roleLabel = ROLE_LABELS[user.role] ?? user.role;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-[var(--app-text)]">Property Inventory</h2>
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">
          Welcome, {user.rank_fullname ?? user.full_name}. Property modules will be added here.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-2)] p-8 text-center">
        <p className="text-sm font-semibold text-[var(--app-text)]">RLRDD dashboard is ready</p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--app-text-muted)]">
          Signed in as <span className="font-medium text-[var(--app-text)]">{roleLabel}</span>
          {user.office ? (
            <>
              {' '}
              · {user.office}
              {user.unit ? ` — ${user.unit}` : ''}
            </>
          ) : null}
          . Property listing, assignments, and reports coming next.
        </p>
      </div>
    </div>
  );
}
