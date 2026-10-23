import { formaterNombre } from "./format";
import type { Ligne } from "./schema";

/** Règles d'exclusion des paires consécutives d'un ticket. */
export const REGLES = {
  /** Au-delà, la comparaison est trop facile. */
  ratioMax: 1000,
  /** Écart relatif minimal entre deux montants exacts (5 %) : en dessous, c'est pile ou face. */
  ecartMinExact: 0.05,
  /** Écart relatif minimal quand l'un des montants est approximatif (« ≈ 12 M€ »). */
  ecartMinApprox: 0.2,
} as const;

/**
 * Nature d'un montant, déduite du champ `affichage` :
 * - « > 1 Md€ », « ≥ … », « plus de … » : `minimum` (la valeur réelle est au moins `montant`) ;
 * - « < … », « ≤ … », « moins de … » : `maximum` ;
 * - « ≈ … », « ~ … », « environ … » : `environ` ;
 * - sinon : `exact`.
 */
export type Precision = "exact" | "environ" | "minimum" | "maximum";

export function precision(ligne: Pick<Ligne, "affichage">): Precision {
  const a = ligne.affichage?.trim().toLowerCase();
  if (!a) return "exact";
  if (/^(>|≥|plus de\b)/.test(a)) return "minimum";
  if (/^(<|≤|moins de\b)/.test(a)) return "maximum";
  if (/^(≈|~|env\.|environ\b)/.test(a)) return "environ";
  return "exact";
}

type Comparable = Pick<Ligne, "montant" | "affichage">;

/**
 * Une paire est jouable si la bonne réponse est certaine et pas triviale.
 * - Ratio ≤ 1 000.
 * - Montants exacts : écart ≥ 5 %.
 * - Un montant « environ » : écart ≥ 20 %.
 * - Un montant « minimum » doit être le plus grand des deux (sinon la vraie valeur pourrait dépasser l'autre),
 *   et inversement pour un « maximum ».
 */
export function paireJouable(a: Comparable, b: Comparable): boolean {
  const [petit, grand] = a.montant <= b.montant ? [a, b] : [b, a];
  const ratio = grand.montant / petit.montant;
  if (ratio > REGLES.ratioMax) return false;

  const pPetit = precision(petit);
  const pGrand = precision(grand);
  if (pPetit === "minimum" || pGrand === "maximum") return false;

  const approx = pPetit !== "exact" || pGrand !== "exact";
  // Petite tolérance : 14,4 / 12 doit compter comme 20 % malgré l'arithmétique flottante.
  return ratio - 1 >= (approx ? REGLES.ecartMinApprox : REGLES.ecartMinExact) - 1e-9;
}

/** Phrase de ratio affichée après la révélation, en comparant la ligne du bas (b) à celle du haut (a). */
export function phraseRatio(a: Comparable, b: Comparable): string {
  const r = b.montant / a.montant;
  const facteur = r >= 1 ? r : 1 / r;
  const sens = r >= 1 ? "plus" : "moins";
  const [petit, grand] = r >= 1 ? [a, b] : [b, a];
  const pPetit = precision(petit);
  const pGrand = precision(grand);

  const borne = pGrand === "minimum" || pPetit === "maximum";
  const environ = pPetit === "environ" || pGrand === "environ";
  if (borne && environ) {
    return `C'est au moins de l'ordre de ${arrondiInferieur(facteur)} fois ${sens} que la ligne du dessus.`;
  }
  if (environ) return `C'est environ ${arrondi(facteur)} fois ${sens} que la ligne du dessus.`;
  if (borne) {
    // Le vrai rapport est au moins celui-ci : on arrondit vers le bas pour ne jamais l'exagérer.
    return `C'est au moins ${arrondiInferieur(facteur)} fois ${sens} que la ligne du dessus.`;
  }
  if (facteur >= 1.1) return `C'est ${arrondi(facteur)} fois ${sens} que la ligne du dessus.`;
  return `Écart de ${formaterNombre(Math.abs(r - 1) * 100, 1)} % avec la ligne du dessus : ça se jouait à peu de chose.`;
}

function arrondi(v: number): string {
  return v < 10 ? formaterNombre(v, 1) : formaterNombre(Math.round(v), 0);
}

function arrondiInferieur(v: number): string {
  return v < 10 ? formaterNombre(Math.floor(v * 10) / 10, 1) : formaterNombre(Math.floor(v), 0);
}
