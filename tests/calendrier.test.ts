import { describe, expect, it } from "vitest";
import brutCalendrier from "@/data/calendrier.lock.json";
import brutLignes from "@/data/lignes.json";
import { mulberry32 } from "@/lib/aleatoire";
import {
  type TicketCalendrier,
  composerTicket,
  genererCalendrier,
  lignesDuTicket,
  tirage,
} from "@/lib/calendrier";
import { numeroDuJour } from "@/lib/date-paris";
import { paireJouable } from "@/lib/paires";
import { type Ligne, lignesSchema } from "@/lib/schema";
import { calendrierSchema, verifierCalendrier } from "@/lib/verification";
import { baseSynthetique } from "./aide";

const lignes = lignesSchema.parse(brutLignes);
const calendrierFige = calendrierSchema.parse(brutCalendrier);

/**
 * Pas de répétition avant épuisement de la base :
 * - dans un cycle, une ligne ne sort qu'une fois ;
 * - un cycle (plus les lignes restantes qui ouvrent le suivant) couvre toute la base.
 */
function verifierSansRepetition(tickets: readonly TicketCalendrier[], base: readonly Ligne[]) {
  const ids = base.map((l) => l.id);
  const cycles = [...new Set(tickets.map((t) => t.cycle))];
  cycles.forEach((c, i) => {
    const duCycle = tickets.filter((t) => t.cycle === c).flatMap((t) => t.ids);
    expect(new Set(duCycle).size, `doublon dans le cycle ${c}`).toBe(duCycle.length);
    // Les lignes restantes d'un cycle peuvent déborder sur les premiers tickets du suivant.
    const suivants = tickets.filter((t) => t.cycle === cycles[i + 1]).slice(0, 3);
    if (suivants.length < 3) return;
    const couverts = new Set([...duCycle, ...suivants.flatMap((t) => t.ids)]);
    expect(ids.filter((id) => !couverts.has(id)), `cycle ${c} incomplet`).toEqual([]);
  });
}

/** Plus petit nombre de jours entre deux passages d'une même ligne. */
function ecartMinimal(tickets: readonly TicketCalendrier[]): number {
  const dernier = new Map<string, number>();
  let min = Infinity;
  for (const t of tickets) {
    for (const id of t.ids) {
      const avant = dernier.get(id);
      if (avant !== undefined) min = Math.min(min, t.numero - avant);
      dernier.set(id, t.numero);
    }
  }
  return min;
}

function verifierTickets(tickets: readonly TicketCalendrier[], base: readonly Ligne[]) {
  const parId = new Map(base.map((l) => [l.id, l]));
  tickets.forEach((t, i) => {
    expect(t.numero).toBe(i + 1);
    expect(new Set(t.ids).size).toBe(6);
    for (let k = 0; k < 5; k++) expect(paireJouable(parId.get(t.ids[k]!)!, parId.get(t.ids[k + 1]!)!)).toBe(true);
  });
}

describe("calendrier : déterminisme", () => {
  it("même date = même ticket", () => {
    const n = numeroDuJour(new Date("2026-11-15T08:00:00+01:00"));
    const matin = lignesDuTicket(calendrierFige, n, lignes).map((l) => l.id);
    const soir = lignesDuTicket(calendrierFige, numeroDuJour(new Date("2026-11-15T23:30:00+01:00")), lignes).map(
      (l) => l.id,
    );
    expect(soir).toEqual(matin);
  });

  it("deux générations identiques donnent le même calendrier", () => {
    const a = genererCalendrier(lignes, { jusquA: 100 }).calendrier;
    const b = genererCalendrier([...lignes].reverse(), { jusquA: 100 }).calendrier;
    expect(b).toEqual(a);
  });

  it("le fichier figé est cohérent avec la génération (pas de modification manuelle)", () => {
    // Prolonger le calendrier figé depuis n'importe quel point, sans changer la base, ne modifie rien.
    for (const coupe of [30, 100, 200]) {
      const { calendrier } = genererCalendrier(lignes, {
        graine: calendrierFige.graine,
        figes: calendrierFige.tickets.slice(0, coupe),
        jusquA: calendrierFige.tickets.length,
      });
      expect(calendrier.tickets).toEqual(calendrierFige.tickets);
    }
  });

  it("au-delà du calendrier, le tirage de secours est déterministe et jouable", () => {
    const n = calendrierFige.tickets.length + 50;
    const a = lignesDuTicket(calendrierFige, n, lignes);
    expect(lignesDuTicket(calendrierFige, n, lignes)).toEqual(a);
    expect(a).toHaveLength(6);
  });
});

describe("calendrier : pas de répétition avant épuisement de la base", () => {
  it("sur la base réelle", () => {
    const { calendrier, avertissements } = genererCalendrier(lignes, { jusquA: 400 });
    expect(avertissements).toEqual([]);
    verifierTickets(calendrier.tickets, lignes);
    verifierSansRepetition(calendrier.tickets, lignes);
    expect(ecartMinimal(calendrier.tickets)).toBeGreaterThanOrEqual(2);
  });

  it("sur une base de 100 lignes", () => {
    const base = baseSynthetique(100);
    const { calendrier, avertissements } = genererCalendrier(base, { jusquA: 120 });
    expect(avertissements).toEqual([]);
    verifierTickets(calendrier.tickets, base);
    verifierSansRepetition(calendrier.tickets, base);
    expect(ecartMinimal(calendrier.tickets)).toBeGreaterThanOrEqual(8);
  });

  it("le fichier figé respecte les règles", () => {
    verifierTickets(calendrierFige.tickets, lignes);
    // Les deux premiers tickets ont été figés avec l'ancienne base de 22 lignes.
    verifierSansRepetition(
      calendrierFige.tickets.filter((t) => t.cycle > 0),
      lignes,
    );
  });
});

describe("calendrier : stabilité quand on ajoute des lignes", () => {
  const base = baseSynthetique(40);
  const initial = genererCalendrier(base, { jusquA: 60 }).calendrier;
  const ajouts = baseSynthetique(12, "nouvelle").map((l, i) => ({ ...l, montant: l.montant + 7 + i }));
  const figes = initial.tickets.slice(0, 9);
  const etendu = genererCalendrier([...base, ...ajouts], { figes, jusquA: 60 }).calendrier;

  it("prolonger un calendrier sans changer la base redonne exactement le même calendrier", () => {
    for (const coupe of [1, 7, 8, 9, 23]) {
      const prolonge = genererCalendrier(base, { figes: initial.tickets.slice(0, coupe), jusquA: 60 }).calendrier;
      expect(prolonge).toEqual(initial);
    }
  });

  it("les tickets publiés ne bougent pas", () => {
    expect(etendu.tickets.slice(0, 9)).toEqual(initial.tickets.slice(0, 9));
  });

  it("les nouvelles lignes n'apparaissent que dans les tickets futurs, avant la fin du cycle suivant", () => {
    const premiere = etendu.tickets.findIndex((t) => t.ids.some((id) => id.startsWith("nouvelle")));
    expect(premiere).toBeGreaterThanOrEqual(9);
    const vues = new Set(etendu.tickets.slice(9, 9 + 20).flatMap((t) => t.ids));
    expect(ajouts.every((l) => vues.has(l.id))).toBe(true);
  });

  it("aucune répétition non plus après l'ajout", () => {
    const cycleAjout = etendu.tickets[9]!.cycle;
    verifierSansRepetition(
      etendu.tickets.filter((t) => t.cycle > cycleAjout),
      [...base, ...ajouts],
    );
    const enCours = etendu.tickets.filter((t) => t.cycle === cycleAjout).flatMap((t) => t.ids);
    expect(new Set(enCours).size).toBe(enCours.length);
  });
});

describe("composition d'un ticket", () => {
  it("exclut les paires trop faciles (ratio > 1 000) et les quasi-égalités", () => {
    const l = (id: string, montant: number) => ({ id, montant });
    const base = [l("a", 1e6), l("b", 2e9), l("c", 1.02e6), l("d", 5e6), l("e", 2e7), l("f", 9e7), l("g", 4e8)];
    const ticket = composerTicket([], base)!;
    for (let k = 0; k < 5; k++) expect(paireJouable(ticket[k]!, ticket[k + 1]!)).toBe(true);
  });

  it("renvoie null si aucune combinaison n'existe", () => {
    const base = Array.from({ length: 6 }, (_, i) => ({ id: `x${i}`, montant: 1e6 + i }));
    expect(composerTicket([], base)).toBeNull();
  });

  it("le tirage d'entraînement donne 6 lignes distinctes", () => {
    const t = tirage(lignes, mulberry32(42));
    expect(new Set(t.map((l) => l.id)).size).toBe(6);
  });
});

describe("verifierCalendrier", () => {
  it("accepte le calendrier figé", () => {
    expect(verifierCalendrier(brutCalendrier, lignes, 1).erreurs).toEqual([]);
  });
  it("signale un calendrier qui ne couvre pas les 30 prochains jours", () => {
    const court = { ...calendrierFige, tickets: calendrierFige.tickets.slice(0, 10) };
    expect(verifierCalendrier(court, lignes, 1).erreurs.join()).toMatch(/30 jours/);
  });
  it("signale une ligne retirée de la base dans un ticket à venir", () => {
    const sansPremiere = lignes.filter((l) => l.id !== calendrierFige.tickets[4]!.ids[0]);
    expect(verifierCalendrier(brutCalendrier, sansPremiere, 1).erreurs.length).toBeGreaterThan(0);
  });
});
