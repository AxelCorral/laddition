import { describe, expect, it } from "vitest";
import { formaterMontant, montantAffiche } from "@/lib/format";

const nbsp = (s: string) => s.replace(/ /g, " ");

describe("formaterMontant", () => {
  it.each([
    [122_560_000, "122,6 M€"],
    [607_650_000, "607,7 M€"],
    [20_000_000, "20 M€"],
    [35_600_000, "35,6 M€"],
    [6_650_000_000, "6,65 Md€"],
    [3_748_000_000, "3,75 Md€"],
    [58_000_000_000, "58 Md€"],
    [197_100_000_000, "197,1 Md€"],
    [152_500_000_000, "152,5 Md€"],
    [999_999, "999 999 €"],
  ])("%d → %s", (montant, attendu) => {
    expect(formaterMontant(montant)).toBe(nbsp(attendu));
  });

  it("insère une espace insécable avant l'unité", () => {
    expect(formaterMontant(122_560_000)).toContain(" M€");
  });
});

describe("montantAffiche", () => {
  it("donne la priorité au champ affichage", () => {
    expect(montantAffiche({ montant: 1_000_000_000, affichage: "> 1 Md€" })).toBe("> 1 Md€");
  });
  it("formate sinon le montant", () => {
    expect(montantAffiche({ montant: 1_047_000_000 })).toBe(nbsp("1,05 Md€"));
  });
});
