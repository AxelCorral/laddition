import { describe, expect, it } from "vitest";
import { paireJouable, phraseRatio, precision } from "@/lib/paires";

const m = (montant: number, affichage?: string) => ({ montant, affichage });

describe("precision", () => {
  it.each([
    [undefined, "exact"],
    ["> 1 Md€", "minimum"],
    ["Plus de 3 M€", "minimum"],
    ["< 5 M€", "maximum"],
    ["≈ 12 M€", "environ"],
    ["environ 12 M€", "environ"],
    ["12 M€", "exact"],
  ])("%s → %s", (affichage, attendu) => {
    expect(precision({ affichage })).toBe(attendu);
  });
});

describe("paireJouable", () => {
  it("refuse un ratio supérieur à 1 000", () => {
    expect(paireJouable(m(1e6), m(1.001e9))).toBe(false);
    expect(paireJouable(m(1e6), m(1e9))).toBe(true);
  });
  it("refuse l'égalité et les écarts de moins de 5 %", () => {
    expect(paireJouable(m(1e6), m(1e6))).toBe(false);
    expect(paireJouable(m(111_500_000), m(113_000_000))).toBe(false);
    expect(paireJouable(m(100e6), m(105e6))).toBe(true);
  });
  it("exige 20 % d'écart avec un montant « environ »", () => {
    expect(paireJouable(m(12e6, "≈ 12 M€"), m(14e6))).toBe(false);
    expect(paireJouable(m(12e6, "≈ 12 M€"), m(14.4e6))).toBe(true);
  });
  it("un minimum (« > 1 Md€ ») doit être le plus grand des deux", () => {
    const cabinets = m(1e9, "> 1 Md€");
    expect(paireJouable(cabinets, m(1_047_000_000))).toBe(false);
    expect(paireJouable(cabinets, m(6_650_000_000))).toBe(false);
    expect(paireJouable(cabinets, m(568_000_000))).toBe(true);
    expect(paireJouable(cabinets, m(900_000_000))).toBe(false);
  });
});

describe("phraseRatio", () => {
  it("rapport simple", () => {
    expect(phraseRatio(m(122_560_000), m(607_650_000))).toBe("C'est 5 fois plus que la ligne du dessus.");
    expect(phraseRatio(m(607_650_000), m(122_560_000))).toBe("C'est 5 fois moins que la ligne du dessus.");
    expect(phraseRatio(m(1e6), m(58e6))).toBe("C'est 58 fois plus que la ligne du dessus.");
  });
  it("écart serré", () => {
    expect(phraseRatio(m(100e6), m(106e6))).toBe(
      "Écart de 6 % avec la ligne du dessus : ça se jouait à peu de chose.",
    );
  });
  it("« au moins », arrondi vers le bas, pour un minimum", () => {
    expect(phraseRatio(m(353_470_000), m(1e9, "> 1 Md€"))).toBe("C'est au moins 2,8 fois plus que la ligne du dessus.");
  });
  it("« environ » pour un montant approximatif", () => {
    expect(phraseRatio(m(12e6, "≈ 12 M€"), m(35_600_000))).toBe("C'est environ 3 fois plus que la ligne du dessus.");
  });
});
