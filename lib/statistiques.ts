/**
 * Mesure d'audience avec Umami (sans cookie), facultative.
 *
 * - NEXT_PUBLIC_UMAMI_WEBSITE_ID : identifiant du site dans Umami. Absent : aucun script chargé.
 * - NEXT_PUBLIC_UMAMI_SCRIPT_URL : script à charger (par défaut, Umami Cloud).
 */
export const UMAMI_WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || undefined;
export const UMAMI_SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || "https://cloud.umami.is/script.js";

export type Evenement = "partie_commencee" | "partie_terminee" | "ticket_copie";

type Donnees = Record<string, string | number>;

declare global {
  interface Window {
    umami?: { track: (evenement: string, donnees?: Donnees) => unknown };
  }
}

/** Envoie un événement si Umami est chargé ; ne fait jamais échouer le jeu. */
export function suivre(evenement: Evenement, donnees?: Donnees): void {
  try {
    window.umami?.track(evenement, donnees);
  } catch {
    /* mesure indisponible : sans conséquence */
  }
}
