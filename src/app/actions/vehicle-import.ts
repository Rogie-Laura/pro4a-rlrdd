'use server';

import { revalidatePath } from 'next/cache';
import { parseVehicleExcel } from '@/lib/mobility/parse-excel';
import { VEHICLE_DATA_TABLE } from '@/lib/mobility/types';
import { requireSystemSettingsAccess } from '@/lib/auth/session';
import { createAdminClient, hasAdminClient } from '@/lib/supabase/admin';

export type VehicleImportResult = {
  ok: boolean;
  message: string;
  imported?: number;
  skipped?: number;
};

const BATCH_SIZE = 200;

export async function uploadVehicleList(formData: FormData): Promise<VehicleImportResult> {
  try {
    await requireSystemSettingsAccess();

    if (!hasAdminClient()) {
      return {
        ok: false,
        message: 'SUPABASE_SERVICE_ROLE_KEY is not configured in .env.local.',
      };
    }

    const file = formData.get('file');

    if (!(file instanceof File) || file.size === 0) {
      return { ok: false, message: 'Please select an Excel file to upload.' };
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension !== 'xlsx' && extension !== 'xls') {
      return { ok: false, message: 'Only .xlsx or .xls files are supported.' };
    }

    const replaceExisting = formData.get('replace_existing') !== 'false';
    const buffer = await file.arrayBuffer();
    const { rows, errors } = parseVehicleExcel(buffer);

    if (rows.length === 0) {
      const detail = errors.length > 0 ? ` ${errors.slice(0, 3).join(' ')}` : '';
      return { ok: false, message: `No valid vehicle rows found in the file.${detail}` };
    }

    const admin = createAdminClient();

    const { data: maxRow } = await admin
      .from(VEHICLE_DATA_TABLE)
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    const watermarkId = (maxRow?.id as number | undefined) ?? 0;

    let imported = 0;
    const now = new Date().toISOString();

    for (let index = 0; index < rows.length; index += BATCH_SIZE) {
      const batch = rows.slice(index, index + BATCH_SIZE).map((row) => ({
        ...row,
        updated_at: now,
      }));
      const { error } = await admin.from(VEHICLE_DATA_TABLE).insert(batch);

      if (error) {
        if (imported > 0) {
          await admin.from(VEHICLE_DATA_TABLE).delete().gt('id', watermarkId);
        }

        return {
          ok: false,
          message: `Import failed at row ${index + 1}: ${error.message}. No changes were saved.`,
        };
      }

      imported += batch.length;
    }

    if (replaceExisting) {
      const { error: deleteError } = await admin
        .from(VEHICLE_DATA_TABLE)
        .delete()
        .lte('id', watermarkId);

      if (deleteError) {
        return {
          ok: false,
          message: `Imported ${imported} record(s), but failed to remove the previous list: ${deleteError.message}`,
          imported,
        };
      }
    }

    revalidatePath('/dashboard/mobility');
    revalidatePath('/dashboard/settings');

    const warning =
      errors.length > 0 ? ` ${errors.length} row(s) were skipped due to validation errors.` : '';

    return {
      ok: true,
      message: `Successfully imported ${imported} vehicle record(s).${
        replaceExisting ? ' Previous vehicle list was replaced.' : ''
      }${warning}`,
      imported,
      skipped: errors.length,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Upload failed.',
    };
  }
}
