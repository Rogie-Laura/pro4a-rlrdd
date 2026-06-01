'use server';

import { revalidatePath } from 'next/cache';
import { canDeleteVehicles, getVehicleScopeForUser } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/auth/session';
import { parseVehicleFormData } from '@/lib/mobility/parse-vehicle-form';
import { applyScopedOfficeUnit, vehicleMatchesScope } from '@/lib/mobility/vehicle-scope';
import { VEHICLE_DATA_TABLE } from '@/lib/mobility/types';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';

export type VehicleActionResult = {
  ok: boolean;
  message: string;
};

async function requireVehicleEditor() {
  const session = await getSessionUser();

  if (!session.userId || !session.user?.is_active) {
    throw new Error('You must be signed in to manage vehicles.');
  }

  if (!hasAdminClient()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return session;
}

async function requireVehicleDeleter() {
  const session = await requireVehicleEditor();

  if (!canDeleteVehicles(session.user?.role)) {
    throw new Error('You do not have permission to delete vehicles.');
  }

  return session;
}

async function assertVehicleInScope(id: number) {
  const session = await requireVehicleEditor();
  const scope = getVehicleScopeForUser(session.user);

  if (!scope) {
    return session;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from(VEHICLE_DATA_TABLE)
    .select('id, office, unit')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Vehicle not found.');
  }

  if (!vehicleMatchesScope(data, scope)) {
    throw new Error('You can only edit vehicles for your assigned office and unit.');
  }

  return session;
}

export async function createVehicle(formData: FormData): Promise<VehicleActionResult> {
  try {
    const session = await requireVehicleEditor();
    const scope = getVehicleScopeForUser(session.user);

    const parsed = parseVehicleFormData(formData);
    if (parsed.error || !parsed.row) {
      return { ok: false, message: parsed.error ?? 'Invalid vehicle data.' };
    }

    const scoped = applyScopedOfficeUnit(parsed.row, scope);
    if (scoped.error || !scoped.row) {
      return { ok: false, message: scoped.error ?? 'Invalid vehicle data.' };
    }

    const now = new Date().toISOString();
    const admin = createAdminClient();
    const { error } = await admin.from(VEHICLE_DATA_TABLE).insert({
      ...scoped.row,
      updated_at: now,
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath('/dashboard/mobility');
    return { ok: true, message: 'Vehicle added successfully.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to add vehicle.',
    };
  }
}

export async function updateVehicle(formData: FormData): Promise<VehicleActionResult> {
  try {
    const id = Number.parseInt(String(formData.get('id') ?? ''), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return { ok: false, message: 'Missing vehicle id.' };
    }

    const session = await assertVehicleInScope(id);
    const scope = getVehicleScopeForUser(session.user);

    const parsed = parseVehicleFormData(formData);
    if (parsed.error || !parsed.row) {
      return { ok: false, message: parsed.error ?? 'Invalid vehicle data.' };
    }

    const scoped = applyScopedOfficeUnit(parsed.row, scope);
    if (scoped.error || !scoped.row) {
      return { ok: false, message: scoped.error ?? 'Invalid vehicle data.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from(VEHICLE_DATA_TABLE)
      .update({
        ...scoped.row,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath('/dashboard/mobility');
    return { ok: true, message: 'Vehicle updated successfully.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to update vehicle.',
    };
  }
}

export async function deleteVehicle(formData: FormData): Promise<VehicleActionResult> {
  try {
    await requireVehicleDeleter();

    const id = Number.parseInt(String(formData.get('id') ?? ''), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return { ok: false, message: 'Missing vehicle id.' };
    }

    const admin = createAdminClient();
    const { error } = await admin.from(VEHICLE_DATA_TABLE).delete().eq('id', id);

    if (error) {
      return { ok: false, message: error.message };
    }

    revalidatePath('/dashboard/mobility');
    return { ok: true, message: 'Vehicle deleted successfully.' };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Failed to delete vehicle.',
    };
  }
}
