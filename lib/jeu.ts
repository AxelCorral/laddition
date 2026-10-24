import { hacher, mulberry32 } from "./aleatoire";
import { tirage } from "./calendrier";
import { NB_QUESTIONS } from "./partie";
import type { Ligne } from "./schema";

/** Données envoyées au navigateur : les lignes et le calendrier, compacté en index dans `lignes`. */
export interface DonneesJeu {
  lignes: Ligne[];
  tickets: number[][];
  graine: string;
}

/** Les 6 lignes du ticket n° `numero` (tirage déterministe de secours au-delà du calendrier figé). */
export function lignesDuJour(donnees: DonneesJeu, numero: number): Ligne[] {
  const indices = donnees.tickets[numero - 1];
  if (indices && indices.every((i) => donnees.lignes[i])) return indices.map((i) => donnees.lignes[i]!);
  return tirage(donnees.lignes, mulberry32(hacher(`${donnees.graine}:secours:${numero}`)));
}

export interface EtatDesSources {
  /** Les lignes du ticket du jour, dans l'ordre, révélées ou non. */
  jour: { ligne: Ligne; revelee: boolean }[];
  /** Lignes des tickets précédents (hors lignes du ticket du jour). */
  passees: Ligne[];
  /** Nombre de lignes de la base encore jamais montrées. */
  masquees: number;
}

/**
 * Ce que la page des sources peut montrer sans rien dévoiler :
 * - les lignes des tickets précédents ;
 * - dans le ticket du jour, la première ligne (affichée d'emblée) et chaque ligne dont le joueur a
 *   déjà vu le montant (une réponse donnée révèle la ligne suivante).
 */
export function etatDesSources(donnees: DonneesJeu, numero: number, nbReponses: number): EtatDesSources {
  const duJour = lignesDuJour(donnees, numero);
  const nbRevelees = Math.min(duJour.length, Math.max(0, Math.min(nbReponses, NB_QUESTIONS)) + 1);
  const idsDuJour = new Set(duJour.map((l) => l.id));

  const passees = new Map<string, Ligne>();
  for (let n = 1; n < numero; n++) {
    for (const l of lignesDuJour(donnees, n)) if (!idsDuJour.has(l.id)) passees.set(l.id, l);
  }

  return {
    jour: duJour.map((ligne, i) => ({ ligne, revelee: i < nbRevelees })),
    passees: [...passees.values()],
    masquees: donnees.lignes.length - passees.size - nbRevelees,
  };
}
