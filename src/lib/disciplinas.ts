export type DisciplinaStatus = "concluida" | "em-andamento" | "bloqueada";
export type DisciplinaManualStatus = Exclude<DisciplinaStatus, "bloqueada">;
export type DisciplinaStatusOverrides = Partial<Record<string, DisciplinaManualStatus>>;
export type DisciplinaUnlockOverrides = Partial<Record<string, boolean>>;
export type AvaliacaoStatus = "concluida" | "pendente";
export type AvaliacaoOverrides = Partial<Record<string, AvaliacaoStatus>>;

export type Disciplina = {
  slug: string;
  nome: string;
  inicio: string;
  anoModulo: string;
  statusPadrao: DisciplinaManualStatus;
  temConteudo: boolean;
};

export type DisciplinaResolvida = Disciplina & {
  status: DisciplinaStatus;
  progresso: number;
  liberada: boolean;
  liberadaPorData: boolean;
  liberadaAntecipadamente: boolean;
};

export const STATUS_LABELS: Record<DisciplinaStatus, string> = {
  bloqueada: "Bloqueada",
  "em-andamento": "Em andamento",
  concluida: "Concluída",
};

export const AVALIACAO_LABELS: Record<AvaliacaoStatus, string> = {
  concluida: "Concluída",
  pendente: "Pendente",
};

const PROGRESSO_POR_STATUS: Record<DisciplinaStatus, number> = {
  bloqueada: 0,
  "em-andamento": 50,
  concluida: 100,
};

export const DISCIPLINAS: Disciplina[] = [
  {
    slug: "concepcao-do-projeto",
    nome: "Concepção do Projeto",
    inicio: "01/06/2026",
    anoModulo: "2025/40",
    statusPadrao: "concluida",
    temConteudo: true,
  },
  {
    slug: "estrategias-de-ux",
    nome: "Estratégias de UX",
    inicio: "01/07/2026",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "metodos-ageis",
    nome: "Métodos Ágeis",
    inicio: "01/08/2026",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "negocios-digitais",
    nome: "Negócios Digitais",
    inicio: "01/09/2026",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "prototipos-de-interface",
    nome: "Protótipos de Interface",
    inicio: "01/10/2026",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "design-de-servicos",
    nome: "Design de Serviços",
    inicio: "01/11/2026",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "user-research",
    nome: "User Research",
    inicio: "01/12/2026",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "design-de-interfaces",
    nome: "Design de Interfaces",
    inicio: "01/01/2027",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "testes-de-usabilidade",
    nome: "Testes de Usabilidade",
    inicio: "01/01/2027",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
  {
    slug: "portfolio",
    nome: "Portfólio",
    inicio: "01/02/2027",
    anoModulo: "2025/40",
    statusPadrao: "em-andamento",
    temConteudo: false,
  },
];

function parseDateBR(value: string) {
  const [day, month, year] = value.split("/").map(Number);
  return new Date(year, month - 1, day);
}

export function disciplinaJaIniciou(disciplina: Disciplina, now = new Date()) {
  const hoje = new Date(now);
  hoje.setHours(0, 0, 0, 0);

  return hoje >= parseDateBR(disciplina.inicio);
}

export function getAvaliacaoStatus(
  disciplina: Disciplina,
  override?: AvaliacaoStatus,
): AvaliacaoStatus {
  if (override) return override;
  return disciplina.statusPadrao === "concluida" ? "concluida" : "pendente";
}

export function podeConcluirDisciplina(avaliacaoStatus: AvaliacaoStatus) {
  return avaliacaoStatus === "concluida";
}

export function resolveDisciplina(
  disciplina: Disciplina,
  statusOverride?: DisciplinaManualStatus,
  unlockOverride = false,
  avaliacaoStatus?: AvaliacaoStatus,
  now = new Date(),
): DisciplinaResolvida {
  const liberadaPorData = disciplinaJaIniciou(disciplina, now);
  const liberadaAntecipadamente = unlockOverride && !liberadaPorData;
  const liberada = liberadaPorData || liberadaAntecipadamente;
  const avaliacaoResolvida = getAvaliacaoStatus(disciplina, avaliacaoStatus);
  const statusBase: DisciplinaStatus = liberada ? statusOverride ?? disciplina.statusPadrao : "bloqueada";
  const status =
    statusBase === "concluida" && !podeConcluirDisciplina(avaliacaoResolvida)
      ? "em-andamento"
      : statusBase;

  return {
    ...disciplina,
    status,
    progresso: PROGRESSO_POR_STATUS[status],
    liberada,
    liberadaPorData,
    liberadaAntecipadamente,
  };
}

export function getDisciplina(slug: string) {
  return DISCIPLINAS.find((d) => d.slug === slug);
}
