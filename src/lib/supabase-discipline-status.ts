import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  AvaliacaoOverrides,
  AvaliacaoStatus,
  DisciplinaManualStatus,
  DisciplinaStatusOverrides,
  DisciplinaUnlockOverrides,
} from "@/lib/disciplinas";
import { getDisciplina } from "@/lib/disciplinas";
import { useAuth } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import {
  loadLegacyItems,
  markLegacyStorageMigrated,
  shouldMigrateLegacyStorage,
} from "@/lib/supabase-legacy";

type AvaliacaoNotas = Partial<Record<string, string>>;

type DisciplineStatusRow = {
  subject_slug: string;
  status_override: DisciplinaManualStatus | null;
  unlock_override: boolean | null;
  avaliacao_status: AvaliacaoStatus | null;
  avaliacao_nota: string | null;
};

type LegacyDisciplineStatusRow = {
  subject_slug: string;
  status: string | null;
  unlocked: boolean | null;
  avaliacao_status: AvaliacaoStatus | null;
};

type DisciplineStatusPersistRow = {
  user_id: string;
  subject_slug: string;
  status_override: DisciplinaManualStatus | null;
  unlock_override: boolean;
  avaliacao_status: AvaliacaoStatus | null;
  avaliacao_nota: string | null;
};

type DisciplineState = {
  statusOverrides: DisciplinaStatusOverrides;
  unlockOverrides: DisciplinaUnlockOverrides;
  avaliacaoOverrides: AvaliacaoOverrides;
  avaliacaoNotas: AvaliacaoNotas;
};

type DisciplineStatePatch = {
  slug: string;
  statusOverride?: DisciplinaManualStatus | null;
  unlockOverride?: boolean;
  avaliacaoStatus?: AvaliacaoStatus | null;
  avaliacaoNota?: string | null;
};

const DISCIPLINE_STATUS_QUERY_KEY = "discipline-statuses";
const LEGACY_STATUS_KEY = "uxa-disciplinas-status";
const LEGACY_UNLOCK_KEY = "uxa-disciplinas-unlock";
const LEGACY_AVALIACAO_KEY = "uxa-disciplinas-avaliacao";
const LEGACY_AVALIACAO_NOTA_KEY = "uxa-disciplinas-avaliacao-nota";
const DISCIPLINE_STATUS_TABLE = "disciplinas_status";
const LEGACY_DISCIPLINE_STATUS_TABLE = "subject_status";
let resolvedDisciplineStatusTable: typeof DISCIPLINE_STATUS_TABLE | typeof LEGACY_DISCIPLINE_STATUS_TABLE | null =
  null;

const EMPTY_STATE: DisciplineState = {
  statusOverrides: {},
  unlockOverrides: {},
  avaliacaoOverrides: {},
  avaliacaoNotas: {},
};

function isMissingTableError(error: { message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return message.includes("could not find the table") || message.includes("relation");
}

function mapLegacyRowToDisciplineRow(row: LegacyDisciplineStatusRow): DisciplineStatusRow {
  const normalizedStatus =
    row.status === "em-andamento" || row.status === "concluida" ? row.status : null;

  return {
    subject_slug: row.subject_slug,
    status_override: normalizedStatus,
    unlock_override: row.unlocked,
    avaliacao_status: row.avaliacao_status,
    avaliacao_nota: null,
  };
}

async function fetchDisciplineStatusRows(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  userId: string,
) {
  if (resolvedDisciplineStatusTable === LEGACY_DISCIPLINE_STATUS_TABLE) {
    const legacyResult = await supabase
      .from(LEGACY_DISCIPLINE_STATUS_TABLE)
      .select("subject_slug, status, unlocked, avaliacao_status")
      .eq("user_id", userId);

    if (legacyResult.error) {
      throw legacyResult.error;
    }

    return ((legacyResult.data ?? []) as LegacyDisciplineStatusRow[]).map(mapLegacyRowToDisciplineRow);
  }

  const { data, error } = await supabase
    .from(DISCIPLINE_STATUS_TABLE)
    .select("subject_slug, status_override, unlock_override, avaliacao_status, avaliacao_nota")
    .eq("user_id", userId);

  if (!error) {
    resolvedDisciplineStatusTable = DISCIPLINE_STATUS_TABLE;
    return (data ?? []) as DisciplineStatusRow[];
  }

  if (!isMissingTableError(error)) {
    throw error;
  }

  const legacyResult = await supabase
    .from(LEGACY_DISCIPLINE_STATUS_TABLE)
    .select("subject_slug, status, unlocked, avaliacao_status")
    .eq("user_id", userId);

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  resolvedDisciplineStatusTable = LEGACY_DISCIPLINE_STATUS_TABLE;
  return ((legacyResult.data ?? []) as LegacyDisciplineStatusRow[]).map(mapLegacyRowToDisciplineRow);
}

async function upsertDisciplineRows(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  rows: DisciplineStatusPersistRow[],
) {
  if (resolvedDisciplineStatusTable === LEGACY_DISCIPLINE_STATUS_TABLE) {
    const legacyPayload = rows.map((row) => ({
      user_id: row.user_id,
      subject_slug: row.subject_slug,
      status: row.status_override ?? getDisciplina(row.subject_slug)?.statusPadrao ?? "em-andamento",
      unlocked: row.unlock_override,
      avaliacao_status: row.avaliacao_status ?? "pendente",
    }));

    const legacyResult = await supabase
      .from(LEGACY_DISCIPLINE_STATUS_TABLE)
      .upsert(legacyPayload, { onConflict: "user_id,subject_slug" })
      .select("subject_slug, status, unlocked, avaliacao_status");

    if (legacyResult.error) {
      throw legacyResult.error;
    }

    return ((legacyResult.data ?? []) as LegacyDisciplineStatusRow[]).map(mapLegacyRowToDisciplineRow);
  }

  const primaryResult = await supabase
    .from(DISCIPLINE_STATUS_TABLE)
    .upsert(rows, { onConflict: "user_id,subject_slug" })
    .select("subject_slug, status_override, unlock_override, avaliacao_status, avaliacao_nota");

  if (!primaryResult.error) {
    resolvedDisciplineStatusTable = DISCIPLINE_STATUS_TABLE;
    return (primaryResult.data ?? []) as DisciplineStatusRow[];
  }

  if (!isMissingTableError(primaryResult.error)) {
    throw primaryResult.error;
  }

  const legacyPayload = rows.map((row) => ({
    user_id: row.user_id,
    subject_slug: row.subject_slug,
    status: row.status_override ?? getDisciplina(row.subject_slug)?.statusPadrao ?? "em-andamento",
    unlocked: row.unlock_override,
    avaliacao_status: row.avaliacao_status ?? "pendente",
  }));

  const legacyResult = await supabase
    .from(LEGACY_DISCIPLINE_STATUS_TABLE)
    .upsert(legacyPayload, { onConflict: "user_id,subject_slug" })
    .select("subject_slug, status, unlocked, avaliacao_status");

  if (legacyResult.error) {
    throw legacyResult.error;
  }

  resolvedDisciplineStatusTable = LEGACY_DISCIPLINE_STATUS_TABLE;
  return ((legacyResult.data ?? []) as LegacyDisciplineStatusRow[]).map(mapLegacyRowToDisciplineRow);
}

function mapRowsToState(rows: DisciplineStatusRow[]): DisciplineState {
  return rows.reduce<DisciplineState>(
    (acc, row) => {
      if (row.status_override) {
        acc.statusOverrides[row.subject_slug] = row.status_override;
      }

      if (typeof row.unlock_override === "boolean") {
        acc.unlockOverrides[row.subject_slug] = row.unlock_override;
      }

      if (row.avaliacao_status) {
        acc.avaliacaoOverrides[row.subject_slug] = row.avaliacao_status;
      }

      if (row.avaliacao_nota) {
        acc.avaliacaoNotas[row.subject_slug] = row.avaliacao_nota;
      }

      return acc;
    },
    {
      statusOverrides: {},
      unlockOverrides: {},
      avaliacaoOverrides: {},
      avaliacaoNotas: {},
    },
  );
}

function mergeOptionalRecord<T>(
  current: Partial<Record<string, T>>,
  slug: string,
  value: T | null | undefined,
) {
  const next = { ...current };

  if (value === null || value === undefined) {
    delete next[slug];
    return next;
  }

  next[slug] = value;
  return next;
}

function mergeState(current: DisciplineState, patch: DisciplineStatePatch): DisciplineState {
  return {
    statusOverrides:
      patch.statusOverride === undefined
        ? current.statusOverrides
        : mergeOptionalRecord(current.statusOverrides, patch.slug, patch.statusOverride),
    unlockOverrides:
      patch.unlockOverride === undefined
        ? current.unlockOverrides
        : {
            ...current.unlockOverrides,
            [patch.slug]: patch.unlockOverride,
          },
    avaliacaoOverrides:
      patch.avaliacaoStatus === undefined
        ? current.avaliacaoOverrides
        : mergeOptionalRecord(current.avaliacaoOverrides, patch.slug, patch.avaliacaoStatus),
    avaliacaoNotas:
      patch.avaliacaoNota === undefined
        ? current.avaliacaoNotas
        : mergeOptionalRecord(current.avaliacaoNotas, patch.slug, patch.avaliacaoNota),
  };
}

async function migrateLegacyDisciplineState(userId: string) {
  const supabase = getSupabaseBrowserClient();
  const shouldMigrate =
    (await shouldMigrateLegacyStorage(LEGACY_STATUS_KEY, { supabase, userId })) ||
    (await shouldMigrateLegacyStorage(LEGACY_UNLOCK_KEY, { supabase, userId })) ||
    (await shouldMigrateLegacyStorage(LEGACY_AVALIACAO_KEY, { supabase, userId })) ||
    (await shouldMigrateLegacyStorage(LEGACY_AVALIACAO_NOTA_KEY, { supabase, userId }));

  if (!shouldMigrate) return null;

  const statusOverrides = loadLegacyItems<DisciplinaStatusOverrides>(LEGACY_STATUS_KEY, {});
  const unlockOverrides = loadLegacyItems<DisciplinaUnlockOverrides>(LEGACY_UNLOCK_KEY, {});
  const avaliacaoOverrides = loadLegacyItems<AvaliacaoOverrides>(LEGACY_AVALIACAO_KEY, {});
  const avaliacaoNotas = loadLegacyItems<AvaliacaoNotas>(LEGACY_AVALIACAO_NOTA_KEY, {});

  const slugs = new Set<string>([
    ...Object.keys(statusOverrides),
    ...Object.keys(unlockOverrides),
    ...Object.keys(avaliacaoOverrides),
    ...Object.keys(avaliacaoNotas),
  ]);

  if (slugs.size === 0) return [];

  return Array.from(slugs).map((slug) => ({
    user_id: userId,
    subject_slug: slug,
    status_override: statusOverrides[slug] ?? null,
    unlock_override: unlockOverrides[slug] ?? false,
    avaliacao_status: avaliacaoOverrides[slug] ?? null,
    avaliacao_nota: avaliacaoNotas[slug] ?? null,
  }));
}

async function markDisciplineLegacyStateMigrated(userId: string) {
  const supabase = getSupabaseBrowserClient();

  await markLegacyStorageMigrated(LEGACY_STATUS_KEY, { supabase, userId });
  await markLegacyStorageMigrated(LEGACY_UNLOCK_KEY, { supabase, userId });
  await markLegacyStorageMigrated(LEGACY_AVALIACAO_KEY, { supabase, userId });
  await markLegacyStorageMigrated(LEGACY_AVALIACAO_NOTA_KEY, { supabase, userId });
}

function mergeLegacyPatchIntoRow(
  legacyRow: DisciplineStatusPersistRow,
  existingRow?: DisciplineStatusRow,
): DisciplineStatusPersistRow | null {
  if (!existingRow) {
    return legacyRow;
  }

  const patch: DisciplineStatusPersistRow = {
    user_id: legacyRow.user_id,
    subject_slug: legacyRow.subject_slug,
    status_override: existingRow.status_override,
    unlock_override: existingRow.unlock_override ?? false,
    avaliacao_status: existingRow.avaliacao_status,
    avaliacao_nota: existingRow.avaliacao_nota,
  };

  let changed = false;

  if (patch.status_override == null && legacyRow.status_override != null) {
    patch.status_override = legacyRow.status_override;
    changed = true;
  }

  if (!patch.unlock_override && legacyRow.unlock_override) {
    patch.unlock_override = true;
    changed = true;
  }

  if (patch.avaliacao_status == null && legacyRow.avaliacao_status != null) {
    patch.avaliacao_status = legacyRow.avaliacao_status;
    changed = true;
  }

  if ((!patch.avaliacao_nota || patch.avaliacao_nota.trim() === "") && legacyRow.avaliacao_nota) {
    patch.avaliacao_nota = legacyRow.avaliacao_nota;
    changed = true;
  }

  return changed ? patch : null;
}

export function useSupabaseDisciplineState() {
  const { user } = useAuth();
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();
  const queryKey = [DISCIPLINE_STATUS_QUERY_KEY, user?.id];

  const { data = EMPTY_STATE, isLoading } = useQuery<DisciplineState>({
    queryKey,
    enabled: Boolean(user && supabase),
    queryFn: async () => {
      if (!supabase || !user) return EMPTY_STATE;

      const rows = await fetchDisciplineStatusRows(supabase, user.id);

      const legacyRows = await migrateLegacyDisciplineState(user.id);

      if (!legacyRows) {
        return mapRowsToState(rows);
      }

      if (legacyRows.length === 0) {
        await markDisciplineLegacyStateMigrated(user.id);
        return mapRowsToState(rows);
      }

      const rowsBySlug = new Map(rows.map((row) => [row.subject_slug, row]));
      const rowsToPersist = legacyRows
        .map((legacyRow) => mergeLegacyPatchIntoRow(legacyRow, rowsBySlug.get(legacyRow.subject_slug)))
        .filter((row): row is DisciplineStatusPersistRow => Boolean(row));

      if (rowsToPersist.length === 0) {
        await markDisciplineLegacyStateMigrated(user.id);
        return mapRowsToState(rows);
      }

      const migratedData = await upsertDisciplineRows(supabase, rowsToPersist);

      await markDisciplineLegacyStateMigrated(user.id);

      const mergedRowsBySlug = new Map(rows.map((row) => [row.subject_slug, row]));
      for (const row of (migratedData ?? []) as DisciplineStatusRow[]) {
        mergedRowsBySlug.set(row.subject_slug, row);
      }

      return mapRowsToState(Array.from(mergedRowsBySlug.values()));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (patch: DisciplineStatePatch) => {
      if (!supabase || !user) throw new Error("Sessao nao encontrada.");

      const currentState = queryClient.getQueryData<DisciplineState>(queryKey) ?? EMPTY_STATE;
      const payload: {
        user_id: string;
        subject_slug: string;
        status_override?: DisciplinaManualStatus | null;
        unlock_override?: boolean;
        avaliacao_status?: AvaliacaoStatus | null;
        avaliacao_nota?: string | null;
      } = {
        user_id: user.id,
        subject_slug: patch.slug,
      };

      if (patch.statusOverride !== undefined) {
        payload.status_override = patch.statusOverride;
      }

      if (patch.unlockOverride !== undefined) {
        payload.unlock_override = patch.unlockOverride;
      }

      if (patch.avaliacaoStatus !== undefined) {
        payload.avaliacao_status = patch.avaliacaoStatus;
      }

      if (patch.avaliacaoNota !== undefined) {
        payload.avaliacao_nota = patch.avaliacaoNota;
      }

      await upsertDisciplineRows(supabase, [
        {
          user_id: user.id,
          subject_slug: patch.slug,
          status_override:
            patch.statusOverride !== undefined
              ? patch.statusOverride
              : currentState.statusOverrides[patch.slug] ?? null,
          unlock_override:
            patch.unlockOverride !== undefined
              ? patch.unlockOverride
              : currentState.unlockOverrides[patch.slug] ?? false,
          avaliacao_status:
            patch.avaliacaoStatus !== undefined
              ? patch.avaliacaoStatus
              : currentState.avaliacaoOverrides[patch.slug] ?? null,
          avaliacao_nota:
            patch.avaliacaoNota !== undefined
              ? patch.avaliacaoNota
              : currentState.avaliacaoNotas[patch.slug] ?? null,
        },
      ]);

      return patch;
    },
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<DisciplineState>(queryKey) ?? EMPTY_STATE;
      queryClient.setQueryData<DisciplineState>(queryKey, mergeState(previous, patch));
      return { previous };
    },
    onError: (error: Error, _patch, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }

      toast.error(error.message);
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    ...data,
    isLoading,
    isSaving: updateMutation.isPending,
    updateDisciplinaState: (patch: DisciplineStatePatch) => updateMutation.mutate(patch),
  };
}
