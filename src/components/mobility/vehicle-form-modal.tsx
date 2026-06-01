'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { createVehicle, updateVehicle, type VehicleActionResult } from '@/app/actions/vehicles';
import { Modal } from '@/components/ui/modal';
import { RLRDD_OFFICES } from '@/lib/mobility/office-list';
import type { VehicleRecord } from '@/lib/mobility/types';
import {
  unitsForOffice,
  withCurrentOption,
  type PersonnelLookupOptions,
} from '@/lib/personnel/lookup-options';

type VehicleFormModalProps = {
  mode: 'add' | 'edit';
  record?: VehicleRecord | null;
  lookup: PersonnelLookupOptions;
  defaultOffice?: string | null;
  defaultUnit?: string | null;
  lockOfficeUnit?: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const inputClass =
  'w-full rounded-md border border-[var(--app-border)] bg-[var(--app-surface-2)] px-2.5 py-1.5 text-xs text-[var(--app-text)] outline-none focus:border-emerald-500/50';
const labelClass =
  'mb-1 block text-[10px] font-semibold uppercase tracking-wide text-[var(--app-text-muted)]';
const btnSecondary =
  'inline-flex h-8 items-center rounded-md border border-[var(--app-border)] bg-[var(--app-surface-2)] px-4 text-xs font-medium text-[var(--app-text)] transition hover:bg-[var(--app-hover)] disabled:opacity-50';
const btnPrimary =
  'inline-flex h-8 items-center rounded-md bg-emerald-500 px-4 text-xs font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:opacity-50';

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={`vehicle-${name}`} className={labelClass}>
        {label}
      </label>
      <input
        id={`vehicle-${name}`}
        name={name}
        type="text"
        defaultValue={defaultValue ?? ''}
        required={required}
        className={inputClass}
      />
    </div>
  );
}

function ActionMessage({ result }: { result: VehicleActionResult | null }) {
  if (!result) {
    return null;
  }

  return (
    <div
      className={`rounded-lg px-3 py-2 text-xs ${
        result.ok
          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
          : 'border border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300'
      }`}
    >
      {result.message}
    </div>
  );
}

export function VehicleFormModal({
  mode,
  record,
  lookup,
  defaultOffice = '',
  defaultUnit = '',
  lockOfficeUnit = false,
  onClose,
  onSuccess,
}: VehicleFormModalProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<VehicleActionResult | null>(null);
  const [office, setOffice] = useState(record?.office ?? defaultOffice ?? '');
  const [unit, setUnit] = useState(record?.unit ?? defaultUnit ?? '');

  useEffect(() => {
    setOffice(record?.office ?? defaultOffice ?? '');
    setUnit(record?.unit ?? defaultUnit ?? '');
    setResult(null);
  }, [record, mode, defaultOffice, defaultUnit]);

  const officeOptions = useMemo(
    () => withCurrentOption(RLRDD_OFFICES, office),
    [office]
  );
  const unitOptions = useMemo(
    () => unitsForOffice(lookup, office, unit),
    [lookup, office, unit]
  );

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const action = mode === 'add' ? createVehicle : updateVehicle;
      const response = await action(formData);
      setResult(response);

      if (response.ok) {
        onSuccess();
        onClose();
      }
    });
  }

  return (
    <Modal
      title={mode === 'add' ? 'Add New Vehicle' : 'Edit Vehicle Info'}
      onClose={onClose}
      closeOnBackdrop={!isPending}
      maxWidth="lg"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={isPending} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="submit"
            form="vehicle-form"
            disabled={isPending}
            className={btnPrimary}
          >
            {isPending ? 'Saving...' : mode === 'add' ? 'Add Vehicle' : 'Save Changes'}
          </button>
        </div>
      }
    >
      <form id="vehicle-form" onSubmit={handleSubmit} className="space-y-4">
        {mode === 'edit' && record ? <input type="hidden" name="id" value={record.id} /> : null}

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Plate#" name="plate_num" defaultValue={record?.plate_num} />
          <Field label="Chasis#" name="chasis_num" defaultValue={record?.chasis_num} />
          <Field label="Engine#" name="engine_num" defaultValue={record?.engine_num} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="vehicle-office" className={labelClass}>
              Office
            </label>
            <select
              id="vehicle-office"
              name="office"
              value={office}
              onChange={(event) => {
                setOffice(event.target.value);
                setUnit('');
              }}
              disabled={lockOfficeUnit}
              className={inputClass}
            >
              <option value="">Select office...</option>
              {officeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="vehicle-unit" className={labelClass}>
              Unit
            </label>
            <input
              id="vehicle-unit"
              name="unit"
              type="text"
              list="vehicle-unit-options"
              value={unit}
              onChange={(event) => setUnit(event.target.value)}
              disabled={lockOfficeUnit}
              placeholder="Type or select unit..."
              className={inputClass}
            />
            <datalist id="vehicle-unit-options">
              {unitOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Make" name="make" defaultValue={record?.make} />
          <Field label="Vehicle Type" name="vehicle_type" defaultValue={record?.vehicle_type} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Status" name="status" defaultValue={record?.status ?? 'Active'} />
          <Field label="Source" name="source" defaultValue={record?.source} />
        </div>

        <div>
          <label htmlFor="vehicle-defects_noted" className={labelClass}>
            Defects Noted
          </label>
          <textarea
            id="vehicle-defects_noted"
            name="defects_noted"
            rows={3}
            defaultValue={record?.defects_noted ?? ''}
            className={`${inputClass} resize-y`}
          />
        </div>

        <p className="text-[10px] text-[var(--app-text-muted)]">
          At least one of Plate#, Chasis#, or Engine# is required.
        </p>

        <ActionMessage result={result} />
      </form>
    </Modal>
  );
}
