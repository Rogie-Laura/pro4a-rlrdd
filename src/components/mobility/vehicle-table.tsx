'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import type { VehicleRecord } from '@/lib/mobility/types';

type LimitOption = 50 | 100 | 250 | 500;

type VehicleTableProps = {
  records: VehicleRecord[];
  total: number;
  search: string;
  limit: number;
  page: number;
  scopeLabel?: string | null;
  fetchError?: string;
};

const LIMIT_OPTIONS: LimitOption[] = [50, 100, 250, 500];

type TableColumnKey =
  | 'index'
  | 'plate_num'
  | 'chasis_num'
  | 'engine_num'
  | 'office_unit'
  | 'make_type'
  | 'status_source'
  | 'defects_noted';

const TABLE_COLUMNS: {
  key: TableColumnKey;
  label: string;
  width: number;
  nowrap?: boolean;
}[] = [
  { key: 'index', label: '#', width: 3, nowrap: true },
  { key: 'plate_num', label: 'Plate#', width: 9, nowrap: true },
  { key: 'chasis_num', label: 'Chasis#', width: 13, nowrap: true },
  { key: 'engine_num', label: 'Engine#', width: 13, nowrap: true },
  { key: 'office_unit', label: 'Office / Unit', width: 15 },
  { key: 'make_type', label: 'Make / Vehicle Type', width: 14 },
  { key: 'status_source', label: 'Status / Source', width: 15 },
  { key: 'defects_noted', label: 'Defects Noted', width: 18 },
];

type StackedLine = {
  header: string;
  field: keyof VehicleRecord;
};

const STACKED_COLUMNS: Record<
  Exclude<TableColumnKey, 'index' | 'defects_noted' | 'plate_num' | 'chasis_num' | 'engine_num'>,
  StackedLine[]
> = {
  office_unit: [
    { header: 'Office', field: 'office' },
    { header: 'Unit', field: 'unit' },
  ],
  make_type: [
    { header: 'Make', field: 'make' },
    { header: 'Vehicle Type', field: 'vehicle_type' },
  ],
  status_source: [
    { header: 'Status', field: 'status' },
    { header: 'Source', field: 'source' },
  ],
};

const tableCellClass = 'px-2 py-2 text-xs leading-snug';
const tableHeadClass =
  'px-2 py-2 text-xs font-semibold leading-snug text-[var(--app-text-muted)]';
const tableNowrapCellClass = `${tableCellClass} whitespace-nowrap`;
const tableNowrapHeadClass = `${tableHeadClass} whitespace-nowrap`;
const tableDefectsCellClass = `${tableCellClass} max-w-0 leading-relaxed`;
const tableValueClass = 'text-[var(--app-text)]';
const tableIndexClass = 'text-[11px] text-[var(--app-text-muted)]';
const tableTruncateClass = 'truncate';
const labelClass = 'shrink-0 text-xs font-medium text-[var(--app-text-muted)]';
const controlClass =
  'h-8 w-52 rounded-md border border-[var(--app-border)] bg-[var(--app-surface-2)] px-2.5 text-xs text-[var(--app-text)] outline-none focus:border-emerald-500/50';
const limitControlClass =
  'h-8 w-20 rounded-md border border-[var(--app-border)] bg-[var(--app-surface-2)] px-2 text-xs text-[var(--app-text)] outline-none focus:border-emerald-500/50';
const navButtonClass =
  'inline-flex h-8 min-w-7 items-center justify-center rounded-md border border-[var(--app-border)] bg-[var(--app-surface-2)] px-1.5 text-xs font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)] disabled:pointer-events-none disabled:opacity-40';

function cell(value: string | null | undefined) {
  return value && value.trim() !== '' ? value : '—';
}

function isStackedColumn(key: TableColumnKey): key is keyof typeof STACKED_COLUMNS {
  return key in STACKED_COLUMNS;
}

function StackedHeader({ lines }: { lines: StackedLine[] }) {
  return (
    <div className="flex flex-col gap-0.5 normal-case tracking-normal">
      {lines.map((line) => (
        <span key={line.header}>{line.header}</span>
      ))}
    </div>
  );
}

function StackedCell({
  record,
  lines,
}: {
  record: VehicleRecord;
  lines: StackedLine[];
}) {
  return (
    <div className="flex flex-col gap-0.5 py-0.5">
      {lines.map((line) => {
        const value = record[line.field];
        const text = typeof value === 'string' ? value : null;

        if (line.field === 'status') {
          return (
            <div key={line.header} className="truncate">
              <span className={getStatusBadgeClass(text)} title={text ?? undefined}>
                {cell(text)}
              </span>
            </div>
          );
        }

        return (
          <div key={line.header} className={`truncate ${tableValueClass}`}>
            {cell(text)}
          </div>
        );
      })}
    </div>
  );
}

function stackedTitle(record: VehicleRecord, lines: StackedLine[]): string {
  return lines
    .map((line) => {
      const value = record[line.field];
      const text = typeof value === 'string' ? value : null;
      return `${line.header} ${cell(text)}`;
    })
    .join('\n');
}

function getStatusBadgeClass(status: string | null | undefined): string {
  const base =
    'inline-block max-w-full truncate rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight';
  const normalized = (status ?? '').trim().toLowerCase();

  if (normalized === 'active' || normalized === 'serviceable') {
    return `${base} bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300`;
  }

  if (normalized.includes('defect') || normalized.includes('unserviceable')) {
    return `${base} bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300`;
  }

  return `${base} bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300`;
}

function ToolbarField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </div>
  );
}

export function VehicleTable({
  records,
  total,
  search,
  limit,
  page,
  scopeLabel = null,
  fetchError,
}: VehicleTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const startIndex = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const endIndex = Math.min(safePage * limit, total);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  function pushParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      pushParams({
        q: value.trim() || null,
        page: '1',
      });
    }, 300);
  }

  function renderCell(key: TableColumnKey, record: VehicleRecord, index: number) {
    if (key === 'index') {
      return startIndex + index;
    }

    if (key === 'plate_num') {
      return <span className="font-semibold">{cell(record.plate_num)}</span>;
    }

    if (isStackedColumn(key)) {
      return <StackedCell record={record} lines={STACKED_COLUMNS[key]} />;
    }

    const value = record[key as keyof VehicleRecord];
    return cell(typeof value === 'string' ? value : null);
  }

  function cellTitle(key: TableColumnKey, record: VehicleRecord): string | undefined {
    if (isStackedColumn(key)) {
      return stackedTitle(record, STACKED_COLUMNS[key]);
    }

    if (key === 'index') {
      return undefined;
    }

    const value = record[key as keyof VehicleRecord];
    return typeof value === 'string' ? value : undefined;
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {fetchError ? (
        <div className="mb-2 shrink-0 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-700 dark:text-red-300">
          {fetchError}
        </div>
      ) : null}

      {scopeLabel ? (
        <div className="mb-2 shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-800 dark:text-amber-200">
          Showing vehicles for: <span className="font-semibold">{scopeLabel}</span>
        </div>
      ) : null}

      <div className="mb-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2">
        <ToolbarField label="Search:">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Plate, make, office..."
            className={controlClass}
          />
        </ToolbarField>

        <ToolbarField label="Show:">
          <select
            value={limit}
            onChange={(event) =>
              pushParams({
                limit: event.target.value,
                page: '1',
              })
            }
            className={limitControlClass}
          >
            {LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </ToolbarField>

        <span className="text-xs text-[var(--app-text-muted)]">
          {total === 0 ? '0 records' : `${startIndex}-${endIndex} of ${total}`}
          {isPending ? ' · Loading...' : ''}
        </span>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span className="text-xs text-[var(--app-text-muted)]">
            Page {safePage} of {totalPages}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={safePage <= 1 || isPending}
              onClick={() => pushParams({ page: '1' })}
              className={navButtonClass}
            >
              First
            </button>
            <button
              type="button"
              disabled={safePage <= 1 || isPending}
              onClick={() => pushParams({ page: String(safePage - 1) })}
              className={navButtonClass}
            >
              Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages || isPending}
              onClick={() => pushParams({ page: String(safePage + 1) })}
              className={navButtonClass}
            >
              Next
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages || isPending}
              onClick={() => pushParams({ page: String(totalPages) })}
              className={navButtonClass}
            >
              Last
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            {TABLE_COLUMNS.map(({ key, width }) => (
              <col key={key} style={{ width: `${width}%` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-10 border-b border-[var(--app-border)] bg-[var(--app-table-header)] shadow-[0_1px_0_var(--app-border)]">
            <tr>
              {TABLE_COLUMNS.map(({ key, label, nowrap }) => (
                <th key={key} className={nowrap ? tableNowrapHeadClass : tableHeadClass}>
                  {isStackedColumn(key) ? (
                    <StackedHeader lines={STACKED_COLUMNS[key]} />
                  ) : (
                    label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td
                  colSpan={TABLE_COLUMNS.length}
                  className="px-3 py-12 text-center text-sm text-[var(--app-text-muted)]"
                >
                  {fetchError ? 'Unable to load vehicle records.' : 'No vehicle records found.'}
                </td>
              </tr>
            ) : (
              records.map((record, index) => (
                <tr
                  key={record.id}
                  className="border-b border-[var(--app-border)]/70 transition-colors even:bg-[var(--app-surface-2)]/40 hover:bg-[var(--app-hover)]"
                >
                  {TABLE_COLUMNS.map(({ key, nowrap }) => (
                    <td
                      key={key}
                      className={`${
                        key === 'defects_noted'
                          ? `${tableDefectsCellClass} ${tableTruncateClass} ${tableValueClass}`
                          : nowrap
                            ? tableNowrapCellClass
                            : tableCellClass
                      } ${
                        key === 'index'
                          ? tableIndexClass
                          : key === 'plate_num'
                            ? `${tableTruncateClass} ${tableValueClass}`
                            : key === 'chasis_num' || key === 'engine_num'
                              ? `${tableTruncateClass} ${tableValueClass}`
                              : isStackedColumn(key)
                                ? `align-top ${tableValueClass}`
                                : `${tableTruncateClass} ${tableValueClass}`
                      }`}
                      title={cellTitle(key, record)}
                    >
                      {renderCell(key, record, index)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
