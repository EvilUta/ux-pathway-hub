export type Disciplina = {
  slug: string;
  nome: string;
  inicio: string;
  status: "concluida" | "em-andamento" | "bloqueada";
  progresso: number;
  liberada: boolean;
};

export const DISCIPLINAS: Disciplina[] = [
  {
    slug: "concepcao-do-projeto",
    nome: "Concepção do Projeto",
    inicio: "Jan 2025",
    status: "concluida",
    progresso: 100,
    liberada: true,
  },
  { slug: "estrategias-de-ux", nome: "Estratégias de UX", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "metodos-ageis", nome: "Métodos Ágeis", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "negocios-digitais", nome: "Negócios Digitais", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "prototipos-de-interface", nome: "Protótipos de Interface", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "design-de-servicos", nome: "Design de Serviços", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "user-research", nome: "User Research", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "design-de-interfaces", nome: "Design de Interfaces", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "testes-de-usabilidade", nome: "Testes de Usabilidade", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
  { slug: "portfolio", nome: "Portfólio", inicio: "—", status: "bloqueada", progresso: 0, liberada: false },
];

export function getDisciplina(slug: string) {
  return DISCIPLINAS.find((d) => d.slug === slug);
}
