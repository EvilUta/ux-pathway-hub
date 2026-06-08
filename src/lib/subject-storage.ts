export type SubjectStorageKeys = {
  flashcards: string;
  materiais: string;
  portfolioReal: string;
  resumos: string;
  revisoes: string;
};

export function getSubjectStorageKeys(slug: string): SubjectStorageKeys {
  if (slug === "concepcao-do-projeto") {
    return {
      flashcards: "uxa-cdp-flashcards",
      materiais: "uxa-cdp-materiais",
      portfolioReal: "uxa-cdp-portfolio-real",
      resumos: "uxa-cdp-resumos",
      revisoes: "uxa-cdp-revisoes",
    };
  }

  return {
    flashcards: `uxa-${slug}-flashcards`,
    materiais: `uxa-${slug}-materiais`,
    portfolioReal: `uxa-${slug}-portfolio-real`,
    resumos: `uxa-${slug}-resumos`,
    revisoes: `uxa-${slug}-revisoes`,
  };
}
