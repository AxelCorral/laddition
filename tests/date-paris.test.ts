import { describe, expect, it } from "vitest";
import {
  dateDuTicket,
  lancementPasse,
  formaterCompteARebours,
  msAvantProchainTicket,
  numeroDuJour,
  prochainMinuitParis,
} from "@/lib/date-paris";

const H = 3_600_000;
/** Date de référence des tests, indépendante de DATE_LANCEMENT. */
const L = "2026-10-23";

describe("numeroDuJour", () => {
  it("vaut 1 le jour du lancement, de minuit à 23 h 59 (heure de Paris)", () => {
    expect(numeroDuJour(new Date("2026-10-23T00:00:00+02:00"), L)).toBe(1);
    expect(numeroDuJour(new Date("2026-10-23T23:59:59+02:00"), L)).toBe(1);
  });
  it("change à minuit heure de Paris, pas à minuit UTC", () => {
    expect(numeroDuJour(new Date("2026-10-23T21:59:59Z"), L)).toBe(1);
    expect(numeroDuJour(new Date("2026-10-23T22:00:00Z"), L)).toBe(2);
  });
  it("reste à 1 avant le lancement", () => {
    expect(numeroDuJour(new Date("2026-01-01T12:00:00Z"), L)).toBe(1);
  });
  it("gère le passage à l'heure d'hiver (25 octobre 2026, journée de 25 h)", () => {
    expect(numeroDuJour(new Date("2026-10-25T00:00:00+02:00"), L)).toBe(3);
    expect(numeroDuJour(new Date("2026-10-25T23:59:59+01:00"), L)).toBe(3);
    expect(numeroDuJour(new Date("2026-10-26T00:00:00+01:00"), L)).toBe(4);
  });
  it("gère le passage à l'heure d'été (28 mars 2027, journée de 23 h)", () => {
    const n = numeroDuJour(new Date("2027-03-28T00:00:00+01:00"), L);
    expect(numeroDuJour(new Date("2027-03-28T23:59:59+02:00"), L)).toBe(n);
    expect(numeroDuJour(new Date("2027-03-29T00:00:00+02:00"), L)).toBe(n + 1);
    expect(dateDuTicket(n, L)).toBe("2027-03-28");
  });
});

describe("lancementPasse", () => {
  it("devient vrai à minuit, heure de Paris, le jour du lancement", () => {
    expect(lancementPasse(new Date("2026-10-22T23:59:59+02:00"), L)).toBe(false);
    expect(lancementPasse(new Date("2026-10-23T00:00:00+02:00"), L)).toBe(true);
    expect(lancementPasse(new Date("2027-01-01T12:00:00Z"), L)).toBe(true);
  });
});

describe("prochainMinuitParis", () => {
  it("renvoie minuit le lendemain, heure de Paris", () => {
    expect(prochainMinuitParis(new Date("2026-10-23T15:00:00+02:00")).toISOString()).toBe("2026-10-23T22:00:00.000Z");
  });
  it("compte 25 h le jour du passage à l'heure d'hiver", () => {
    expect(msAvantProchainTicket(new Date("2026-10-25T00:00:00+02:00"))).toBe(25 * H);
    expect(prochainMinuitParis(new Date("2026-10-25T12:00:00+01:00")).toISOString()).toBe("2026-10-25T23:00:00.000Z");
  });
  it("compte 23 h le jour du passage à l'heure d'été", () => {
    expect(msAvantProchainTicket(new Date("2027-03-28T00:00:00+01:00"))).toBe(23 * H);
  });
  it("à 23 h 59 59, il reste une seconde", () => {
    expect(msAvantProchainTicket(new Date("2026-11-10T23:59:59+01:00"))).toBe(1000);
  });
});

describe("dateDuTicket", () => {
  it("relie les numéros aux dates", () => {
    expect(dateDuTicket(1, L)).toBe("2026-10-23");
    expect(dateDuTicket(10, L)).toBe("2026-11-01");
  });
});

describe("formaterCompteARebours", () => {
  it("affiche heures et minutes", () => {
    expect(formaterCompteARebours(5 * H + 42 * 60_000 + 30_000)).toBe("05 h 42");
    expect(formaterCompteARebours(-1)).toBe("00 h 00");
  });
});
