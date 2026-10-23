import { hacher, melanger, mulberry32 } from "./aleatoire";
import { DATE_LANCEMENT } from "./config";
import { lancementPasse, numeroDuJour } from "./date-paris";
import { paireJouable } from "./paires";
import type { Ligne } from "./schema";

/**
 * Calendrier des tickets
 * ======================
 *
 * Le calendrier est calculé une fois par `npm run generer-calendrier` puis figé dans
 * `data/calendrier.lock.json` (committé). Le site ne fait que le lire.
 *
 * - Cycles : on mélange la base avec une graine fixe (`graine:cycle`) et on la parcourt par
 *   paquets de 6. Une ligne ne revient pas avant que toutes les autres aient été jouées.
 * - Fin de cycle : les lignes restantes (moins de 6, ou qui ne s'enchaînent pas entre elles) passent
 *   en priorité dans le ou les tickets suivants, complétés par le cycle d'après. Elles comptent
 *   alors comme jouées dans le nouveau cycle.
 * - Écart entre deux passages : au début d'un cycle, les lignes sorties dans la dernière
 *   demi-période sont placées en fin de mélange, pour qu'une ligne ne revienne pas deux jours de suite.
 * - Dans un ticket, deux lignes consécutives doivent former une paire jouable (voir `paires.ts`) ;
 *   on prend les lignes dans l'ordre du mélange en sautant celles qui ne s'enchaînent pas.
 * - Avant le lancement (`DATE_LANCEMENT`), rien n'est figé : tout le calendrier est régénéré.
 * - Après : regénérer ne touche jamais aux tickets déjà publiés (jusqu'à demain inclus).
 *   Les lignes ajoutées entrent dans les tickets futurs : elles ne sont pas encore « jouées »
 *   dans le cycle en cours, donc elles apparaissent avant la fin de ce cycle.
 */

export const TAILLE_TICKET = 6;
export const GRAINE = "laddition-2026";

export interface TicketCalendrier {
  numero: number;
  cycle: number;
  ids: string[];
}

export interface Calendrier {
  /** Date du ticket n° 1 au moment de la génération. */
  lancement: string;
  graine: string;
  tickets: TicketCalendrier[];
}

/**
 * Dernier numéro de ticket à conserver lors d'une regénération : aucun avant le lancement,
 * puis tous les tickets jusqu'à demain inclus (déjà publiés ou sur le point de l'être).
 */
export function dernierTicketFige(instant: Date, lancement: string): number {
  return lancementPasse(instant, lancement) ? numeroDuJour(instant, lancement) + 1 : 0;
}

type Comparable = Pick<Ligne, "id" | "montant" | "affichage">;

/** Ordre de parcours de la base pour un cycle donné. Les ids sont triés avant mélange pour ne pas dépendre de l'ordre du fichier. */
export function ordreDuCycle(ids: readonly string[], graine: string, cycle: number): string[] {
  return melanger([...ids].sort(), mulberry32(hacher(`${graine}:${cycle}`)));
}

/**
 * Compose une suite de 6 lignes dont toutes les paires consécutives sont jouables.
 * Les lignes `imposees` doivent y figurer ; les autres sont prises dans l'ordre de `candidates`.
 * Recherche en profondeur déterministe, bornée pour rester rapide.
 */
export function composerTicket<T extends Comparable>(
  imposees: readonly T[],
  candidates: readonly T[],
  budget = 200_000,
): T[] | null {
  const liste = [...imposees, ...candidates.filter((c) => !imposees.some((i) => i.id === c.id))];
  const obligatoires = new Set(imposees.map((l) => l.id));
  const choix: T[] = [];
  const utilises = new Set<string>();
  let noeuds = 0;

  const chercher = (): boolean => {
    if (choix.length === TAILLE_TICKET) return true;
    const manquantes = [...obligatoires].filter((id) => !utilises.has(id)).length;
    const placesRestantes = TAILLE_TICKET - choix.length;
    for (const ligne of liste) {
      if (++noeuds > budget) return false;
      if (utilises.has(ligne.id)) continue;
      if (manquantes >= placesRestantes && !obligatoires.has(ligne.id)) continue;
      const precedente = choix[choix.length - 1];
      if (precedente && !paireJouable(precedente, ligne)) continue;
      choix.push(ligne);
      utilises.add(ligne.id);
      if (chercher()) return true;
      choix.pop();
      utilises.delete(ligne.id);
    }
    return false;
  };

  return chercher() ? choix : null;
}

export interface OptionsGeneration {
  graine?: string;
  /** Date du ticket n° 1, enregistrée dans le calendrier. */
  lancement?: string;
  /** Tickets à conserver tels quels (déjà publiés). */
  figes?: readonly TicketCalendrier[];
  /** Dernier numéro à générer. */
  jusquA: number;
}

export interface ResultatGeneration {
  calendrier: Calendrier;
  avertissements: string[];
}

export function genererCalendrier(lignes: readonly Comparable[], options: OptionsGeneration): ResultatGeneration {
  const graine = options.graine ?? GRAINE;
  const lancement = options.lancement ?? DATE_LANCEMENT;
  const parId = new Map(lignes.map((l) => [l.id, l]));
  const ids = lignes.map((l) => l.id);
  const tickets: TicketCalendrier[] = (options.figes ?? []).map((t) => ({ ...t, ids: [...t.ids] }));
  const avertissements: string[] = [];
  const versLignes = (liste: readonly string[]) => liste.map((id) => parId.get(id)!);

  // Dernier ticket où chaque ligne est sortie : sert à repousser en fin de cycle les lignes vues récemment.
  const dernierPassage = new Map<string, number>();
  const ordre = (cycle: number, debut: number) => {
    const melange = ordreDuCycle(ids, graine, cycle);
    if (cycle === 0) return melange;
    const fenetre = Math.max(1, Math.floor(ids.length / TAILLE_TICKET / 2));
    const recente = (id: string) => (dernierPassage.get(id) ?? -Infinity) >= debut - fenetre;
    return [...melange.filter((id) => !recente(id)), ...melange.filter(recente)];
  };

  // Reconstitue l'état du cycle en cours à partir des tickets figés.
  let cycle = tickets.at(-1)?.cycle ?? 0;
  const debutCycle = tickets.find((t) => t.cycle === cycle)?.numero ?? 1;
  tickets.filter((t) => t.numero < debutCycle).forEach((t) => t.ids.forEach((id) => dernierPassage.set(id, t.numero)));
  let ordreCycle = ordre(cycle, debutCycle);
  const joues = new Set<string>();
  for (const t of tickets.filter((t) => t.numero >= debutCycle)) {
    t.ids.forEach((id) => {
      joues.add(id);
      dernierPassage.set(id, t.numero);
    });
  }

  // Lignes du cycle précédent pas encore jouées : elles passent en priorité dans les tickets suivants.
  const enRetard = (c: number, dejaVues: (id: string) => boolean) =>
    ordreDuCycle(ids, graine, c).filter((id) => !dejaVues(id) && !joues.has(id));
  let dette: string[] = [];
  if (cycle > 0) {
    const precedent = new Set(tickets.filter((t) => t.cycle === cycle - 1).flatMap((t) => t.ids));
    if (precedent.size) dette = enRetard(cycle - 1, (id) => precedent.has(id));
  }
  const tentatives = new Map<string, number>();

  for (let numero = tickets.length + 1; numero <= options.jusquA; numero++) {
    let choix: Comparable[] | null = null;

    if (dette.length === 0) {
      const restantes = ordreCycle.filter((id) => !joues.has(id));
      if (restantes.length >= TAILLE_TICKET) choix = composerTicket([], versLignes(restantes));
      if (!choix) {
        // Fin de cycle : les lignes restantes deviennent prioritaires, le cycle suivant complète les tickets.
        const restantesSet = new Set(restantes);
        cycle++;
        ordreCycle = ordre(cycle, numero);
        joues.clear();
        dette = enRetard(cycle - 1, (id) => !restantesSet.has(id));
      }
    }

    if (!choix) {
      // On impose le plus possible de lignes en retard, dans l'ordre, tant que le ticket reste composable.
      const complements = versLignes(ordreCycle.filter((id) => !joues.has(id) && !dette.includes(id)));
      let imposees: Comparable[] = [];
      for (const id of dette) {
        if (imposees.length === TAILLE_TICKET) break;
        const essai = [...imposees, parId.get(id)!];
        if (composerTicket(essai, complements)) imposees = essai;
      }
      choix = composerTicket(imposees, complements);
      if (!choix) throw new Error(`Ticket ${numero} : aucune combinaison jouable dans la base.`);
      const placees = new Set(choix.map((l) => l.id));
      dette = dette.filter((id) => {
        if (placees.has(id)) return false;
        const n = (tentatives.get(id) ?? 0) + 1;
        tentatives.set(id, n);
        if (n <= 3) return true;
        avertissements.push(`Ticket ${numero} : « ${id} » n'a pas pu être placée ; elle saute le cycle ${cycle - 1}.`);
        return false;
      });
    }

    choix.forEach((l) => {
      joues.add(l.id);
      dernierPassage.set(l.id, numero);
    });
    tickets.push({ numero, cycle, ids: choix.map((l) => l.id) });
  }

  return { calendrier: { lancement, graine, tickets }, avertissements };
}

/** Lignes du ticket n° `numero`. Au-delà du calendrier figé, tirage déterministe de secours. */
export function lignesDuTicket<T extends Comparable>(
  calendrier: Pick<Calendrier, "graine" | "tickets">,
  numero: number,
  lignes: readonly T[],
): T[] {
  const parId = new Map(lignes.map((l) => [l.id, l]));
  const ticket = calendrier.tickets[numero - 1];
  if (ticket && ticket.numero === numero && ticket.ids.every((id) => parId.has(id))) {
    return ticket.ids.map((id) => parId.get(id)!);
  }
  return tirage(lignes, mulberry32(hacher(`${calendrier.graine}:secours:${numero}`)));
}

/** Tirage libre (mode entraînement ou secours). */
export function tirage<T extends Comparable>(lignes: readonly T[], aleatoire: () => number): T[] {
  const choix = composerTicket([], melanger(lignes, aleatoire));
  if (!choix) throw new Error("Aucune combinaison jouable dans la base.");
  return choix;
}

/** Sérialisation lisible : un ticket par ligne, pour des diffs clairs. */
export function serialiserCalendrier(calendrier: Calendrier): string {
  const lignes = calendrier.tickets.map((t) => "    " + JSON.stringify(t));
  return `{\n  "lancement": ${JSON.stringify(calendrier.lancement)},\n  "graine": ${JSON.stringify(calendrier.graine)},\n  "tickets": [\n${lignes.join(",\n")}\n  ]\n}\n`;
}
