import type { Ligne } from "./schema";

/** Espace insécable entre le nombre et l'unité, pour éviter « 122,6 / M€ » en fin de ligne. */
const ESP = " ";

export function formaterNombre(valeur: number, decimalesMax: number): string {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: decimalesMax }).format(valeur);
}

/**
 * Formatage d'un montant en euros, identique au prototype :
 * - à partir de 100 Md€ : 1 décimale (197,1 Md€) ;
 * - à partir de 1 Md€ : 2 décimales au plus (6,65 Md€, 58 Md€) ;
 * - à partir de 1 M€ : 1 décimale au plus (122,6 M€, 20 M€) ;
 * - sinon : euros entiers.
 */
export function formaterMontant(montant: number): string {
  if (montant >= 1e9) return formaterNombre(montant / 1e9, montant >= 1e11 ? 1 : 2) + ESP + "Md€";
  if (montant >= 1e6) return formaterNombre(montant / 1e6, 1) + ESP + "M€";
  return formaterNombre(montant, 0) + ESP + "€";
}

/** Texte affiché pour une ligne : le champ `affichage` est prioritaire. */
export function montantAffiche(ligne: Pick<Ligne, "montant" | "affichage">): string {
  return ligne.affichage ?? formaterMontant(ligne.montant);
}
