import { hacher, melanger, mulberry32 } from "./aleatoire";
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
 * - Fin de cycle : s'il reste moins de 6 lignes, elles ouvrent le ticket suivant et le cycle
 *   d'après complète le paquet. Elles comptent alors comme jouées dans le nouveau cycle.
 * - Écart entre deux passages : au début d'un cycle, les lignes sorties dans la dernière
 *   demi-période sont placées en fin de mélange, pour qu'une ligne ne revienne pas deux jours de suite.
 * - Dans un ticket, deux lignes consécutives doivent former une paire jouable (voir `paires.ts`) ;
 *   on prend les lignes dans l'ordre du mélange en sautant celles qui ne s'enchaînent pas.
 * - Stabilité : regénérer ne touche jamais aux tickets déjà publiés (jusqu'à demain inclus).
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
  graine: string;
  tickets: TicketCalendrier[];
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

  for (let numero = tickets.length + 1; numero <= options.jusquA; numero++) {
    const restantes = ordreCycle.filter((id) => !joues.has(id));
    let choix: Comparable[] | null = null;

    if (restantes.length >= TAILLE_TICKET) choix = composerTicket([], versLignes(restantes));

    if (choix) {
      choix.forEach((l) => joues.add(l.id));
    } else {
      // Fin de cycle : les lignes restantes ouvrent le ticket, le cycle suivant le complète.
      cycle++;
      ordreCycle = ordre(cycle, numero);
      const imposees = restantes.length < TAILLE_TICKET ? versLignes(restantes) : [];
      const suivantes = versLignes(ordreCycle);
      choix = composerTicket(imposees, suivantes);
      if (!choix) {
        avertissements.push(
          `Ticket ${numero} : impossible de placer ${restantes.join(", ")} ; ces lignes sautent le cycle ${cycle - 1}.`,
        );
        choix = composerTicket([], suivantes);
      } else if (imposees.length === 0 && restantes.length > 0) {
        avertissements.push(
          `Ticket ${numero} : ${restantes.join(", ")} ne s'enchaînent pas entre elles ; elles sautent le cycle ${cycle - 1}.`,
        );
      }
      if (!choix) throw new Error(`Ticket ${numero} : aucune combinaison jouable dans la base.`);
      joues.clear();
      choix.forEach((l) => joues.add(l.id));
    }

    choix.forEach((l) => dernierPassage.set(l.id, numero));
    tickets.push({ numero, cycle, ids: choix.map((l) => l.id) });
  }

  return { calendrier: { graine, tickets }, avertissements };
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
  return `{\n  "graine": ${JSON.stringify(calendrier.graine)},\n  "tickets": [\n${lignes.join(",\n")}\n  ]\n}\n`;
}
