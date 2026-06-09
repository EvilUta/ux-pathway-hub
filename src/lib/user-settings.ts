import type { SupabaseClient } from "@supabase/supabase-js";

export type ThemePreference = "light" | "dark";

type UserSettingsRow = {
  user_id: string;
  theme_preference: ThemePreference | null;
  legacy_migration_flags: Record<string, boolean> | null;
};

const USER_SETTINGS_TABLE = "user_settings";
const settingsCache = new Map<string, UserSettingsRow>();

function getCacheKey(userId: string) {
  return userId;
}

function normalizeSettingsRow(userId: string, row?: Partial<UserSettingsRow> | null): UserSettingsRow {
  return {
    user_id: userId,
    theme_preference:
      row?.theme_preference === "dark" || row?.theme_preference === "light"
        ? row.theme_preference
        : null,
    legacy_migration_flags:
      row?.legacy_migration_flags && typeof row.legacy_migration_flags === "object"
        ? row.legacy_migration_flags
        : {},
  };
}

export async function getUserSettings(supabase: SupabaseClient, userId: string) {
  const cacheKey = getCacheKey(userId);
  const cached = settingsCache.get(cacheKey);

  if (cached) return cached;

  const { data, error } = await supabase
    .from(USER_SETTINGS_TABLE)
    .select("user_id, theme_preference, legacy_migration_flags")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const normalized = normalizeSettingsRow(userId, data);
  settingsCache.set(cacheKey, normalized);
  return normalized;
}

export async function updateUserSettings(
  supabase: SupabaseClient,
  userId: string,
  patch: {
    theme_preference?: ThemePreference | null;
    legacy_migration_flags?: Record<string, boolean>;
  },
) {
  const current = await getUserSettings(supabase, userId);

  const payload = {
    user_id: userId,
    theme_preference:
      patch.theme_preference !== undefined ? patch.theme_preference : current.theme_preference,
    legacy_migration_flags:
      patch.legacy_migration_flags !== undefined
        ? patch.legacy_migration_flags
        : current.legacy_migration_flags,
  };

  const { data, error } = await supabase
    .from(USER_SETTINGS_TABLE)
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, theme_preference, legacy_migration_flags")
    .single();

  if (error) throw error;

  const normalized = normalizeSettingsRow(userId, data);
  settingsCache.set(getCacheKey(userId), normalized);
  return normalized;
}

export async function getThemePreference(supabase: SupabaseClient, userId: string) {
  const settings = await getUserSettings(supabase, userId);
  return settings.theme_preference;
}

export async function setThemePreference(
  supabase: SupabaseClient,
  userId: string,
  theme: ThemePreference,
) {
  return updateUserSettings(supabase, userId, { theme_preference: theme });
}

export async function isLegacyStorageMigrated(
  supabase: SupabaseClient,
  userId: string,
  storageKey: string,
) {
  const settings = await getUserSettings(supabase, userId);
  return Boolean(settings.legacy_migration_flags?.[storageKey]);
}

export async function setLegacyStorageMigrated(
  supabase: SupabaseClient,
  userId: string,
  storageKey: string,
) {
  const settings = await getUserSettings(supabase, userId);
  return updateUserSettings(supabase, userId, {
    legacy_migration_flags: {
      ...(settings.legacy_migration_flags ?? {}),
      [storageKey]: true,
    },
  });
}

export function clearUserSettingsCache(userId?: string) {
  if (userId) {
    settingsCache.delete(getCacheKey(userId));
    return;
  }

  settingsCache.clear();
}
