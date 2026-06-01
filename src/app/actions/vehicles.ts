'use server';

import { revalidatePath } from 'next/cache';
import { parseVehicleFormData } from '@/lib/mobility/parse-vehicle-form';
import { VEHICLE_DATA_TABLE } from '@/lib/mobility/types';
import { canManageVehicles } from '@/lib/auth/roles';
import { getSessionUser } from '@/lib/auth/session';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';

export type VehicleActionResult = {
  ok: boolean;
  message: string;
};

async function requireVehicleManager() {
  const session = await getSessionUser();

  if (!session.userId || !session.user?.is_active || !canManageVehicles(session.user.role)) {
    throw new Error('You do not have permission to manage vehicles.');
  }

  if (!hasAdminClient()) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return session;
}

export async function createVehicle(formData: FormData): Promise<VehicleActionResult> {
  try {
    await requireVehicleManager();

    const parsed = parseVehicleFormData(formData);
    if (parsed.error || !parsed.row) {
      return { ok: false, message: parsed.error ?? 'Invalid vehicle data.' };
    }

    const now = new Date().toISOString();
    const admin = createAdminClient();
    const { error } = await admin.from(VEHICLE_DATA_TABLE).insert({
      ...parsed.row,
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
    await requireVehicleManager();

    const id = Number.parseInt(String(formData.get('id') ?? ''), 10);
    if (!Number.isFinite(id) || id <= 0) {
      return { ok: false, message: 'Missing vehicle id.' };
    }

    const parsed = parseVehicleFormData(formData);
    if (parsed.error || !parsed.row) {
      return { ok: false, message: parsed.error ?? 'Invalid vehicle data.' };
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from(VEHICLE_DATA_TABLE)
      .update({
        ...parsed.row,
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
    await requireVehicleManager();

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
