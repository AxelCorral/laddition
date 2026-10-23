export type Mode = "jour" | "entrainement";

export const NB_QUESTIONS = 5;

/** La réponse est juste si la ligne du bas est bien plus chère (ou moins chère) que celle du haut. */
export function reponseJuste(montantHaut: number, montantBas: number, plusCher: boolean): boolean {
  return montantBas > montantHaut === plusCher;
}

export function score(reponses: readonly boolean[]): number {
  return reponses.filter(Boolean).length;
}

/** Grille encodée pour les liens de partage : « 11011 ». */
export function encoderGrille(reponses: readonly boolean[]): string {
  return reponses.map((r) => (r ? "1" : "0")).join("");
}

export function decoderGrille(grille: string): boolean[] | null {
  if (!new RegExp(`^[01]{${NB_QUESTIONS}}$`).test(grille)) return null;
  return [...grille].map((c) => c === "1");
}

export function grilleEmoji(reponses: readonly boolean[]): string {
  return reponses.map((r) => (r ? "🟩" : "🟥")).join("");
}

const VERDICTS = [
  "Zéro. L'État vous doit une explication, ou l'inverse.",
  "Une seule. Les ordres de grandeur sont traîtres.",
  "Deux sur cinq. Bercy aussi se trompe parfois.",
  "Trois sur cinq. Vous lisez les budgets en diagonale, et ça marche.",
  "Quatre sur cinq. Vous avez l'œil d'un rapporteur spécial.",
  "Sans faute. La Cour des comptes recrute.",
] as const;

export function verdict(points: number): string {
  return VERDICTS[Math.min(Math.max(points, 0), VERDICTS.length - 1)]!;
}

export interface Partage {
  mode: Mode;
  numero: number;
  reponses: readonly boolean[];
  url?: string;
}

/** Texte copié dans le presse-papiers en fin de partie. */
export function texteDePartage({ mode, numero, reponses, url }: Partage): string {
  const points = `${score(reponses)}/${NB_QUESTIONS}`;
  const titre = mode === "jour" ? `L'Addition n° ${numero} : ${points}` : `L'Addition (entraînement) : ${points}`;
  return [titre, grilleEmoji(reponses), "Combien coûte la France ?", url].filter(Boolean).join("\n");
}
