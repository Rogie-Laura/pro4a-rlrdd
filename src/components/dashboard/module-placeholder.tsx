import type { ReactNode } from 'react';

type ModulePlaceholderProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

export function ModulePlaceholder({ title, description, icon }: ModulePlaceholderProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 shrink-0">
        <h2 className="text-lg font-bold text-[var(--app-text)]">{title}</h2>
        <p className="mt-1 text-xs text-[var(--app-text-muted)]">{description}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface-2)] p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/25 dark:text-emerald-300">
          {icon}
        </div>
        <p className="text-sm font-semibold text-[var(--app-text)]">{title} module</p>
        <p className="mt-2 max-w-md text-xs leading-relaxed text-[var(--app-text-muted)]">
          Inventory listing, assignments, and reports for this category will be added here.
        </p>
      </div>
    </div>
  );
}
