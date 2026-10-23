import { z } from "zod";
import { TAILLE_TICKET, type Calendrier } from "./calendrier";
import { DATE_LANCEMENT } from "./config";
import { paireJouable } from "./paires";
import { lignesSchema, type Ligne } from "./schema";

export interface Rapport {
  erreurs: string[];
  avertissements: string[];
}

/** Contrôles de `data/lignes.json`. */
export function verifierLignes(brut: unknown): Rapport & { lignes: Ligne[] | null } {
  const erreurs: string[] = [];
  const avertissements: string[] = [];

  const resultat = lignesSchema.safeParse(brut);
  if (!resultat.success) {
    for (const probleme of resultat.error.issues) {
      const [index, ...chemin] = probleme.path;
      const id = Array.isArray(brut) && typeof index === "number" ? (brut[index] as { id?: unknown })?.id : undefined;
      const ou = typeof index === "number" ? `ligne ${index + 1}${typeof id === "string" ? ` (${id})` : ""}` : "fichier";
      erreurs.push(`${ou} › ${chemin.join(".") || "racine"} : ${probleme.message}`);
    }
    return { erreurs, avertissements, lignes: null };
  }

  const lignes = resultat.data;
  doublons(lignes, (l) => l.id).forEach(([id, n]) => erreurs.push(`id « ${id} » présent ${n} fois`));
  doublons(lignes, (l) => String(l.montant)).forEach(([montant]) => {
    const ids = lignes.filter((l) => String(l.montant) === montant).map((l) => l.id);
    erreurs.push(`même montant (${montant} €) pour : ${ids.join(", ")}`);
  });

  for (const l of lignes) {
    if (!lignes.some((autre) => autre !== l && paireJouable(l, autre))) {
      avertissements.push(`« ${l.id} » ne forme aucune paire jouable : elle ne sortira jamais.`);
    }
  }

  return { erreurs, avertissements, lignes: erreurs.length ? null : lignes };
}

function doublons<T>(elements: readonly T[], cle: (e: T) => string): [string, number][] {
  const compte = new Map<string, number>();
  for (const e of elements) compte.set(cle(e), (compte.get(cle(e)) ?? 0) + 1);
  return [...compte].filter(([, n]) => n > 1);
}

export const calendrierSchema = z.object({
  lancement: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  graine: z.string().min(1),
  tickets: z.array(
    z.object({
      numero: z.number().int().positive(),
      cycle: z.number().int().min(0),
      ids: z.array(z.string()).length(TAILLE_TICKET),
    }),
  ),
});

/** Nombre minimal de jours à venir couverts par le calendrier figé. */
export const MARGE_CALENDRIER_JOURS = 30;

/** Contrôles de `data/calendrier.lock.json` par rapport à la base et à la date du jour. */
export function verifierCalendrier(brut: unknown, lignes: readonly Ligne[], numeroDuJour: number): Rapport {
  const erreurs: string[] = [];
  const avertissements: string[] = [];
  const resultat = calendrierSchema.safeParse(brut);
  if (!resultat.success) {
    return { erreurs: resultat.error.issues.map((p) => `calendrier › ${p.path.join(".")} : ${p.message}`), avertissements };
  }
  const calendrier: Calendrier = resultat.data;
  if (calendrier.lancement !== DATE_LANCEMENT) {
    erreurs.push(
      `le calendrier a été généré pour un lancement le ${calendrier.lancement}, mais DATE_LANCEMENT vaut ${DATE_LANCEMENT} (lancez npm run generer-calendrier)`,
    );
  }
  const parId = new Map(lignes.map((l) => [l.id, l]));

  calendrier.tickets.forEach((t, i) => {
    // Les tickets passés sont archivés : un problème y est signalé, sans bloquer.
    const signaler = (msg: string) => (t.numero >= numeroDuJour ? erreurs : avertissements).push(msg);
    if (t.numero !== i + 1) erreurs.push(`calendrier : le ticket en position ${i + 1} porte le n° ${t.numero}`);
    if (new Set(t.ids).size !== t.ids.length) signaler(`ticket ${t.numero} : ligne en double`);
    const inconnues = t.ids.filter((id) => !parId.has(id));
    if (inconnues.length) {
      signaler(`ticket ${t.numero} : lignes absentes de la base (${inconnues.join(", ")})`);
      return;
    }
    for (let k = 0; k + 1 < t.ids.length; k++) {
      const a = parId.get(t.ids[k]!)!;
      const b = parId.get(t.ids[k + 1]!)!;
      if (!paireJouable(a, b)) signaler(`ticket ${t.numero} : paire non jouable ${a.id} → ${b.id}`);
    }
  });

  const dernier = calendrier.tickets.at(-1)?.numero ?? 0;
  if (dernier < numeroDuJour + MARGE_CALENDRIER_JOURS) {
    erreurs.push(
      `le calendrier s'arrête au ticket ${dernier} ; il doit couvrir au moins ${MARGE_CALENDRIER_JOURS} jours à venir (lancez npm run generer-calendrier)`,
    );
  }

  const aVenir = new Set(calendrier.tickets.filter((t) => t.numero > numeroDuJour + 1).flatMap((t) => t.ids));
  const absentes = lignes.filter((l) => !aVenir.has(l.id)).map((l) => l.id);
  if (absentes.length && dernier > numeroDuJour + 1) {
    avertissements.push(
      `lignes absentes des tickets à venir : ${absentes.join(", ")} (lancez npm run generer-calendrier)`,
    );
  }

  return { erreurs, avertissements };
}
