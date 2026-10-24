import { DATE_LANCEMENT } from "./config";

/** Accès au localStorage, toujours protégé : navigation privée, stockage bloqué, rendu serveur… */
export const stockage = {
  lire<T>(cle: string): T | null {
    try {
      const brut = globalThis.localStorage?.getItem(cle);
      return brut ? (JSON.parse(brut) as T) : null;
    } catch {
      return null;
    }
  },
  ecrire(cle: string, valeur: unknown): void {
    try {
      globalThis.localStorage?.setItem(cle, JSON.stringify(valeur));
    } catch {
      /* stockage indisponible : on joue sans mémoire */
    }
  },
};

/**
 * Les clés portent la date de lancement : les parties jouées avant (ou avec un ancien calendrier)
 * ne sont jamais relues comme des tickets du jour.
 */
const PREFIXE = `addition:${DATE_LANCEMENT}:`;
export const CLE_STATS = `${PREFIXE}stats`;
export const clePartie = (numero: number) => `${PREFIXE}jour:${numero}`;
/** Préférence d'affichage, indépendante du calendrier. */
export const CLE_THEME = "addition:theme";

/** Supprime les sauvegardes d'avant le lancement ou d'un ancien format (« addition:jour:1 »…). */
export function nettoyerAnciennesSauvegardes(): void {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return;
    const aSupprimer: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const cle = ls.key(i);
      if (cle && cle.startsWith("addition:") && cle !== CLE_THEME && !cle.startsWith(PREFIXE)) aSupprimer.push(cle);
    }
    aSupprimer.forEach((cle) => ls.removeItem(cle));
  } catch {
    /* stockage indisponible */
  }
}

export interface PartieSauvegardee {
  ids: string[];
  reponses: boolean[];
}

export interface Stats {
  dernierJour: number;
  serie: number;
  meilleure: number;
}

export const STATS_VIDES: Stats = { dernierJour: 0, serie: 0, meilleure: 0 };

/** Valide une sauvegarde : elle doit correspondre au même ticket (mêmes lignes). */
export function partieValide(sauvegarde: unknown, ids: readonly string[]): sauvegarde is PartieSauvegardee {
  if (!sauvegarde || typeof sauvegarde !== "object") return false;
  const s = sauvegarde as Partial<PartieSauvegardee>;
  return (
    Array.isArray(s.ids) &&
    s.ids.length === ids.length &&
    s.ids.every((id, i) => id === ids[i]) &&
    Array.isArray(s.reponses) &&
    s.reponses.length <= ids.length - 1 &&
    s.reponses.every((r) => typeof r === "boolean")
  );
}

export function lireStats(brut: unknown): Stats {
  if (!brut || typeof brut !== "object") return STATS_VIDES;
  const s = brut as Partial<Stats>;
  const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);
  return { dernierJour: n(s.dernierJour), serie: n(s.serie), meilleure: n(s.meilleure) };
}

/** Met à jour la série après un ticket du jour terminé. Rejouer le même jour ne change rien. */
export function enregistrerTicketTermine(stats: Stats, numero: number): Stats {
  if (stats.dernierJour === numero) return stats;
  const serie = stats.dernierJour === numero - 1 ? stats.serie + 1 : 1;
  return { dernierJour: numero, serie, meilleure: Math.max(stats.meilleure, serie) };
}

/** Série affichée : elle tombe à 0 si le ticket d'hier n'a pas été terminé. */
export function serieEnCours(stats: Stats, numeroDuJour: number): number {
  return stats.dernierJour >= numeroDuJour - 1 ? stats.serie : 0;
}
