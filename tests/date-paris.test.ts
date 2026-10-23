import { describe, expect, it } from "vitest";
import {
  dateDuTicket,
  formaterCompteARebours,
  msAvantProchainTicket,
  numeroDuJour,
  prochainMinuitParis,
} from "@/lib/date-paris";

const H = 3_600_000;

describe("numeroDuJour", () => {
  it("vaut 1 le jour du lancement, de minuit à 23 h 59 (heure de Paris)", () => {
    expect(numeroDuJour(new Date("2026-10-23T00:00:00+02:00"))).toBe(1);
    expect(numeroDuJour(new Date("2026-10-23T23:59:59+02:00"))).toBe(1);
  });
  it("change à minuit heure de Paris, pas à minuit UTC", () => {
    expect(numeroDuJour(new Date("2026-10-23T21:59:59Z"))).toBe(1);
    expect(numeroDuJour(new Date("2026-10-23T22:00:00Z"))).toBe(2);
  });
  it("reste à 1 avant le lancement", () => {
    expect(numeroDuJour(new Date("2026-01-01T12:00:00Z"))).toBe(1);
  });
  it("gère le passage à l'heure d'hiver (25 octobre 2026, journée de 25 h)", () => {
    expect(numeroDuJour(new Date("2026-10-25T00:00:00+02:00"))).toBe(3);
    expect(numeroDuJour(new Date("2026-10-25T23:59:59+01:00"))).toBe(3);
    expect(numeroDuJour(new Date("2026-10-26T00:00:00+01:00"))).toBe(4);
  });
  it("gère le passage à l'heure d'été (28 mars 2027, journée de 23 h)", () => {
    const n = numeroDuJour(new Date("2027-03-28T00:00:00+01:00"));
    expect(numeroDuJour(new Date("2027-03-28T23:59:59+02:00"))).toBe(n);
    expect(numeroDuJour(new Date("2027-03-29T00:00:00+02:00"))).toBe(n + 1);
    expect(dateDuTicket(n)).toBe("2027-03-28");
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
    expect(dateDuTicket(1)).toBe("2026-10-23");
    expect(dateDuTicket(10)).toBe("2026-11-01");
  });
});

describe("formaterCompteARebours", () => {
  it("affiche heures et minutes", () => {
    expect(formaterCompteARebours(5 * H + 42 * 60_000 + 30_000)).toBe("05 h 42");
    expect(formaterCompteARebours(-1)).toBe("00 h 00");
  });
});
