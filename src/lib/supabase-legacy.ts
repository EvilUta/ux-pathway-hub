import { loadLS, loadLSFlag, saveLSFlag } from "@/lib/storage";
import {
  isLegacyStorageMigrated as isLegacyStorageMigratedForUser,
  setLegacyStorageMigrated as setLegacyStorageMigratedForUser,
} from "@/lib/user-settings";
import type { SupabaseClient } from "@supabase/supabase-js";

const MIGRATION_FLAG_SUFFIX = "__supabase_migrated";

function getMigrationFlagKey(storageKey: string) {
  return `${storageKey}${MIGRATION_FLAG_SUFFIX}`;
}

export async function shouldMigrateLegacyStorage(
  storageKey: string,
  options?: { supabase?: SupabaseClient | null; userId?: string | null },
) {
  const localMigrated = loadLSFlag(getMigrationFlagKey(storageKey));

  if (localMigrated) return false;

  if (!options?.supabase || !options.userId) {
    return true;
  }

  const remoteMigrated = await isLegacyStorageMigratedForUser(
    options.supabase,
    options.userId,
    storageKey,
  );

  if (remoteMigrated) {
    saveLSFlag(getMigrationFlagKey(storageKey), true);
    return false;
  }

  return true;
}

export async function markLegacyStorageMigrated(
  storageKey: string,
  options?: { supabase?: SupabaseClient | null; userId?: string | null },
) {
  saveLSFlag(getMigrationFlagKey(storageKey), true);

  if (!options?.supabase || !options.userId) {
    return;
  }

  await setLegacyStorageMigratedForUser(options.supabase, options.userId, storageKey);
}

export function loadLegacyItems<T>(storageKey: string, fallback: T) {
  return loadLS<T>(storageKey, fallback);
}
